# Member B: Sprint 3

Tanggal: 31 Oktober 2026. Mode antislop: `during` (`session override`).

Implementasi Sprint 3 menyelesaikan layar rekomendasi tindakan (`/recommendation`), integrasi penyimpanan hasil skrining non-blocking ke riwayat (`saveStatus` dan aksi `"Simpan Ulang"`), pemeriksaan konektivitas dengan `@react-native-community/netinfo`, serta feedback haptik ringan dengan `expo-haptics`. Pengujian perangkat fisik Android (CP3 / MVP Gate) bersama layanan Supabase Member C dan server FastAPI Member A tetap menjadi tanggung jawab Human Reviewer.

## Implementasi

1. **Layar Rekomendasi Tindakan (`src/app/recommendation.tsx`):**
   - Header `"Rekomendasi Tindakan"` menggunakan `ScreenHeader` dengan callback `onBack` yang kembali ke riwayat navigasi sebelumnya (`/screening/result`), menuju `/screening/result` bila hasil sesi aktif tersedia, atau kembali ke `/(tabs)` bila halaman dibuka secara langsung.
   - Banner ringkasan risiko (`Card` varian `risk`) menampilkan ikon peringatan, judul indikasi risiko non-diagnostik, nama anak aktif dari adapter, waktu skrining terformat lokal Indonesia (`id-ID`), serta tombol `"Lihat Detail Hasil"` menuju `/screening/result`. Apabila halaman dibuka langsung tanpa hasil sesi aktif, banner menampilkan panduan statis tindak lanjut risiko secara aman beserta tombol `"Buka Panduan Rekaman"` menuju `/screening/guide`.
   - Kartu aksi pertama (`"Konsultasi dengan dokter"`) menampilkan aset `UI_reference/image_doctor.png` berukuran tetap (`88x96`), penjelasan non-diagnostik, dan tombol `RiskButton` `"Mulai Konsultasi"` menuju `/doctors`.
   - Kartu aksi kedua (`"Kunjungi fasilitas kesehatan terdekat"`) menampilkan simbol fasilitas kesehatan (`SymbolView` `cross.case.fill` / `local_hospital`) pada bidang `88x88`, penjelasan pemeriksaan fisik di Puskesmas atau rumah sakit, dan tombol `RiskButton` `"Lihat Rumah Sakit"` menuju `/hospitals`.
   - Komponen `DangerSignsBox` dirender dengan `showEmergencyAction` aktif sehingga menampilkan daftar empat tanda bahaya darurat dan tombol `"Hubungi Darurat 119"` (`Linking.canOpenURL("tel:119")` + `Linking.openURL("tel:119")`, dilengkapi pesan fallback bila perangkat tidak dapat membuka pemanggil telepon).
   - Komponen `Disclaimer` ditampilkan pada bagian bawah layar.

2. **Integrasi Penyimpanan Hasil Skrining Non-Blocking (`src/types/screening.ts`, `src/services/api/screening-session.ts`, `src/hooks/use-screening.ts`, `src/app/screening/result.tsx`):**
   - Fungsi `toSaveScreeningPayload(childId, result)` memetakan hasil `PredictSuccessResponse` ke struktur tabel `screenings` (`child_id`, `result`, `agreement`, `ae_error`, `ae_threshold`, `ocsvm_score`, `chunks`, `duration_sec`, `waveform`, `summary`, `model_version`) tanpa menyertakan file atau URI audio.
   - `ScreeningProvider` menerima prop opsional `saveScreening?: SaveScreeningAdapter` untuk disambungkan Member C ke `screeningsService.save`. Penyimpanan hanya dijalankan bila `childId` merupakan UUID valid (bukan ID profil pratinjau `demo-child`).
   - Proses simpan berjalan secara non-blocking setelah hasil skrining dipublikasikan (`status: "success"`). State `saveStatus` (`"idle" | "saving" | "saved" | "save_failed"`) diperbarui secara asinkron tanpa menahan perpindahan ke `/screening/result` dan tanpa memicu unhandled promise rejection.
   - Pada `/screening/result`, kegagalan penyimpanan (`saveStatus === "save_failed"`) menampilkan kartu peringatan `"Hasil belum tersimpan ke riwayat"` dengan tombol `"Simpan Ulang"` yang memanggil `retrySave()` untuk mengirim ulang payload yang sama.
   - Galeri komponen pengembangan (`/dev/components`, khusus `__DEV__`) dilengkapi pemilih mode simulasi simpan (`Pratinjau (Tanpa Simpan)`, `Simulasi Simpan Berhasil`, `Simulasi Gagal Simpan (Uji Simpan Ulang)`).

