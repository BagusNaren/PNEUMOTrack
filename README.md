# PNEUMOTrack

> *Track the Signs, Guard the Lungs.*

**PNEUMOTrack** adalah aplikasi mobile berbasis kecerdasan buatan untuk **skrining awal risiko pneumonia pada anak** (khususnya balita) melalui rekaman suara batuk pada ponsel.

> [!IMPORTANT]
> **Penafian Non-Diagnostik:** PNEUMOTrack adalah alat bantu skrining awal bagi orang tua dan pengasuh, **bukan alat diagnosis medis** dan tidak menggantikan pemeriksaan dokter maupun radiologi (X-ray). Selalu konsultasikan kondisi anak ke tenaga kesehatan, dan segera bawa anak ke IGD atau hubungi **119** apabila muncul tanda bahaya (napas cepat atau sesak, tarikan dinding dada ke dalam, bibir atau ujung jari kebiruan, atau anak tidak bisa minum/menyusu dan tampak sangat lemas).

---

## Arsitektur Sistem

| Lapisan | Teknologi | Peran |
| --- | --- | --- |
| **Aplikasi Mobile** | Expo SDK 58, React Native 0.88, Expo Router, NativeWind v4, Reanimated v4, `@expo/ui` | Antarmuka pengguna (Android utama), perekaman suara batuk (`expo-audio`), pengecekan kebisingan ruang, visualisasi waveform, hasil skrining, dan rekomendasi tindak lanjut |
| **Backend Inferensi AI** | FastAPI (Python) | Pra-pemrosesan sinyal audio (konversi mono, reduksi bising LogMMSE, segmentasi RMS, ekstraksi 20 MFCC) dan inferensi ensemble deteksi anomali (*Autoencoder* + *One-Class SVM*) melalui endpoint `POST /predict` |
| **Database & Autentikasi** | Supabase (PostgreSQL + Supabase Auth + RLS) | Autentikasi pengguna, manajemen profil anak, riwayat hasil skrining, direktori dokter, fasilitas kesehatan, dan artikel edukasi |

Aplikasi mobile mengirim rekaman sementara ke backend FastAPI, menampilkan hasil skrining, lalu **menghapus file rekaman audio sementara dari penyimpanan lokal perangkat** segera setelah analisis selesai atau dibatalkan.

---

## Prasyarat Pengembangan

1. **Bun** (`>= 1.1`) sebagai package manager dan test runner utama (repositori menggunakan `bun.lock`).
2. **Node.js LTS** (`>= 20`) untuk kompatibilitas ekosistem CLI Expo.
3. **Android Development Build** (pada perangkat fisik Android atau Android Emulator):
   - Aplikasi ini menggunakan modul native (`expo-audio`, `@react-native-community/netinfo`, dan `@expo/ui`) sehingga fitur perekaman mikrofon penuh memerlukan **Development Build**, bukan Expo Go standar.
4. **Opsional untuk Pengujian End-to-End Lokal:**
   - Layanan backend FastAPI (`POST /predict`) dan instance Supabase lokal/cloud. Selama pengembangan antarmuka terisolasi, aplikasi mendukung simulator API bawaan (`EXPO_PUBLIC_USE_MOCK_API=true`).

---

## Langkah Persiapan & Konfigurasi `.env`

1. **Instal seluruh dependensi proyek:**

   ```bash
   bun install
   ```

   Untuk menambahkan paket Expo atau React Native baru, selalu gunakan perintah berikut agar versi tetap selaras dengan Expo SDK 58:

   ```bash
   bunx expo install <nama-paket>
   ```

2. **Salin file environment contoh menjadi `.env`:**

   ```bash
   cp .env.example .env
   ```

   Di PowerShell (Windows):

   ```powershell
   Copy-Item .env.example .env
   ```

