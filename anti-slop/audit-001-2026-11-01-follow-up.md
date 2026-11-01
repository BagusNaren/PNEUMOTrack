# Tindak lanjut audit 001

Pembaruan berikutnya: instalasi tanpa sesi diarahkan ke Login, sesi tersimpan tetap menuju Beranda, dan fallback akun demo palsu dihapus. Perubahan autentikasi ini tidak menjalani pengujian atau build ulang atas permintaan pengguna. Bukti dan gate di bawah berlaku untuk perbaikan UI sebelum pembaruan autentikasi tersebut.

Tanggal: 1 November 2026. Mode pengerjaan: antislop during, sesuai instruksi sesi. Semua temuan 1 sampai 17 telah ditangani. Pengujian dimulai setelah implementasi, lalu diulang untuk koreksi yang ditemukan saat pengujian.

## Hasil per temuan

| # | Perbaikan |
|---|---|
| 1 | Warna semantik menggunakan CSS variable NativeWind v4 melalui `ThemeRoot`. `palette.json` menjadi sumber bersama untuk kelas Tailwind dan properti warna native. Kelas lama, termasuk alias `dark:`, tetap kompatibel. Kontras teks, tepi input, dan keadaan tombol ditekan memiliki tes regresi. |
| 2 | Angka vital, grafik statis, jarak buatan, tanggal cadangan, waktu baca, penilaian cadangan, serta nama pengguna cadangan dihapus. Tanggal dan durasi berasal dari data; nilai yang hilang diberi keterangan. |
| 3 | Tampilan metrik teknis di Detail Skrining dan ResultView dihapus. Field respons/backend tetap ada. Collapsible hanya dipertahankan untuk galeri pengembangan. |
| 4 | Avatar anak memakai inisial, termasuk di formulir tambah anak. Foto anak bersama dan badge kamera tanpa fungsi dihapus. |
| 5 | Lonceng salah tujuan, bookmark, pencarian dekoratif, dan menu tiga titik tanpa fungsi dihapus. |
| 6 | Aksi utama, pilih anak, tambah/hapus anak, filter, dan aksi daftar memiliki area minimal 48 px. Tombol kembali tetap 44 px. Tombol tambah anak hanya satu. |
| 7 | Klaim Live Monitoring, Match, aktivitas 24 jam, dan gelombang real-time dari data lama dihapus. Monitoring menampilkan gelombang rekaman terakhir. |
| 8 | Emoji antarmuka diganti ikon SF Symbols/Material melalui komponen Icon atau dihapus. Tab Riwayat memakai ikon riwayat. Avatar dokter memakai foto dari data atau inisial. |
| 9 | Status Beranda hanya satu. Bahasa dan tanggal disamakan ke Indonesia. Ringkasan simulasi menjadi dua kalimat. Disclaimer dan tanda bahaya digabung dalam satu komponen. Ringkasan asli dari backend tetap ditampilkan apa adanya. |
| 10 | Beranda menampilkan pemilih anak, hasil terakhir, tanggal/durasi, aksi utama, lalu artikel. Kartu vital buatan dihapus. |
| 11 | Artikel, riwayat, dan layar pendukung memiliki keadaan memuat, kosong, dan gagal dengan aksi pemulihan. Kegagalan service tidak lagi disamarkan sebagai hasil kosong. |
| 12 | Tab menampilkan label Beranda, Riwayat, Anak, dan Menu. |
| 13 | Merah dipakai untuk hasil risiko dan tindakan terkait. Gelombang, ringkasan, dan pilihan layanan memakai permukaan netral/biru. |
| 14 | Titik dekoratif di nama anak dan status berulang dihapus. Badge Aktif hanya menunjukkan anak yang dipilih. |
| 15 | HeartGauge menggunakan token tema. ThemedText yang tidak dipakai dihapus. Permukaan dan teks memakai token semantik. |
| 16 | Copy layar yang dirapikan dipusatkan di `src/constants/copy.ts`; tanggal/durasi memakai formatter bersama. |
| 17 | Monitoring dipertahankan sesuai F9 PRD, tersedia dari Menu, dan difokuskan pada rekaman terakhir. Parameter `source=monitoring` tetap dipakai saat menuju panduan. |

Keputusan implementasi: opsi A untuk token warna dan avatar inisial; fungsi Monitoring dipertahankan. Perubahan ini dicatat di `design.md` sebagai pengganti instruksi lama tentang foto profil bersama dan tab tanpa label.

## Koreksi terkait yang ditemukan selama pengerjaan