3. **Deteksi Konektivitas & Feedback Haptik Ringan (`src/services/api/connectivity.ts`, `src/components/screening/offline-banner.tsx`, `src/services/api/haptics.ts`):**
   - Paket `@react-native-community/netinfo@12.0.1` dan `expo-haptics@58.0.7` dipasang melalui `bunx expo install` sesuai daftar modul bundel Expo SDK 58.
   - `connectivity.ts` memantau status jaringan menggunakan `useSyncExternalStore` dan menonaktifkan probe HTTP pihak ketiga NetInfo pada web (`reachabilityShouldRun: () => Platform.OS !== "web"`) agar tidak memicu request CORS ke domain eksternal, sambil tetap mempertahankan pemeriksaan reachability native pada Android dan iOS.
   - Sebelum mengunggah rekaman asli, `ScreeningSession` memeriksa `checkIsOnline()`. Bila perangkat offline, analisis langsung gagal cepat dengan `kind: "offline"` tanpa menunggu timeout 60 detik dan tetap menyimpan URI rekaman di memori untuk `"Coba Lagi"`.
   - `OfflineBanner` ditampilkan secara halus pada `/screening/guide` dan `/screening/record` saat koneksi tidak tersedia, dengan penjelasan bahwa perekaman tetap dapat dilakukan tetapi pengiriman analisis membutuhkan internet.
   - `haptics.ts` membungkus pemanggilan `expo-haptics` dengan guard platform dan `try/catch` pada tiga momen: mulai merekam (`Gesture_Start` / `Light`), selesai merekam (`Confirm` / `Light`), dan saat hasil risiko muncul (`Reject` / `Warning`). Pada Android digunakan `performAndroidHapticsAsync` yang tidak membutuhkan izin `VIBRATE` tambahan.
   - Nilai contoh `EXPO_PUBLIC_USE_MOCK_API` pada `.env.example` diperbarui menjadi `false` dengan catatan penggunaan flag `true` untuk pengujian terisolasi.

## Batas Integrasi

- Folder `src/services/screenings/**` merupakan area milik Member C (terlarang dibuat atau diubah oleh Member B sesuai `task_member_B.md` §2.1). Integrasi disediakan melalui prop `saveScreening?: SaveScreeningAdapter` pada `ScreeningProvider` dan tipe `SaveScreeningPayload` di `src/types/screening.ts`.
- Selama `EXPO_PUBLIC_USE_MOCK_DATA=true` dan prop `saveScreening` belum diberikan oleh Member C, adapter default menyelesaikan penyimpanan mock untuk UUID anak yang valid; bila `EXPO_PUBLIC_USE_MOCK_DATA=false` dan service belum dipasang, adapter menolak penyimpanan sehingga UI secara jujur menampilkan `"Hasil belum tersimpan ke riwayat"` beserta tombol `"Simpan Ulang"`.

