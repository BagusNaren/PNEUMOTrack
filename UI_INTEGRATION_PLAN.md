# Rencana Integrasi UI Baru dengan Aplikasi Saat Ini

Tanggal revisi: 14 November 2026  
Baseline kode: `9167609`  
Status: integrasi diimplementasikan; hasil pemeriksaan dicatat di `docs/ui-integration-verification.md`.  
Antislop: during, pilihan sesi pengguna.

## 1. Tujuan dan batas pekerjaan

Mengintegrasikan UI baru dari commit Rudita dengan alur aplikasi, FastAPI, dan layanan Supabase yang sudah tersedia. Hasil yang dituju adalah alur utuh: onboarding/login → pilih atau tambah anak → rekam → analisis → hasil → riwayat/dashboard/profil → rekomendasi.

UI baru sudah masuk ke `main` melalui fast-forward. Pekerjaan berikutnya bukan merge ulang atau menulis ulang seluruh screen, melainkan menyelesaikan sambungan data, navigasi, state, dan verifikasi perangkat.

Keputusan selama hacking day mungkin tidak seluruhnya tercatat. Karena itu, kode dan perilaku aplikasi saat ini menjadi acuan utama. Perbedaan terhadap PRD atau catatan desain lama tidak otomatis dianggap sebagai bug atau alasan mengubah arsitektur.

Fokus pekerjaan: menghubungkan tombol, route, parameter, data, dan state UI baru ke fungsi yang sudah ada. Mulai dari menjalankan aplikasi, telusuri alurnya, lalu ubah bagian yang terbukti belum tersambung. Jika suatu alur sudah bekerja, tandai terverifikasi dan lanjutkan; checklist bukan perintah menulis ulang implementasi.

Pengujian demo dan layanan nyata dicatat terpisah sesuai konfigurasi yang benar-benar dipakai. Dokumen ini tidak menganggap backend aktif atau koneksi Supabase sudah teruji.

Referensi:

- Kode baseline dan hasil runtime: acuan utama untuk arsitektur, sumber data, kontrak, dan perilaku yang dipertahankan.
- `design.md`: referensi visual tambahan; cocokkan dengan UI terbaru karena memiliki catatan lama yang berbeda.
- `4fba12e`: onboarding, profil, dashboard, tab ikon, Lucide, dan chat composer.
- `b96fc70`: tren dan ringkasan riwayat skrining.
- `9167609`: edit profil, audio demo di hasil/riwayat, serta penyesuaian alur login.
- `src/types/screening.ts`, `src/services/api/`, serta backend yang dipakai saat pengujian: acuan kontrak aktual. Cocokkan implementasi client dan backend bila berbeda.
- `PRD.md` dan dokumen layanan: konteks tambahan, bukan daftar kewajiban migrasi agar aplikasi kembali ke rancangan lama.

## 2. Kondisi yang sudah diperiksa

| Area | Kondisi pada baseline | Implikasi integrasi |
| --- | --- | --- |
| Dashboard dan profil | Memakai `useActiveChild`, `useResource`, dan `screeningsService.latest` | Sambungan layanan sudah ada; uji kesamaan anak/hasil dan pembaruan setelah penyimpanan |
| Riwayat | `src/app/history/index.tsx` mengambil `listByChild`; tab riwayat mengekspor screen tersebut | Pertahankan satu implementasi; uji akses dari tab dan stack |
| Refresh data | `useResource` memuat ulang saat screen mendapat fokus dan menolak respons permintaan lama | Verifikasi perilaku yang ada sebelum menambah mekanisme refresh baru |
| Profil orang tua | `use-profile.tsx` menyimpan nama, telepon, kota, dan URI foto di AsyncStorage per user | Pertahankan perilaku lokal; samakan data di profil dan header dashboard |
| Skema profil | Tabel `profiles` memiliki `id`, `full_name`, `created_at` dan kebijakan akses pemilik | Tidak perlu memperluas skema atau memindahkan profil lokal untuk menyelesaikan integrasi UI |
| Audio hasil/riwayat | Result demo memakai `DEMO_COUGH_AUDIO`; detail riwayat memasang player saat `useMockData` aktif | Player ini bukan bukti penyimpanan rekaman asli |
| Siklus audio asli | `screening-session.ts` membersihkan audio setelah prediksi; service skrining menyimpan hasil dan waveform | Pertahankan lifecycle file saat ini; playback historis asli merupakan fitur terpisah |
| Auth | `use-session.ts` mendukung Supabase serta sesi demo dengan kondisi konfigurasi tertentu | Uji konfigurasi demo dan nyata secara terpisah; jangan menganggap mock data berarti semua auth dimock |
| Navigasi | Entry mengarah ke onboarding jika belum login; tab baru Home, History, Profile, Menu | Periksa akses langsung ke route privat, logout/back, dan child management dari profil/menu |
| Tema | Default provider sekarang light, tetapi preferensi system/dark tersimpan masih dapat dimuat | Ikuti provider dan preferensi sekarang; jangan memaksakan light-only dari dokumen lama |
| Desain sumber | `design.md` menyebut halaman FigCraft `UI Kit · FIX PNM`, 32 frame | MCP/desain asli belum berhasil dibaca dalam sesi ini; kesesuaian visual belum terverifikasi |

