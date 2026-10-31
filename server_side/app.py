"""PNEUMOTrack FastAPI backend (contract v2)."""

from __future__ import annotations

import logging
import os
import subprocess
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import imageio_ffmpeg
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from model import MODEL_VERSION, predict, warmup
from predictor import ERROR_MESSAGES, AudioValidationError

logger = logging.getLogger("pneumotrack")

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_SUFFIXES = {".wav", ".m4a", ".mp4", ".aac", ".mp3", ".ogg", ".flac"}
CHUNK_SIZE = 1024 * 1024


class APIError(Exception):
    def __init__(self, code: str, message: Optional[str] = None) -> None:
        self.code = code
        self.message = message or ERROR_MESSAGES.get(code, ERROR_MESSAGES["INTERNAL_ERROR"])
        super().__init__(self.message)


def _clean_temp_dir() -> None:
    for path in TEMP_DIR.glob("*"):
        try:
            if path.is_file():
                path.unlink()
        except OSError:  # pragma: no cover - best effort cleanup
            logger.warning("Failed to remove stale temp file")


@asynccontextmanager
async def lifespan(_: FastAPI):
    _clean_temp_dir()
    await run_in_threadpool(warmup)
    yield


app = FastAPI(title="PNEUMOTrack API", version="2.0", lifespan=lifespan)

_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AudioValidationError)
async def audio_error_handler(_: object, exc: AudioValidationError):
    return JSONResponse(
        status_code=422,
        content={"status": "error", "code": exc.code, "message": exc.message},
    )


@app.exception_handler(APIError)
async def api_error_handler(_: object, exc: APIError):
    return JSONResponse(
        status_code=422,
        content={"status": "error", "code": exc.code, "message": exc.message},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: object, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "code": "INVALID_REQUEST",
            "message": "Permintaan tidak valid. Pastikan field audio terisi.",
        },
    )


@app.exception_handler(Exception)
async def internal_error_handler(_: object, exc: Exception):
    logger.exception("Unhandled error: %s", type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "code": "INTERNAL_ERROR",
            "message": ERROR_MESSAGES["INTERNAL_ERROR"],
        },
    )


def _convert_to_wav(source: Path, destination: Path) -> None:
    """Decode phone formats (m4a/AAC) into mono 22.05 kHz WAV."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    try:
        result = subprocess.run(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-vn",
                "-ac",
                "1",
                "-ar",
                "22050",
                "-f",
                "wav",
                str(destination),
            ],
            capture_output=True,
            timeout=60,
        )
    except (OSError, subprocess.SubprocessError):
        raise AudioValidationError("UNSUPPORTED_FORMAT")
    if result.returncode != 0 or not destination.exists():
        logger.warning(
            "ffmpeg conversion failed rc=%s stderr=%s",
            result.returncode,
            result.stderr.decode("utf-8", "replace")[:300],
        )
        raise AudioValidationError("UNSUPPORTED_FORMAT")


async def _save_upload(upload: UploadFile, destination: Path) -> int:
    size = 0
    with destination.open("wb") as buffer:
        while chunk := await upload.read(CHUNK_SIZE):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                raise APIError("FILE_TOO_LARGE")
            buffer.write(chunk)
    if size == 0:
        raise APIError("AUDIO_SILENT")
    return size


@app.get("/health")
async def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/predict")
async def predict_endpoint(
    audio: UploadFile = File(...),
    child_id: Optional[str] = Form(default=None),
):
    request_id = uuid.uuid4().hex
    started = time.perf_counter()

    suffix = Path(audio.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise APIError("UNSUPPORTED_FORMAT")

    source_path: Optional[Path] = None
    wav_path: Optional[Path] = None

    try:
        source_path = TEMP_DIR / f"{request_id}_input{suffix}"
        wav_path = TEMP_DIR / f"{request_id}_decoded.wav"

        size = await _save_upload(audio, source_path)
        _convert_to_wav(source_path, wav_path)

        payload = await run_in_threadpool(predict, str(wav_path))

        elapsed_ms = round((time.perf_counter() - started) * 1000)
        logger.info(
            "request_id=%s status=success result=%s agreement=%s chunks=%s size=%s duration_ms=%s",
            request_id,
            payload["result"],
            payload["agreement"],
            payload["chunks"],
            size,
            elapsed_ms,
        )
        return {"status": "success", **payload}

    except (AudioValidationError, APIError) as exc:
        logger.info(
            "request_id=%s status=error code=%s duration_ms=%s",
            request_id,
            exc.code,
            round((time.perf_counter() - started) * 1000),
        )
        raise
    except Exception:
        logger.exception("request_id=%s status=error code=INTERNAL_ERROR", request_id)
        raise
    finally:
        for path in (source_path, wav_path):
            if path and path.exists():
                try:
                    path.unlink()
                except OSError:  # pragma: no cover
                    logger.warning("request_id=%s failed to delete temp file", request_id)