## Bukti Pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `bunx tsc --noEmit` | PASS, 0 error |
| `bunx expo lint` | PASS, 0 error/warning |
| `bunx expo-doctor` | PASS, 20/20 checks passed |
| `bun test src/services/api/screening.test.cjs src/types/screening.test.cjs` | PASS, 26 tes (termasuk 4 tes baru Sprint 3: mapping payload simpan tanpa audio, alur non-blocking `save_failed` -> `retrySave` -> `saved`, skip simpan pada `demo-child`, dan fail-fast offline sebelum upload) |
| `bunx expo export --platform all --output-dir .expo/sprint-3-final` | PASS, bundle Android, iOS, dan Web/Server berhasil dibangun |
| Audit statis `src/` (`console.log/info/debug`, `96.3`/`96,3`, kata diagnosis pasti, `any`/`@ts-ignore`, em dash) | PASS, 0 kemunculan |
| Pemeriksaan kontras WCAG (`contrast-check.py`) untuk permukaan risiko dan permukaan lembut (`light` & `dark`) | PASS, 9 pasangan diuji, rasio terendah 4,79:1 (`#A33A3A` di atas `#F4D6D6`) |

## Keputusan Desain (R-31)

Design Read: layar tindak lanjut risiko skrining (`recommendation.tsx`), status penyimpanan riwayat (`result.tsx`), serta indikator konektivitas dan umpan balik haptik (`guide.tsx`, `record.tsx`, `use-screening.ts`) untuk orang tua, dalam bahasa visual medis tenang sesuai `design.md`, dial ENERGY 1 / RHYTHM 2 / MOTION 2.

| Keputusan | Alasan |
| --- | --- |
| Permukaan `risk` (`#F4D6D6` / `#3A1E22`) pada banner dan kartu rekomendasi | Menjaga kontinuitas visual dari hasil berisiko ke dua tindakan tindak lanjut medis utama |
| Teks `ink` dan `risk` di atas permukaan `risk` (tanpa `ink-muted`) | Memastikan rasio kontras minimum 4,79:1 dan menghindari `ink-muted` di atas `surface-risk` yang hanya 4,4:1 |
| Kartu `soft` biru muda untuk status penyimpanan dan banner offline | Memisahkan informasi status sistem/jaringan dari peringatan risiko klinis |
| Foto dokter dari `UI_reference/image_doctor.png` dan simbol fasilitas kesehatan `SymbolView` | Memakai aset referensi yang sudah ada untuk dokter dan simbol semantik untuk rumah sakit tanpa mengarang foto stok baru (R-23) |
| Tata letak kartu rekomendasi `flex-row flex-wrap` dengan `min-w-[180px]` pada kolom teks | Memungkinkan teks dan ilustrasi turun menjadi satu kolom secara rapi pada layar sempit 320px atau ukuran teks besar |
| Tombol `"Hubungi Darurat 119"` langsung di dalam `DangerSignsBox` | Menempatkan aksi panggilan darurat tepat di bawah daftar tanda bahaya IGD tanpa duplikasi tombol |
| Haptik satu kali per komitmen aksi pengguna | Memberi umpan balik fisik saat mulai/berhenti rekam dan saat hasil risiko terbit tanpa getaran berulang per frame |

## Delivery Gate Antislop

Status di bawah ini memisahkan verifikasi kode/bundle otomatis dari pengujian perangkat fisik Android (CP3):

