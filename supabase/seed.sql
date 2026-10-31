-- Local/demo seed data: Denpasar hospitals, fictitious pediatricians, articles.
-- Apply after migrations: psql "$DB_URL" -f supabase/seed.sql
-- Re-runnable: fixed ids + on conflict update.

insert into public.hospitals (id, name, address, lat, lng, phone, type, has_pediatric) values
  ('11111111-1111-1111-1111-111111111101', 'RSUP Prof. Dr. I.G.N.G. Ngoerah (Sanglah)', 'Jl. Diponegoro, Dauh Puri Klod, Denpasar Barat', -8.675500, 115.213500, '0361-227911', 'hospital', true),
  ('11111111-1111-1111-1111-111111111102', 'RSUD Wangaya', 'Jl. Kartini No. 1, Dauh Puri, Denpasar Barat', -8.644700, 115.206500, '0361-236601', 'hospital', true),
  ('11111111-1111-1111-1111-111111111103', 'RS Kasih Ibu Denpasar', 'Jl. Teuku Umar No. 120, Denpasar Barat', -8.671500, 115.207500, '0361-3003030', 'hospital', true),
  ('11111111-1111-1111-1111-111111111104', 'RS Prima Medika', 'Jl. Raya Puputan No. 100, Denpasar Selatan', -8.656000, 115.213000, '0361-236225', 'hospital', true),
  ('11111111-1111-1111-1111-111111111105', 'RS Siloam Hospitals Denpasar', 'Jl. Sunset Road No. 818, Kuta', -8.665000, 115.190000, '0361-779900', 'hospital', true),
  ('11111111-1111-1111-1111-111111111106', 'RS Manuaba', 'Jl. Gatot Subroto Barat No. 88, Denpasar Barat', -8.650000, 115.220000, '0361-414141', 'hospital', true),
  ('11111111-1111-1111-1111-111111111107', 'RS Surya Husadha Denpasar', 'Jl. Pulau Serangan No. 7, Denpasar Selatan', -8.682000, 115.207000, '0361-725011', 'hospital', true),
  ('11111111-1111-1111-1111-111111111108', 'Puskesmas Kuta Utara', 'Jl. Raya Kerobokan No. 92, Badung', -8.648000, 115.152000, '0361-730438', 'puskesmas', true),
  ('11111111-1111-1111-1111-111111111109', 'Puskesmas Denpasar Selatan', 'Jl. Raya Pemogan No. 45, Denpasar Selatan', -8.710000, 115.220000, '0361-723456', 'puskesmas', true),
  ('11111111-1111-1111-1111-111111111110', 'Klinik Anak Sehat Denpasar', 'Jl. Mahendradatta No. 55, Denpasar Barat', -8.662000, 115.198000, '0361-484444', 'clinic', true)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  phone = excluded.phone,
  type = excluded.type,
  has_pediatric = excluded.has_pediatric;

