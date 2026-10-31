# Member B: Sprint 1

Tanggal: 31 Oktober 2026. Antislop `during`, dipilih pengguna untuk sesi ini.

Implementasi fondasi Sprint 1 tersedia untuk review. Sign-off visual dan perangkat tetap menunggu Human Reviewer. Sprint 2 belum dikerjakan.

## Perubahan

- Template Expo diganti entry splash dengan logo proyek dan tagline, lalu masuk ke `/(tabs)`.
- Root memakai GestureHandlerRootView, SafeAreaProvider, ThemeProvider, StatusBar, serta Stack tanpa header. `AppProviders` merupakan titik sisip SessionProvider milik Member C. ScreeningProvider baru diperlukan ketika state skrining diimplementasikan pada Sprint 2.
- Tab icon-only: Beranda, Riwayat, Profil, dan aksi Menu. Menu memakai BottomSheet universal dari `@expo/ui`; memilih tautan menutup sheet dan menuju route tujuan. Monitoring dan More terdaftar sebagai tab tersembunyi, bukan ikon tambahan.
- Seluruh skeleton route Sprint 1 dibuat karena sebelumnya belum ada. Placeholder menyatakan fitur belum tersedia; tidak menampilkan data anak, hasil skrining, atau akun fiktif.
- Token semantik, tema raw light/dark, teks Indonesia terpusat, serta komponen UI bersama tersedia. Galeri `/dev/components` menampilkan kartu, tombol, banner, badge, avatar, waveform, empty/error/loading states, accordion, penafian, tanda bahaya, dan tautan inspeksi route.
- Galeri dilindungi `__DEV__`; produksi merender Redirect ke `/` tanpa konten contoh. Respons HTML produksi tidak memuat teks galeri.
- `expo-audio ~58.0.10` dipasang dengan `bunx expo install`. Expo Doctor meminta peer `expo-asset ~58.0.19`, yang dipasang dengan cara yang sama. Plugin audio menyediakan alasan izin mikrofon bahasa Indonesia dan menonaktifkan background recording/playback. Belum ada permintaan izin runtime atau perekaman.
- `.env.example` mempertahankan kedua variabel Supabase dan menambah konfigurasi API/mock. `config.ts` menyediakan batas 3/30 detik, timeout 60 detik, batas 10 MiB, validasi URL HTTP(S), penolakan kredensial/query/fragment pada URL, dan syarat HTTPS untuk produksi. Konfigurasi URL tidak valid menghasilkan `null`, bukan koneksi diam-diam ke server lokal.

## Catatan integrasi untuk Member C

Daftar `/history` berada di `src/app/(tabs)/history.tsx`, sehingga bottom navbar tetap tampil. Detail berada di `src/app/history/[id].tsx` tanpa navbar. Pola yang sama berlaku untuk profil anak pada `src/app/(tabs)/children.tsx` dan form `src/app/children/new.tsx`.

TabTrigger memakai href yang menyertakan grup, misalnya `/(tabs)` dan `/(tabs)/history`, untuk membedakan Beranda dari root entry gate. URL publik tetap `/` dan `/history`. TabTrigger ditempatkan langsung di dalam child TabList agar parser Expo Router mengenali seluruh tab.

Skeleton Member C hanya ditulis pada Sprint 1 ini. Setelah handoff, Member B tidak boleh menimpanya. Tidak ada perubahan pada backend, Supabase, service/domain milik Member A/C, atau folder native.

Button menerima `label`, `variant`, `loading`, `disabled`, dan props Pressable; alias PrimaryButton, SecondaryButton, RiskButton tersedia. Screen menangani safe area dan scroll; pada route tab gunakan `bottomInset={false}` karena navbar sudah menambahkan inset bawah. Waveform menerima sampel ternormalisasi 0..1 melalui `samples` dan mode `static | live`; mode live hanya menggambar sampel yang diberikan, tidak membuka mikrofon.

Komponen native sheet dan accordion memakai RNHostView untuk menjembatani isi React Native ke SwiftUI/Compose. Penafian dan tanda bahaya sudah ada pada placeholder hasil/rekomendasi. Tombol 119 opsional pada DangerSignsBox; galeri menyembunyikannya agar inspeksi tidak melakukan panggilan darurat.

## Keputusan desain dan antislop

Design Read: fondasi aplikasi skrining untuk orang tua, gaya medis tenang, ENERGY 1 / RHYTHM 2 / MOTION 1.

