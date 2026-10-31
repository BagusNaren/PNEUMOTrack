# PNEUMOTrack — Backend & Data (Member A)

> Status: **implemented on `main` (merge `8c35b80`), team sign-off pending.**
> Audit of Member A work across Sprint 0–5, with run instructions and remaining items.

## Scope

Member A owns `server_side/**`, `supabase/**`, `docs/api.md`. Responsibilities: FastAPI backend, AI inference, Supabase schema/RLS/seed, deployment assets. No UI.

---

## 1. What was delivered

| Area | Files |
|---|---|
| API v2 | `server_side/app.py`, `predictor.py`, `model.py` |
| Tests | `server_side/tests/` (11 cases, all passing) |
| Dependencies | `server_side/requirements.txt` (pinned), `requirements-dev.txt` |
| Supabase | `supabase/migrations/0001_init.sql`, `supabase/seed.sql` |
| Deploy | `server_side/Dockerfile`, `.dockerignore`, `scripts/smoke.sh|ps1`, `scripts/rls-test.mjs` |
| Docs | `docs/api.md`, `docs/backend-local.md`, `docs/deploy.md`, `docs/architecture.md`, `server_side/README.md` |

## 2. Quick facts

| Item | Value |
|---|---|
| Python | 3.12 (uv) |
| TensorFlow / scikit-learn / numpy | 2.21.0 / 1.6.1 / 2.5.4 |
| Model version | `v3` |
| `ae_threshold` | `0.03890753164887428` |
| `sample_rate` | missing from config → 22,050 Hz fallback |
| Features | 20 MFCC → 80-dim (mean/std/skew/kurtosis) |
| Label mapping | `Pneumonia` → `risk`, `Bukan Pneumonia` → `normal` |

## 3. API (contract v2)

- `POST /predict` — multipart `audio` (m4a/aac/mp4/wav, ≤ 10 MB) + optional `child_id`
- `GET /health` → `{ "status": "ok", "model_version": "v3" }`
- 200 → `result`, `raw_label`, `agreement`, `votes`, `autoencoder`, `ocsvm`, `chunks`, `duration_sec`, `waveform[100]`, `summary`, `model_version`
- 422 codes → `AUDIO_TOO_SHORT`, `AUDIO_SILENT`, `NO_COUGH_DETECTED`, `AUDIO_TOO_NOISY`, `UNSUPPORTED_FORMAT`, `FILE_TOO_LARGE`, `INVALID_REQUEST`
- 500 → `INTERNAL_ERROR`
- Full spec + verification: [`docs/api.md`](./docs/api.md)

## 4. Run

```bash
# backend
cd server_side
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000

# tests
.venv/Scripts/python.exe -m pytest -q            # 11 passed
./scripts/smoke.sh http://127.0.0.1:8000 sample.m4a

# docker
docker build -t pneumotrack-api server_side
docker run --rm -p 8000:8000 pneumotrack-api

# supabase (local compose)
bun run db:up
bun run db:migrate
bun run db:seed
bun run db:rls
bun run db:types
```

## 5. Database

- Tables: `profiles`, `children`, `screenings`, `hospitals`, `doctors`, `articles`, `conversations`/`messages` (P2)
- RLS enabled on all; `screenings` scoped via `children.parent_id = auth.uid()`
- Trigger creates `profiles` on sign-up
- `messages` added to `supabase_realtime` publication when available
- Seed: 10 hospitals (Denpasar coordinates), 6 doctors, 6 articles

## 6. Audit status

| Sprint | Result |
|---|---|
| 0 — Kickoff | ✅ docs/api.md + PRD §12 draft; 🟡 model-owner confirmation & team sign-off pending |
| 1 — Fondasi | ✅ backend v2, tests; ⛔ Supabase cloud project not created (local only) |
| 2 — Quality gate | ✅ all codes + waveform + summary; ⛔ real-recording calibration |
| 3 — Data & deploy prep | ✅ seed + RLS test + Dockerfile + smoke; ⬜ help C debugging |
| 4 — Deploy & realtime | 🟡 deploy assets ready, realtime enabled; ⛔ VPS execution |
| 5 — Hardening & demo | ✅ PRD/api final + architecture notes; ⬜ QA-based fixes |

## 7. Remaining / blocked

| # | Item | Blocker |
|---|---|---|
| 1 | Team sign-off PRD §12 | team decision |
| 2 | Model owner confirms label/threshold/`sample_rate` | model owner |
| 3 | Supabase cloud project (Singapura) + share keys | Supabase account |
| 4 | Deploy VPS + HTTPS + monitoring | server/domain access |
| 5 | Calibrate thresholds with ~10 real recordings | recording samples |
| 6 | End-to-end test from a real phone | device |
| 7 | Realtime chat verified + demo doctor account | chat UI (Member C) |
| 8 | Help C debug Supabase queries/policies | Member C progress |

## 8. Decisions needed from the team

1. `Pneumonia` = `risk`? (proposal: yes)
2. Final endpoint `POST /predict` v2?
3. `sample_rate`: add to `config_v3.pkl` or keep 22,050 Hz fixed?
4. Minimum duration 3 s (align app + backend)?
5. Quality-gate thresholds: keep until real recordings collected?

Record answers in `task.md` → "Pertanyaan Terbuka".

---

*Model limitation: trained only on pneumonia-labelled samples; 96.3% is dataset consistency, not clinical accuracy.*
