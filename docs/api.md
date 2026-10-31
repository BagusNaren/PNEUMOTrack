# PNEUMOTrack — API Contract v2

Status: **implemented** in `server_side/` (commit on `feat/a-backend-v2`). Team sign-off for `PRD.md` §12 is still pending; the backend already behaves exactly as described here.

Owner: Member A. Source of truth for Member B/C when building the API client and result screens.

---

## 1. Model facts

Read from `server_side/deployment_v3/config_v3.pkl` and the model artifacts.

| Item | Value | Note |
|---|---|---|
| `model_version` | `v3` | from `config["version"]` |
| `ae_threshold` | `0.03890753164887428` | autoencoder MSE threshold |
| `sample_rate` | **not in config** | code uses 22,050 Hz fallback; add it to config or treat 22.05 kHz as fixed |
| `n_mfcc` | `20` | |
| `latent_dim` | `4` | encoder output |
| `feature_dim` | `80` | mean/std/skew/kurtosis × 20 |
| Pickle authoring version | `scikit-learn==1.6.1` | pinned in `requirements.txt` |
| Keras models | `encoder_v3.h5`, `autoencoder_full_v3.h5` | load on TensorFlow 2.21 / Keras 3, `compile=False` |

Do not change model artifacts without the model owner's approval.

---

## 2. Label mapping

The model is one-class, trained **only on pneumonia samples**. Similarity to that training distribution therefore means **risk**, never diagnosis.

| Raw label | `result` | UI |
|---|---|---|
| `Pneumonia` | `risk` | pink/red, "Indikasi risiko pneumonia, perlu perhatian" |
| `Bukan Pneumonia` | `normal` | blue/teal, "Tidak ditemukan tanda pola batuk pneumonia" |

- `agreement = (autoencoder vote == ocsvm vote)`.
- Tie (1–1) → `risk`.
- `confidence` is **not** in the response. Internally it is the vote share (0.5 / 1.0) and must never be shown as clinical accuracy. The 96.3% proposal figure is not a clinical metric.

---

## 3. `POST /predict`

`multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `audio` | file | yes | `.wav`, `.m4a`, `.mp4`, `.aac`, `.mp3`, `.ogg`, `.flac`; max 10 MB |
| `child_id` | UUID string | no | accepted and ignored by the model; never logged |

Formats are decoded with the bundled ffmpeg binary (`imageio-ffmpeg`) to mono 22.05 kHz WAV before feature extraction.

### 200 OK

```json
{
  "status": "success",
  "result": "risk",
  "raw_label": "Pneumonia",
  "agreement": true,
  "votes": { "autoencoder": "risk", "ocsvm": "risk" },
  "autoencoder": { "error": 0.0012, "threshold": 0.03890753164887428 },
  "ocsvm": { "score": 0.41 },
  "chunks": 4,
  "duration_sec": 6.2,
  "waveform": [0.01, 0.2, 0.8],
  "summary": "Ringkasan non-diagnostik berbahasa Indonesia",
  "model_version": "v3"
}
```

| Field | Type | Meaning |
|---|---|---|
| `result` | `"risk" \| "normal"` | drives UI color and CTA |
| `raw_label` | `"Pneumonia" \| "Bukan Pneumonia"` | model transparency |
| `agreement` | boolean | both models agree |
| `votes.*` | `"risk" \| "normal"` | per-model vote |
| `autoencoder.error` | number | reconstruction MSE |
| `autoencoder.threshold` | number | fixed threshold |
| `ocsvm.score` | number | `score_samples`, not a probability |
| `chunks` | integer | cough segments found |
| `duration_sec` | number | duration after decoding |
| `waveform` | number[100] | RMS envelope, 0..1 |
| `summary` | string | Indonesian, non-diagnostic, no fake vitals |
| `model_version` | `"v3"` | |

### 422 — audio not usable (no result returned)

```json
{ "status": "error", "code": "AUDIO_TOO_SHORT", "message": "Rekaman terlalu pendek. Rekam minimal 3 detik." }
```

| Code | Trigger | App behavior |
|---|---|---|
| `AUDIO_TOO_SHORT` | duration < 3 s | re-record |
| `AUDIO_SILENT` | peak RMS < 1e-4 before normalization | re-record |
| `NO_COUGH_DETECTED` | segmentation returns 0 chunks (fallback removed) | re-record while coughing |
| `AUDIO_TOO_NOISY` | SNR < 3 dB or active frames > 80% | re-record in a quieter room |
| `UNSUPPORTED_FORMAT` | suffix outside the allow-list or ffmpeg decode failure | re-record |
| `FILE_TOO_LARGE` | > 10 MB | record a shorter clip |
| `INVALID_REQUEST` | missing `audio` field | fix the request |

### 500

```json
{ "status": "error", "code": "INTERNAL_ERROR", "message": "Terjadi kesalahan. Coba lagi." }
```

### `GET /health`

```json
{ "status": "ok", "model_version": "v3" }
```

---

## 4. Client contract

- Upload timeout 60 s; retry only on network/timeout/500, never on 422.
- `child_id` optional; send it only if the app already has the active child.
- Audio is deleted server-side after inference; the app should delete its local file after upload.
- Server logs contain: request id, status, result, agreement, chunks, byte size, duration. **No filenames, paths, `child_id`, or audio.**

---

## 5. Verification evidence

### Backend tests (`server_side/tests/test_api.py`)

`pytest -q` → **11 passed**.

| Test | Expected | Result |
|---|---|---|
| `/health` | 200 `{ok, v3}` | pass |
| cough-like WAV | 200 with full contract, waveform 100 points | pass |
| cough-like M4A | 200 (ffmpeg decode) | pass |
| `child_id` sent | 200, not echoed | pass |
| silent WAV | 422 `AUDIO_SILENT` | pass |
| 1 s WAV | 422 `AUDIO_TOO_SHORT` | pass |
| white noise | 422 `AUDIO_TOO_NOISY` or `NO_COUGH_DETECTED` | pass |
| `.txt` | 422 `UNSUPPORTED_FORMAT` | pass |
| 11 MB WAV | 422 `FILE_TOO_LARGE` | pass |
| no `audio` field | 422 `INVALID_REQUEST` | pass |
| temp files | removed after requests | pass |

### Quality-gate calibration

| Fixture | Duration | Result |
|---|---|---|
| cough-like bursts (3 bursts, 6 s) | 6.0 s | accepted |
| digital silence | 5.0 s | `AUDIO_SILENT` |
| tone / white noise | 1–5 s | `AUDIO_TOO_SHORT` or `AUDIO_TOO_NOISY` |
| short burst | 1.0 s | `AUDIO_TOO_SHORT` |

**Still required:** 10 real recordings (silence, speech, fan/TV, adult cough, dataset samples) to confirm the thresholds. Synthetic fixtures only prove the gate works mechanically.

### Supabase RLS (`server_side/scripts/rls-test.mjs`)

Two real accounts against local Supabase:

| Check | Result |
|---|---|
| B reads A's `children` | 0 rows (pass) |
| B reads A's `screenings` | 0 rows (pass) |
| B inserts screening for A's child | `403` (pass) |
| A reads own children/screenings | 1 each (pass) |
| anon reads doctors/hospitals/articles | 6 / 10 / 6 rows (pass) |

### Deployment

Dockerfile, smoke scripts, nginx/systemd templates, and checklist live in `docs/deploy.md`. **VPS deployment not executed** — no server/domain access.

Docker runtime verified locally: image `pneumotrack-api:local` (3.9 GB) starts, `/health` → 200, `/predict` with a valid WAV → 200, CORS preflight → 200.

Local LAN check: server bound to `0.0.0.0`, `curl http://192.168.18.6:8000/health` → `200` from another interface on the same machine. A physical-phone request over Wi-Fi is still untested.

---

## 6. Decisions still needed from the team

| # | Question | Proposal | Status |
|---|---|---|---|
| 1 | `Pneumonia` = `risk`? | yes | awaiting model owner |
| 2 | Final endpoint | `POST /predict` v2 | awaiting sign-off |
| 3 | `sample_rate` | add to `config_v3.pkl` or keep 22,050 Hz fixed | Member A decision |
| 4 | Minimum duration | 3 s in app and backend | align with B |
| 5 | Quality thresholds | keep current values until real recordings are collected | needs dataset |

---

## 7. TypeScript types for the app

```ts
type ScreeningResult = 'normal' | 'risk';
type AudioErrorCode =
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_SILENT'
  | 'NO_COUGH_DETECTED'
  | 'AUDIO_TOO_NOISY'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'INVALID_REQUEST';
```

## 8. Examples

```bash
curl http://127.0.0.1:8000/health

curl -X POST http://127.0.0.1:8000/predict \
  -F "audio=@sample.m4a" \
  -F "child_id=00000000-0000-0000-0000-000000000000"
```
