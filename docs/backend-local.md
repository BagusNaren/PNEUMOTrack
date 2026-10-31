# Backend lokal — setup & catatan

Catatan Sprint 0 Member A: cara menjalankan `server_side/` dengan **uv** di Windows, versi yang terpasang, dan kendala yang ditemukan.

## 1. Prasyarat

- [uv](https://docs.astral.sh/uv/) ≥ 0.13 (`uv --version` → `0.13.6` di mesin ini)
- Python 3.12 (dipakai lewat `uv venv --python 3.12`)
- ffmpeg **belum terpasang** di mesin ini → m4a/AAC belum bisa diproses (lihat §5)

Di mesin ini, Python sistem di `C:\Users\rudit\.local\bin\python3.11.exe` diblokir Application Control (Windows, `os error 4551`). uv memakai interpreter managed-nya sendiri, jadi tidak perlu Python sistem.

## 2. Setup

```powershell
cd server_side
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt

# WAJIB: pin scikit-learn ke versi pembuat model
uv pip install --python .venv/Scripts/python.exe "scikit-learn==1.6.1"
```

`.venv/` sudah di-ignore oleh uv (`.venv/.gitignore` berisi `*`), tidak perlu ditambahkan ke `.gitignore` repo.

## 3. Versi yang terpasang & lolos uji

| Paket | Versi |
|---|---|
| Python | 3.12.15 |
| fastapi | 0.162.0 |
| uvicorn | 0.54.0 |
| tensorflow | 2.21.0 |
| numpy | 2.5.4 |
| scikit-learn | **1.6.1** (manual pin) |
| joblib | 1.6.0 |
| librosa | 1.0.0 |
| soundfile | 0.14.0 |
| python-multipart | 0.0.32 |
| noisereduce | 3.0.3 |
| scipy | 1.18.1 |

`requirements.txt` belum di-pin; `uv pip install -r` tanpa pin menghasilkan `scikit-learn==1.9.1` dan memunculkan `InconsistentVersionWarning` saat load pickle 1.6.1. Untuk local dev, pin manual seperti di atas sampai Sprint 1 memperbarui `requirements.txt`.

## 4. Menjalankan

Model dan file sementara memakai path relatif (`deployment_v3/`, `temp/`), jadi **cwd harus `server_side/`**.

```powershell
cd server_side
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Swagger: http://127.0.0.1:8000/docs

Tes cepat:

```powershell
curl.exe -X POST http://127.0.0.1:8000/predict -F "audio=@sample.wav"
curl.exe -o NUL -w "%{http_code}" http://127.0.0.1:8000/health
```

## 5. Kendala yang ditemukan

| # | Kendala | Dampak | Rencana |
|---|---|---|---|
| 1 | `requirements.txt` tidak di-pin | versi berubah sewaktu-waktu; sklearn 1.9.1 tidak kompatibel dengan pickle 1.6.1 | Sprint 1: pin semua versi (`scikit-learn==1.6.1`, `tensorflow==2.21.0`, `numpy==2.5.4`, `librosa==1.0.0`, dst.) |
| 2 | Pickle dibuat dengan scikit-learn 1.6.1 | warning + risiko hasil inferensi berubah | pin 1.6.1, verifikasi ulang skor |
| 3 | `ffmpeg` tidak terpasang | m4a/AAC dari Android tidak bisa di-decode; `librosa` hanya membaca format libsndfile | Sprint 1: install ffmpeg + konversi ke WAV mono 22.050 Hz |
| 4 | Path relatif | server gagal start kalau dijalankan dari root repo | dokumentasikan; Sprint 1 bisa memakai `pathlib.Path(__file__).parent` |
| 5 | TensorFlow menulis log oneDNN ke stderr | log berisik | set `TF_ENABLE_ONEDNN_OPTS=0` bila perlu |
| 6 | `temp/` belum masuk `.gitignore` | file sementara bisa ikut ter-commit | Sprint 2 (task.md) menambahkan `temp/` |
| 7 | Log memuat nama file asli & path | melanggar privasi PRD §13 | Sprint 2: log request-id saja |
| 8 | Audio hening → `NaN` → HTTP 500 | app menerima HTML, bukan JSON | Sprint 1/2: validasi audio + penanganan error |
| 9 | `GET /health` belum ada | monitoring & pre-flight app tidak bisa | Sprint 1 |
| 10 | Tidak ada CORS | web build tidak bisa memanggil API | Sprint 1 |
| 11 | Belum ada sampel batuk asli di repo | hasil 200 untuk batuk belum terverifikasi | minta sampel ke tim / dataset |

## 6. Catatan model

- `config_v3.pkl`: `ae_threshold = 0.03890753`, `n_mfcc = 20`, `latent_dim = 4`, `feature_dim = 80`, `version = v3`.
- **Tidak ada key `sample_rate`** di config; kode memakai fallback 22.050 Hz.
- `Pneumonia` = model menganggap pola mirip data latih pneumonia → dipetakan ke `risk`; `Bukan Pneumonia` → `normal`.
- Dataset latih hanya berisi sampel pneumonia; angka 96,3% pada proposal mengukur konsistensi, bukan akurasi klinis.
