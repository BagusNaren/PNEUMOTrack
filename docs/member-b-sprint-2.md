# Member B: Sprint 2

Tanggal: 31 Oktober 2026. Antislop `during`, pilihan pengguna pada sesi ini.

Implementasi Sprint 2 tersedia untuk review. CP2 pada Android fisik dan FastAPI LAN asli belum dijalankan, sehingga penerimaan perangkat belum dinyatakan lulus. Sprint 3 tidak dikerjakan.

## Implementasi

- Panduan menampilkan profil dari adapter, petunjuk jarak ponsel, tiga tips, rationale izin mikrofon, dan pemeriksaan kebisingan selama tiga detik. State profil loading, error, dan benar-benar kosong dibedakan.
- `use-recorder.ts` mengelola recorder `expo-audio`, izin, Pengaturan, start/pause/resume/stop, metering maksimum 60 sampel, penghentian native dengan `record({ forDuration: 30 })`, dan stop saat AppState menjadi inactive/background. Operasi async diserialkan agar prepare, stop, dan dispose tidak berlomba.
- Rekaman di bawah tiga detik tidak dapat dikirim. Pratinjau menyediakan pemutaran, rekam ulang, dan Analisis Batuk. Pratinjau tidak menyimpan rekaman ke riwayat.
- Client mengirim multipart `audio` dan UUID `child_id` yang valid, tanpa memasang Content-Type manual. Format m4a/wav/aac dipetakan ke MIME yang sesuai. Web menggunakan MIME Blob, termasuk webm/ogg. Batas ukuran adalah 10 MiB.
- `/predict` memakai kontrak v2 yang telah dikonfirmasi pada Sprint 0. Respons sukses melewati guard Sprint 0. HTTP 422 yang dikenal, JSON rusak, HTTP gagal, koneksi gagal, timeout 60 detik, dan pembatalan ditangani terpisah. Pesan server mentah tidak ditampilkan.
- `ScreeningSession` memegang state dan URI sementara di memori. Error jaringan mempertahankan file untuk retry. Sukses dan penolakan audio menghapus file sebelum memublikasikan hasil/error. Cancel mengabort request, menghapus file, dan menolak respons sesi lama.
- Recorder menyerahkan kepemilikan file ke sesi analisis sebelum route rekam diganti. Dispose menangani stop dan penghapusan file yang belum diserahkan. Kegagalan penghapusan menjadi error yang dapat ditangani; penghapusan native yang gagal juga diantrikan untuk percobaan berikutnya selama proses aplikasi masih hidup.
- Layar analisis memiliki loading, state tanpa rekaman, konfirmasi keluar lewat `usePreventRemove`, tombol pembatalan, error audio dengan Rekam Ulang, serta error jaringan dengan Coba Lagi. Respons sukses mengganti route ke hasil.
- `ResultView` murni menerima hasil aktif atau subset riwayat, tanpa membaca context atau melakukan navigasi. Kedua varian menampilkan waveform, ringkasan backend, skor teknis dalam accordion, tanda bahaya, dan penafian. Ketidaksepakatan model menampilkan peringatan dan callback rekam ulang opsional.
- Galeri development menyediakan 12 skenario dan dapat menjalankan simulasi tanpa mikrofon. Simulasi memiliki label yang jelas pada analisis dan hasil. Galeri tidak tersedia pada produksi.

## Batas integrasi

Hook anak aktif Member C belum tersedia. `ScreeningProvider` menerima prop `activeChild: ActiveChildAdapter` dengan status `loading | error | empty | ready`. Default sementara adalah profil berlabel **Anak (Mode Pratinjau)**. UUID contoh tidak dibuat dan `demo-child` tidak dikirim ke backend. Member C dapat meneruskan state hook-nya melalui prop ini tanpa mengubah layar skrining.

Rekomendasi, Supabase, penyimpanan hasil, NetInfo, dan haptics tetap Sprint 3. CTA rekomendasi menuju placeholder yang sudah ada. Tombol Riwayat menuju route milik Member C, tetapi hasil Sprint 2 belum disimpan ke sana.

Fetch tidak mengekspos progres upload. Pada request asli, fase `analyzing` dimulai saat header respons diterima, sebelum JSON dibaca dan divalidasi. Selama menunggu, copy menjelaskan pengiriman dan penantian layanan; tidak ada progres persentase atau langkah inferensi yang dikarang. Simulator memisahkan tahapan dengan delay total 1,8 detik dan menghormati AbortSignal.