- Peta dekoratif dengan posisi fasilitas statis diganti daftar fasilitas yang membuka koordinat sebenarnya melalui aplikasi peta. Peta tertanam belum diimplementasikan. Jika izin lokasi ditolak, layar menjelaskan area cadangan Denpasar dan tidak mengklaim jarak dari pengguna.
- Percakapan memakai service, bukan pesan lokal dan balasan dokter karangan di layar. Pemetaan pesan disesuaikan dengan kolom `body` pada migrasi database. Tidak ada balasan dokter otomatis. Data mock diberi label simulasi.
- Konfirmasi hapus profil menyebut bahwa riwayat ikut terhapus, sesuai foreign key `on delete cascade` yang sudah ada. Skema database tidak diubah.
- Provider anak menangani permintaan usang dan memisahkan pilihan tersimpan per akun tanpa memasang ulang navigator. Sesi skrining dibersihkan saat anak berganti.
- Pengujian perubahan ukuran teks menemukan timer splash yang memanggil router global saat navigator belum tersedia. Source map menunjuk `src/app/index.tsx`. Splash sekarang memakai router dari hook dan timer hanya berjalan saat layar fokus, dengan pembatalan saat kehilangan fokus.

## Verifikasi

| Pemeriksaan | Hasil dan bukti |
|---|---|
| Lint | PASS: `bunx expo lint`, tanpa error/peringatan lint. |
| Typecheck | PASS: `bunx tsc --noEmit`. |
| Tes regresi | PASS: 50 tes pada 6 file. Mencakup API/audio, penyimpanan/pembatalan, kontrak respons, konfigurasi, token warna/keadaan ditekan, dan pemetaan chat. |
| Kontras | PASS: 88 pasangan teks, 8 pasangan tepi input, dan 40 pasangan label saat ditekan. Minimum teks pada permukaan aplikasi: terang 4,97:1, gelap 5,61:1. Checker antislop juga memverifikasi pasangan muted/risk, brand/brand-dark, dan risk/risk-dark. |
| Export web | PASS: export produksi SDK 58 sesudah perubahan terakhir. |
| Browser | PASS: tidak ada overflow horizontal pada lebar 390, 820, 1280 px. Konten dibatasi 800 px. Kontrol Beranda yang diukur minimal 48 px. Tab dapat diaktifkan lewat keyboard, Menu ditutup dengan Escape, fokus tema gelap terlihat, validasi formulir kosong dan filter artikel bekerja. Tidak ada console error pada alur tersebut. |
| Android release | PASS: build dan pemasangan pada emulator uji terpisah API 36. Build akhir khusus x86_64 dan memakai `-Mock`, sehingga bukan APK distribusi ponsel. |
| Navigasi Android | PASS: Beranda, Riwayat, detail normal/risiko, rekomendasi, daftar/detail dokter, chat mock, pergantian anak melalui Profil dan pemilih Beranda, Menu/tutup, Monitoring/panduan, formulir profil, serta daftar/peta fasilitas. Pesan sintetis berhasil masuk ke service mock; tidak dikirim ke dokter. |
| Keadaan khusus Android | PASS: izin lokasi ditolak menampilkan penjelasan cadangan; nama profil kosong memunculkan validasi; kontrol formulir dapat dijangkau dengan teks sistem 200%. |
| Regresi splash | PASS: enam cold launch pada skala teks 100%/200%, ditambah perubahan skala saat aplikasi aktif. Log AndroidRuntime/ReactNativeJS setelah rangkaian akhir tidak berisi error. |

Bukti lokal: `.expo/audit-001-testing/` (diabaikan Git), termasuk `tests-final.log`, `build-final.log`, `web-build-final.log`, `runtime-final.log`, XML, dan screenshot. Emulator lama tidak dihapus; emulator uji baru disimpan di folder tersebut. Perangkat fisik tidak dipakai untuk pengujian.

Batas verifikasi: tidak menguji prediksi dari batuk asli, pengiriman chat ke backend aktif, pembuatan akun nyata, panggilan dokter/119, atau runtime iOS. Tes chat memakai stub database dan UI chat memakai mock. Pemeriksaan ini bukan validasi klinis maupun klaim kepatuhan aksesibilitas menyeluruh.

## Delivery Gate antislop

Gate berikut berlaku pada perubahan audit ini dan alur yang diuji, dengan batas verifikasi di atas.

