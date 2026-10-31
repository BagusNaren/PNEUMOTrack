# Backend lokal — setup & catatan

Cara menjalankan `server_side/` dengan **uv** di Windows, versi yang terpasang, perintah database, dan kendala yang tersisa.

## 1. Prasyarat

- [uv](https://docs.astral.sh/uv/) ≥ 0.13 (`uv --version` → `0.13.6`)
- Python 3.12 via `uv venv --python 3.12`
- ffmpeg **tidak perlu install sistem**: decoding memakai binary bawaan `imageio-ffmpeg`

Di mesin ini, Python sistem di `C:\Users\rudit\.local\bin\python3.11.exe` diblokir Application Control (Windows, `os error 4551`). uv memakai interpreter managed-nya sendiri.

## 2. Setup

```powershell
cd server_side
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
uv pip install --python .venv/Scripts/python.exe -r requirements-dev.txt
```

`requirements.txt` sudah di-pin (`scikit-learn==1.6.1`, `tensorflow==2.21.0`, dst.). Model `.h5` berhasil dimuat di TensorFlow 2.21 / Keras 3.

## 3. Menjalankan

Model dan temp memakai path absolut (`Path(__file__).parent`), jadi bisa dijalankan dari mana saja.

```powershell
cd server_side
.venv/Scripts/python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

- Health: http://127.0.0.1:8000/health
- Swagger: http://127.0.0.1:8000/docs
- `--host 0.0.0.0` agar HP di LAN bisa mengakses; emulator Android memakai `10.0.2.2:8000`
- CORS: env `CORS_ORIGINS` (default `*` untuk lokal)

## 4. Test & smoke

```powershell
cd server_side
.venv/Scripts/python.exe -m pytest -q          # 11 tests
./scripts/smoke.sh                             # health
./scripts/smoke.sh http://127.0.0.1:8000 sample.m4a
./scripts/smoke.ps1 -Sample sample.m4a
```

## 5. Supabase lokal

```powershell
bun run db:up        # docker compose
bun run db:migrate   # supabase migration up --db-url ...
bun run db:seed      # 10 RS Denpasar, 6 dokter, 6 artikel
bun run db:rls       # uji RLS dengan 2 akun (node script)
bun run db:types     # generate TypeScript types
```

Hasil uji RLS terakhir: semua pemeriksaan lulus (lihat `docs/api.md` §5).

## 6. Versi terpasang & terverifikasi

| Paket | Versi |
|---|---|
| Python | 3.12.15 |
| fastapi | 0.162.0 |
| uvicorn | 0.54.0 |
| tensorflow | 2.21.0 |
| numpy | 2.5.4 |
| scikit-learn | 1.6.1 |
| librosa | 1.0.0 |
| soundfile | 0.14.0 |
| noisereduce | 3.0.3 |
| imageio-ffmpeg | 0.7.0 |
| pytest / httpx | 9.2.0 / 0.28.1 |

## 7. Kendala yang masih tersisa

| # | Kendala | Status |
|---|---|---|
| 1 | `sample_rate` tidak ada di `config_v3.pkl` | kode memakai 22.050 Hz; perlu keputusan pemilik model |
| 2 | Threshold quality gate baru diuji dengan sinyal sintetis | perlu ±10 rekaman asli (hening, bicara, kipas/TV, batuk) |
| 3 | TensorFlow menulis log oneDNN ke stderr | set `TF_ENABLE_ONEDNN_OPTS=0` (Dockerfile sudah) |
| 4 | Windows: TensorFlow ≥2.11 tanpa GPU | inferensi CPU; cukup untuk demo |
| 5 | Uji LAN dari HP belum dilakukan | butuh HP + jaringan yang sama |
| 6 | Deploy VPS belum dieksekusi | aset siap di `docs/deploy.md` |
| 7 | Akun uji RLS menumpuk di database lokal | hapus berkala: `delete from auth.users where email like 'rls-%@local.dev'` |

## 8. Catatan model

- `Pneumonia` = pola mirip data latih pneumonia → `risk`; `Bukan Pneumonia` → `normal`.
- Dataset latih hanya berisi sampel pneumonia; angka 96,3% bukan akurasi klinis.
- Audio dihapus setelah inferensi; log tidak memuat nama file, path, atau `child_id`.
