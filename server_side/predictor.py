"""Audio preprocessing, validation, segmentation, and inference helpers."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import librosa
import numpy as np
import noisereduce as nr
from scipy.stats import kurtosis, skew

# ---------------------------------------------------------------------------
# Quality-gate thresholds: calibrated on synthetic fixtures in Sprint 2.
# Needs physical-phone microphone testing and field adjustment (especially
# MIN_SNR_DB and MAX_ACTIVE_RATIO under room AC/fan background noise).
# ---------------------------------------------------------------------------
MIN_DURATION_SEC = 3.0
SILENT_RMS = 1e-4
MAX_ACTIVE_RATIO = 0.8
MIN_SNR_DB = 3.0
ACTIVE_FRAME_RATIO = 0.2
WAVEFORM_POINTS = 100

ERROR_MESSAGES = {
    "AUDIO_TOO_SHORT": "Rekaman terlalu pendek. Rekam minimal 3 detik.",
    "AUDIO_SILENT": "Tidak ada suara yang terekam. Coba rekam ulang.",
    "NO_COUGH_DETECTED": "Batuk belum terdeteksi. Rekam ulang saat anak batuk.",
    "AUDIO_TOO_NOISY": "Rekaman terlalu berisik. Cari tempat yang lebih tenang.",
    "UNSUPPORTED_FORMAT": "Format audio tidak didukung.",
    "FILE_TOO_LARGE": "Ukuran file terlalu besar (maksimal 10 MB).",
    "INVALID_REQUEST": "Permintaan tidak valid. Pastikan field audio terisi.",
    "INTERNAL_ERROR": "Terjadi kesalahan. Coba lagi.",
}


class AudioValidationError(Exception):
    """Raised when a recording is not usable for screening."""

    def __init__(self, code: str, message: Optional[str] = None) -> None:
        self.code = code
        self.message = message or ERROR_MESSAGES.get(code, ERROR_MESSAGES["INTERNAL_ERROR"])
        super().__init__(self.message)


# ---------------------------------------------------------------------------
# Loading & preprocessing
# ---------------------------------------------------------------------------
def load_audio(filepath: str, sr: int = 22050) -> np.ndarray:
    audio, _ = librosa.load(filepath, sr=sr, mono=True)
    if audio.size == 0:
        raise AudioValidationError("AUDIO_SILENT")
    return audio.astype(np.float32)


def reduce_noise(audio: np.ndarray, sr: int = 22050) -> np.ndarray:
    try:
        cleaned = nr.reduce_noise(
            y=audio,
            sr=sr,
            prop_decrease=0.4,
            stationary=True,
            n_fft=512,
            n_jobs=1,
        )
        return cleaned.astype(np.float32)
    except Exception:  # pragma: no cover - optional enhancement
        return audio.astype(np.float32)


def normalize_amplitude(audio: np.ndarray) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 1e-8:
        return (audio / peak).astype(np.float32)
    return audio.astype(np.float32)


def prepare_audio(audio: np.ndarray, sr: int = 22050) -> np.ndarray:
    """Denoise then normalize. Validation always runs on the raw signal."""
    return normalize_amplitude(reduce_noise(audio, sr))


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def frame_rms(audio: np.ndarray, frame_len: int = 512, hop: int = 128) -> np.ndarray:
    rms = librosa.feature.rms(y=audio, frame_length=frame_len, hop_length=hop, center=True)
    return rms[0].astype(np.float64)


def signal_to_noise_db(frames: np.ndarray) -> float:
    noise = float(np.percentile(frames, 10))
    signal = float(np.percentile(frames, 95))
    return 20.0 * np.log10((signal + 1e-12) / (noise + 1e-12))


def active_frame_ratio(frames: np.ndarray) -> float:
    if frames.size == 0:
        return 0.0
    peak = float(np.max(frames))
    if peak <= 1e-12:
        return 0.0
    return float(np.mean(frames > ACTIVE_FRAME_RATIO * peak))


def validate_audio(audio: np.ndarray, sr: int = 22050) -> Dict[str, float]:
    """Reject unusable recordings before running the model (PRD §13)."""
    duration = len(audio) / sr
    if duration < MIN_DURATION_SEC:
        raise AudioValidationError("AUDIO_TOO_SHORT")

    frames = frame_rms(audio)
    peak_rms = float(np.max(frames)) if frames.size else 0.0
    if peak_rms < SILENT_RMS:
        raise AudioValidationError("AUDIO_SILENT")

    snr_db = signal_to_noise_db(frames)
    active_ratio = active_frame_ratio(frames)
    if snr_db < MIN_SNR_DB or active_ratio > MAX_ACTIVE_RATIO:
        raise AudioValidationError("AUDIO_TOO_NOISY")

    return {
        "duration_sec": round(duration, 2),
        "snr_db": round(snr_db, 2),
        "active_ratio": round(active_ratio, 3),
    }


# ---------------------------------------------------------------------------
# Cough segmentation (no fallback to whole signal: silence/noise must fail)
# ---------------------------------------------------------------------------
def _extract_chunks_from_mask(
    audio: np.ndarray,
    energy: np.ndarray,
    energy_threshold: float,
    hop: int,
    sr: int,
    min_dur: float,
    max_dur: float,
    merge_gap: float,
) -> List[np.ndarray]:
    active_mask = energy > energy_threshold
    intervals: List[tuple[int, int]] = []
    in_chunk = False
    chunk_start = 0

    for index, is_active in enumerate(active_mask):
        sample_pos = index * hop
        if is_active and not in_chunk:
            chunk_start = sample_pos
            in_chunk = True
        elif not is_active and in_chunk:
            intervals.append((chunk_start, min(sample_pos, len(audio))))
            in_chunk = False
    if in_chunk:
        intervals.append((chunk_start, len(audio)))
    if not intervals:
        return []

    gap_samples = int(merge_gap * sr)
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        prev_start, prev_end = merged[-1]
        if start - prev_end <= gap_samples:
            merged[-1] = (prev_start, end)
        else:
            merged.append((start, end))

    min_samples = int(min_dur * sr)
    max_samples = int(max_dur * sr)
    chunks: List[np.ndarray] = []
    for start, end in merged:
        if end - start < min_samples:
            continue
        if end - start > max_samples:
            center = (start + end) // 2
            start = max(0, center - max_samples // 2)
            end = min(len(audio), start + max_samples)
        chunks.append(audio[start:end].astype(np.float32))
    return chunks


def segment_cough_chunks(
    audio: np.ndarray,
    sr: int = 22050,
    adaptive_ratio: float = 0.20,
    frame_len: int = 512,
    hop: int = 128,
    min_dur: float = 0.1,
    max_dur: float = 2.0,
    merge_gap: float = 0.05,
) -> List[np.ndarray]:
    energy = frame_rms(audio, frame_len, hop)
    peak = float(np.max(energy)) if energy.size else 0.0
    if peak <= 1e-8:
        return []
    threshold = adaptive_ratio * peak
    return _extract_chunks_from_mask(
        audio, energy, threshold, hop, sr, min_dur, max_dur, merge_gap
    )


# ---------------------------------------------------------------------------
# Feature extraction (80-dim: mean/std/skew/kurtosis of 20 MFCCs)
# ---------------------------------------------------------------------------
def pad_or_crop_chunk(chunk: np.ndarray, target_len: int = 22050) -> np.ndarray:
    if len(chunk) >= target_len:
        start = (len(chunk) - target_len) // 2
        return chunk[start : start + target_len]
    return np.pad(chunk, (0, target_len - len(chunk)), mode="constant").astype(np.float32)


def extract_mfcc_matrix(
    chunk: np.ndarray,
    sr: int = 22050,
    n_mfcc: int = 20,
    fixed_len: int = 22050,
) -> np.ndarray:
    chunk_fixed = pad_or_crop_chunk(chunk, fixed_len)
    mfcc = librosa.feature.mfcc(
        y=chunk_fixed,
        sr=sr,
        n_mfcc=n_mfcc,
        n_fft=2048,
        hop_length=512,
        fmin=50,
        fmax=8000,
    )
    return mfcc.astype(np.float32)


def mfcc_to_80dim_vector(mfcc_matrix: np.ndarray) -> np.ndarray:
    mean_vec = np.mean(mfcc_matrix, axis=1)
    std_vec = np.std(mfcc_matrix, axis=1)
    skew_vec = skew(mfcc_matrix, axis=1)
    kurt_vec = kurtosis(mfcc_matrix, axis=1)
    return np.concatenate([mean_vec, std_vec, skew_vec, kurt_vec]).astype(np.float32)


def aggregate_mfcc_chunks(mfcc_list: List[np.ndarray]) -> np.ndarray:
    if not mfcc_list:
        raise AudioValidationError("NO_COUGH_DETECTED")
    stacked = np.stack(mfcc_list, axis=0)
    return np.mean(stacked, axis=0).astype(np.float32)


def extract_features(chunks: List[np.ndarray], sr: int = 22050, n_mfcc: int = 20) -> np.ndarray:
    if not chunks:
        raise AudioValidationError("NO_COUGH_DETECTED")
    mfcc_list = [extract_mfcc_matrix(chunk, sr, n_mfcc) for chunk in chunks]
    min_t = min(matrix.shape[1] for matrix in mfcc_list)
    trimmed = [matrix[:, :min_t] for matrix in mfcc_list]
    aggregated = aggregate_mfcc_chunks(trimmed)
    return mfcc_to_80dim_vector(aggregated).reshape(1, -1)


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------
def run_models(
    feature: np.ndarray,
    encoder_model: Any,
    svm_model: Any,
    feat_scaler: Any,
    latent_scaler: Any,
    ae_model: Any,
) -> Dict[str, Any]:
    feat_scaled = feat_scaler.transform(feature)

    reconstruction = ae_model.predict(feat_scaled, verbose=0)
    ae_error = float(np.mean(np.square(feat_scaled - reconstruction)))

    latent = encoder_model.predict(feat_scaled, verbose=0)
    latent_scaled = latent_scaler.transform(latent)
    svm_pred = int(svm_model.predict(latent_scaled)[0])
    svm_score = float(svm_model.score_samples(latent_scaled)[0])

    return {
        "ae_error": ae_error,
        "svm_label": "Pneumonia" if svm_pred == 1 else "Bukan Pneumonia",
        "svm_score": svm_score,
    }


def decide(ae_error: float, ae_threshold: float, svm_label: str) -> Dict[str, Any]:
    # NOTE: Tie-break on model disagreement (1 vs 1) currently defaults to "risk".
    # Pending team discussion: evaluate tie-breaking using normalized distance/confidence
    # from both models (Autoencoder threshold margin vs OC-SVM decision_function margin)
    # instead of unconditionally defaulting every disagreement to "risk".
    ae_label = "Pneumonia" if ae_error <= ae_threshold else "Bukan Pneumonia"
    votes = [svm_label, ae_label]
    pneumonia_votes = votes.count("Pneumonia")
    normal_votes = votes.count("Bukan Pneumonia")

    raw_label = "Pneumonia" if pneumonia_votes >= normal_votes else "Bukan Pneumonia"
    return {
        "raw_label": raw_label,
        "result": "risk" if raw_label == "Pneumonia" else "normal",
        "agreement": ae_label == svm_label,
        "votes": {
            "autoencoder": "risk" if ae_label == "Pneumonia" else "normal",
            "ocsvm": "risk" if svm_label == "Pneumonia" else "normal",
        },
        "vote_confidence": max(pneumonia_votes, normal_votes) / len(votes),
    }


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------
def waveform_envelope(audio: np.ndarray, points: int = WAVEFORM_POINTS) -> List[float]:
    """RMS envelope normalized to 0..1 for the result chart."""
    if audio.size == 0:
        return [0.0] * points
    frames = np.array_split(np.abs(audio), points)
    envelope = np.array([float(np.sqrt(np.mean(frame**2))) if frame.size else 0.0 for frame in frames])
    peak = float(np.max(envelope))
    if peak > 1e-8:
        envelope = envelope / peak
    return [round(float(value), 4) for value in envelope]


def build_summary(result: str, agreement: bool) -> str:
    if not agreement:
        return (
            "Kedua model memberi penilaian berbeda. Hasil ini perlu perhatian; "
            "pertimbangkan rekam ulang atau konsultasi ke tenaga kesehatan."
        )
    if result == "risk":
        return (
            "Pola batuk menyerupai data latih pneumonia. Ini bukan diagnosis; "
            "segera konsultasikan ke tenaga kesehatan untuk pemeriksaan lanjutan."
        )
    return (
        "Tidak ditemukan pola batuk yang menyerupai data latih pneumonia. "
        "Tetap pantau kondisi anak dan konsultasikan bila gejala berlanjut."
    )
