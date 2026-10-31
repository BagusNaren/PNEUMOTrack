# Member B: Sprint 5

Tanggal: 31 Oktober 2026. Mode antislop: `during` (`session override`).

Implementasi Sprint 5 menyelesaikan pengerasan (*hardening*) alur inti skrining terhadap *edge cases* (skala font sistem besar dan pencegahan *double-tap* cepat pada aksi maupun navigasi), audit otomatis keamanan, privasi, serta kepatuhan medis sesuai `PRD.md` §13, dan pembaruan dokumentasi utama di [`README.md`](../README.md). Sesuai pembagian peran (`task_member_B.md` §2.2), pembuatan APK final (`v1.0.0-hackathon`) via EAS Build, pengujian pada perangkat Android demo fisik, dan perekaman video cadangan tetap dilakukan oleh Human Reviewer.

## Implementasi

1. **Perbaikan Edge Cases, Ketahanan Skala Font Besar & Proteksi Double-Tap:**
   - **Ketahanan terhadap ukuran font sistem besar (*large font scaling*, hingga 200%):**
     - [`src/components/ui/status-banner.tsx`](../src/components/ui/status-banner.tsx): menambahkan `flex-wrap` pada baris konten dan membungkus ikon dengan `<View className="shrink-0">` sehingga teks status panjang dapat turun baris (*wrap*) tanpa memotong ikon atau keluar dari kartu.
     - [`src/components/ui/button.tsx`](../src/components/ui/button.tsx): menambahkan `flex-wrap` pada kontainer `min-h-12` sehingga tombol dengan label panjang atau indikator pemrosesan (`ActivityIndicator`) dapat menyesuaikan tinggi secara dinamis tanpa memotong teks.
     - [`src/components/ui/screen-header.tsx`](../src/components/ui/screen-header.tsx): menambahkan `flex-wrap`, `py-1`, dan `shrink-0` pada slot tombol kembali (`44x44dp`) serta slot aksi kanan, serta `w-full` pada judul/subjudul tengah agar judul dapat membungkus baris dengan rapi saat ukuran teks diperbesar.
     - [`src/components/ui/danger-signs-box.tsx`](../src/components/ui/danger-signs-box.tsx): menggunakan baris `flex-row flex-wrap items-start gap-2` dengan kolom teks `min-w-0 flex-1` pada setiap butir tanda bahaya serta mengunci pemanggilan `Linking.openURL("tel:119")` dengan guard `callingRef` agar ketukan ganda pada tombol darurat tidak memicu duplikasi pembukaan dialer.
   - **Proteksi *Single-Flight* terhadap *Double-Tap* Cepat (`src/services/api/single-flight.ts` & `src/hooks/use-single-flight.ts`):**
     - `createSingleFlightGate()` menyediakan dua metode sinkron:
       - `run(action)`: mengunci eksekusi secara sinkron pada ketukan pertama hingga `Promise` selesai.
       - `navigate(action)`: mengunci eksekusi secara sinkron pada ketukan pertama dan mempertahankan kunci selama transisi layar berlangsung hingga layar kembali mendapatkan fokus (`useFocusEffect` memanggil `gate.reset()`), atau membuka kunci kembali bila prasyarat asinkron mengembalikan `false`.
     - Dipasang pada seluruh layar alur skrining inti:
       - [`src/app/screening/guide.tsx`](../src/app/screening/guide.tsx): tombol `"Mulai"`, `"Periksa Suara Ruangan"`, `"Tambah Anak"`, dan tombol kembali header.
       - [`src/app/screening/record.tsx`](../src/app/screening/record.tsx) & [`src/components/screening/audio-preview.tsx`](../src/components/screening/audio-preview.tsx): tombol `"Analisis Batuk"`, `"Rekam Ulang"`, `"Batalkan"`, dan tombol kembali header.
       - [`src/app/screening/analyzing.tsx`](../src/app/screening/analyzing.tsx): tombol `"Coba Lagi"`, `"Rekam Ulang"`, `"Batalkan Analisis"`, `"Buka Panduan Rekaman"`, serta transisi otomatis ke `/screening/result`.
       - [`src/app/screening/result.tsx`](../src/app/screening/result.tsx): tombol `"Lihat Rekomendasi Tindakan"`, `"Kembali ke Beranda"`, `"Lihat Riwayat"`, `"Rekam Ulang"`, `"Simpan Ulang"`, dan tombol kembali header.
       - [`src/app/recommendation.tsx`](../src/app/recommendation.tsx): tombol `"Mulai Konsultasi"`, `"Lihat Rumah Sakit"`, `"Lihat Detail Hasil"`, `"Buka Panduan Rekaman"`, dan tombol kembali header.
       - [`src/app/dev/components.tsx`](../src/app/dev/components.tsx): tombol `"Jalankan Simulasi"`.
   - **Pengerasan Konkurensi `ScreeningSession` & `useRecorder`:**
     - [`src/services/api/screening-session.ts`](../src/services/api/screening-session.ts): menambahkan guard `clearingInFlight` pada `clear()`, `start()`, dan `retry()` agar pemanggilan `clearSession()` ganda secara bersamaan hanya menghapus file audio sementara satu kali dan hanya mengembalikan `true` pada pemanggil pertama.
     - [`src/hooks/use-recorder.ts`](../src/hooks/use-recorder.ts): memperbarui antrean `perform` dengan penghitung `pendingTasks` yang langsung menetapkan `busy: true` secara sinkron dan menambahkan `performUserAction` agar ketukan ganda pada kontrol perekam ditolak seketika sebelum antrean asinkron berjalan.

