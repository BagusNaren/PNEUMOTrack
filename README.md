<div align="center">

<img width="1500" height="1000" alt="PNEUMOTrack_banner_logos" src="https://github.com/user-attachments/assets/40d24b6c-203a-4c0a-b16e-b7ed08a4116d" />

<img width="3778" height="1640" alt="merged-images" src="https://github.com/user-attachments/assets/64e49514-00e6-4754-a9e2-1a8980cf02e4" />

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

## Try the deployed product

A deployed build of PNEUMOTrack that you can test right away is available on the release page:

**[Release `deployed_product`: deployed product you can test](https://github.com/BagusNaren/PNEUMOTrack/releases/tag/deployed_product)**

Release timestamp: **1 November 2026, 12:00 WITA (GMT+8)**

Prefer to run everything yourself? Follow [Run it locally, step by step](#6-run-it-locally-step-by-step).

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
11. [Roadmap and next steps](#11-roadmap-and-next-steps)
12. [AI Use and Third-Party Declaration](#12-ai-use-and-third-party-declaration)
13. [Team](#13-team)

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
    subgraph HW["Hardware"]
        direction TB
        MIC[/"Smartphone<br/>Microphone"/] --> REC("On-device Audio Recording<br/>(Edge Processing)")
        REC --> AUD[("Cough Audio Data<br/>(m4a / WAV)")]
    end

    subgraph CC["Communication & Cloud"]
        direction TB
        API("REST API<br/>(FastAPI over HTTPS, hosted on VPS)")
        CLOUD(["Cloud Storage<br/>(Supabase / PostgreSQL)"])
        API --> CLOUD
    end

    subgraph SW["Software"]
        direction TB
        RES[("Retrieved<br/>Screening Result")]
        DASH[/"Dashboard & Summary"/]
        HIST("History")
        REK("Recommendation")
        DOC[/"Doctor Consultation"/]
        HOSP("Hospital Recommendation")
        RES --> DASH
        RES --> HIST
        RES --> REK
        REK --> DOC
        REK --> HOSP
    end

    subgraph AI["AI"]
        direction TB
        PRE("Cough Sound Pre-processing<br/>(Mono, LogMMSE Noise Reduction,<br/>Normalization, RMS Segmentation)")
        FEAT("Feature Extraction<br/>(20 MFCC → 80-dim, Mean Pooling)")
        AE("Autoencoder<br/>(Reconstruction Error / MSE)")
        SVM("One-Class SVM<br/>(Decision Score)")
        VOTE("Majority Voting")
        OUT("Pneumonia Screening<br/>(Risk / Normal)")
        PRE --> FEAT
        FEAT --> AE
        FEAT --> SVM
        AE --> VOTE
        SVM --> VOTE
        VOTE --> OUT
    end

    AUD --> API
    API --> PRE
    OUT --> RES
    API <--> RES
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
│   │   ├── screening/        # guide, record, analyzing, result
│   │   ├── children/ history/ doctors/ hospitals/ chats/ articles/
│   │   └── recommendation.tsx
│   ├── components/ui/        # Design system (Button, Card, StatusBanner, Waveform...)
│   ├── constants/            # theme, copy (UI text), config (env)
│   ├── hooks/                # session, active child, location, recorder, screening
│   ├── services/             # API client, Supabase client + data services (real and mock)
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
└── PRD.md  design.md  task.md
```

## 6. Run it locally, step by step

You will run **three things**: the AI backend, the local database, and the mobile app.

```
┌──────────────┐  audio   ┌──────────────────┐
│              │ ───────▶ │ FastAPI :8000    │
│  Expo app    │          └──────────────────┘
│  (phone/emu) │  data    ┌──────────────────┐
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
>
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

Then fill the blank settings in `.env` with your own backend and Supabase configuration. Both mock switches are disabled by default. The URLs depend on **where the app runs**:

| App runs on | Use this host in the URLs |
|---|---|
| Android **emulator** | `10.0.2.2` |
| **Physical phone** (same Wi-Fi as your computer) | your computer's LAN IP, e.g. `192.168.1.20` |

```ini
# Supabase (local stack from step 6.3)
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your project's public client key>

# AI backend (from step 6.4)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# Optional switches
EXPO_PUBLIC_USE_MOCK_DATA=false    # true = use built-in sample data, no Docker/Supabase needed
EXPO_PUBLIC_USE_MOCK_API=false     # true = fake prediction results, no backend needed
```

> `127.0.0.1` / `localhost` points to the **phone itself**, not your computer, so it will not work from a device or emulator.
>
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

**Option C: Cloud APK build with EAS (`eas.json`)**

```bash
bunx eas-cli build --profile development --platform android
bunx eas-cli build --profile preview --platform android
```

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

Full contract: [`PRD.md`, section 12](./PRD.md#12-api-contract). Endpoint implementation: [`server_side/app.py`](./server_side/app.py).

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

# App quality & mobile screening tests
bun run lint
bunx tsc --noEmit
bun test src/services/api/screening.test.cjs src/types/screening.test.cjs
```

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Unable to resolve module @supabase/supabase-js` (or `async-storage`, `expo-location`, `react-native-svg`) | Run `bun install`; if a native package is missing or was changed, run `bunx expo install <package-name>`, then `bunx expo start -c` to clear the cache |
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

## 11. Roadmap and next steps

PNEUMOTrack is a hackathon prototype. The roadmap below turns the limitations in [section 10](#10-responsible-ai-and-limitations) into concrete next steps, from a better-tested model to a pilot in primary care. Timelines are plans and depend on funding and partner readiness.

**Where we are now:** a working end-to-end prototype with cough recording, the FastAPI inference service, a Supabase database with Row Level Security, screening history, doctor and hospital recommendations, and a documented local setup.

| Phase | Timeline | Focus | Outcome |
|---|---|---|---|
| 1 | Months 1–3 | Strengthen the model | Model tested against non-pneumonia coughs, with a performance report that can be defended |
| 2 | Months 4–6 | Clinical validation and user testing | First clinical evidence and real feedback from parents and health cadres |
| 3 | Months 7–12 | Pilot in primary care | Real-world usage and health partners willing to continue |
| 4 | Year 2 | Scale and integrate | A sustainable service connected to regional health systems |

### Phase 1: Strengthen the model (months 1–3)

- [ ] Collect cough recordings from children **without** pneumonia (healthy and common cold) as a comparison set
- [ ] Re-evaluate the model with sensitivity and specificity, not only agreement between models
- [ ] Re-calibrate the audio quality-gate thresholds with real phone recordings instead of mostly synthetic signals
- [ ] Complete dataset attribution and license information (see [section 12](#12-ai-use-and-third-party-declaration))

### Phase 2: Clinical validation and user testing (months 4–6)

- [ ] Draft a study protocol together with pediatricians and a research institution
- [ ] Apply for research ethics approval and prepare informed consent for parents
- [ ] Run usability tests with parents and posyandu health cadres
- [ ] Harden child-data security (encryption, per-user access, retention rules)

### Phase 3: Pilot in primary care (months 7–12)

- [ ] Run a limited pilot at a puskesmas or posyandu together with the local health office
- [ ] Put the referral flow into real use: doctors, hospitals and consultation chat
- [ ] Publish on an app store with a privacy policy and a clear non-diagnostic statement
- [ ] Monitor result quality and system errors on a regular basis

### Phase 4: Scale and integrate (year 2)

- [ ] Expand to more regions and health facilities
- [ ] Add an epidemiology trend dashboard for health offices
- [ ] Add an iOS version and regional-language support
- [ ] Retrain the model on a schedule and evaluate supporting signals such as vital signs
- [ ] Define a funding and revenue model for long-term sustainability

> PNEUMOTrack is a screening aid, not a diagnosis. None of these steps changes that: every phase keeps a doctor in the loop.

## 12. AI Use and Third-Party Declaration

### AI use

PNEUMOTrack uses machine-learning models as part of its core screening workflow:

- **Autoencoder (AE):** learns a compact representation of the extracted cough-audio features and contributes a reconstruction-error-based anomaly signal.
- **One-Class Support Vector Machine (One-Class SVM / OC-SVM):** evaluates the four-dimensional latent representation produced by the Autoencoder.
- **Decision logic:** combines the model outputs through majority voting. The application presents the result as a cautious screening indication, not a medical diagnosis.

The model implementation and training workflow are maintained in [`server_side/pneumonia_detection_v3.ipynb`](./server_side/pneumonia_detection_v3.ipynb), with inference code in [`server_side/predictor.py`](./server_side/predictor.py) and [`server_side/model.py`](./server_side/model.py).

### Third-party declaration

PNEUMOTrack is built with third-party open-source software and external services. The principal components visible in the project manifests and source code include:

| Component | Purpose |
|---|---|
| [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/) | Mobile application runtime and native device capabilities |
| [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Expo Router](https://docs.expo.dev/router/introduction/) | UI, application logic, and file-based navigation |
| [NativeWind](https://www.nativewind.dev/) and [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Supabase](https://supabase.com/) | Local/hosted authentication, PostgreSQL access, and database services |
| [FastAPI](https://fastapi.tiangolo.com/) and [Uvicorn](https://www.uvicorn.org/) | Backend API |
| [TensorFlow](https://www.tensorflow.org/) / [Keras](https://keras.io/) and [scikit-learn](https://scikit-learn.org/) | Autoencoder and One-Class SVM implementation |
| [librosa](https://librosa.org/), [noisereduce](https://github.com/timsainb/noisereduce), [SciPy](https://scipy.org/), [SoundFile](https://python-soundfile.readthedocs.io/) | Audio processing and feature extraction |
| [imageio-ffmpeg](https://github.com/imageio/imageio-ffmpeg) | Bundled FFmpeg binary for audio decoding |
| [Docker](https://www.docker.com/) and Docker Compose | Local database/backend development environment |
| [Bun](https://bun.sh/) and [uv](https://docs.astral.sh/uv/) | JavaScript and Python dependency management |

**Dataset and media attribution:** The model notebook processes 82 pneumonia-labelled cough samples, but the original dataset files and their source/license details are not included in this repository archive. The dataset provider, original citation, and usage license must be added here once confirmed. The same applies to any externally sourced images, icons, fonts, or other media: retain the original creator attribution and license where required. Do not assume that an asset is free to redistribute merely because it is accessible online.

**No endorsement:** Third-party names and trademarks belong to their respective owners. Their inclusion documents technical dependencies or cited information sources and does not imply sponsorship, certification, or endorsement of PNEUMOTrack.

## 13. Team

| Role | Member |
|---|---|
| Team leader, pneumonia model developer (Autoencoder + OC-SVM), UI designer, Member C (mobile features) | [@BagusNaren](https://github.com/BagusNaren) |
| Member A: backend, AI serving, Supabase | [@ruditagithub](https://github.com/ruditagithub) |
| Member B: mobile core flow (recording, analysis, result) | [@Nomad37301](https://github.com/Nomad37301) |

Built for the **INCEPTION 2026 Hackathon** · Universitas Udayana.

## Documentation

- [`docker/README.md`](./docker/README.md): local Supabase stack
- [`PRD.md`](./PRD.md): product requirements

## License

See [`LICENSE`](./LICENSE).