- R-02 PASS: copy baru tidak memakai em dash; komentar template pada file yang disentuh dibersihkan.
- R-03 PASS: ukuran ponsel/tablet/desktop diperiksa; target aksi diperbesar dan teks 200% tetap dapat dijangkau.
- R-17 PASS: angka buatan di layar dihapus; nilai berasal dari data atau diberi label simulasi.
- R-18 PASS: tidak menambahkan testimoni atau identitas pengguna cadangan.
- R-23 PASS: tidak membuat aset baru; avatar menggunakan placeholder inisial dan foto hanya dari data.
- R-24 PASS: tab dan pilihan Menu menuju route yang tersedia.
- R-25 PASS: perhitungan kontras tersimpan dalam tes; fokus web menggunakan warna ink sesuai tema.
- R-26 PASS: kontrol dekoratif dihapus; aksi navigasi, filter, form, dan pesan mock diperiksa. Panggilan nyata dikecualikan dari eksekusi.
- R-27 PASS: loading, empty, error, dan retry dirender terpisah; kegagalan tidak dinyatakan sebagai hasil normal.
- R-28 PASS: tidak menambahkan FAQ.
- R-32 PASS: navigasi keyboard, fokus terlihat, dan Escape pada Menu diperiksa di browser.
- R-33 PASS: fitur ditulis di source melalui patch; formatter hanya merapikan format.
- R-34 PASS: tema terang dan gelap diperiksa pada APK; kedua palet memiliki tes kontras.
- R-35 PASS: build produksi web dan Android serta walkthrough tersimpan; enam cold launch akhir tanpa error.
- R-36 PASS: klaim pemantauan langsung, penilaian cadangan, dan akun terverifikasi tanpa dasar dihapus.
- R-37 PASS: mengikuti arah medis tenang `design.md`, ENERGY 1 / RHYTHM 2 / MOTION 1; keputusan avatar dan navigasi dicatat.
- R-38 PASS: angka dan konten palsu di layar dihapus; data contoh dari service diberi label simulasi.
- R-39 PASS: aksi yang diperbaiki memakai nama aksesibel, label, dan keadaan disabled/loading; animasi baru tidak ditambahkan.
- R-40 PASS: avatar memiliki dimensi tetap; tidak menambahkan media hero, font eksternal baru, atau klaim performa.
- R-01 PASS: biru mendukung informasi dan aksi; merah menandai risiko. Tidak menambahkan gradient/glow.
- R-04 PASS: ikon platform dipilih berdasarkan fungsi, termasuk riwayat, dokter, fasilitas, dan telepon.
- R-06 PASS: font sistem dipertahankan agar sesuai platform dan mendukung pembesaran teks.
- R-07 PASS: tidak menambahkan pola latar.
- R-08 PASS: tidak menambahkan panah dekoratif pada CTA.
- R-09 PASS: Live Monitoring dan Match dihapus; Aktif menunjukkan pilihan anak sebenarnya.
- R-10 PASS: tidak menambahkan glassmorphism.
- R-12 PASS: daftar dan CTA utama tidak memakai bayangan besar; susunan memakai alur layout biasa.
- R-13 PASS: tidak menambahkan glow.
- R-14 PASS: satu kartu hasil utama diikuti daftar artikel; daftar rekaman dan layanan memakai struktur sesuai konten.
- R-19 PASS: tidak menambahkan animasi otomatis; umpan balik tekan dipertahankan dengan kontras teruji.
- R-22 PASS: ilustrasi generik dan foto profil bersama dihapus dari alur yang dirapikan.
- Liveliness PASS: hasil terakhir menjadi fokus Beranda; jarak memisahkan pemilih, status, dan artikel. Jantung yang sudah ada menjadi motif PNEUMOTrack, dengan aksen biru dan sinyal risiko merah.
- C-1 PASS: pilihan visual mendukung status, keterbacaan, atau tindakan berikutnya.
- C-2 PASS: kontrol tanpa fungsi dihapus; tujuan dan aksi yang tersisa diperiksa sesuai lingkup pengujian.
- C-3 PASS: grafik vital dan bagian pengisi dihapus; Monitoring memiliki tugas berbeda dari Beranda.
- C-4 PASS: keadaan data, kedua tema, teks besar, dan perubahan konfigurasi perangkat diuji.
- C-5 PASS: klaim yang tidak bersumber dihapus; mock ditandai jelas.
- R-05 PASS: Beranda mengikuti urutan keputusan orang tua; tidak menambahkan template hero/grid/statistik.
- R-11 PASS: kartu memakai radius card, avatar bulat, input membulat, dan CTA pill sesuai desain yang ada.
- R-15 PASS: aksi menyebut tugas, seperti Rekam Batuk, Lihat Rekomendasi, Simpan, dan Pilih sebagai Anak Aktif.
- R-16 PASS: tidak menambahkan jargon promosi; ringkasan teknis yang tidak membantu orang tua dihapus.
- R-20 PASS: identitas mengikuti skrining batuk anak, hasil terakhir, dan motif jantung yang sudah ada.
- R-21 PASS: tema mengikuti perangkat; tidak memaksakan mode gelap.
- R-29 PASS: palet mengikuti biru/teal, netral, serta merah untuk risiko/tindakan destruktif.
- R-30 PASS: tidak mengadopsi template atau tampilan produk lain.
- R-31 PASS: setiap bagian memiliki fungsi; titik status dekoratif dan aksi ganda dihapus.

Referensi implementasi: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Symbols SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/symbols/), [Router SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/), [NativeWind v4 themes](https://www.nativewind.dev/docs/guides/themes). API juga diperiksa pada paket yang terpasang.
