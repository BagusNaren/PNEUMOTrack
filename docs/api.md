# PNEUMOTrack — API Contract v2 (draft)

Status: **usulan Sprint 0, menunggu persetujuan tim.** Backend saat ini masih berperilaku v1 (lihat §6). Dokumen ini menjadi acuan tetap untuk `docs/api.md` setelah disetujui; sinkronkan dengan `PRD.md` §12.

Owner: Member A.

---

## 1. Fakta model & konfigurasi

Dibaca langsung dari `server_side/deployment_v3/config_v3.pkl` dan pickle lainnya.

| Item | Nilai | Catatan |
|---|---|---|
| `model_version` | `v3` | dari `config["version"]` |
| `ae_threshold` | `0.03890753` | ambang MSE autoencoder (`np.float32`) |
| `sample_rate` | **tidak ada di config** | kode memakai fallback `22050 Hz` (`config.get("sample_rate", 22050)`). Perlu keputusan: tambahkan ke config atau dokumentasikan 22.050 Hz sebagai tetap. |
| `n_mfcc` | `20` | 20 koefisien MFCC |
| `latent_dim` | `4` | output encoder |
| `feature_dim` | `80` | mean/std/skew/kurtosis × 20 |
| Library pembuat pickle | `scikit-learn==1.6.1` | memuat dengan versi lain memunculkan `InconsistentVersionWarning` |
| Model files | `encoder_v3.h5`, `autoencoder_full_v3.h5` | dimuat dengan TensorFlow 2.21 / Keras 3 (`compile=False`) |

Konfigurasi model tidak boleh diubah tanpa persetujuan pemilik model.

---

## 2. Mapping label (keputusan yang diminta)

Model dilatih **one-class hanya pada sampel pneumonia**. Skor "mirip pola pneumonia" karena itu bermakna **risiko**, bukan diagnosis.

| Raw label (kode) | `result` (API v2) | Warna UI | Wording UI |
|---|---|---|---|
| `Pneumonia` | `risk` | pink/merah | "Indikasi risiko pneumonia, perlu perhatian" |
| `Bukan Pneumonia` | `normal` | biru/teal | "Tidak ditemukan tanda pola batuk pneumonia" |

Aturan tambahan:

- `agreement = (svm_vote == autoencoder_vote)`.
- `confidence` = proporsi vote (0.5 atau 1.0). **Bukan** probabilitas klinis dan tidak boleh ditampilkan sebagai persentase akurasi.
- Voting seri (1–1) jatuh ke `risk` (`pneumonia_votes >= normal_votes`). UI menampilkan "perlu perhatian" dan menyarankan rekam ulang.
- Angka 96,3% dari proposal **tidak boleh** muncul sebagai akurasi klinis.

---

## 3. `POST /predict`

`Content-Type: multipart/form-data`

| Field | Tipe | Wajib | Batas |
|---|---|---|---|
| `audio` | file | ya | `m4a`, `mp4`, `aac`, `wav`; ≤ 10 MB |
| `child_id` | string (UUID) | tidak | tidak pernah di-log; hanya untuk korelasi di klien |

Catatan format: rekaman Android (expo-audio) menghasilkan **m4a/AAC**. Backend harus mengonversi ke WAV mono 22.050 Hz dengan ffmpeg sebelum `librosa.load`. `librosa`/`soundfile` tidak membuka m4a secara langsung.

### 200 OK