### Hasil pemeriksaan awal

Perintah dijalankan sebelum penulisan rencana, setelah pull:

- `bun run lint`: gagal dengan dua unresolved imports, `expo-image-picker` dan `lucide-react-native`.
- `bun run typecheck`: gagal dengan dua modul yang sama serta tiga penolakan route `/profile/edit` pada dashboard/profil.
- `package.json` sudah mencantumkan kedua dependensi. Lingkungan lokal perlu disinkronkan ke lockfile sebelum menyimpulkan ada kesalahan dependensi di commit.
- Route `src/app/profile/edit.tsx` ada. Tipe route yang belum diperbarui adalah kemungkinan penyebab error route, belum kesimpulan yang teruji.

## 3. Baseline perilaku dan batas perubahan

Reading this as: aplikasi skrining untuk orang tua, dengan bahasa visual medis biru/teal yang tenang, ENERGY 1 / RHYTHM 1 / MOTION 1.

Pertahankan susunan UI terbaru sebagai baseline integrasi: tab Home/History/Profile/Menu, profil baru, kartu status dengan detail audio, dan grafik riwayat. Gunakan `src/constants/palette.json`, `theme.ts`, dan `copy.ts` untuk konsistensi. Warna risiko selalu disertai teks dan ikon; aksi rekam atau rekomendasi menjadi fokus sesuai konteks hasil.

Perilaku berikut dipertahankan sebagai baseline integrasi. Tidak perlu membuka ulang keputusan hacking day hanya untuk mulai menyambungkan UI.

| Bagian | Baseline yang dipakai | Pekerjaan integrasi |
| --- | --- | --- |
| Acuan visual | Struktur screen dan komponen dari commit UI terbaru | Akses FigCraft bukan prasyarat perbaikan tombol, route, data, dan state |
| Tema | Provider sekarang dengan default light dan preferensi tersimpan | Perbaiki keterbacaan screen yang tersentuh tanpa menghapus preferensi |
| Profil | Nama, telepon, kota, dan foto lokal per user | Pastikan edit, simpan, restart, dan header dashboard konsisten |
| Audio riwayat | Sampel bawaan hanya pada jalur demo/mock yang ada | Pertahankan label demo dan jangan menyajikan sampel sebagai rekaman asli |
| Onboarding | Pengguna tanpa sesi diarahkan ke onboarding | Verifikasi Next/skip/login dan Back, tanpa menambah kebijakan first-launch baru |
| Pergantian anak | `use-screening.ts` membersihkan sesi ketika ID anak terpilih berubah | Uji reset/pembatalan yang sudah ada; jangan menggantinya dengan sesi lintas anak |
| Provider dan service | Bridge skrining serta layanan domain sudah terpasang di aplikasi | Perbaiki adapter atau pemanggil yang bermasalah, tanpa mengganti seluruh layer data |