insert into public.doctors (id, name, specialty, hospital_id, photo_url, phone, whatsapp, bio, rating, schedule) values
  ('22222222-2222-2222-2222-222222222201', 'dr. Ayu Pramesti, Sp.A', 'Spesialis Anak', '11111111-1111-1111-1111-111111111101', null, '0361-227911', '+6281234500001', 'Dokter spesialis anak dengan fokus infeksi saluran napas dan tumbuh kembang.', 4.9, '{"senin":"08:00-13:00","rabu":"08:00-13:00","jumat":"08:00-11:00"}'),
  ('22222222-2222-2222-2222-222222222202', 'dr. Bagus Wirawan, Sp.A', 'Spesialis Anak', '11111111-1111-1111-1111-111111111102', null, '0361-236601', '+6281234500002', 'Menangani masalah pernapasan anak dan imunisasi.', 4.8, '{"selasa":"09:00-14:00","kamis":"09:00-14:00"}'),
  ('22222222-2222-2222-2222-222222222203', 'dr. Citra Lestari, Sp.A', 'Spesialis Anak', '11111111-1111-1111-1111-111111111103', null, '0361-3003030', '+6281234500003', 'Fokus pada alergi dan penyakit paru anak.', 4.7, '{"senin":"14:00-18:00","jumat":"14:00-18:00"}'),
  ('22222222-2222-2222-2222-222222222204', 'dr. Dharma Putra, Sp.P', 'Spesialis Paru', '11111111-1111-1111-1111-111111111104', null, '0361-236225', '+6281234500004', 'Spesialis paru dewasa dan konsultasi infeksi saluran napas.', 4.6, '{"rabu":"10:00-15:00","sabtu":"09:00-12:00"}'),
  ('22222222-2222-2222-2222-222222222205', 'dr. Eka Sari, Sp.A', 'Spesialis Anak', '11111111-1111-1111-1111-111111111106', null, '0361-414141', '+6281234500005', 'Konsultasi anak, nutrisi, dan pencegahan penyakit musiman.', 4.8, '{"selasa":"08:00-12:00","kamis":"08:00-12:00"}'),
  ('22222222-2222-2222-2222-222222222206', 'dr. Fajar Nugraha, Sp.A', 'Spesialis Anak', '11111111-1111-1111-1111-111111111107', null, '0361-725011', '+6281234500006', 'Deteksi dini gangguan napas pada anak dan bayi.', 4.9, '{"senin":"09:00-13:00","rabu":"09:00-13:00","sabtu":"09:00-12:00"}')
on conflict (id) do update set
  name = excluded.name,
  specialty = excluded.specialty,
  hospital_id = excluded.hospital_id,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  bio = excluded.bio,
  rating = excluded.rating,
  schedule = excluded.schedule;

insert into public.articles (id, title, category, cover_url, body_md, source, published_at) values
  ('33333333-3333-3333-3333-333333333301', 'Mengenali Gejala Pneumonia pada Anak', 'gejala', null,
   'Pneumonia pada anak sering dimulai seperti flu biasa: demam, batuk, dan napas cepat. Waspadai tarikan dinding dada, bibir kebiruan, atau anak sulit minum. Segera bawa ke fasilitas kesehatan bila gejala memburuk.',
   'Kemenkes RI', '2026-01-10T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333302', 'Cara Mencegah Pneumonia pada Balita', 'pencegahan', null,
   'Pastikan imunisasi lengkap, beri ASI eksklusif, jaga ventilasi rumah, dan hindari paparan asap rokok. Cuci tangan rutin juga menurunkan risiko infeksi saluran napas.',
   'WHO', '2026-01-18T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333303', 'Kapan Anak Perlu Dibawa ke IGD?', 'penanganan', null,
   'Bawa anak ke IGD bila napas sangat cepat atau sesak, ada tarikan dinding dada, bibir atau kuku kebiruan, kejang, atau tidak bisa minum. Jangan menunggu sampai kondisi memburuk.',
   'IDAI', '2026-02-02T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333304', 'Memahami Suara Batuk Anak', 'edukasi', null,
   'Batuk adalah refleks alami untuk membersihkan saluran napas. Yang perlu diperhatikan adalah pola dan gejalanya, bukan hanya suaranya. Aplikasi skrining hanya membantu mengenali pola, bukan menegakkan diagnosis.',
   'Tim PNEUMOTrack', '2026-02-12T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333305', 'Polusi Udara dan Kesehatan Paru Anak', 'edukasi', null,
   'Paparan polusi dalam dan luar ruangan meningkatkan risiko infeksi saluran napas. Gunakan masker saat udara buruk, hindari pembakaran sampah, dan jaga sirkulasi udara di rumah.',
   'Kemenkes RI', '2026-03-01T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333306', 'Panduan Imunisasi PCV untuk Bayi', 'pencegahan', null,
   'Vaksin PCV membantu melindungi anak dari infeksi pneumokokus, penyebab umum pneumonia. Ikuti jadwal imunisasi dari tenaga kesehatan dan lengkapi sampai dosis terakhir.',
   'IDAI', '2026-03-15T00:00:00Z')
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  body_md = excluded.body_md,
  source = excluded.source,
  published_at = excluded.published_at;
