"""Model loading and end-to-end prediction."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import tensorflow as tf

from predictor import (
    AudioValidationError,
    build_summary,
    decide,
    extract_features,
    load_audio,
    prepare_audio,
    run_models,
    segment_cough_chunks,
    validate_audio,
    waveform_envelope,
)

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "deployment_v3"

_config = joblib.load(MODEL_DIR / "config_v3.pkl")
MODEL_VERSION: str = str(_config.get("version", "v3"))
AE_THRESHOLD: float = float(_config["ae_threshold"])
SAMPLE_RATE: int = int(_config.get("sample_rate", 22050))
N_MFCC: int = int(_config.get("n_mfcc", 20))

_feat_scaler = joblib.load(MODEL_DIR / "scaler_feat_v3.pkl")
_latent_scaler = joblib.load(MODEL_DIR / "scaler_latent_v3.pkl")
_svm = joblib.load(MODEL_DIR / "ocsvm_full_v3.pkl")
_encoder = tf.keras.models.load_model(MODEL_DIR / "encoder_v3.h5", compile=False)
_autoencoder = tf.keras.models.load_model(MODEL_DIR / "autoencoder_full_v3.h5", compile=False)

logger.info(
    "Models loaded (version=%s, threshold=%.8f, sample_rate=%d)",
    MODEL_VERSION,
    AE_THRESHOLD,
    SAMPLE_RATE,
)


def warmup() -> None:
    """Run one dummy pass so the first real request is not slow."""
    try:
        feature = np.zeros((1, 80), dtype=np.float32)
        run_models(feature, _encoder, _svm, _feat_scaler, _latent_scaler, _autoencoder)
        logger.info("Model warm-up complete")
    except Exception:  # pragma: no cover - warm-up must never block startup
        logger.exception("Model warm-up failed")


def predict(audio_path: str) -> Dict[str, Any]:
    """Validate, preprocess, segment, infer, and shape the API payload."""
    raw = load_audio(audio_path, SAMPLE_RATE)
    meta = validate_audio(raw, SAMPLE_RATE)

    prepared = prepare_audio(raw, SAMPLE_RATE)
    chunks = segment_cough_chunks(prepared, SAMPLE_RATE)
    if not chunks:
        raise AudioValidationError("NO_COUGH_DETECTED")

    feature = extract_features(chunks, SAMPLE_RATE, N_MFCC)
    metrics = run_models(
        feature,
        _encoder,
        _svm,
        _feat_scaler,
        _latent_scaler,
        _autoencoder,
    )
    decision = decide(metrics["ae_error"], AE_THRESHOLD, metrics["svm_label"])

    logger.debug(
        "prediction metrics: ae_error=%.6f svm_score=%.4f votes=%s",
        metrics["ae_error"],
        metrics["svm_score"],
        decision["votes"],
    )

    return {
        "result": decision["result"],
        "raw_label": decision["raw_label"],
        "agreement": decision["agreement"],
        "votes": decision["votes"],
        "autoencoder": {
            "error": round(metrics["ae_error"], 6),
            "threshold": AE_THRESHOLD,
        },
        "ocsvm": {"score": round(metrics["svm_score"], 6)},
        "chunks": len(chunks),
        "duration_sec": meta["duration_sec"],
        "waveform": waveform_envelope(raw),
        "summary": build_summary(decision["result"], decision["agreement"]),
        "model_version": MODEL_VERSION,
    }