Di luar scope: profil cloud/lintas perangkat, migration field profil baru, storage foto cloud, retensi dan playback audio historis asli, fitur lampiran/voice message, perubahan model, dan desain ulang arsitektur. Pisahkan sebagai pekerjaan lanjutan jika diminta.

Jika perilaku ambigu, cari pemanggil, tes yang tersedia, riwayat commit, dan hasil runtime terlebih dahulu. Tanyakan hanya jika perbaikan mengharuskan perubahan keputusan produk yang tidak dapat dipastikan dari aplikasi. Pertahankan label simulasi, bahasa risiko, disclaimer, serta perlindungan data yang sudah ada selama integrasi.

## 4. Tahapan implementasi

### Tahap 0: Pulihkan baseline pengembangan (P0)

File: `package.json`, `bun.lock`, `app.json`, `tsconfig.json`, dan konfigurasi Expo yang relevan.

- [ ] Sinkronkan paket sesuai lockfile dengan `bun install --frozen-lockfile`.
- [ ] Jalankan aplikasi dengan konfigurasi yang selama ini dipakai. Catat mode API/data dan status layanan tanpa token atau data pribadi; jangan mengganti mode hanya supaya sebuah screen tampak berhasil.
- [ ] Baca ulang major Expo dari `package.json` sebelum menyentuh API; baseline sekarang SDK 58.
- [ ] Gunakan dokumentasi versi `https://docs.expo.dev/versions/v58.0.0/` dan indeks `https://docs.expo.dev/llms.txt` untuk Router, audio, pemilih foto, filesystem, lokasi, dan map sesuai kebutuhan perubahan.
- [ ] Regenerasi tipe route melalui alur Expo Router yang didokumentasikan, lalu periksa `/profile/edit` dan `/(tabs)/profile`. Hindari menutupi error dengan cast `Href` tanpa memvalidasi route.
- [ ] Jika perlu menambah/memperbaiki paket native, gunakan `bunx expo install <package>` agar sesuai SDK. Jangan mengubah native directory hasil generate dengan tangan.
- [ ] Jalankan `bun run lint`, `bun run typecheck`, dan `bunx expo-doctor`; catat masalah nyata yang tersisa setelah sinkronisasi.

Selesai bila: impor paket terselesaikan, route baru dikenali, lint/typecheck lolos, dan temuan Doctor ditangani sebelum build.

### Tahap 1: Telusuri sambungan sesi dan navigasi UI baru (P0)

File: `src/app/index.tsx`, `src/app/_layout.tsx`, `src/app/(auth)/*`, `src/app/(tabs)/_layout.tsx`, `src/app/onboarding.tsx`, `src/hooks/use-session.ts`, `src/constants/config.ts`.

- [ ] Petakan mode `useMockApi` dan `useMockData` secara eksplisit untuk build demo dan build nyata. Jangan memasukkan token demo ke permintaan Supabase nyata.
- [ ] Uji cold start, pemulihan sesi, login salah, signup yang menunggu konfirmasi email, sesi kedaluwarsa, dan offline.
- [ ] Periksa perlindungan seluruh route privat, termasuk deep link langsung ke profil/edit, riwayat, dan skrining; entry redirect saja belum menjadi bukti perlindungan route lain.
- [ ] Uji logout lalu tombol Back Android agar data privat tidak terlihat kembali. Reset state yang terikat user ketika akun berubah, termasuk anak aktif dan hasil skrining.
- [ ] Pastikan profil, child management, monitoring, dan menu tetap dapat dicapai; uji penutupan menu serta tab terpilih.
- [ ] Pastikan focused flow skrining dan edit profil memakai navigasi kembali yang masuk akal tanpa tab ganda.
- [ ] Buat daftar tombol/route UI baru dengan status tersambung, rusak, atau memang belum tersedia. Perbaiki masalah yang dapat direproduksi; jangan merombak auth hanya karena dokumen lama berbeda.

Selesai bila: pengguna demo dan nyata mendapat alur yang sesuai; akses tanpa sesi dan perpindahan akun tidak menampilkan data akun sebelumnya.

### Tahap 2: Sambungkan alur skrining ke UI baru (P0)