| Keputusan | Alasan |
| --- | --- |
| Navy/biru dari design.md | Menandai informasi dan aksi skrining dengan identitas proyek. |
| Pink khusus status risiko | Memisahkan informasi yang perlu perhatian tanpa alarm dekoratif. |
| Huruf sistem, body 16, label 14 | Mendukung keterbacaan dan skala teks perangkat tanpa font tambahan. |
| Kartu 16, sheet native, tombol pill | Membedakan kelompok informasi, lapisan modal, dan aksi. |
| Gutter 20, gap dalam kelompok 12, antarbagian 24 | Menghubungkan isi yang terkait dan memisahkan tujuan inspeksi. |
| Ikon rumah, gelombang, profil, menu | Mengikuti empat tujuan navigasi yang dikunci dalam tugas. |
| Ikon inaktif memakai ink-muted | Token icon-muted asli terlalu pucat untuk ikon navigasi yang bermakna; ink-muted meningkatkan kontras. Token aslinya tetap tersedia. |
| Garis pendek pada tab aktif dan bobot ikon lebih tebal | Menunjukkan pilihan selain melalui warna. |
| Tanpa animasi custom atau loop | Sprint ini berfokus pada navigasi dan inspeksi; tidak ada suara atau progres yang perlu dianimasikan. |
| Tema otomatis perangkat | Mempertahankan `darkMode: media` dan `userInterfaceStyle: automatic` yang diwajibkan design.md; tidak menambah preferensi produk baru. |
| Logo yang sudah ada | Menggunakan identitas yang diberikan, tanpa membuat aset atau orang fiktif. |

`+html.tsx` mengatur bahasa Indonesia dan judul web. Flag media NativeWind didefinisikan sebelum runtime dimuat untuk menghindari MutationObserver NativeWind v4 yang mencoba memanggil setter manual ketika stylesheet datang terlambat. Dokumen HTML juga merender `headNodes` dan `bodyNodes` sesuai API SDK 58, termasuk stylesheet dan bootstrap JavaScript.

## Bukti pemeriksaan

Bun 1.4.4 ditemukan di `%USERPROFILE%/.bun/bin`; PATH diperluas hanya untuk proses perintah, tanpa mengubah pengaturan perangkat.

| Pemeriksaan | Hasil |
| --- | --- |
| `bunx tsc --noEmit` setelah perubahan akhir | PASS, 0 error |
| `bunx expo lint` setelah perubahan akhir | PASS, 0 error/warning |
| `bunx expo-doctor` | PASS, 20/20 setelah peer audio dipasang |
| `node --test src/types/screening.test.cjs` | PASS, 9 pengujian kontrak Sprint 0 |
| `bunx expo export --platform all --output-dir .expo/sprint-1-final` | PASS, bundle Android, iOS, dan web/server |
| `bunx expo serve .expo/sprint-1-final --port 8082` + smoke HTTP berurutan | PASS, 23 route menghasilkan HTTP 200 tanpa halaman Unmatched Route |
| Proteksi galeri produksi | PASS, HTML tidak memuat contoh galeri; kode produksi mengembalikan Redirect |
| Pemindaian hex mentah, console log/info, any, penonaktifan TypeScript, dan em dash pada app/UI | PASS, tidak ditemukan |
| `git diff --check` | PASS |
| Kontras teks dengan rumus WCAG pada token Tailwind | PASS, 26 pasangan light/dark, terendah 4,79:1 |

Route produksi yang diperiksa: `/`, `/history`, `/children`, `/monitoring`, `/more`, `/sign-in`, `/sign-up`, `/children/new`, `/history/preview`, `/screening/guide`, `/screening/record`, `/screening/analyzing`, `/screening/result`, `/recommendation`, `/doctors`, `/doctors/preview`, `/chats`, `/chats/preview`, `/hospitals`, `/hospitals/map`, `/articles`, `/articles/preview`, `/dev/components`.

Smoke awal terhadap Metro development yang menerima beberapa permintaan SSR sekaligus menghasilkan error modul Metro pada `/hospitals` dan `/articles`. Pemeriksaan akhir dilakukan berurutan pada build produksi; kedua route dan seluruh route lainnya lulus. Hasil produksi tersebut tidak membuktikan Metro development tahan permintaan SSR paralel.

### Interaksi yang benar-benar dicoba di browser