Pemeriksaan kebisingan memakai heuristik dBFS relatif, bukan dB SPL terkalibrasi atau penilaian medis. Metering yang tidak tersedia menghasilkan status belum dapat diperiksa, bukan Aman. Kelayakan audio tetap ditentukan backend melalui kode 422.

Getter izin web pada expo-audio SDK 58 dapat meminta mikrofon ketika status masih prompt. Pemeriksaan awal web memakai Permissions API tanpa permintaan akses; permintaan mikrofon hanya berlangsung setelah pengguna menekan tombol izin. Pengaturan perangkat dan pengujian mikrofon tetap perlu dicoba pada Android.

## Dependency

`expo-file-system ~58.0.13` dipasang melalui `bunx expo install`. Expo Doctor meminta pembaruan patch: Expo 58.0.22, expo-audio 58.0.11, expo-router 58.0.29, dan @expo/ui 58.0.26. Keempatnya dipasang melalui Expo installer; major SDK tetap 58.

Dua dependency lama yang tertinggal dari instalasi sebelumnya dicadangkan dari node_modules ke `.expo/sprint-2-stale-packages`: CLI 58.1.17 dan log-box 58.0.13. Lockfile sudah menunjuk versi baru. Setelah pencadangan dan `bun install`, Expo Doctor lulus 20/20. Tidak ada override atau pengecualian Doctor yang ditambahkan.

Tidak ada perubahan source backend, Supabase, route Member C, folder native, kredensial, atau akun EAS.

## Bukti pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `bunx tsc --noEmit` | PASS, 0 error |
| `bunx expo lint` | PASS, 0 error/warning |
| `bunx expo-doctor` | PASS, 20/20 |
| `bun test src/services/api/screening.test.cjs src/types/screening.test.cjs` | PASS, 22 tes |
| `bunx expo export --platform all --output-dir .expo/sprint-2-final` | PASS, bundle Android, iOS, web, dan server |
| HTTP produksi untuk empat route skrining, rekomendasi, dan galeri | PASS, enam HTTP 200, tanpa Unmatched Route; HTML galeri tidak memuat simulator |
| Pemindaian logging sensitif, klaim angka klinis, diagnosis pasti, any, penonaktifan TypeScript, dan em dash pada kode Sprint 2 | PASS, tidak ditemukan |
| Kontras enam pasangan teks/permukaan baru, light dan dark | PASS, 4,79:1 sampai 8,10:1 melalui contrast-check.py |
| Lebar 320 | PASS untuk tampilan yang diperiksa; lebar dokumen dan viewport sama-sama 320 |
| Target sentuh panduan | PASS, tombol utama 48 dan kembali 44 piksel |

Tes mencakup respons normal/risiko/disagreement, seluruh kode error, pembatalan delay mock, boundary multipart, JSON rusak, HTTP 422/500, offline, timeout, pembatalan manual, MIME, batas file, penolakan ID contoh, pembersihan audio, retry file yang sama, pencegahan pengiriman ganda, dan respons lama setelah sesi baru dimulai.

### Interaksi browser yang benar-benar dicoba

| Kontrol atau skenario | Bukti |
| --- | --- |
| Normal | Hasil normal, waveform, penafian, dan tanda bahaya tampil |
| Risiko | Hasil risiko dan CTA rekomendasi tampil; CTA menuju `/recommendation` |
| Model berbeda | Badge, penjelasan, dan Rekam Ulang tampil; tombol menuju panduan |
| Enam error audio | Masing-masing alasan lokal tampil, tanpa hasil normal/risiko; Rekam Ulang menuju layar rekam |
| Offline, timeout, server | Pesan sesuai dan Coba Lagi tampil; retry kembali ke proses lalu error yang dipilih |
| Batalkan saat proses | Konfirmasi tampil; persetujuan pembatalan menuju panduan |
| Lanjutkan Analisis | Konfirmasi ditutup dan proses menghasilkan hasil normal |
| Accordion | Klik buka/tutup dan Enter pada fokus keyboard menampilkan detail; outline fokus solid teramati |
| Beranda | Tombol hasil kembali ke dashboard placeholder |
| Riwayat | Tombol hasil menuju `/history`, tab Riwayat aktif |
| Tanpa hasil setelah reload | Empty state dengan Buka Panduan Rekaman tampil |
| Panduan tanpa izin | Rationale dan Izinkan Mikrofon tampil; tidak membuka rekaman otomatis |