File: `src/hooks/use-active-child.tsx`, `src/hooks/use-screening.ts`, `src/hooks/use-recorder.ts`, `src/services/api/screening-session.ts`, `src/services/api/screening.ts`, `src/services/screenings/index.ts`, `src/app/screening/*`, `src/app/recommendation.tsx`.

- [ ] Pertahankan satu sesi skrining melalui provider/bridge yang ada. Uji identitas anak yang diteruskan saat analisis dan reset sesi ketika anak berubah, mengikuti perilaku `use-screening.ts` sekarang.
- [ ] Cocokkan data UI dengan response yang benar-benar diterima dan validator di `src/types/screening.ts`: result, agreement, waveform, summary, duration, chunks, serta model version. Periksa implementasi backend bila berbeda, tanpa migrasi kontrak hanya berdasarkan PRD.
- [ ] Verifikasi jalur hasil langsung dan hasil tersimpan lewat `screeningId`. Rekomendasi dari dashboard/riwayat harus memakai hasil yang dipilih, bukan hasil sesi lain.
- [ ] Bedakan prediksi berhasil dari penyimpanan riwayat berhasil. Tampilkan saving/save_failed dan retry; hasil tidak hilang ketika Supabase gagal.
- [ ] Uji retry penyimpanan dan tap berulang agar tidak menggandakan record; audit perilaku yang sudah ada sebelum mengubah service.
- [ ] Pertahankan pembatalan, pembersihan audio sementara, dan penolakan respons yang terlambat. Jangan menambah playback asli dengan menahan file sementara tanpa kebijakan retensi.
- [ ] Sediakan jalur pemulihan untuk izin mic ditolak, rekaman terlalu pendek, senyap, bising, tidak ada batuk, format/ukuran ditolak, offline, timeout, dan kegagalan backend.
- [ ] Tampilkan disclaimer dan tanda bahaya pada hasil/rekomendasi. Gunakan istilah risiko; angka voting atau jumlah segmen tidak boleh menjadi klaim akurasi klinis.

Selesai bila: rekaman baru menghasilkan tampilan yang sesuai, tersimpan untuk anak yang benar, dan rekomendasi membawa konteks hasil yang sama pada mode nyata maupun demo.

### Tahap 3: Samakan dashboard, profil, monitoring, dan riwayat (P1)

File: `src/app/(tabs)/index.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/(tabs)/monitoring.tsx`, `src/app/history/index.tsx`, `src/app/history/[id].tsx`, `src/components/ui/trend-chart.tsx`, `src/hooks/use-resource.ts`.

- [ ] Verifikasi pemuatan ulang saat fokus yang sudah ada: setelah save, keempat tampilan harus memakai hasil terbaru tanpa restart aplikasi.
- [ ] Uji save yang baru selesai setelah screen kembali mendapat fokus; bila hasil tertinggal, tambahkan pemberitahuan penyimpanan selesai/reload bersama di hook atau service, bukan polling di setiap screen.
- [ ] Ganti anak ketika permintaan masih berjalan; respons anak lama tidak boleh muncul sebagai data anak baru.
- [ ] Pastikan kondisi loading/error tidak tersaji sebagai status normal atau belum pernah skrining. Bedakan gagal memuat, riwayat kosong, dan data lama saat refresh gagal.
- [ ] Hitung tren dan ringkasan dari kumpulan record yang sama; beri label batas data yang ditampilkan. Service saat ini membatasi `listByChild` ke 50 hasil secara default.
- [ ] Periksa urutan tanggal, jumlah hasil 0/1/banyak, dan data numerik yang hilang. Grafik durasi/segmen tidak boleh ditafsirkan sebagai tingkat keparahan atau perkembangan klinis.
- [ ] Pertahankan satu implementasi riwayat yang dipakai tab dan route stack; uji Back dari detail ke asalnya.

Selesai bila: anak aktif, hasil terbaru, jumlah record, dan detail hasil konsisten antar-screen, termasuk setelah retry save atau pindah akun.

### Tahap 4: Sambungkan profil lokal dan tampilan audio yang sudah ada (P1)

