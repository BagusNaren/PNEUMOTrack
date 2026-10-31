# Member B: Sprint 0

Tanggal: 31 Oktober 2026. Mode antislop: `during`, pilihan pengguna dalam sesi ini.

## Kontrak skrining

Pengguna mengonfirmasi penggunaan `POST /predict` v2 dari `task_member_B.md` §4.1. PRD §12 masih memuat asumsi `/screen` lama. `docs/api.md` dan tipe tabel Supabase hasil generasi belum tersedia, sehingga pencocokan akhir dengan Member A dan C tetap menjadi checkpoint reviewer.

`src/types/screening.ts` menyediakan outcome, label mentah, enam kode kesalahan audio, respons sukses/error, union respons, kesalahan aplikasi, serta props hasil aktif/riwayat. `ScreeningHistoryResult` merupakan subset struktural kolom `screenings` pada `task.md` §4.2; tidak mengarang tabel atau menyimpan audio.

Guard memeriksa semua field wajib, objek bersarang, angka finite, jumlah chunk bulat nonnegatif, durasi nonnegatif, waveform 0..1, serta teks ringkasan/versi yang tidak kosong. Mapping `Pneumonia` ke `risk`, `Bukan Pneumonia` ke `normal`, dan konsistensi agreement/votes diperiksa. Ketika model berbeda, guard tidak menentukan sendiri pemenangnya. Validasi struktur tidak memverifikasi kebenaran medis atau keamanan bahasa ringkasan backend.

Props `ResultViewProps.result` menerima `PredictSuccessResponse` atau `ScreeningHistoryResult`. Item riwayat tidak dipaksa memiliki `raw_label` atau `votes`, karena keduanya tidak tercantum pada skema penyimpanan. JSON waveform dari Supabase tetap perlu divalidasi pada service Member C.

## Verifikasi Expo SDK 58