2. **Audit Otomatis Keamanan, Privasi & Kepatuhan Medis:**
   - Pemindaian otomatis ditambahkan sebagai pengujian permanen di [`src/services/api/screening.test.cjs`](../src/services/api/screening.test.cjs) yang memverifikasi seluruh file `.ts` dan `.tsx` di dalam `src/`:
     - **0 kemunculan** `console.log`, `console.debug`, atau `console.info`.
     - **0 kemunculan** angka klaim `96.3` atau `96,3` serta frasa diagnosis pasti (*"menderita pneumonia"*, *"positif pneumonia"*, *"has pneumonia"*, *"terdiagnosis pneumonia"*, *"bebas pneumonia"*).
     - **0 kemunculan** referensi kunci rahasia `service_role`.
     - Seluruh komponen kritis (`StatusBanner`, `Button`, `ScreenHeader`, `DangerSignsBox`) terverifikasi menerapkan `flex-wrap`.
     - Seluruh kontrol *icon-only* (`ScreenHeader` kembali, tab bar `Beranda`/`Riwayat`/`Profil`/`Menu` di [`src/app/(tabs)/_layout.tsx`](../src/app/(tabs)/_layout.tsx)) memiliki `accessibilityLabel` Bahasa Indonesia.

3. **Dokumentasi Root [`README.md`](../README.md):**
   - Mengganti template bawaan Expo dengan dokumentasi lengkap proyek **PNEUMOTrack** dalam Bahasa Indonesia yang mencakup: deskripsi singkat dan penafian non-diagnostik + tanda bahaya 119, tabel arsitektur ringkas (Expo SDK 58 + FastAPI + Supabase), prasyarat pengembangan (`bun` dan Android Development Build), panduan konfigurasi `.env` dari `.env.example`, daftar perintah server pengembangan dan pemeriksaan kualitas kode (`tsc`, `expo lint`, `expo-doctor`, `bun test`), serta langkah pembuatan APK `development` dan `preview` melalui EAS Build.

## Bukti Pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `bunx tsc --noEmit` | PASS, 0 error |
| `bunx expo lint` | PASS, 0 error/warning |
| `bunx expo-doctor` | PASS, 20/20 checks passed |
| `bun test src/services/api/screening.test.cjs src/types/screening.test.cjs` | PASS, 31 tes (termasuk 3 tes baru Sprint 5: gate *single-flight* double-tap, konkurensi `clearSession`, dan audit statis menyeluruh `src/`) |
| `bunx expo export --platform all --output-dir .expo/sprint-5-final` | PASS, bundle Android, iOS, dan Web/Server berhasil dibangun |
| Audit statis `src/` (`console.log/info/debug`, `96.3`/`96,3`, kata diagnosis pasti, `service_role`, `any`/`@ts-ignore`, em dash) | PASS, 0 kemunculan |

## Keputusan Desain & Ketahanan (R-31)

Design Read: pengerasan ketahanan skala font besar, pencegahan *double-tap* pada aksi dan navigasi, serta dokumentasi rilis untuk alur skrining batuk orang tua dan pengasuh, dalam bahasa visual medis tenang sesuai `design.md`, dial ENERGY 1 / RHYTHM 2 / MOTION 2.

| Keputusan | Alasan |
| --- | --- |
| `createSingleFlightGate` dengan pemisahan `run` dan `navigate` | Mencegah duplikasi request API maupun duplikasi push layar selama animasi transisi navigasi berlangsung, dan otomatis membuka kunci saat layar kembali fokus |
| Guard `clearingInFlight` pada `ScreeningSession.clear()` | Memastikan dua aksi batal/keluar yang terpanggil berdekatan tidak menghapus file yang sama dua kali atau memicu dua navigasi beruntun |
| `flex-wrap` + `shrink-0` + `min-w-0 flex-1` pada `StatusBanner`, `Button`, `ScreenHeader`, dan `DangerSignsBox` | Menjaga keterbacaan teks pada perbesaran font sistem hingga 200% tanpa memotong kalimat atau menggeser ikon keluar layar |
| Pengujian audit kepatuhan otomatis di `screening.test.cjs` | Menjamin aturan privasi data anak, larangan klaim `96,3%`, dan larangan kalimat diagnosis pasti terjaga secara otomatis pada setiap eksekusi test suite |

