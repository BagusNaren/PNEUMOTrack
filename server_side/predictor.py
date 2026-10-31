from pathlib import Path
import logging
import numpy as np
from typing import Dict, Any, List
from tensorflow.keras.models import Model
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import librosa
import noisereduce as nr
from scipy.stats import skew, kurtosis

logger = logging.getLogger(__name__)

# ---------------------------------------------
# AUDIO PREPROCESSING
# ---------------------------------------------
def logmmse_noise_reduction(
    audio: np.ndarray,
    sr: int = 22050,
    prop_decrease: float = 0.4,
    stationary: bool = True
) -> np.ndarray:
    try:
        audio_denoised = nr.reduce_noise(
            y=audio, sr=sr,
            prop_decrease=prop_decrease,
            stationary=stationary,
            n_fft=512, n_jobs=1
        )
        return audio_denoised.astype(np.float32)
    except Exception as e:
        logger.warning(f"Noise reduction gagal, pakai audio asli: {e}")
        return audio

def normalize_amplitude(audio: np.ndarray) -> np.ndarray:
    max_val = np.max(np.abs(audio))
    if max_val > 1e-8:
        return (audio / max_val).astype(np.float32)
    return audio.astype(np.float32)

def preprocess_audio(filepath: str, sr: int = 22050) -> np.ndarray:
    try:
        audio, _ = librosa.load(filepath, sr=sr, mono=True)
        if len(audio) == 0:
            logger.warning(f"File kosong: {filepath}")
            return None
        audio = logmmse_noise_reduction(audio, sr)
        audio = normalize_amplitude(audio)
        return audio
    except Exception as e:
        logger.error(f"Gagal preprocess {filepath}: {e}")
        return None

# ---------------------------------------------
# ADAPTIVE COUGH SEGMENTATION
# ---------------------------------------------
def compute_frame_energy(
    audio: np.ndarray,
    frame_len: int = 512,
    hop: int = 128
) -> np.ndarray:
    rms = librosa.feature.rms(
        y=audio, frame_length=frame_len,
        hop_length=hop, center=True
    )
    return rms[0]