| Kontrol | Bukti |
| --- | --- |
| Entry | Splash berpindah ke Beranda. |
| Tab Riwayat | URL menjadi `/history`, placeholder Riwayat tampil. |
| Menu dari navbar | Sheet tampil dengan empat tujuan, galeri, dan tombol Tutup; fokus awal berada di Profil Anak. |
| Galeri dari Menu | Sheet tertutup dan URL menjadi `/dev/components`; semua kelompok komponen tampil di accessibility tree. |
| Uji Tombol Utama | Pesan konfirmasi simulasi tampil. |
| Uji Tombol Sekunder | Pesan konfirmasi simulasi tampil. |
| Uji Tombol Risiko | Pesan konfirmasi simulasi tampil. |
| Uji Tombol Teks | Pesan konfirmasi simulasi tampil. |
| Coba Lagi | Pesan percobaan ulang simulasi selesai tampil. |
| Accordion | Status berubah menjadi expanded dan konten detail tampil. |
| Loading/disabled | Kedua tombol dikenali sebagai disabled pada accessibility tree. |

Screenshot browser ukuran 390×844 diperiksa untuk placeholder Riwayat pada tema gelap. Tidak terlihat overflow horizontal dan navbar berada di bawah konten dalam aliran layout. Perubahan akhir menambahkan ARIA selected/expanded, merapikan posisi indikator tab, dan menambahkan bridge RNHostView; perubahan ini lulus typecheck, lint, export, dan SSR, tetapi belum diulang lewat klik browser.

## Status Delivery Gate

Gate belum ditutup untuk rilis atau sign-off visual. Bukti statis/otomatis berikut lulus; daftar yang belum diuji tetap terbuka dan tidak diklaim PASS:

- Hard Gate statis PASS: tanpa klaim klinis, data/audio fiktif, aset baru, teks diagnosis, logging sensitif, tautan route yang tidak ada, atau hex mentah pada layar/komponen. Empty/loading/error primitives tersedia dan contoh bertanda simulasi.
- Purpose Gate PASS: alasan warna, ikon, tipografi, kartu, spacing, pilihan tema, dan gerak tertulis di atas; tidak ada glow, gradient, statistik, testimonial, atau dekorasi yang tidak melayani isi.
- Liveliness implementasi PASS: dials dinyatakan sebelum edit; fokus pada aksi/pesan utama, motif permukaan biru dan bahasa skrining, struktur jarak mengikuti design.md. Placeholder tidak diklaim sebagai desain layar fitur akhir.
- Craftsmanship otomatis PASS: strict TypeScript, lint, Doctor, tes kontrak, tiga bundle, route produksi, dan kontras token lulus.
- Verifikasi R-03/R-32/R-34/R-35 masih terbuka: seluruh tautan menu/route melalui klik, collapse accordion, tutup sheet via tombol/Escape/backdrop, fokus keyboard, tema terang, teks besar/zoom, lebar 320/tablet, serta UI native pada Android/iOS.

Kontrol Windows untuk inspeksi tambahan lewat Firefox dihentikan alat karena penegakan kebijakan URL belum didukung pada browser Windows tersebut. Tidak ada input UI lanjutan setelah penghentian. Ini pembatasan alat inspeksi, bukan bukti bahwa tema terang atau perangkat fisik sudah diuji.

## Checkpoint Human Reviewer

1. Jalankan `bunx expo start`, lalu buka Menu → Galeri Komponen pada development mode. Periksa light/dark, teks besar, fokus dan interaksi yang masih terbuka di atas.
2. Periksa di HP Android, khususnya ukuran sheet, bridge RNHostView, safe area, tombol kembali, dan izin mikrofon pada binary yang dibangun tim. Tidak ada pengujian mikrofon, metering, APK, signing, atau akun EAS pada sprint ini.
3. Task menempatkan `eas.json` pada Sprint 4. Sebelum menjalankan checkpoint development build pertama, reviewer perlu menyiapkan konfigurasi EAS/development client bila belum tersedia. Sprint ini tidak mengklaim command EAS siap dijalankan dan tidak menginisialisasi akun/proyek EAS.
4. Serahkan skeleton dan komponen ke Member C setelah review. Jangan menganggap placeholder sebagai fitur Supabase atau skrining yang sudah berfungsi.

## Acuan SDK

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) dan [indeks dokumentasi](https://docs.expo.dev/llms.txt).
- [Router UI SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/ui/) dan [custom tabs](https://docs.expo.dev/router/advanced/custom-tabs/).
- [Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/).
- [BottomSheet](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/bottomsheet/), [Collapsible](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/collapsible/), dan [RNHostView](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/rnhostview/).
- [Root HTML SDK 58](https://docs.expo.dev/router/web/static-rendering/#root-html).

Deklarasi TypeScript dan implementasi paket terpasang juga diperiksa agar penggunaan sesuai SDK proyek, termasuk ref TabTrigger NativeWind v4 dan bridging native.