File: `src/hooks/use-profile.tsx`, `src/app/profile/edit.tsx`, `src/services/profile-photo.ts`, `src/components/screening/audio-playback.tsx`, dashboard, dan tab profil.

- [ ] Gunakan `useProfile` sebagai sumber profil lokal pada editor, header dashboard, dan tab profil. Jangan memindahkan sumber nama ke Supabase sebagai bagian dari tugas ini.
- [ ] Tangani kegagalan simpan tanpa memberi kesan berhasil; update lokal optimistis saat ini perlu rollback atau state error yang jelas. Uji pembacaan storage yang gagal dan pergantian akun.
- [ ] Untuk foto lokal: uji izin dibatalkan/ditolak, file sumber hilang, copy gagal, ganti/hapus foto, restart aplikasi, dan logout. Samakan foto/nama dashboard dengan profil.
- [ ] Uji simpan nama/telepon/kota dan batal edit, lalu restart aplikasi. Nilai yang tampil harus mengikuti perubahan yang benar-benar berhasil disimpan untuk user tersebut.
- [ ] Pertahankan label audio demo pada sampel bawaan. Di mode nyata, jangan mengganti rekaman yang tidak tersedia dengan sampel demo.
- [ ] Pertahankan cleanup rekaman asli setelah prediksi. UI tanpa sumber audio tersimpan tidak boleh menampilkan kontrol playback rekaman asli yang tidak berfungsi.

Selesai bila: edit profil lokal terlihat konsisten di UI, bertahan setelah restart sesuai implementasi sekarang, kegagalan terlihat, dan audio demo tidak disajikan sebagai rekaman asli.

### Tahap 5: Layanan pendukung dan pemeriksaan visual (P2)

File: `src/app/doctors/*`, `src/app/chats/*`, `src/app/hospitals/*`, `src/app/articles/*`, `src/components/ui/chat-composer.tsx`, serta service domain terkait.

- [ ] Verifikasi CTA rekomendasi menuju dokter/fasilitas yang benar. Uji daftar kosong, detail tidak ditemukan, dan permintaan gagal.
- [ ] Pastikan pesan teks memakai service chat yang ada, mencegah kirim ganda, dan menangani gagal kirim. Tombol lampiran/suara masih menampilkan informasi belum tersedia; jangan dianggap fitur selesai.
- [ ] Uji izin lokasi ditolak dan lokasi gagal tanpa memblokir daftar fasilitas. Tandai lokasi fallback agar tidak diklaim sebagai lokasi pengguna.
- [ ] Bandingkan screen dengan frame final setelah akses FigCraft/ekspor tersedia. Fokus pada hierarki, jarak, ikon, safe area, state risiko, dan posisi CTA.
- [ ] Uji lebar 320, 390, dan 430, teks diperbesar, nama panjang, serta keyboard pada login/edit profil/chat. Target sentuh minimal 48, status terbaca tanpa warna, dan ikon tab memiliki accessible name/selected state.
- [ ] Uji tema yang dapat dihasilkan provider sekarang, termasuk preferensi tersimpan. Perbaiki masalah layout/kontras yang ditemukan tanpa mengubah kebijakan tema agar mengikuti catatan lama.

Selesai bila: layanan pendukung yang termasuk scope berfungsi atau jelas ditandai belum tersedia; bukti visual disimpan per screen/state yang diuji.

## 5. Matriks verifikasi akhir

| Skenario | Bukti yang harus dicatat |
| --- | --- |
| Instalasi bersih, belum login | Onboarding/login dapat diselesaikan; akses privat ditangani |
| Login nyata dan pemulihan sesi | Data anak milik akun yang benar; restart tidak memunculkan akun demo |
| Demo offline | UI dapat didemokan sesuai konfigurasi, hasil simulasi berlabel, tanpa menulis ke Supabase nyata |
| Tidak ada anak dan tidak ada riwayat | Empty state dengan aksi tambah anak/rekam yang berfungsi |
| Hasil normal, risiko, model tidak sepakat | Data/label konsisten, disclaimer ada, konteks rekomendasi benar |
| Audio buruk dan gangguan jaringan | Tidak ada hasil palsu; tindakan rekam ulang/retry tersedia |
| Prediksi sukses, save gagal, retry | Hasil tetap terlihat; setelah sukses riwayat terbarui dan tidak duplikat |
| Berpindah anak/akun ketika loading | Tidak ada respons lama yang tampil di konteks baru |
| Profil dan foto | Simpan/batal/gagal/restart menggunakan penyimpanan lokal sekarang; dashboard dan profil sinkron |
| Audio riwayat | Sampel demo berlabel; tidak ada sampel yang diklaim sebagai rekaman asli atau player tanpa sumber |
| Navigasi APK release | Tap tab/menu, Back Android, hasil/detail/rekomendasi, dan logout direkam |

