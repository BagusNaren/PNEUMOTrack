from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
import uuid
import os
import logging

from model import predictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pneumotrack")

app = FastAPI(
    title="Pneumonia Detection API",
    version="1.0"
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


def _fmt(value, spec="", dash="-"):
    """Aman untuk None saat formatting angka."""
    if value is None:
        return dash
    return format(value, spec)


def log_prediction(filename, size_bytes, result):
    status = result.get("status")
    final = result.get("final_label")
    conf = result.get("confidence")
    emoji = "🫁" if final == "Pneumonia" else ("✅" if final else "❓")

    lines = [
        "=" * 60,
        "PNEUMOTRACK PREDICTION",
        "-" * 60,
        f"File         : {filename}",
        f"Size         : {size_bytes} bytes",
        f"Status       : {status}",
        f"Chunks       : {result.get('n_chunks')}",
        "-" * 60,
        f"SVM          : {result.get('svm_label')} "
        f"(score={_fmt(result.get('svm_score'), '.4f')})",
        f"AutoEncoder  : {result.get('ae_label')} "
        f"(error={_fmt(result.get('ae_error'), '.6f')}, "
        f"thr={_fmt(result.get('ae_threshold'), '.6f')})",
        "-" * 60,
        f"PREDICTION   : {emoji} {final}",
        f"Confidence   : {_fmt(conf, '.0%')}",
        "=" * 60,
    ]
    block = "\n".join(lines)

    if status == "success":
        logger.info("\n%s", block)
    else:
        logger.error("\n%s\nError: %s", block, result.get("error_msg"))


@app.post("/predict")
async def predict(audio: UploadFile = File(...)):

    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(TEMP_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    size_bytes = os.path.getsize(filepath)
    logger.info("Received audio '%s' (%s bytes) → %s",
                audio.filename, size_bytes, filepath)

    try:

        result = predictor(filepath)

        log_prediction(audio.filename, size_bytes, result)

        return JSONResponse({
            "status": result["status"],
            "prediction": result["final_label"],
            "confidence": result["confidence"],
            "chunks": result["n_chunks"],

            "svm": {
                "label": result["svm_label"],
                "score": result["svm_score"]
            },

            "autoencoder": {
                "label": result["ae_label"],
                "error": result["ae_error"],
                "threshold": result["ae_threshold"]
            }
        })

    finally:

        if os.path.exists(filepath):
            os.remove(filepath)
