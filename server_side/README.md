# PNEUMOTrack Backend

FastAPI + Autoencoder/OC-SVM screening API. Contract: [`../docs/api.md`](../docs/api.md). Product rules: [`../PRD.md`](../PRD.md).

## Requirements

- Python 3.12 via [uv](https://docs.astral.sh/uv/)
- No system ffmpeg needed: decoding uses the bundled `imageio-ffmpeg` binary (installable on Windows/Linux)

## Local setup

```bash
cd server_side
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt      # Windows
# uv pip install --python .venv/bin/python -r requirements.txt             # Linux/macOS
uv pip install --python .venv/Scripts/python.exe -r requirements-dev.txt  # tests
```

## Run

```bash
cd server_side
.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
# Linux/macOS: .venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

- Health: `GET /health` → `{"status":"ok","model_version":"v3"}`
- Swagger: `/docs`
- CORS: set `CORS_ORIGINS` (comma separated, default `*` for local dev)
- Bind `0.0.0.0` so a phone on the same LAN can reach it; emulator uses `10.0.2.2`.

## Test

```bash
cd server_side
.venv/Scripts/python.exe -m pytest -q
./scripts/smoke.sh                       # health only
./scripts/smoke.sh http://127.0.0.1:8000 sample.m4a
```

## Docker

```bash
docker build -t pneumotrack-api server_side
docker run --rm -p 8000:8000 pneumotrack-api
```

## Deploy

Assets and checklist: [`../docs/deploy.md`](../docs/deploy.md). Deployment to the VPS is **not executed** yet (no server access); the Dockerfile, nginx, and systemd templates are ready.

## Model limitations

- Trained **only** on pneumonia-labelled cough samples (one-class anomaly detection). `Pneumonia` means "similar to the training pattern" → API maps it to `risk`.
- The 96.3% figure in the proposal measures consistency on that dataset, **not clinical accuracy**. Never use it in UI copy or slides as accuracy.
- Quality gate thresholds were calibrated with synthetic signals only. Real cough recordings must be used to re-calibrate before claiming sensitivity/specificity.
- Audio is deleted after inference; no recordings or child data are logged.
