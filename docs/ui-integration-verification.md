# Pemeriksaan integrasi UI

Tanggal: 15 November 2026.

## Perubahan

- Root navigator membatasi seluruh route privat dengan `Stack.Protected`. Provider anak dan sesi skrining dibuat ulang saat ID akun berubah.
- Dashboard membedakan hasil belum tersedia, sedang dimuat, dan gagal dimuat. Profil anak mempunyai loading/error/retry.
- Penyelesaian save memicu reload resource skrining yang sedang fokus. Refresh setelah save tidak memerlukan polling.
- Profil lokal baru berubah setelah storage berhasil ditulis. Editor menampilkan error/retry jika storage tidak dapat dibaca, sehingga kegagalan baca tidak menimpa profil tersimpan.
- Penyalinan foto menggunakan tujuan baru; kegagalan copy diteruskan ke editor dan foto sebelumnya tidak dihapus sebelum save berhasil.
- Riwayat mock diurutkan sebelum limit. Riwayat menyediakan akses seluruh hasil yang dimuat, menyebut batas 50 hasil, dan menjelaskan bahwa durasi/segmen bukan ukuran keparahan penyakit.
- Header dan status dapat membungkus konten. Ikon dekoratif memakai atribut aksesibilitas yang sesuai platform.
- Cakupan TypeScript dibatasi ke `src/` dan deklarasi Expo/NativeWind, agar SDK serta cache Gradle lokal tidak ikut ditelusuri.

## Mode yang diperiksa

- Build final: `EXPO_PUBLIC_USE_MOCK_API=false`, `EXPO_PUBLIC_USE_MOCK_DATA=false`. URL API HTTPS dan konfigurasi Supabase berasal dari pengguna, disimpan di `.env.local`; `git check-ignore .env.local` mengonfirmasi berkas diabaikan Git.
- Pengujian interaksi memakai ekspor web demo terpisah dengan kedua flag `true`. Data profil/anak/riwayat/dokter dalam pengujian ini adalah data demo, bukan bukti alur akun nyata.
- Ekspor web produksi awal dibuat sebelum konfigurasi backend diberikan; digunakan untuk onboarding, validasi form, dan proteksi route. Ini bukan bukti konfigurasi backend pada APK.

## Pemeriksaan otomatis dan layanan nyata

| Pemeriksaan | Hasil |
| --- | --- |
| `bun run lint -- --no-cache src scripts/check-backend-audio.cjs` | PASS |
| `bun run typecheck` | PASS |
| `bunx expo-doctor` | PASS, 20/20 |
| Tes audio native, kontrak, sesi skrining, chat, palette, konfigurasi lokal | PASS, 50 tes |
| `bun test src/services/screenings/index.test.cjs` | PASS, 2 tes; urutan sebelum limit, isolasi anak, notifikasi setelah save, unsubscribe |
| `bun run backend:check` | PASS, FastAPI health dan Supabase Auth HTTP 200 |
| `bun scripts/check-backend-audio.cjs` | PASS, WAV senyap sintetis HTTP 422 dan WAV burst sintetis HTTP 200; keduanya lolos validator kontrak client |
| Read anonim `articles`, `doctors`, `hospitals`, hanya kolom ID dengan limit 1 | HTTP 200, hasil kosong; tidak membuktikan isi tabel yang dapat dilihat setelah login |
| `bunx expo export --platform web` | PASS untuk ekspor produksi dan demo terpisah |

Skrip audio menghasilkan seluruh sampel secara matematis dalam memori. Tidak membaca rekaman pengguna, mengirim ID anak, atau menguji akurasi klinis.

## Interaksi browser yang diamati