Urutan pemeriksaan:

1. `bun run lint` dan `bun run typecheck` harus lolos setelah implementasi.
2. `bunx expo-doctor` untuk kompatibilitas paket/config.
3. Jalankan tes regresi yang relevan dari test skrining, service chat, dan palette yang sudah ada; tambahkan tes hanya untuk perubahan perilaku penting seperti isolasi akun, retry save, atau urutan respons.
4. Build Android lokal menggunakan `bun run android:local -Mock` dan `bun run android:release -Mock` untuk demo. `-Mock` menghasilkan hasil simulasi.
5. Uji build tanpa `-Mock` dengan konfigurasi Supabase dan endpoint FastAPI yang sesuai. URL API release harus HTTPS menurut validator config saat ini.
6. Verifikasi tap/navigation pada APK release sebelum cloud build. Perubahan modul native memerlukan build yang sesuai; jangan mengandalkan Expo Go untuk semua paket.
7. Uji smoke iOS untuk safe area, izin mic/foto/lokasi, playback, dan navigasi sebelum menyatakan kompatibel iOS.

## 6. Urutan penyerahan dan definisi selesai

Paket perubahan yang disarankan:

1. Baseline dependensi, tipe route, dan daftar sambungan UI berdasarkan runtime.
2. Auth/navigasi serta alur skrining nyata sampai penyimpanan hasil.
3. Konsistensi dashboard/profil/riwayat/monitoring dan tren.
4. Konsistensi profil lokal dan tampilan audio yang ada, lalu sambungan layanan pendukung.
5. Verifikasi APK release, screenshot, dan catatan masalah yang masih terbuka.

Integrasi dinyatakan selesai jika UI baru dapat menjalankan fungsi aplikasi yang sudah ada, konteks user/anak/hasil konsisten, masalah integrasi yang ditemukan diperbaiki, lint/typecheck lolos, dan flow utama berhasil dicoba pada APK. Penyelesaian tidak mensyaratkan profil cloud, audio historis asli, atau perubahan arsitektur. Sertakan status pemeriksaan nyata; jangan menyatakan aplikasi atau fidelitas FigCraft lulus hanya berdasarkan pembacaan kode.

Untuk setiap perubahan, catat langkah reproduksi dan mode config tanpa rahasia, screen → hook/service/route yang bermasalah, perubahan minimum, serta hasil pengujian skenario yang sama sesudah perbaikan. Jika alur sudah bekerja, cukup catat bukti verifikasinya.

## 7. Pemeriksaan dokumen rencana

- PASS, keterlacakan: baseline dan tiga commit UI disebutkan; area pekerjaan menunjuk screen, hook, dan service yang diperiksa.
- PASS, lingkup: kode dan runtime menjadi acuan utama; profil lokal, lifecycle audio, provider, serta preferensi tema dipertahankan. PRD menjadi konteks tambahan.
- PASS, perubahan minimum: checklist meminta verifikasi dahulu; fitur cloud, audio historis asli, dan perubahan arsitektur berada di luar scope integrasi.
- PASS, keterujian: setiap tahap memiliki kriteria selesai dan matriks bukti untuk sesi demo maupun layanan nyata.
- PASS, batas klaim: kegagalan lint/typecheck awal dan keterbatasan akses FigCraft dicatat. Pemeriksaan runtime, kontras, layout, serta interaksi masih menjadi gerbang implementasi; dokumen ini tidak mengklaim UI telah lulus pemeriksaan tersebut.
