<div align="center">

<img width="1500" height="1000" alt="PNEUMOTrack_thumbnail" src="https://github.com/user-attachments/assets/910a09cb-f6dd-417c-96bd-69eb57519f09" />

# PNEUMOTrack

### *Track the Signs, Guard the Lungs.*

**AI cough-sound screening that helps parents spot early pneumonia risk in children, right from a smartphone.**

![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?logo=tensorflow&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

INCEPTION 2026 Hackathon · Universitas Udayana

</div>

---

## Table of contents

1. [The problem](#1-the-problem)
2. [What PNEUMOTrack does](#2-what-pneumotrack-does)
3. [How it works](#3-how-it-works)
4. [Tech stack](#4-tech-stack)
5. [Repository structure](#5-repository-structure)
6. [Run it locally, step by step](#6-run-it-locally-step-by-step)
7. [API quick reference](#7-api-quick-reference)
8. [Testing](#8-testing)
9. [Troubleshooting](#9-troubleshooting)
10. [Responsible AI and limitations](#10-responsible-ai-and-limitations)
11. [Roadmap](#11-roadmap)
12. [Team](#12-team)

---

## 1. The problem

Pneumonia is still one of the biggest health threats to children in Indonesia.

- Around **19,000** child deaths from pneumonia were recorded in Indonesia in 2018, one of the highest counts in the world.
- In 2023 pneumonia was the **costliest disease for BPJS Kesehatan**, at **Rp8.7 trillion**.
- In Surakarta, only **46.4%** of estimated pneumonia cases in under-fives were found through health services. More than half were never reached.

Early symptoms look like a common cold, parents have no objective way to tell a worrying cough from an ordinary one, and chest X-rays are costly and often unavailable in primary care or remote areas.

> **What if the phone in every parent's hand could give a first, fast, non-invasive signal?**

## 2. What PNEUMOTrack does

PNEUMOTrack is a mobile app for early pneumonia **risk screening** in children, based on cough sounds.

1. **Register** a child profile.
2. **Record** a short cough with the phone microphone, guided by on-screen tips.
3. **Analyze**: the backend checks audio quality, extracts acoustic features and runs two anomaly-detection models.
4. **See the result**: a clear, non-diagnostic status (normal or needs attention) with a waveform and a plain-language summary.
5. **Act**: warning signs to watch for, doctors to consult and nearby hospitals.
6. **Track**: every screening is saved to the child's history.

> PNEUMOTrack is a **screening aid, not a diagnosis**. It does not replace a doctor or a chest X-ray.

## 3. How it works

```mermaid
flowchart LR
    APP["Expo app<br/>(React Native)"] -->|"m4a + child_id"| API["FastAPI<br/>POST /predict"]
    API --> GATE["Audio quality gate"]
    GATE -->|valid| PRE["Preprocess<br/>noise reduction + normalize"]
    PRE --> SEG["Cough segmentation<br/>RMS threshold"]
    SEG --> FEAT["20 MFCC → 80-dim vector"]
    FEAT --> AE["Autoencoder<br/>reconstruction MSE"]
    FEAT --> ENC["Encoder (4-dim)"]
    ENC --> SVM["One-Class SVM"]
    AE --> VOTE["Majority vote"]
    SVM --> VOTE
    VOTE --> API
    API -->|"result, waveform, summary"| APP
    APP -->|"save screening"| SB[("Supabase<br/>Auth + Postgres + RLS")]
```

**Audio and AI pipeline**

| Step | What happens |
|---|---|
| Decode | Phone audio (m4a/AAC) is decoded to mono 22.05 kHz WAV with the bundled ffmpeg |
| Quality gate | Rejects audio that is too short (< 3 s), silent, too noisy or without a detectable cough, and asks the user to re-record |
| Preprocess | Noise reduction (`noisereduce`) and peak normalization |
| Segment | Energy (RMS) based cough segmentation into 1-second chunks |
| Features | 20 MFCCs per chunk, summarized as mean, std, skew and kurtosis (80 dimensions), mean-pooled per recording |
| Models | **Autoencoder** (reconstruction error vs. threshold) and **One-Class SVM** (on the 4-dim latent space) |
| Decision | Majority voting plus an `agreement` flag. A tie is treated conservatively as `risk` |

Because the open dataset contains **only pneumonia-labelled coughs** (82 patients), the task is framed as **one-class anomaly detection**. The model reports how much a cough *resembles the pneumonia pattern*, and the app translates that into a cautious "risk / normal" screening result.

## 4. Tech stack

| Layer | Technology |
|---|---|
| **Mobile app** | Expo SDK 58, React Native 0.88, React 19, Expo Router, TypeScript, NativeWind (Tailwind), Reanimated |
| **Backend and AI** | Python 3.12, FastAPI, Uvicorn, TensorFlow/Keras, scikit-learn, librosa, noisereduce, SciPy, soundfile, imageio-ffmpeg, pytest |
| **Database and auth** | Supabase (PostgreSQL 17, GoTrue, PostgREST) with Row Level Security |
| **Infrastructure** | Docker and Docker Compose (local Supabase stack, backend image), Caddy gateway (local), VPS deployment guide (Nginx + certbot) |

## 5. Repository structure

```
PNEUMOTrack/
├── src/                      # Expo app
│   ├── app/                  # Screens (file-based routing)
│   │   ├── (auth)/           # sign-in, sign-up
│   │   ├── (tabs)/           # dashboard, monitoring, children, more
│   │   ├── children/ history/ doctors/ hospitals/ chats/ articles/
│   │   └── recommendation.tsx
│   ├── components/ui/        # Design system (Button, Card, StatusBanner, Waveform...)
│   ├── constants/            # theme, copy (UI text), config (env)
│   ├── hooks/                # session, active child, location
│   ├── services/             # Supabase client + data services (real and mock)
│   └── types/
├── server_side/              # FastAPI + models
│   ├── app.py                # API endpoints
│   ├── predictor.py          # audio pipeline + features + decision
│   ├── model.py              # model loading
│   ├── deployment_v3/        # trained models (.h5, .pkl)
│   ├── tests/                # pytest suite
│   └── pneumonia_detection_v3.ipynb   # training notebook
├── supabase/                 # migrations + seed data
├── docker/ docker-compose.yml        # local Supabase stack
├── docs/                     # api.md, architecture.md, backend-local.md, deploy.md
└── PRD.md  design.md  task.md
```

## 6. Run it locally, step by step

You will run **three things**: the AI backend, the local database, and the mobile app.

```
┌──────────────┐  audio   ┌──────────────────┐
│  Expo app    │ ───────▶ │ FastAPI :8000    │
│  (phone/emu) │          └──────────────────┘
│              │  data    ┌──────────────────┐
│              │ ───────▶ │ Supabase :54321  │  (Docker)
└──────────────┘          └──────────────────┘
```

### 6.1 Prerequisites

| Tool | Version | Why |
|---|---|---|
| [Git](https://git-scm.com/) | any | clone the repo |
| [Bun](https://bun.sh/) | latest | install JS dependencies and run scripts |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest | local Supabase (Postgres, auth, REST) |
| [uv](https://docs.astral.sh/uv/) | ≥ 0.13 | Python 3.12 virtual environment for the backend |
| [Android Studio](https://developer.android.com/studio) **or** a physical Android phone | recent | run the app (emulator or device) |

> You do **not** need to install ffmpeg. The backend uses the binary bundled in `imageio-ffmpeg`.
> Prefer plain `pip`? Python 3.12 and `python -m venv` work too. See the note in step 6.4.

### 6.2 Clone the repository

```bash
git clone https://github.com/BagusNaren/PNEUMOTrack.git
cd PNEUMOTrack
```

### 6.3 Start the local database (Supabase via Docker)

Make sure Docker Desktop is running, then from the repository root:

```bash
bun install               # install JS dependencies (also installs the Supabase CLI)
bun run db:up             # start Postgres, auth, REST, Studio, gateway
bun run db:migrate        # create tables and Row Level Security policies
bun run db:seed           # insert 10 hospitals (Denpasar), 6 doctors, 6 articles
```

What you get:

| Service | URL |
|---|---|
| Supabase API (auth + REST) | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio (browse tables) | http://127.0.0.1:54323 |

Optional checks:

```bash
bun run db:rls            # verifies that one parent cannot read another parent's data
bun run db:logs           # follow container logs
bun run db:down           # stop (keeps data)
bun run db:reset          # wipe the database and start fresh
```

> The credentials above are the public Supabase **local defaults**. Never reuse them in production.

### 6.4 Start the AI backend (FastAPI)

Open a **new terminal**:

```bash
cd server_side
uv venv --python 3.12 .venv
```

Install dependencies (pick your OS):

```powershell
# Windows (PowerShell)
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
uv pip install --python .venv/Scripts/python.exe -r requirements-dev.txt
```

```bash
# macOS / Linux
uv pip install --python .venv/bin/python -r requirements.txt
uv pip install --python .venv/bin/python -r requirements-dev.txt
```

> **pip alternative:** create a Python 3.12 venv, activate it, then `pip install -r requirements.txt -r requirements-dev.txt`. Keep the pinned versions, because the `.pkl` models were created with `scikit-learn==1.6.1`.

Run the server:

```powershell
# Windows
.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

```bash
# macOS / Linux
.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

The first start loads the TensorFlow models, so wait **30 to 60 seconds**. Then check:

- Health: http://127.0.0.1:8000/health → `{"status":"ok","model_version":"v3"}`
- Interactive API docs (Swagger): http://127.0.0.1:8000/docs

`--host 0.0.0.0` lets a phone on the same Wi-Fi reach the API. Restrict browser origins with the `CORS_ORIGINS` environment variable if needed (default `*` for local development).

**Prefer Docker for the backend?**

```bash
docker build -t pneumotrack-api server_side
docker run --rm -p 8000:8000 pneumotrack-api
```

### 6.5 Configure the mobile app

Back in the repository root, create your env file from the example:

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

Then edit `.env`. The URLs depend on **where the app runs**:

| App runs on | Use this host in the URLs |
|---|---|
| Android **emulator** | `10.0.2.2` |
| **Physical phone** (same Wi-Fi as your computer) | your computer's LAN IP, e.g. `192.168.1.20` |

```ini
# Supabase (local stack from step 6.3)
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<keep the value from .env.example>

# AI backend (from step 6.4)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# Optional switches
EXPO_PUBLIC_USE_MOCK_DATA=false    # true = use built-in sample data, no Docker/Supabase needed
EXPO_PUBLIC_USE_MOCK_API=false     # true = fake prediction results, no backend needed
```

> `127.0.0.1` / `localhost` points to the **phone itself**, not your computer, so it will not work from a device or emulator.
> Find your LAN IP with `ipconfig` (Windows) or `ifconfig` / `ip a` (macOS/Linux).

### 6.6 Install the native packages the app needs

Some packages used by the code are installed through Expo so that versions match SDK 58. Run once, from the repository root:

```bash
bunx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill react-native-svg expo-location expo-audio
```

> Use `bunx expo install`, not `bun add`, for Expo and React Native packages, so versions stay compatible with the SDK.

### 6.7 Run the app

Because the app uses native modules (microphone, location), use a **development build** rather than Expo Go.

**Option A: Android emulator or USB-connected phone (Android Studio installed)**

```bash
bunx expo run:android
```

This builds and installs the development build, then starts Metro. The first build takes several minutes.

**Option B: Metro only (after a development build is already installed)**

```bash
bun run start
```

Press `a` to open on Android, or scan the QR code from the development build.

> Quick UI-only preview: set `EXPO_PUBLIC_USE_MOCK_DATA=true` in `.env` and start with `bun run start`. You can browse the screens with sample data without Docker or the backend. Features that need the microphone still need a development build.

### 6.8 Try the full flow

1. Open the app and **sign up** with any email and password. The local auth stack auto-confirms accounts.
2. **Add a child** profile.
3. Browse **doctors**, **hospitals** and **articles** (loaded from the seeded database).
4. Check the backend with a real recording (see [Testing](#8-testing)).

### 6.9 Quick start cheat sheet

```bash
# terminal 1 (repo root)
bun install && bun run db:up && bun run db:migrate && bun run db:seed

# terminal 2
cd server_side && uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt     # macOS/Linux: .venv/bin/python
.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000    # macOS/Linux: .venv/bin/python

# terminal 3 (repo root)
cp .env.example .env     # then edit URLs (step 6.5)
bunx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill react-native-svg expo-location expo-audio
bunx expo run:android
```

## 7. API quick reference

Full contract: [`docs/api.md`](./docs/api.md)

### `POST /predict`

`multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `audio` | file | yes | `.wav`, `.m4a`, `.mp4`, `.aac`, `.mp3`, `.ogg`, `.flac`, max 10 MB |
| `child_id` | string | no | accepted, ignored by the model, never logged |

```bash
curl -F "audio=@cough.m4a" http://127.0.0.1:8000/predict
```

**200 OK**

```json
{
  "status": "success",
  "result": "risk",
  "raw_label": "Pneumonia",
  "agreement": true,
  "votes": { "autoencoder": "risk", "ocsvm": "risk" },
  "autoencoder": { "error": 0.0012, "threshold": 0.0389 },
  "ocsvm": { "score": 0.41 },
  "chunks": 4,
  "duration_sec": 6.2,
  "waveform": [0.01, 0.2, 0.8],
  "summary": "Ringkasan non-diagnostik berbahasa Indonesia",
  "model_version": "v3"
}
```

**422**: audio cannot be used, so the app asks for a new recording

| Code | Meaning |
|---|---|
| `AUDIO_TOO_SHORT` | shorter than 3 seconds |
| `AUDIO_SILENT` | nothing audible |
| `NO_COUGH_DETECTED` | no cough segment found |
| `AUDIO_TOO_NOISY` | too much background noise |
| `UNSUPPORTED_FORMAT` | file type or decoding problem |
| `FILE_TOO_LARGE` | larger than 10 MB |

`GET /health` returns `{"status":"ok","model_version":"v3"}`.

### Database (Supabase / PostgreSQL)

`profiles`, `children`, `screenings`, `doctors`, `hospitals`, `articles`, `conversations`, `messages`. Row Level Security is enabled on every table, so parents can only access their own children and screenings. Audio recordings are **not stored**.

## 8. Testing

```bash
# Backend unit and API tests
cd server_side
.venv/Scripts/python.exe -m pytest -q          # macOS/Linux: .venv/bin/python

# Smoke test against a running server
./scripts/smoke.sh                                       # health only
./scripts/smoke.sh http://127.0.0.1:8000 cough.m4a       # with a real recording
./scripts/smoke.ps1 -Sample cough.m4a                    # Windows PowerShell

# Database access rules (from repo root, needs the local DB running)
bun run db:rls

# App quality
bun run lint
bunx tsc --noEmit
```

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Unable to resolve module @supabase/supabase-js` (or `async-storage`, `expo-location`, `react-native-svg`) | Run the `bunx expo install ...` command from [step 6.6](#66-install-the-native-packages-the-app-needs), then `bunx expo start -c` to clear the cache |
| App on a **phone** cannot reach the API or database | Use your computer's **LAN IP** in `.env`, keep both devices on the same Wi-Fi, and allow ports `8000` and `54321` in the firewall |
| App on the **emulator** cannot reach the API | Use `10.0.2.2` instead of `localhost` |
| `/health` is not ready right after starting the backend | Wait 30 to 60 seconds for TensorFlow to load the models |
| `bun run db:up` fails with a port error | Another service uses `54321`, `54322` or `54323`. Stop it or change the ports in `docker-compose.yml` |
| Database is in a strange state | `bun run db:reset` wipes volumes and recreates everything (run `db:migrate` and `db:seed` again) |
| Windows blocks the system Python (`os error 4551`) | Use `uv`, which installs its own managed Python 3.12 |
| Model loading error about scikit-learn | Install with the pinned `requirements.txt`; the models require `scikit-learn==1.6.1` |
| TensorFlow prints oneDNN messages | Harmless. Set `TF_ENABLE_ONEDNN_OPTS=0` to silence them |
| Microphone or location does not work | Use a **development build** (`bunx expo run:android`), not Expo Go, and grant the permissions on the device |

## 10. Responsible AI and limitations

We want to be honest about what this prototype can and cannot do.

- **Screening aid, not a diagnosis.** Results are worded as "risk" and "needs attention", with a disclaimer and a list of danger signs that should send a child to the emergency room immediately.
- **One-class training data.** The model was trained only on pneumonia-labelled coughs, so it measures similarity to that pattern. It has **not** been evaluated on healthy children or other causes of cough.
- **The 96.3% figure is not clinical accuracy.** In Leave-One-Out evaluation on 82 pneumonia samples, 79 were classified as inliers. This shows consistency with the training class, so the app never presents it as accuracy.
- **No clinical validation yet.** The quality-gate thresholds were calibrated mainly with synthetic signals and need real recordings before any performance claims.
- **Noise and microphones matter.** Background noise and phone microphone quality can affect consistency.
- **Privacy first.** Audio is deleted right after inference, recordings and child names are never logged, and database access is restricted per user with Row Level Security.

## 11. Roadmap

- [ ] Collect non-pneumonia coughs (healthy, cold, asthma, bronchitis) to measure sensitivity and specificity
- [ ] Clinical validation with pediatricians and partner community health centers (puskesmas)
- [ ] Re-calibrate the audio quality gate with real home recordings
- [ ] Complete the recording and analysis screens end to end on device
- [ ] Real-time doctor chat and live hospital map with distance
- [ ] Deploy the backend to a VPS with HTTPS (guide in [`docs/deploy.md`](./docs/deploy.md))
- [ ] Anonymized epidemiology dashboard for health offices

## 12. Team

| Role | Member |
|---|---|
| Team leader, pneumonia model developer (Autoencoder + OC-SVM), UI designer, Member C (mobile features) | [@BagusNaren](https://github.com/BagusNaren) |
| Member A: backend, AI serving, Supabase | [@ruditagithub](https://github.com/ruditagithub) |
| Member B: mobile core flow (recording, analysis, result) | [@Nomad37301](https://github.com/Nomad37301) |

Built for the **INCEPTION 2026 Hackathon** · Universitas Udayana.

## Documentation

- [`docs/api.md`](./docs/api.md): API contract
- [`docs/architecture.md`](./docs/architecture.md): architecture and AI pipeline
- [`docs/backend-local.md`](./docs/backend-local.md): backend local setup notes
- [`docs/deploy.md`](./docs/deploy.md): VPS deployment guide
- [`docker/README.md`](./docker/README.md): local Supabase stack
- [`PRD.md`](./PRD.md): product requirements

## License

See [`LICENSE`](./LICENSE).