3. **Sesuaikan variabel di `.env`:**

   | Variabel | Contoh Nilai Pengembangan | Fungsi |
   | --- | --- | --- |
   | `EXPO_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | URL proyek Supabase (lokal atau cloud) |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `<anon-key>` | Kunci publik anon Supabase (wajib dengan Row Level Security aktif) |
   | `EXPO_PUBLIC_API_URL` | `http://10.0.2.2:8000` | URL server FastAPI (`10.0.2.2` untuk Android Emulator, atau IP LAN laptop untuk HP Android fisik) |
   | `EXPO_PUBLIC_USE_MOCK_API` | `false` (`true` untuk mode simulasi) | Mengaktifkan simulator respons `POST /predict` tanpa koneksi ke backend FastAPI |
   | `EXPO_PUBLIC_USE_MOCK_DATA` | `true` | Mengaktifkan data contoh lokal sebelum tabel Supabase terhubung penuh |

   > [!CAUTION]
   > Jangan pernah menyimpan kunci rahasia (`service_role` key atau kredensial server) di dalam kode mobile maupun `.env` aplikasi klien. Hanya gunakan variabel berawalan `EXPO_PUBLIC_*` untuk konfigurasi non-rahasia, dan jangan pernah melakukan commit file `.env` atau `.env.local` ke repositori.

---

## Menjalankan Server Pengembangan & Pemeriksaan Kualitas Kode

```bash
# Menjalankan Metro development server
bunx expo start

# Pemeriksaan tipe TypeScript (wajib 0 error)
bunx tsc --noEmit

# Pemeriksaan linter ESLint Expo (wajib 0 error/warning)
bunx expo lint

# Diagnosa kesehatan konfigurasi & kompatibilitas paket Expo SDK 58
bunx expo-doctor

# Menjalankan unit test kontrak tipe, sesi skrining, dan audit kepatuhan
bun test src/services/api/screening.test.cjs src/types/screening.test.cjs
```

Saat menjalankan aplikasi dalam mode pengembangan (`__DEV__`), Anda dapat membuka **Menu -> Galeri Komponen** (`/dev/components`) untuk menginspeksi seluruh komponen UI dalam tema terang/gelap serta menguji seluruh skenario hasil skrining (`normal`, `risk`, `disagreement`, keenam kode validasi audio `422`, serta error `offline`, `timeout`, dan `server`).

---

## Membuat Development Build & APK Preview via EAS Build

Konfigurasi cloud build tersedia di [`eas.json`](./eas.json) dengan tiga profil: `development` (APK dev client internal), `preview` (APK mandiri siap instal untuk pengujian dan demo), dan `production` (Android App Bundle `.aab`).

1. **Login dan hubungkan proyek ke akun EAS:**

   ```bash
   bunx eas-cli login
   bunx eas-cli whoami
   bunx eas-cli init
   ```

2. **Daftarkan variabel environment untuk profil `preview` dan `production` di EAS:**

   ```bash
   bunx eas-cli env:create --name EXPO_PUBLIC_API_URL --value "https://<domain-vps-fastapi>" --environment preview --environment production --visibility plaintext
   bunx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<project-ref>.supabase.co" --environment preview --environment production --visibility plaintext
   bunx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<supabase-anon-key>" --environment preview --environment production --visibility sensitive
   ```

3. **Bangun APK Development Client (untuk pengembangan harian):**

   ```bash
   bunx eas-cli build --profile development --platform android
   ```

4. **Bangun APK Preview Mandiri (untuk demo dan pengujian perangkat fisik):**

   ```bash
   bunx eas-cli build --profile preview --platform android
   ```

---

## Kepatuhan Keselamatan, Privasi & Aksesibilitas

- **Komunikasi Risiko Non-Diagnostik:** Seluruh teks antarmuka terpusat di [`src/constants/copy.ts`](./src/constants/copy.ts) dalam Bahasa Indonesia yang tenang dan menggunakan istilah indikatif (*"Indikasi risiko pneumonia terdeteksi, perlu perhatian"*), tanpa klaim diagnosis pasti dan tanpa klaim persentase akurasi klinis.
- **Privasi Rekaman Audio & Data Anak:** Tidak ada pencatatan (`console.log`) atas audio, URI file rekaman, maupun identitas anak. Rekaman sementara dihapus dari cache perangkat segera setelah analisis selesai atau dibatalkan.
- **Aksesibilitas & Ergonomi:** Target sentuh aksi utama minimal `48dp`, tombol ikon minimal `44x44dp` dengan `accessibilityLabel` Bahasa Indonesia, kontras warna memenuhi standar WCAG AA pada mode terang maupun gelap, tata letak adaptif terhadap perbesaran ukuran teks sistem (*large font scaling*), serta animasi otomatis berhenti saat fitur *Kurangi Gerakan* (*Reduce Motion*) aktif.