### Block 1: Hard Gate
- R-02 PASS: 0 karakter em dash pada kode, `copy.ts`, dan dokumentasi Sprint 3.
- R-03 PASS pada struktur responsif: kartu rekomendasi memakai `flex-wrap`, tinggi tombol minimum `h-12` (48dp), dan tombol kembali `44x44dp`. Verifikasi perangkat fisik tetap pada CP3.
- R-17 / R-18 / R-36 / R-38 PASS: tidak ada angka akurasi klinis (`96,3%`), statistik fiktif, atau testimoni; mode simulasi selalu diberi label eksplisit.
- R-23 PASS: hanya menggunakan aset `UI_reference/image_doctor.png` yang tersedia di repositori dan simbol `SymbolView` untuk fasilitas kesehatan; tidak membuat aset foto baru tanpa konfirmasi.
- R-24 / R-26 PASS: seluruh tombol memiliki aksi nyata (`/screening/result`, `/screening/guide`, `/doctors`, `/hospitals`, `tel:119`, `retrySave()`).
- R-25 PASS: seluruh pasangan teks/latar pada komponen Sprint 3 diuji dengan `contrast-check.py` (4,79:1 hingga 15,60:1).
- R-27 PASS: `/recommendation` menangani sesi hasil aktif maupun akses langsung tanpa sesi; `/screening/result` menangani state `saving`, `saved`, dan `save_failed`; layar panduan dan rekam menangani state offline.
- R-28 PASS: tidak ada bagian FAQ generik.
- R-32 / R-39 PASS pada implementasi: setiap kontrol menggunakan komponen `Button`/`Pressable` bertipe peran aksesibilitas, label Bahasa Indonesia, dan indikator `accessibilityLiveRegion` / `accessibilityRole="alert"`.
- R-33 PASS: seluruh perubahan ditulis langsung pada source code TypeScript/TSX.
- R-34 PASS pada token tema: seluruh komponen menggunakan pasangan kelas terang dan `dark:` dari `tailwind.config.js`.
- R-35 PENDING untuk CP3 perangkat fisik: typecheck, lint, Expo Doctor, 26 unit test, dan ekspor bundle 3 platform lulus; pengujian mikrofon, haptik perangkat, dialer `119`, serta penyimpanan Supabase nyata menunggu eksekusi Human Reviewer pada Android fisik.
- R-37 PASS: arah desain mengacu pada `design.md` dan Design Read dinyatakan sebelum edit.
- R-40 PASS: gambar dokter memiliki dimensi eksplisit (`88x96`) dan simbol rumah sakit memiliki dimensi eksplisit (`88x88`); NetInfo web dikonfigurasi tanpa request pihak ketiga yang memblokir.

### Block 2: Purpose-Gate
- R-01 / R-04 / R-06 / R-07 / R-08 / R-09 / R-10 / R-12 / R-13 / R-14 / R-19 / R-22 PASS: tidak menggunakan gradient dekoratif, glassmorphism, glow, pola latar, panah tombol dekoratif, atau animasi berulang; setiap elemen visual dan ikon memiliki alasan fungsional tertulis pada tabel Keputusan Desain.

### Block 3: Liveliness
- Dials (`ENERGY 1 / RHYTHM 2 / MOTION 2`) dan Design Read ditetapkan secara eksplisit.
- Setiap layar memiliki satu fokus utama (tindak lanjut risiko pada `/recommendation`, hasil skrining pada `/screening/result`), whitespace struktural (`gap-3` / `gap-6`, `px-5`), dan aksen warna `risk` yang hanya muncul pada konteks risiko/darurat.

### Block 4: Craftsmanship & Quality Locks
- C-1 hingga C-5 dan R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 PASS pada implementasi: CTA spesifik konteks (`"Mulai Konsultasi"`, `"Lihat Rumah Sakit"`, `"Lihat Detail Hasil"`, `"Simpan Ulang"`, `"Hubungi Darurat 119"`), tanpa buzzword AI, dan seluruh komentar kode ringkas serta menjelaskan alasan teknis.

## CP3 untuk Human Reviewer (MVP Gate)

1. Bangun ulang development client Android karena terdapat penambahan modul native `@react-native-community/netinfo` dan `expo-haptics`.
2. Hubungkan `activeChild` dan `saveScreening={screeningsService.save}` milik Member C pada `ScreeningProvider` di `src/app/_layout.tsx`.
3. Uji alur penuh di perangkat Android fisik: **Login -> Pilih/Tambah Anak -> Panduan & Cek Kebisingan -> Rekam Batuk (rasakan haptik mulai & berhenti) -> Analisis -> Hasil Risiko tampil (rasakan haptik peringatan) & tersimpan ke tabel `screenings` Supabase -> Buka Rekomendasi Tindakan -> Uji navigasi ke Daftar Dokter (`/doctors`), Daftar Rumah Sakit (`/hospitals`), dan tombol `"Hubungi Darurat 119"` membuka dialer telepon**.
4. Uji skenario jaringan terputus saat penyimpanan ke Supabase untuk memastikan banner `"Hasil belum tersimpan ke riwayat"` tampil tanpa menghalangi pembacaan hasil, lalu aktifkan internet kembali dan tekan `"Simpan Ulang"`.
