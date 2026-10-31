# Member B: Sprint 4

Tanggal: 31 Oktober 2026. Mode antislop: `during` (`session override`).

Implementasi Sprint 4 menyelesaikan konfigurasi pipeline EAS Build (`eas.json` dan `app.json`), integrasi entry-point `?source=monitoring` untuk pemanggilan alur rekam dari layar Monitoring milik Member C, serta optimasi performa animasi live `Waveform` dan `AnalysisPulse` pada UI thread Reanimated. Sesuai batasan peran (`TASK_MEMBER_B.md` §2.2), eksekusi `eas login`, `eas init`, `eas build`, pengaturan variabel environment di akun EAS, dan pengujian APK preview di HP Android fisik tetap dilakukan oleh Human Reviewer.

## Implementasi

1. **Konfigurasi Pipeline Build (`eas.json` & `app.json`):**
   - `eas.json` dibuat dengan 3 profil build:
     - `development`: `developmentClient: true`, `distribution: "internal"`, dan `android.buildType: "apk"` untuk pengembangan perangkat tim.
     - `preview`: `distribution: "internal"`, `android.buildType: "apk"` agar tim dan juri dapat menginstal file `.apk` mandiri tanpa Google Play Store, serta flag non-sensitif `EXPO_PUBLIC_USE_MOCK_API=false` dan `EXPO_PUBLIC_USE_MOCK_DATA=false`.
     - `production`: `autoIncrement: true` dan `android.buildType: "app-bundle"` untuk rilis store standar.
   - `app.json` diperbarui dengan:
     - `android.package`: `"com.pneumotrack.app"` dan `ios.bundleIdentifier`: `"com.pneumotrack.app"`.
     - `ios.infoPlist.CADisableMinimumFrameDurationOnPhone`: `true` untuk mendukung frame rate penuh pada layar 120Hz.
     - `android.adaptiveIcon.backgroundColor`: `"#D6E9F4"` (selaras dengan token `surface-brand` di `design.md`).
     - `android.permissions`: dibatasi hanya pada izin yang benar-benar dipakai aplikasi (`RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `ACCESS_NETWORK_STATE`).
     - `android.blockedPermissions`: memblokir secara eksplisit izin yang tidak diperlukan (`CAMERA`, `READ_CONTACTS`, `WRITE_CONTACTS`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`).

2. **Integrasi Entry-Point Monitoring (`src/services/api/screening-source.ts`, `src/app/screening/{guide,record,analyzing,result}.tsx`):**
   - Helper `parseScreeningSource`, `withScreeningSource`, dan `originHrefForSource` menormalisasi query param `?source=monitoring` dari `useLocalSearchParams`.
   - Saat Member C memanggil `/screening/guide?source=monitoring` atau `/screening/record?source=monitoring` dari `(tabs)/monitoring.tsx`:
     - Tombol kembali pada header `/screening/guide` menghentikan pemeriksaan suara (bila aktif) dan mengarahkan pengguna kembali ke `/(tabs)/monitoring` (`router.dismissTo("/(tabs)/monitoring")`).
     - Tombol `"Mulai"` di `/screening/guide` meneruskan parameter `source=monitoring` ke `/screening/record`, kemudian diteruskan ke `/screening/analyzing` dan `/screening/result`.
     - Tombol kembali pada header `/screening/record` membatalkan rekaman sementara secara aman, lalu kembali ke layar sebelumnya (`router.back()`) atau ke `/(tabs)/monitoring` bila dibuka langsung tanpa stack sebelumnya.
     - Tombol kembali pada header `/screening/result` membersihkan sesi dan mengarahkan pengguna kembali ke `/(tabs)/monitoring` apabila alur dimulai dari Monitoring.
   - Galeri komponen pengembangan (`/dev/components`, khusus `__DEV__`) menyediakan tautan uji cepat `Panduan Rekaman (dari Monitoring)` dan `Rekaman Audio (dari Monitoring)`.