| Skenario | Bukti |
| --- | --- |
| Onboarding | Lanjut menampilkan slide dokter lalu fasilitas; Mulai mencapai form masuk |
| Login/daftar | Form kosong menampilkan pesan wajib diisi; tautan Daftar membuka form pendaftaran |
| Route privat tanpa sesi | Akses langsung `/profile/edit` beralih ke onboarding |
| Login demo | Dashboard tampil dengan label Mode Simulasi, anak aktif, hasil terbaru, dan artikel |
| Simpan profil | Nama uji dan kota disimpan; kembali ke dashboard menampilkan nama baru |
| Riwayat | Tab terpilih, grafik durasi/segmen, ringkasan, lima record, dan disclaimer tampil |
| Detail risiko | Detail record menampilkan risiko, tanggal, ringkasan, tanda bahaya, dan audio berlabel contoh simulasi |
| Rekomendasi dari record | Nama anak dan tanggal rekomendasi sama dengan record yang dipilih |
| Dokter | CTA membuka daftar, pencarian tanpa kecocokan memberi empty state, hapus pencarian memulihkan daftar; detail dan chat terbuka |
| Fasilitas | CTA membuka daftar; tanpa lokasi pengguna, daftar tetap tampil dengan label fallback Denpasar |
| Audio demo | Tombol Dengarkan Rekaman berubah menjadi Jeda Pemutaran; label contoh simulasi tetap terlihat |
| Anak aktif | Mengganti Budi ke Ayu memperbarui nama, durasi, tanggal, dan hasil terbaru; tab profil memakai konteks anak yang sama |
| Menu | Menu terbuka dan dapat ditutup dengan Escape |
| Lebar ponsel | `scrollWidth == innerWidth` pada 320, 390, dan 430; screenshot riwayat 320 memperlihatkan teks membungkus di dalam kartu |

Panggilan telepon darurat, panggilan dokter, dan pengiriman pesan ke layanan nyata tidak dilakukan.

## Antislop

Direction: UI PNEUMOTrack yang sudah ada, biru/teal medis, ENERGY 1 / RHYTHM 1 / MOTION 1. Kartu status dan CTA rekam/rekomendasi menjadi fokus; ikon menunjukkan fungsi dan status, bukan dekorasi baru.

- PASS, purpose: struktur UI dan token produk dipertahankan; perubahan visual dibatasi pembungkusan teks dan state yang bermakna.
- PASS, evidence: pengujian palette mencakup light/dark dan state tombol; tes keamanan medis menolak klaim klinis terlarang serta logging data.
- PASS, resilience pada skenario browser di atas: ukuran ponsel dan loading/empty/validation diamati, label demo serta disclaimer terlihat.
- Batas gerbang akhir: seluruh kontrol, font 200%, keyboard pada semua screen, izin perangkat, dan tap APK belum seluruhnya diperiksa. Catatan ini tidak mengklaim gerbang visual penuh atau fidelitas FigCraft lulus.

## Android dan batas validasi

SDK tools resmi Google diunduh dengan checksum SHA-256 yang diverifikasi. Platform API 37.0, build tools, CMake 3.31.6, dan NDK 27.1 dipasang di cache `.expo/`. Folder Android dihasilkan oleh Expo prebuild, tanpa edit native manual.

Sesuai permintaan pengguna untuk mengejar deadline, pengujian lanjutan dihentikan dan build dipersempit ke ARM64. Build release lokal dengan R8 berhasil: `BUILD SUCCESSFUL in 13m 47s`, 641 tasks. Artefak: `dist/release-final.apk`, 40.588.867 byte. `apksigner verify --verbose` lulus dengan APK Signature Scheme v2 dan satu penanda tangan. APK memakai signing config lokal dari template Expo untuk instalasi langsung, bukan bukti kesiapan publikasi store.

URL API, URL Supabase, dan public key terkonfirmasi tertanam dalam bundle Android; kedua flag mock `false`. Artefak berasal dari build release yang berhasil dengan optimasi R8, sebelum percobaan percepatan lanjutan. Ini aplikasi Expo yang dikompilasi lokal menjadi APK Android; bukan build cloud EAS.

Belum terverifikasi: login/pemulihan akun nyata dan RLS antar-akun, simpan hasil ke Supabase sebagai user nyata, mikrofon/foto/lokasi pada perangkat Android, tap/Back pada APK, serta iOS. Tidak ada perangkat Android terhubung ketika `adb devices` diperiksa.