Versi proyek: `expo ~58.0.21`, `expo-router ~58.0.28`. Acuan: [SDK 58](https://docs.expo.dev/versions/v58.0.0/) dan [indeks dokumentasi](https://docs.expo.dev/llms.txt).

### Audio untuk Sprint 1 dan 2

[Dokumentasi audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/) merekomendasikan `expo-audio ~58.0.10`, sesuai `node_modules/expo/bundledNativeModules.json`.

- Perekam: `useAudioRecorder(options)`, status `useAudioRecorderState(recorder, interval)`; interval default 500 ms. Mulai dengan `await prepareToRecordAsync()`, lalu `record()`; akhiri `await stop()` dan baca `uri`.
- `RecordingPresets.HIGH_QUALITY`: Android `.m4a`, `mpeg4`/`aac`; iOS `.m4a`, `IOSOutputFormat.MPEG4AAC`. Preset 44.100 Hz, stereo; kebutuhan mono harus dikonfigurasi tersendiri.
- Aktifkan `isMeteringEnabled: true`; baca `state.metering`, yang opsional. Nilai hilang tidak boleh ditafsirkan sebagai ruangan tenang.
- Izin runtime: `requestRecordingPermissionsAsync()`. Mode: `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, allowsBackgroundRecording: false, shouldPlayInBackground: false })`. Nonaktifkan `allowsRecording` setelah selesai.
- Plugin `expo-audio`: `microphonePermission` mengatur pesan iOS; `recordAudioAndroid: true` mengaktifkan izin Android. Atur `enableBackgroundRecording: false` dan `enableBackgroundPlayback: false`; default playback plugin adalah true.
- Cache adalah lokasi default. Penghapusan eksplisit tetap diperlukan. Web memakai MediaRecorder, format dapat berbeda; izin mikrofon memerlukan konteks aman.

[Source Android paket 58.0.10](https://unpkg.com/expo-audio@58.0.10/android/src/main/java/expo/modules/audio/AudioRecorder.kt) mengonfirmasi metering relatif terhadap full scale: `20 * log10(amplitude / 32767)`, dengan fallback -160 ketika amplitudo nol. [Source iOS paket yang sama](https://unpkg.com/expo-audio@58.0.10/ios/AudioRecorder.swift) memanggil `updateMeters()` lalu `averagePower(forChannel: 0)`. Ini bukan pengukuran dB SPL terkalibrasi; jangan menjanjikan ambang kebisingan lintas perangkat sebelum checkpoint perangkat fisik.

[Referensi Apple untuk averagePower](https://developer.apple.com/documentation/avfaudio/avaudiorecorder/averagepower%28forchannel%3A%29?changes=l_5) menyatakan satuan dBFS dengan rentang -160 sampai 0. Jadi kedua platform memakai referensi full scale, tetapi Android membaca amplitudo puncak sedangkan iOS membaca daya rata-rata; keduanya tidak boleh dianggap identik untuk kalibrasi ambang kebisingan.

### Custom tabs

[Router UI SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/ui/) mengonfirmasi `Tabs`, `TabSlot`, `TabList`, dan `TabTrigger`. [Panduan custom tabs](https://docs.expo.dev/router/advanced/custom-tabs/) menjelaskan `name`, `href`, dan `asChild`. Implementasi awal `src/components/app-tabs.web.tsx` sudah memakai keempatnya. Deklarasi tipe paket terpasang juga diperiksa. Untuk SDK 58, gunakan `resetOnFocus`, sebagaimana referensi versi dan tipe lokal; jangan menyalin prop `reset` dari contoh panduan umum.

Menu kelak berupa aksi pembuka sheet, tanpa route tab fiktif. Implementasi navigasi tetap di Sprint 1.

## Perbaikan template yang disetujui

- `app-tabs.web.tsx`: tipe ref tombol mengikuti instance `Pressable`, menggantikan tipe ref `View` yang tidak cocok dari slot Router. Tidak memakai assertion atau menonaktifkan typecheck.
- `use-color-scheme.web.ts`: hidrasi menggunakan `useSyncExternalStore`; snapshot server/hidrasi tetap light, lalu mengikuti tema perangkat. Menghilangkan setState sinkron dalam effect. Acuan: [dokumentasi React](https://react.dev/reference/react/useSyncExternalStore).

## Pemeriksaan

Bun/bunx tidak tersedia pada mesin ini. Fallback npx diizinkan `task_member_B.md` §6; dependency proyek tidak ditambah atau diubah.

`expo lint` sempat mengembalikan exit code 0 sambil gagal memanggil Bun. Karena itu hasil lint yang dipakai adalah eksekusi ESLint langsung. Expo Doctor awalnya lulus 19/20 karena `bun.lock` dan `package-lock.json` bersamaan di root. Dengan persetujuan pengguna, lockfile npm dipindahkan ke `.expo/sprint-0/package-lock.backup.json`, checksum SHA256 diverifikasi sama, dan `bun.lock` dipertahankan.

| Pemeriksaan | Hasil |
| --- | --- |
| `npx --no-install tsc --noEmit` | PASS, 0 error |
| `npx --no-install eslint .` | PASS, 0 error/warning; fallback untuk expo lint yang mencoba memanggil Bun |
| `node --test src/types/screening.test.cjs` | PASS, 9 pengujian |
| `npx --no-install expo export --platform web --output-dir .expo/sprint-0-web` | PASS, bundle web dan server dihasilkan |
| `npx --yes expo-doctor` | PASS, 20/20 setelah pencadangan lockfile npm |

Tes mencakup kedua outcome, disagreement dua arah, seluruh kode error, setiap field wajib, metrik rusak, waveform rusak/sparse, kontradiksi label/voting, dan penolakan respons backend lama. Fixture sintetis tidak berisi data anak atau audio.

## Gate antislop dalam lingkup Sprint 0

- Hard gate PASS: guard menolak payload rusak; kode baru tanpa logging data, klaim klinis, kontrol mati, atau aset fiktif. Build web lulus. Tidak ada interaksi baru untuk diuji klik.
- Purpose gate PASS: tidak membuat gaya visual, ikon, animasi, aset, atau navigasi baru; dua perubahan template hanya memperbaiki tipe ref dan hidrasi.
- Liveliness: tidak berlaku pada kontrak tipe; tidak ada desain layar atau dial visual yang diklaim selesai pada sprint ini.
- Craftsmanship PASS: strict typecheck, lint, sembilan tes kontrak, build, dan Expo Doctor 20/20 lulus. JSDoc menjelaskan batas kontrak/privasi, tanpa komentar dekoratif atau narasi langkah.

## Checkpoint reviewer

- Cocokkan kontrak dengan `docs/api.md` setelah tersedia dari Member A, termasuk aturan voting ketika model berbeda.
- Cocokkan subset riwayat dengan tipe tabel dan nullability dari Member C.
- Siapkan emulator atau HP Android untuk Sprint 1. Mikrofon, metering perangkat fisik, dan APK belum diuji dalam Sprint 0.