3. **Optimasi Performa & Animasi HP Low/Mid-End (`src/components/screening/motion.tsx`, `src/components/ui/waveform.tsx`, `src/hooks/use-recorder.ts`):**
   - **Durasi dan kurva sesuai `design.md` §11 & `expo-animation`:** konstanta `MOTION_DURATION_MS = 180` (berada di rentang `150-250ms`) dengan kurva `EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)` dan `CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)`. Tidak ada *bouncy spring* pada hasil maupun indikator medis.
   - **Eliminasi re-render React tree per tick metering:**
     - `useRecorder` kini menyimpan `liveMetering` sebagai Reanimated `SharedValue<readonly number[]>`. Setiap tick metering (`100ms`) selama perekaman mendorong sampel amplitudo langsung ke `liveMetering.set(...)` di UI thread tanpa menyalin array `meteringHistory` ke state React pada setiap tick.
     - Update state JS `durationMs` (untuk teks timer) dan `noiseLevel` dibatasi dengan throttle `200ms` (maksimum 5 kali per detik), sedangkan array `meteringHistory` di state React hanya disinkronkan saat rekaman dijeda (`pauseRecording`) atau selesai (`finish`).
     - `Waveform` dibungkus `React.memo` dan menggunakan 32 komponen `LiveWaveformBar` ter-memoisasi yang membaca `liveSamples.get()` melalui `useAnimatedReaction` dan `useAnimatedStyle` (`transform: [{ scaleY }]`) murni di UI thread Reanimated.
   - **Penghentian penuh saat `reduceMotion` aktif atau layar tidak fokus:**
     - Hook `useMotionAllowed()` menggabungkan status `AccessibilityInfo.isReduceMotionEnabled()`, `useIsFocused()` dari `expo-router`, dan `AppState` (`"active"`).
     - Saat `reduceMotion` aktif, layar kehilangan fokus, atau aplikasi berpindah ke background, `AnalysisPulse` dan `LiveWaveformBar` langsung memanggil `cancelAnimation(...)` dan menghentikan seluruh transisi loop.
     - `RecordScreen` menambahkan `useFocusEffect` yang memanggil `stopOnBlur()` sehingga perekaman maupun polling metering berhenti segera bila layar kehilangan fokus.

## Dokumentasi Environment Variables EAS (Untuk Human Reviewer)

Jangan pernah menaruh URL VPS produksi atau kunci kredensial langsung di dalam `eas.json`. Sebelum menjalankan cloud build (`preview` atau `production`), Human Reviewer wajib mendaftarkan variabel environment berikut melalui dashboard EAS atau perintah `bunx eas-cli env:create`:

| Nama Variabel | Nilai pada Lingkungan `preview` & `production` | Visibilitas EAS | Keterangan |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://<domain-vps-member-a>` | `plaintext` / `sensitive` | URL HTTPS publik backend FastAPI Member A (jangan gunakan `10.0.2.2` atau IP LAN lokal) |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | `plaintext` | URL proyek Supabase produksi |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `<supabase-anon-public-key>` | `sensitive` | Kunci anon publik Supabase (dengan RLS aktif; jangan pernah memasukkan `service_role` key) |
| `EXPO_PUBLIC_USE_MOCK_API` | `false` | `plaintext` | Menonaktifkan simulator API agar aplikasi memanggil server FastAPI nyata |
| `EXPO_PUBLIC_USE_MOCK_DATA` | `false` | `plaintext` | Menonaktifkan data dummy agar aplikasi membaca/menyimpan ke Supabase nyata |

Contoh perintah CLI untuk Human Reviewer setelah `bunx eas-cli login` dan `bunx eas-cli init`:

```powershell
bunx eas-cli env:create --name EXPO_PUBLIC_API_URL --value "https://api.pneumotrack.example.com" --environment preview --environment production --visibility plaintext
bunx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<project-ref>.supabase.co" --environment preview --environment production --visibility plaintext
bunx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>" --environment preview --environment production --visibility sensitive
```

## Bukti Pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `bunx tsc --noEmit` | PASS, 0 error |
| `bunx expo lint` | PASS, 0 error/warning |
| `bunx expo-doctor` | PASS, 20/20 checks passed |
| `bun test src/services/api/screening.test.cjs src/types/screening.test.cjs` | PASS, 28 tes (termasuk 2 tes baru Sprint 4: helper `?source=monitoring` dan validasi struktur `eas.json` / `app.json`) |
| `bunx expo export --platform all --output-dir .expo/sprint-4-final` | PASS, bundle Android, iOS, dan Web/Server berhasil dibangun |
| Audit statis `src/` (`console.log/info/debug`, `96.3`/`96,3`, kata diagnosis pasti, `any`/`@ts-ignore`, em dash) | PASS, 0 kemunculan |

## Keputusan Desain & Performa (R-31)

Design Read: konfigurasi pipeline EAS Build, integrasi navigasi entry-point Monitoring, serta optimasi performa animasi perekaman dan analisis skrining untuk orang tua, dalam bahasa visual medis tenang sesuai `design.md`, dial ENERGY 1 / RHYTHM 2 / MOTION 2.

