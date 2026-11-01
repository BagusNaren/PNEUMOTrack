# Testing Android lokal (Windows)

Gunakan build lokal untuk testing harian dan pengecekan APK release sebelum build cloud. SDK proyek tetap mengikuti `package.json`.

## Persiapan

- Install Bun, JDK, dan Android Studio beserta Android SDK.
- Jalankan emulator dari Android Studio, atau hubungkan HP dengan USB debugging aktif.
- Siapkan `.env` seperti panduan di README. HP memakai IP LAN komputer, sedangkan emulator Android memakai `10.0.2.2` untuk backend lokal.

Tanpa opsi `-Mock`, build memerlukan `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` dari proyek Supabase yang digunakan. Script memeriksa konfigurasi ini sebelum Metro dan Gradle dijalankan. File `.env.example` tidak dimuat otomatis sebagai `.env`; konfigurasi EAS cloud juga tidak otomatis tersedia pada build lokal. Untuk testing UI tanpa konfigurasi backend, gunakan `bun run android:release -Mock`.

Script mendeteksi Bun di PATH atau `%USERPROFILE%\.bun\bin`, dan SDK dari `ANDROID_HOME`, `ANDROID_SDK_ROOT`, atau `%LOCALAPPDATA%\Android\Sdk`. Tidak perlu mengganti versi Expo.