Pemeriksaan browser memakai tema gelap, lebar 320 dan 390. Waveform awalnya tidak terlihat karena className pada Reanimated View belum terhubung ke NativeWind. Perbaikan memisahkan View untuk layout/warna dan Animated.View untuk transform; screenshot akhir memperlihatkan bar. Uji ini tidak membuktikan performa frame pada perangkat Android.

Restart dependency/Fast Refresh pada Metro development sempat menghasilkan context lama dan pemulihan hidrasi. Halaman dimuat ulang setelah restart untuk pengujian interaksi. Build dan smoke produksi lulus. React Native DevTools menggunakan fallback karena direktori cache di luar workspace tidak dapat ditulis; ini tidak menghalangi Metro atau build.

Bukti gambar: [risiko 320](./sprint-2-risk-320.png), [model berbeda 320](./sprint-2-disagreement-320.png), [normal 390](./sprint-2-normal-390.png). Seluruhnya adalah simulasi berlabel.

## Keputusan desain

Design Read: alur skrining untuk orang tua, bahasa visual medis tenang dari design.md, ENERGY 1 / RHYTHM 2 / MOTION 2.

| Keputusan | Alasan |
| --- | --- |
| Biru untuk panduan dan tindakan | Mempertahankan identitas PNEUMOTrack dan hierarki aksi |
| Pink pada indikasi risiko dan tanda bahaya | Memisahkan kebutuhan perhatian dengan teks yang selalu menyertai warna |
| Huruf sistem dan timer tabular | Mendukung skala teks perangkat dan menjaga posisi angka saat merekam |
| Satu kolom, gutter 20, kelompok berjarak 12/24 | Memudahkan pembacaan satu tangan dan membedakan tindakan dari penjelasan |
| Diagram anak, jarak, ponsel | Menjelaskan posisi mikrofon tanpa menciptakan foto anak atau logo baru |
| Kartu untuk informasi terkait, petunjuk berupa teks | Mengelompokkan isi yang perlu dibaca bersama tanpa menjadikan semua bagian kartu |
| Waveform dari metering atau respons | Menunjukkan suara yang diterima; tidak mengarang tanda vital |
| Transform waveform 100 ms, UI thread | Meredam perubahan sampel tanpa animasi layout setiap frame |
| Pulse logo dua siklus, total 3,6 detik | Memberi tanda proses aktif lalu berhenti; tidak ada loop tanpa akhir |
| AccessibilityInfo untuk reduce motion | Menonaktifkan pulse dan interpolasi waveform sesuai preferensi perangkat |
| Tema mengikuti sistem | Mengikuti automatic theme yang ditentukan desain proyek; tidak menambah pengaturan produk baru |

## Delivery Gate antislop

Gate berikut membedakan bukti implementasi/browser dari checkpoint perangkat. Status yang belum diuji tidak dinyatakan PASS. Sign-off seluruh gate masih menunggu CP2.