def _extract_chunks_from_mask(
    audio: np.ndarray, energy: np.ndarray,
    energy_threshold: float, hop: int,
    sr: int, min_dur: float, max_dur: float, merge_gap: float
) -> List[np.ndarray]:
    active_mask = energy > energy_threshold
    intervals_samples = []
    in_chunk = False
    chunk_start = 0

    for i, is_active in enumerate(active_mask):
        sample_pos = i * hop
        if is_active and not in_chunk:
            chunk_start = sample_pos
            in_chunk = True
        elif not is_active and in_chunk:
            intervals_samples.append((chunk_start, min(sample_pos, len(audio))))
            in_chunk = False
    if in_chunk:
        intervals_samples.append((chunk_start, len(audio)))

    if not intervals_samples:
        return []

    gap_samples = int(merge_gap * sr)
    merged = [intervals_samples[0]]
    for start, end in intervals_samples[1:]:
        prev_start, prev_end = merged[-1]
        if start - prev_end <= gap_samples:
            merged[-1] = (prev_start, end)
        else:
            merged.append((start, end))

    min_samples = int(min_dur * sr)
    max_samples = int(max_dur * sr)
    chunks = []
    for start, end in merged:
        dur = end - start
        if dur < min_samples:
            continue
        if dur > max_samples:
            center = (start + end) // 2
            start = max(0, center - max_samples // 2)
            end   = min(len(audio), start + max_samples)
        chunks.append(audio[start:end].astype(np.float32))

    return chunks

def segment_cough_chunks(
    audio: np.ndarray,
    sr: int = 22050,
    adaptive_ratio: float = 0.20,
    fallback_ratio: float = 0.05,
    frame_len: int = 512,
    hop: int = 128,
    min_dur: float = 0.1,
    max_dur: float = 2.0,
    merge_gap: float = 0.05
) -> List[np.ndarray]:
    energy = compute_frame_energy(audio, frame_len, hop)
    max_energy = np.max(energy)

    if max_energy < 1e-8:
        logger.warning("Energi sinyal sangat rendah, gunakan seluruh sinyal")
        return [audio]

    threshold = adaptive_ratio * max_energy
    chunks = _extract_chunks_from_mask(
        audio, energy, threshold, hop, sr, min_dur, max_dur, merge_gap
    )

    if not chunks:
        threshold_fb = fallback_ratio * max_energy
        logger.warning(
            f"Adaptive thr={threshold:.4f} → 0 chunk. "
            f"Fallback thr={threshold_fb:.4f}"
        )
        chunks = _extract_chunks_from_mask(
            audio, energy, threshold_fb, hop, sr, min_dur, max_dur, merge_gap
        )

    if not chunks:
        logger.warning("Tetap 0 chunk setelah fallback, gunakan seluruh sinyal")
        return [audio]

    return chunks

# ---------------------------------------------
# FEATURE EXTRACTION (80-dim)
# ---------------------------------------------
def pad_or_crop_chunk(chunk: np.ndarray, target_len: int = 22050) -> np.ndarray:
    if len(chunk) >= target_len:
        start = (len(chunk) - target_len) // 2
        return chunk[start:start + target_len]
    else:
        return np.pad(chunk, (0, target_len - len(chunk)), mode='constant').astype(np.float32)

def extract_mfcc_matrix(
    chunk: np.ndarray,
    sr: int = 22050,
    n_mfcc: int = 20,
    fixed_len: int = 22050
) -> np.ndarray:
    chunk_fixed = pad_or_crop_chunk(chunk, fixed_len)
    mfcc = librosa.feature.mfcc(
        y=chunk_fixed, sr=sr, n_mfcc=n_mfcc,
        n_fft=2048, hop_length=512,
        fmin=50, fmax=8000
    )
    return mfcc.astype(np.float32)

def mfcc_to_80dim_vector(mfcc_matrix: np.ndarray) -> np.ndarray:
    mean_vec = np.mean(mfcc_matrix, axis=1)             # (20,)
    std_vec  = np.std(mfcc_matrix, axis=1)              # (20,)
    skew_vec = skew(mfcc_matrix, axis=1)                # (20,)
    kurt_vec = kurtosis(mfcc_matrix, axis=1)            # (20,)
    return np.concatenate([mean_vec, std_vec, skew_vec, kurt_vec]).astype(np.float32)  # (80,)

def aggregate_mfcc_chunks(mfcc_list: List[np.ndarray]) -> np.ndarray:
    if not mfcc_list:
        raise ValueError("mfcc_list kosong")
    stacked = np.stack(mfcc_list, axis=0)    # (N, 20, T)
    return np.mean(stacked, axis=0).astype(np.float32)   # (20, T)

# ---------------------------------------------
# PREDICTION FUNCTION
# ---------------------------------------------
def predict_new_audio(
    filepath: str,
    encoder_model: Model,
    svm_model: OneClassSVM,
    feat_scaler: MinMaxScaler,
    latent_scaler: StandardScaler,
    ae_model: Model,
    ae_threshold: float,
    sr: int = 22050,
    verbose: bool = True
) -> Dict[str, Any]:
    """
    Inferensi end-to-end.
    """

    result = {
        "filepath": filepath,
        "status": "error",
        "n_chunks": 0,
        "svm_label": None,
        "svm_score": None,
        "ae_label": None,
        "ae_error": None,
        "ae_threshold": float(ae_threshold),
        "final_label": None,
        "confidence": None,
    }

    try:
        audio = preprocess_audio(filepath, sr)

        if audio is None:
            raise ValueError("Gagal memproses audio.")

        chunks = segment_cough_chunks(audio, sr)

        if len(chunks) == 0:
            raise ValueError("Tidak ditemukan segmen batuk.")

        result["n_chunks"] = len(chunks)

        # ==========================
        # MFCC
        # ==========================
        mfcc_list = [extract_mfcc_matrix(chunk, sr) for chunk in chunks]
        min_T = min(m.shape[1] for m in mfcc_list)
        mfcc_trim = [m[:, :min_T] for m in mfcc_list]
        agg = aggregate_mfcc_chunks(mfcc_trim)
        feat = mfcc_to_80dim_vector(agg).reshape(1, -1)

        # ==========================
        # Feature Scaling
        # ==========================
        feat_scaled = feat_scaler.transform(feat)

        # ==========================
        # AutoEncoder
        # ==========================
        feat_recon = ae_model.predict(feat_scaled, verbose=0)
        ae_error = float(
            np.mean(np.square(feat_scaled - feat_recon))
        )

        ae_label = (
            "Pneumonia"
            if ae_error <= ae_threshold
            else "Bukan Pneumonia"
        )

        # ==========================
        # Encoder + OneClassSVM
        # ==========================
        latent = encoder_model.predict(
            feat_scaled,
            verbose=0
        )
        latent_scaled = latent_scaler.transform(latent)
        svm_pred = svm_model.predict(latent_scaled)[0]
        svm_score = float(
            svm_model.score_samples(latent_scaled)[0]
        )

        svm_label = (
            "Pneumonia"
            if svm_pred == 1
            else "Bukan Pneumonia"
        )

        # ==========================
        # Voting
        # ==========================
        votes = [svm_label, ae_label]
        pneumonia_votes = votes.count("Pneumonia")
        normal_votes = votes.count("Bukan Pneumonia")

        final = (
            "Pneumonia"
            if pneumonia_votes >= normal_votes
            else "Bukan Pneumonia"
        )

        confidence = max(
            pneumonia_votes,
            normal_votes
        ) / len(votes)

        result.update({
            "status": "success",
            "svm_label": svm_label,
            "svm_score": svm_score,
            "ae_label": ae_label,
            "ae_error": ae_error,
            "final_label": final,
            "confidence": confidence
        })

        if verbose:
            emoji = "🫁" if final == "Pneumonia" else "✅"
            print("=" * 60)
            print(f"File       : {Path(filepath).name}")
            print(f"Chunks     : {len(chunks)}")
            print(f"SVM        : {svm_label} ({svm_score:.4f})")
            print(f"AE         : {ae_label} ({ae_error:.6f})")
            print(f"HASIL      : {emoji} {final}")
            print(f"Confidence : {confidence:.0%}")
            print("=" * 60)

    except Exception as e:
        logger.exception("Prediction Error")
        result["error_msg"] = str(e)
        if verbose:
            print(e)

    return result