Script memilih CMake 3.31.6 untuk proses build lokal Windows karena Ninja bawaan CMake 3.22.1 gagal pada path native yang panjang. Pastikan dukungan long paths Windows aktif; lihat [panduan resmi Expo](https://docs.expo.dev/troubleshooting/windows-long-paths/). Pilihan CMake ini hanya berlaku pada proses lokal, sehingga build EAS tetap memakai toolchain bawaannya. Jika belum terpasang, script mengunduh CMake lewat Android SDK Command-line Tools (latest). CMake juga bisa diinstall melalui Android Studio > SDK Tools.

## Memakai backend online

`.env.example` berisi endpoint FastAPI HTTPS dan Supabase online yang sudah dikonfigurasi. Salin ke `.env` jika file tersebut belum ada, lalu pastikan kedua flag berikut bernilai `false`:

```dotenv
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_USE_MOCK_DATA=false
```

Cek layanan dan jalankan aplikasi:

```powershell
bun run backend:check
bun run android:local
```

Untuk APK mandiri, jalankan `bun run android:release` tanpa `-Mock`. Backend online berjalan terpisah dari APK, sehingga komputer tidak perlu menyalakan FastAPI atau Docker lokal. Masuk dengan akun Supabase untuk data profil anak dan riwayat. APK mock yang dibuat sebelumnya perlu dibangun ulang karena variabel environment dibundel ke APK.

Pemeriksaan 1 November 2026: FastAPI `/health` dan Supabase Auth sama-sama merespons HTTP 200. FastAPI juga menolak permintaan prediksi tanpa audio dengan HTTP 422 `INVALID_REQUEST`. Kueri publik dokter, rumah sakit, dan artikel berhasil, tetapi belum mengembalikan baris data; daftar tersebut dapat tampil kosong sampai data/policy Supabase disiapkan.

## Development dengan pembaruan kode langsung

```powershell
bun run android:local
```

Pilih HP atau emulator saat diminta. Expo membuat direktori native lewat prebuild, mengompilasi aplikasi di komputer, memasangnya ke perangkat, dan menjalankan Metro. Perubahan JavaScript berikutnya memakai Fast Refresh; perubahan modul native atau konfigurasi native memerlukan build ulang.

## APK release tanpa Metro

```powershell
bun run android:release
```

Perintah ini mengompilasi dan memasang varian release lokal, dengan JavaScript dibundel di APK. Hasilnya ada di `android/app/build/outputs/apk/release/app-release.apk`. Ini APK untuk pengujian lokal dengan signing bawaan proyek hasil prebuild, bukan proses penandatanganan rilis Google Play.

Validasi aplikasi mewajibkan HTTPS untuk API prediksi pada varian release. Gunakan development build untuk backend HTTP lokal, atau opsi `-Mock` di bawah untuk menguji interaksi UI pada release.

Untuk memilih perangkat tertentu tanpa prompt:

```powershell
bun run android:release -Device emulator-5554
```

Untuk menguji UI tanpa backend atau `.env`, gunakan konfigurasi lokal publik dari `.env.example` dan layanan mock yang sudah ada:

```powershell
bun run android:release -Mock -Device emulator-5554
```

Opsi `-Mock` juga tersedia untuk `android:local`. APK hasil opsi ini memakai data dan hasil skrining simulasi, sehingga hanya digunakan untuk testing UI. Jalankan ulang tanpa `-Mock` dengan `.env` backend yang benar untuk menguji alur data asli.

Build pertama mengunduh dependensi Gradle/native dan dapat memakan waktu. Build berikutnya menggunakan cache lokal. Folder `android/` tetap hasil generate dan tidak diedit manual atau dimasukkan ke Git.

Jika perangkat sudah memiliki APK dari EAS dengan signing key berbeda, instalasi lokal akan ditolak dengan `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Gunakan emulator baru untuk testing lokal agar instalasi dan data lama tetap utuh.

## Cek regresi sentuhan

Pada APK release, tanpa Metro berjalan:

1. Buka aplikasi sampai Beranda muncul, lalu tekan tab Riwayat dan Profil.
2. Kembali ke Beranda, buka Menu, lalu tutup dengan tombol Tutup.
3. Ulangi dengan swipe untuk menutup dan tombol Back Android.
4. Pastikan tab serta tombol Beranda tetap merespons setelah setiap penutupan.
5. Buka Menu lagi dan pilih Profil Anak; pastikan navigasi berhasil dan layar tujuan menerima tap.
6. Tutup dan buka ulang aplikasi, lalu ulangi langkah pertama.

Menu memakai host native layar penuh yang dapat menahan tap meskipun isi sheet tidak ditampilkan. Saat Menu tertutup, komponen mengembalikan `null` agar host dilepas dari tree native. Saat Menu terbuka, presenter menggunakan `pointerEvents="none"` seperti implementasi modal bawaan `@expo/ui`; isi sheet menerima tap melalui jendela native sendiri. Pengujian release menunjukkan bahwa mengganti `pointerEvents` saja belum cukup tanpa melepas host yang tertutup.

Referensi: [build lokal Expo](https://docs.expo.dev/guides/local-app-development/), [Expo CLI](https://docs.expo.dev/more/expo-cli/), dan [Expo UI SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/ui/).

## Verifikasi perbaikan tap, 1 November 2026

Lingkup: interaksi Beranda, tab, dan Menu pada emulator Android API 36, memakai APK release dengan data mock. Backend dan prediksi audio nyata tidak termasuk dalam pemeriksaan ini.

- Reproduksi APK lama: tap Riwayat tidak mengubah layar; Beranda tetap terpilih. Penggantian `pointerEvents` saja juga masih gagal pada pengujian release.
- Perbaikan akhir: host Menu tidak dipasang saat `open=false`. Setelah perubahan ini, 19 pemeriksaan navigasi lulus, termasuk semua pilihan Menu, tombol Tutup, Back Android, swipe, dan cold relaunch.
- Tiga pemeriksaan tombol Beranda juga lulus: artikel, panduan rekaman, serta profil/pengaturan.
- `bunx expo lint` dan `bunx tsc --noEmit`: PASS setelah perubahan source terakhir.
- `bun run android:release -Mock -Device emulator-5554`: PASS, termasuk build dan instalasi di emulator uji baru. Tahap Gradle pada build ulang selesai dalam 1 menit 57 detik dengan 607 task up-to-date.
- Port Metro 8081 tidak aktif saat pemeriksaan akhir. APK berada di `android/app/build/outputs/apk/release/app-release.apk`.

Gate perubahan ini:

- Hard Gate PASS: kontrol yang terdampak menerima tap; 22 pemeriksaan interaksi pada APK release lulus. Bukti lokal berupa XML, screenshot, dan `results.txt` tersimpan di `.expo/tap-testing/` yang diabaikan Git.
- Purpose Gate PASS: host hanya ada ketika Menu terbuka agar presenter native yang kosong tidak menutupi layar.
- Liveliness PASS: tampilan mengikuti `design.md`; tidak ada aset, dekorasi, atau tata letak baru.
- Craftsmanship PASS: lint, typecheck, build release, dan pengujian interaksi perangkat selesai.

## Perbaikan upload audio SDK 58

Pada SDK 58, fetch global Android/iOS memakai `expo/fetch`. Pola multipart lama yang berisi `{ uri, name, type }` ditolak encoder dengan `Unsupported FormDataPart implementation` sebelum permintaan dikirim. Penanganan fetch di aplikasi lalu menerjemahkannya menjadi pesan koneksi internet.

`src/services/api/audio-file.ts` sekarang memasukkan objek `File` dari `expo-file-system` langsung ke `FormData`, sehingga encoder membaca byte rekamannya. Validasi ukuran, format, file kosong, pembatalan, dan pembersihan rekaman tetap berlaku. Referensi: [fetch SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/expo/#expofetch-api) dan [upload File/FormData SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/#uploading-files-using-expofetch).

Verifikasi 1 November 2026:

- PASS: 35 tes termasuk regresi yang memakai encoder SDK terpasang untuk membandingkan format lama dengan objek File.
- PASS: APK release pengujian pada emulator API 36 membuktikan format lama ditolak lokal, sedangkan upload File mencapai backend online dan mengembalikan HTTP 422 `AUDIO_SILENT` untuk WAV hening sintetis.
- PASS: file sintetis dibersihkan; pengujian tidak menggunakan rekaman pengguna atau profil anak.
- PASS: lint dan typecheck.
- PASS: APK aplikasi normal dibangun ulang tanpa `-Mock`, entrypoint kembali ke `expo-router/entry`, dan Beranda berhasil dibuka setelah cold launch. Salinan APK perbaikan tersedia di `.expo/releases/PNEUMOTrack-upload-fix.apk`.

Bukti lokal berada di `.expo/upload-smoke/result.xml`, `result.png`, dan `results.txt`. Pengujian ini memverifikasi upload dan validasi audio; hasil prediksi batuk asli belum diuji dalam sesi ini. Build ulang APK tanpa `-Mock` untuk memakai perbaikan tersebut.