- R-02 PASS: pemindaian kode dan copy Sprint 2 tidak menemukan em dash.
- R-03 PASS untuk browser yang diperiksa: panduan dan hasil 320/390 tidak meluber; ukurannya diperiksa lewat DOM dan screenshot. Teks besar/native masih checkpoint.
- R-17/R-18/R-36/R-38 PASS: tidak ada angka klinis, testimonial, atau klaim keamanan/performa yang dikarang; semua respons sintetis berlabel simulasi.
- R-23 PASS: diagram posisi merupakan implementasi petunjuk yang diminta task; logo memakai aset proyek; tidak membuat foto atau profil realistis.
- R-24/R-26 PASS untuk kontrol yang diperiksa: route target tersedia, simulasi/retry/rekam ulang/konfirmasi/CTA berfungsi; izin, mikrofon, dan playback native masih checkpoint.
- R-25 PASS pada pasangan warna yang digunakan ulang: enam pasangan baru dihitung, nilai terendah 4,79:1; ikon/status bermakna memakai warna teks yang sama.
- R-27 PASS implementasi: loading, belum ada rekaman/hasil, profil kosong, error profil, error audio, dan error jaringan memiliki tampilan dan tindakan.
- R-28 PASS: tidak menambahkan FAQ.
- R-32 PASS pada kontrol hasil yang dicoba: Tab menghasilkan fokus accordion dengan outline solid, Enter membuka detail. Audit keyboard/screen reader menyeluruh masih checkpoint.
- R-33 PASS: fitur ditulis melalui source patch; formatter hanya merapikan source.
- R-34 PENDING: kedua tema tersedia dan kontras dihitung, tetapi inspeksi visual/interaksi tema terang belum dilakukan.
- R-35 PENDING: tiga bundle dan simulasi browser dijalankan, tetapi rekam/pause/resume/playback/native permission serta backend Android nyata wajib diuji reviewer.
- R-37 PASS: arah desain dan dials ditetapkan sebelum edit, mengikuti brief proyek.
- R-39 PASS implementasi: tombol berlabel, target min 48/44, disabled state, fokus web bawaan, motion terbatas dan reduce-motion tersedia; verifikasi perangkat tetap CP2.
- R-40 PASS pada source: logo memiliki dimensi 140x140, tidak menambahkan media atau script pihak ketiga, dan tidak mengklaim angka performa.
- Purpose Gate PASS: alasan warna, simbol, huruf, spacing, kartu, dan gerak tertulis; tidak menambahkan gradient, glow, glass, pola latar, badge pemasaran, atau dekorasi tanpa tujuan.
- Liveliness PASS untuk layar yang diperiksa: dials eksplisit, satu keputusan utama per layar, motif jarak ponsel/waveform, dan aksen risiko mengikuti konten.
- C-1/C-3/C-5 dan Quality Locks PASS implementasi: keputusan diturunkan dari tugas/desain, copy khusus tindakan, konten sesuai alur, token/radius konsisten, dan simulasi diberi label.
- C-2/C-4 PENDING untuk sign-off perangkat: interaksi browser yang disebutkan lulus; mikrofon, pemutaran, background, tema terang, dan font besar membutuhkan pengujian berikut.

## CP2 untuk Human Reviewer

1. Hubungkan state anak aktif Member C ke `ScreeningProvider`. Coba loading, error+retry, empty, dan anak yang dipilih. Pastikan ID anak asli UUID dan bukan profil pratinjau.
2. Pakai development build/Expo Go yang sesuai SDK 58 pada Android fisik. Pilih `EXPO_PUBLIC_USE_MOCK_API=false` dan `EXPO_PUBLIC_API_URL=http://<IP_LAN_BACKEND>:8000`, lalu restart Metro. Jangan memakai 10.0.2.2 pada HP fisik.
3. Coba izin ditolak, ditolak permanen, buka Pengaturan, kembali ke aplikasi, dan izin diberikan. Cek kebisingan harus berhenti setelah tiga detik dan melepaskan mikrofon sebelum perekaman utama.
4. Rekam di bawah tiga detik, rekam valid, jeda/lanjut, batas 30 detik termasuk beberapa jeda, dan pindah background. Coba playback sebelum upload, rekam ulang, back, serta batal. Periksa penghapusan file cache setelah selesai/batal.
5. Kirim batuk asli, hening, bicara tanpa batuk, dan suara ramai ke backend. Cocokkan enam kode audio dengan kontrak; hasil tidak boleh muncul pada 422.
6. Mode Pesawat saat Analisis Batuk, kembali online, lalu Coba Lagi. Pastikan URI yang sama dipakai dan file dihapus setelah sukses. Coba timeout/server mati serta pembatalan ketika request masih berjalan.
7. Periksa light/dark, font besar, TalkBack, safe area, fokus, dan gerak pada Android yang lebih lambat. Tidak ada uji mikrofon, kalibrasi kebisingan, APK, EAS, atau validasi klinis yang diklaim dalam pekerjaan ini.

## Acuan SDK

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) dan [indeks Expo](https://docs.expo.dev/llms.txt).
- [Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/), [FileSystem SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/), dan [Stack SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/stack/).
- [React Native AppState](https://reactnative.dev/docs/appstate), [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo), dan [Reanimated 4](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/).

Deklarasi tipe dan implementasi paket terpasang juga diperiksa, termasuk limit native ketika resume, izin web, pembersihan recorder, serta bentuk `usePreventRemove` SDK 58 yang menyediakan `disablePrevention`.