## Delivery Gate Antislop

Status di bawah ini memisahkan verifikasi kode, tes, dan bundle otomatis dari checkpoint pembuatan APK final dan demo perangkat fisik oleh Human Reviewer:

### Block 1: Hard Gate
- R-02 PASS: 0 karakter em dash pada seluruh kode sumber, `copy.ts`, `README.md`, dan dokumentasi Sprint 5.
- R-03 PASS: komponen `StatusBanner`, `Button`, `ScreenHeader`, dan `DangerSignsBox` menggunakan `flex-wrap`, `min-h-*`, dan `min-w-0 flex-1` tanpa horizontal overflow; target sentuh tetap minimal `48dp` untuk tombol utama dan `44x44dp` untuk tombol ikon.
- R-17 / R-18 / R-36 / R-38 PASS: 0 kemunculan klaim akurasi `96,3%`, testimoni fiktif, atau tanda vital palsu.
- R-23 PASS: seluruh aset visual menggunakan ilustrasi dan ikon yang telah disetujui di repositori.
- R-24 / R-26 PASS: setiap tombol dan item navigasi memiliki aksi nyata dan dilindungi dari *double-tap* melalui `useSingleFlight`.
- R-25 PASS: seluruh warna menggunakan token semantik `tailwind.config.js` yang memenuhi standar kontras WCAG AA pada mode terang dan gelap.
- R-27 PASS: state empty, loading, dan error tersedia dan teruji pada seluruh layar alur skrining.
- R-28 PASS: tidak ada bagian FAQ generik.
- R-32 / R-39 PASS: seluruh kontrol memiliki `accessibilityRole`, `accessibilityLabel` Bahasa Indonesia, `accessibilityState`, dan menghormati pengaturan `isReduceMotionEnabled`.
- R-33 PASS: seluruh perubahan ditulis langsung pada kode sumber TypeScript/TSX dan Markdown.
- R-34 PASS: mode terang dan gelap menggunakan pasangan token semantik yang konsisten.
- R-35 PENDING untuk Checkpoint APK Demo Perangkat Fisik: typecheck, lint, Expo Doctor (20/20), 31 unit test, dan ekspor bundle 3 platform lulus; pembuatan APK final (`v1.0.0-hackathon`) via EAS Build dan pengujian di perangkat Android demo dilakukan oleh Human Reviewer.
- R-37 PASS: arah desain mengikuti `design.md` dengan dial `ENERGY 1 / RHYTHM 2 / MOTION 2`.
- R-40 PASS: seluruh elemen gambar memiliki dimensi eksplisit (`width` dan `height`) dan tidak ada klaim metrik performa yang belum diukur.

### Block 2: Purpose-Gate
- R-01 / R-04 / R-06 / R-07 / R-08 / R-09 / R-10 / R-12 / R-13 / R-14 / R-19 / R-22 PASS: tidak ada dekorasi tanpa tujuan; seluruh keputusan tata letak dan ketahanan interaksi memiliki alasan tertulis pada tabel R-31.

### Block 3: Liveliness
- Dials (`ENERGY 1 / RHYTHM 2 / MOTION 2`) dan Design Read ditetapkan sebelum perubahan kode; hirarki fokus satu aksi utama per layar dan ruang kosong struktural tetap terjaga.

### Block 4: Craftsmanship & Quality Locks
- C-1 hingga C-5 dan R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 PASS pada implementasi.

## Checkpoint Sprint 5 untuk Human Reviewer (Demo Readiness)

1. Jalankan build **APK Preview Final** (`v1.0.0-hackathon`) menggunakan EAS:
   ```powershell
   bunx eas-cli build --profile preview --platform android
   ```
2. Pasang APK hasil build pada HP Android demo utama dan HP cadangan, lalu uji alur end-to-end (`Panduan -> Rekam -> Analisis -> Hasil -> Rekomendasi -> Dokter/RS/119`) dengan ukuran font normal maupun ukuran font besar sistem.
3. Siapkan sampel audio demo (pola batuk normal dan indikasi risiko) serta rekam video *screen-recording* end-to-end sebagai cadangan presentasi apabila koneksi internet di lokasi lomba tidak stabil.
