import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import pytest
import soundfile as sf

SR = 22050


def _write_wav(path: Path, audio: np.ndarray, sr: int = SR) -> Path:
    sf.write(path, audio.astype(np.float32), sr)
    return path


def _cough_like(duration: float = 6.0) -> np.ndarray:
    rng = np.random.default_rng(42)
    samples = int(duration * SR)
    audio = rng.standard_normal(samples).astype(np.float32) * 0.002
    for start_sec in (1.0, 2.6, 4.2):
        start = int(start_sec * SR)
        if start >= samples:
            continue
        length = min(int(0.35 * SR), samples - start)
        envelope = np.exp(-np.linspace(0, 6, length))
        burst = rng.standard_normal(length) * envelope * 0.8
        audio[start : start + length] += burst.astype(np.float32)
    return audio


@pytest.fixture(scope="session")
def fixture_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    directory = tmp_path_factory.mktemp("audio")
    _write_wav(directory / "cough.wav", _cough_like())
    _write_wav(directory / "silent.wav", np.zeros(SR * 5, dtype=np.float32))
    _write_wav(directory / "short.wav", _cough_like(1.0))
    _write_wav(
        directory / "noise.wav",
        (0.2 * np.random.default_rng(0).standard_normal(SR * 5)).astype(np.float32),
    )
    (directory / "notaudio.txt").write_text("hello")

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(directory / "cough.wav"),
            str(directory / "cough.m4a"),
        ],
        check=True,
    )
    return directory


@pytest.fixture()
def oversized_wav(tmp_path: Path) -> Path:
    path = tmp_path / "large.wav"
    path.write_bytes(b"RIFF" + b"\x00" * (11 * 1024 * 1024))
    return path