| Keputusan | Alasan |
| --- | --- |
| `SharedValue<readonly number[]>` + `useAnimatedReaction` pada `Waveform` live | Memindahkan pembaruan 32 bar amplitudo ke UI thread Reanimated sehingga perekaman tidak memicu re-render komponen React setiap 100ms |
| Durasi transisi `180ms` dengan `Easing.bezier(0.23, 1, 0.32, 1)` (`ease-out`) | Memenuhi aturan `150-250ms ease-out` pada `design.md` §11 dan mencegah pantulan pegas (*bouncy spring*) pada antarmuka medis |
| Throttle `200ms` pada state JS `durationMs` dan `noiseLevel` | Membatasi frekuensi pembaruan teks timer dan meter kebisingan ke 5 Hz agar thread JS tetap ringan di ponsel Android low-end |
| Hook `useMotionAllowed()` (`!reduced && isFocused && appActive`) | Menghentikan total animasi pulse dan bar waveform saat pengguna mengaktifkan *reduce motion*, berpindah layar, atau meminimalkan aplikasi |
| Warna latar adaptive icon Android `#D6E9F4` | Menyelaraskan ikon aplikasi di launcher Android dengan palet `surface-brand` PNEUMOTrack |
| Pemblokiran eksplisit izin kamera, kontak, dan penyimpanan eksternal di `app.json` | Menjamin prinsip minimasi izin sesuai `PRD.md` §13 agar APK hanya meminta akses mikrofon dan jaringan |

## Delivery Gate Antislop

Status di bawah ini memisahkan verifikasi kode/bundle otomatis dari checkpoint cloud build dan perangkat fisik Android:

### Block 1: Hard Gate
- R-02 PASS: 0 karakter em dash pada kode, `copy.ts`, dan dokumentasi Sprint 4.
- R-03 PASS pada struktur responsif: tidak ada perubahan layout yang memicu horizontal overflow; target sentuh tetap minimum `48dp` untuk CTA dan `44x44dp` untuk tombol kembali.
- R-17 / R-18 / R-36 / R-38 PASS: tidak ada angka akurasi klinis (`96,3%`), statistik fiktif, atau klaim performa perangkat yang belum diukur.
- R-23 PASS: konfigurasi ikon dan splash menggunakan aset yang sudah tersedia di repositori (`assets/images/*` dan `UI_reference/logo.png`).
- R-24 / R-26 PASS: seluruh navigasi `?source=monitoring` memiliki route tujuan nyata (`/(tabs)/monitoring`, `/screening/guide`, `/screening/record`, `/screening/analyzing`, `/screening/result`).
- R-25 PASS: tidak menambahkan kombinasi warna baru di luar token semantik yang telah terverifikasi WCAG AA.
- R-27 PASS: state loading, empty, dan error pada keempat layar skrining tetap terjaga saat diakses dengan parameter `?source=monitoring`.
- R-28 PASS: tidak ada bagian FAQ generik.
- R-32 / R-39 PASS: seluruh kontrol memiliki peran aksesibilitas, label Bahasa Indonesia, dan penghentian gerak otomatis saat `prefers-reduced-motion` / `isReduceMotionEnabled` aktif.
- R-33 PASS: seluruh perubahan ditulis langsung pada source code dan file konfigurasi.
- R-34 PASS: token tema terang dan gelap tidak berubah dan tetap konsisten.
- R-35 PENDING untuk Checkpoint Cloud Build & Perangkat Fisik: typecheck, lint, Expo Doctor (20/20), 28 unit test, dan ekspor bundle 3 platform lulus; pembuatan APK via `eas build` dan pengujian di ponsel Android fisik menggunakan jaringan seluler dilakukan oleh Human Reviewer.
- R-37 PASS: arah desain dan dials (`ENERGY 1 / RHYTHM 2 / MOTION 2`) mengikuti `design.md`.
- R-40 PASS: tidak ada klaim metrik frame rate atau waktu build yang dilaporkan tanpa pengukuran nyata.

### Block 2: Purpose-Gate
- R-01 / R-04 / R-06 / R-07 / R-08 / R-09 / R-10 / R-12 / R-13 / R-14 / R-19 / R-22 PASS: animasi hanya digunakan untuk umpan balik sinyal suara (`Waveform`) dan indikator proses aktif (`AnalysisPulse`) dengan alasan teknis tertulis di tabel Keputusan Desain.

### Block 3: Liveliness
- Dials (`ENERGY 1 / RHYTHM 2 / MOTION 2`) dan Design Read ditetapkan sebelum perubahan kode; motion berjalan mulus di UI thread saat layar aktif dan berhenti saat tidak fokus.

### Block 4: Craftsmanship & Quality Locks
- C-1 hingga C-5 dan R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 PASS pada implementasi.

## Checkpoint Sprint 4 untuk Human Reviewer

1. Jalankan `bunx eas-cli whoami` dan `bunx eas-cli init` untuk menautkan proyek ke akun Expo/EAS tim.
2. Pasang variabel environment produksi (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) di EAS sesuai tabel di atas.
3. Jalankan perintah build APK preview:
   ```powershell
   bunx eas-cli build --profile preview --platform android
   ```
4. Unduh APK preview yang dihasilkan, pasang pada HP Android fisik menggunakan koneksi data seluler, lalu uji alur skrining penuh (termasuk masuk dari tab Monitoring `?source=monitoring` dan kembali ke Monitoring).