```json
{
  "status": "success",
  "result": "risk",
  "raw_label": "Pneumonia",
  "agreement": true,
  "votes": { "autoencoder": "risk", "ocsvm": "risk" },
  "autoencoder": { "error": 0.0012, "threshold": 0.03890753 },
  "ocsvm": { "score": 0.41 },
  "chunks": 4,
  "duration_sec": 6.2,
  "waveform": [0.01, 0.2, 0.8],
  "summary": "Ringkasan non-diagnostik berbahasa Indonesia",
  "model_version": "v3"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `status` | `"success"` | |
| `result` | `"risk" \| "normal"` | dipakai UI untuk warna & CTA |
| `raw_label` | `"Pneumonia" \| "Bukan Pneumonia"` | transparansi model |
| `agreement` | boolean | kedua model sepakat |
| `votes.autoencoder` / `votes.ocsvm` | `"risk" \| "normal"` | vote per model |
| `autoencoder.error` | number | MSE rekonstruksi |
| `autoencoder.threshold` | number | `0.03890753` |
| `ocsvm.score` | number | `score_samples`, bukan probabilitas |
| `chunks` | integer | jumlah segmen batuk yang lolos segmentasi |
| `duration_sec` | number | durasi audio setelah decode |
| `waveform` | number[] | envelope RMS ±100 titik, 0..1, untuk grafik |
| `summary` | string | template non-diagnostik, Indonesia |
| `model_version` | `"v3"` | |

Skor teknis (`autoencoder`, `ocsvm`) boleh dipakai untuk debug/collapsible, bukan headline UI.

### 422 — audio tidak layak

```json
{ "status": "error", "code": "AUDIO_TOO_SHORT", "message": "Rekaman terlalu pendek. Rekam minimal 3 detik." }
```

| `code` | Pemicu | Aksi UI |
|---|---|---|
| `AUDIO_TOO_SHORT` | durasi < 3 dtk | minta rekam ulang |
| `AUDIO_SILENT` | RMS maksimum di bawah ambang (sebelum normalisasi) | minta rekam ulang |
| `NO_COUGH_DETECTED` | segmentasi menghasilkan 0 chunk (fallback dimatikan) | minta rekam ulang |
| `AUDIO_TOO_NOISY` | SNR rendah / frame aktif > 80% | minta rekam ulang di tempat tenang |
| `UNSUPPORTED_FORMAT` | MIME/ekstensi di luar daftar | minta rekam ulang |
| `FILE_TOO_LARGE` | > 10 MB | minta rekaman lebih pendek |

Semua 422 **tidak** mengembalikan hasil prediksi. App tidak boleh menampilkan hasil dari respons ini.

### 500 — kesalahan server

```json
{ "status": "error", "code": "INTERNAL_ERROR", "message": "Terjadi kesalahan. Coba lagi." }
```

### `GET /health`

```json
{ "status": "ok", "model_version": "v3" }
```

Dipakai untuk cek kesiapan sebelum upload dan oleh monitoring VPS.

---

## 4. Kontrak perilaku klien

- Timeout upload 60 dtk; retry hanya untuk network/timeout/500, **bukan** 422.
- `child_id` opsional; app boleh mengirim tanpa menyimpan audio.
- Audio tidak disimpan server (dihapus di `finally`) dan tidak disimpan app setelah hasil tampil.
- Log server tidak boleh memuat nama file asli, path, atau `child_id`.

---

## 5. Keputusan yang dibutuhkan tim

| # | Pertanyaan | Usulan | Status |
|---|---|---|---|
| 1 | `Pneumonia` = `risk`? | Ya | menunggu konfirmasi pemilik model |
| 2 | Endpoint final | `POST /predict` v2 (bukan `/screen`) | menunggu persetujuan |
| 3 | `sample_rate` | tambahkan ke `config_v3.pkl` atau kunci 22.050 Hz di kode | perlu keputusan A |
| 4 | Nama field `result` vs `label` | `result` (sesuai task.md §4.1) | menunggu |
| 5 | Batas durasi minimum | 3 dtk (samakan app & backend) | menunggu |

---

## 6. Perilaku implementasi saat ini (v1) — baseline

Diuji pada 2026-10-31 dengan `uvicorn app:app` (Python 3.12, TensorFlow 2.21, scikit-learn 1.6.1). Sampel sintetis, bukan rekaman batuk asli.

| Input | HTTP | Respons | Masalah |
|---|---|---|---|
| `tone5s.wav` (nada 440 Hz, 5 dtk) | 200 | `prediction: "Bukan Pneumonia"` | audio bukan batuk tetap dinilai |
| `tone1s.wav` (1 dtk) | 200 | `prediction: "Bukan Pneumonia"` | tidak ada batas durasi minimum |
| `noise5s.wav` (white noise) | 200 | `prediction: "Bukan Pneumonia"` | noise tetap dinilai |
| `silent.wav` (5 dtk hening) | **500** | `Internal Server Error` (bukan JSON) | `NaN` di skor → `ValueError: Out of range float values are not JSON compliant` |
| `notaudio.txt` | 200 | `status: "error"`, `prediction: null` | error tidak memakai HTTP 4xx |
| tanpa field `audio` | 422 | format validasi FastAPI default | bentuk error beda dari kontrak |

Gap lain yang terkonfirmasi:

- Tidak ada `GET /health` (404).
- Tidak ada CORS.
- Tidak ada batas 10 MB / validasi MIME.
- File sementara memakai ekstensi `.wav` apa pun input aslinya.
- Log memuat nama file asli dan path (`Received audio 'tone1s.wav' → temp\...`) — melanggar aturan privasi.
- `segment_cough_chunks` memakai fallback seluruh sinyal saat 0 chunk → PRD §13 dilanggar.
- `m4a/AAC` belum didukung (ffmpeg belum terpasang).
- `confidence` = proporsi vote; bukan probabilitas.

Semua item di atas menjadi scope Sprint 1 Member A.

---

## 7. Rencana verifikasi Sprint 1

1. `curl -F audio=@sample.m4a http://localhost:8000/predict` → 200 sesuai §3.
2. Rekaman hening → 422 `AUDIO_SILENT`.
3. Rekaman < 3 dtk → 422 `AUDIO_TOO_SHORT`.
4. Bicara tanpa batuk → 422 `NO_COUGH_DETECTED`.
5. File > 10 MB → 422 `FILE_TOO_LARGE`.
6. `.txt` → 422 `UNSUPPORTED_FORMAT`.
7. `GET /health` → 200 `{ "status": "ok", "model_version": "v3" }`.
8. Log tidak memuat nama file/`child_id`.

---

## 8. Contoh pemanggilan

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -F "audio=@sample.m4a" \
  -F "child_id=00000000-0000-0000-0000-000000000000"
```

```ts
// bentuk tipe untuk Member B (src/types/screening.ts)
type ScreeningResult = 'normal' | 'risk';
type AudioErrorCode =
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_SILENT'
  | 'NO_COUGH_DETECTED'
  | 'AUDIO_TOO_NOISY'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE';
```
