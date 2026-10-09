-- Export data SNBP untuk js/data-snbp.js
-- Jalankan di Centil (data source: cerejur) setiap kali tabel snpmb_prodi / snpmb_sebaran diperbarui.
-- Output: satu kolom "r" per baris dengan format:
--   rumpun|kode_prodi|nama_prodi|nama_ptn|jenjang|dt2026|peminat2025|dt2025|grup
-- Tempel hasilnya ke bagian `prodi` di js/data-snbp.js.
-- Catatan: daftar CASE di bawah harus sama dengan kunci `rumpun` di js/riasec.js.

WITH base AS (
  SELECT p.kode_prodi, p.kode_ptn, UPPER(TRIM(p.nama_prodi)) AS n, p.nama_ptn, p.jenjang,
         CAST(p.daya_tampung2026 AS UNSIGNED) AS dt26,
         CASE WHEN p.peminat2025 REGEXP '^[0-9]+$' THEN CAST(p.peminat2025 AS UNSIGNED) END AS pem25,
         CAST(SUBSTRING_INDEX(s.daya_tampung,'(',1) AS UNSIGNED) AS dt25
  FROM snpmb_prodi p
  LEFT JOIN snpmb_sebaran s ON s.kode_prodi = p.kode_prodi AND s.tahun = '2025'
),
fam AS (
  SELECT b.*, CASE
    WHEN n LIKE '%KEDOKTERAN HEWAN%' OR n LIKE '%DOKTER HEWAN%' THEN 'dokter_hewan'
    WHEN n LIKE '%DOKTER GIGI%' OR n LIKE '%KEDOKTERAN GIGI%' THEN 'dokter_gigi'
    WHEN n IN ('KEDOKTERAN','PENDIDIKAN DOKTER') THEN 'kedokteran'
    WHEN n LIKE '%FARMASI%' THEN 'farmasi'
    WHEN n LIKE '%KEPERAWATAN%' THEN 'keperawatan'
    WHEN n LIKE '%KESEHATAN MASYARAKAT%' THEN 'kesmas'
    WHEN n LIKE '%GIZI%' THEN 'gizi'
    WHEN n LIKE '%GURU SEKOLAH DASAR%' THEN 'pgsd'
    WHEN n LIKE '%BIMBINGAN DAN KONSELING%' THEN 'bk'
    WHEN n LIKE 'PENDIDIKAN BAHASA INGGRIS%' THEN 'pend_inggris'
    WHEN n LIKE 'PENDIDIKAN%' AND (n LIKE '%JASMANI%' OR n LIKE '%OLAHRAGA%') THEN 'olahraga'
    WHEN n LIKE 'PENDIDIKAN MATEMATIKA%' THEN 'pend_mtk'
    WHEN n LIKE 'PENDIDIKAN%' THEN 'x'
    WHEN n LIKE '%TELEKOMUNIKASI%' OR n LIKE '%TEKNIK ELEKTRO%' THEN 'elektro'
    WHEN n LIKE '%INFORMATIKA%' OR n LIKE '%ILMU KOMPUTER%' OR n LIKE '%TEKNIK KOMPUTER%' THEN 'informatika'
    WHEN n LIKE '%SISTEM INFORMASI%' THEN 'sisfo'
    WHEN n LIKE '%TEKNIK SIPIL%' THEN 'sipil'
    WHEN n LIKE '%TEKNIK MESIN%' THEN 'mesin'
    WHEN n LIKE '%TEKNIK INDUSTRI%' THEN 'industri'
    WHEN n LIKE '%TEKNIK KIMIA%' THEN 'tekkim'
    WHEN n LIKE '%TEKNIK LINGKUNGAN%' THEN 'lingkungan'
    WHEN n LIKE '%ARSITEKTUR%' THEN 'arsitektur'
    WHEN n LIKE '%DESAIN KOMUNIKASI VISUAL%' THEN 'dkv'
    WHEN n LIKE '%DESAIN%' THEN 'desain'
    WHEN n LIKE '%AGROTEKNOLOGI%' OR n LIKE '%AGRONOMI%' THEN 'agrotek'
    WHEN n LIKE '%AGRIBISNIS%' THEN 'agribisnis'
    WHEN n LIKE '%STATISTIKA%' THEN 'statistika'
    WHEN n = 'MATEMATIKA' THEN 'matematika'
    WHEN n IN ('BIOLOGI','KIMIA','FISIKA') THEN 'sains'
    WHEN n LIKE '%PSIKOLOGI%' THEN 'psikologi'
    WHEN n LIKE '%KOMUNIKASI%' OR n LIKE '%HUBUNGAN MASYARAKAT%' THEN 'komunikasi'
    WHEN n LIKE '%AKUNTANSI%' THEN 'akuntansi'
    WHEN n = 'MANAJEMEN' THEN 'manajemen'
    WHEN n LIKE '%BISNIS DIGITAL%' OR n LIKE '%KEWIRAUSAHAAN%' THEN 'bisnis_digital'
    WHEN n LIKE '%ADMINISTRASI BISNIS%' THEN 'adm_bisnis'
    WHEN n LIKE '%EKONOMI PEMBANGUNAN%' OR n IN ('ILMU EKONOMI','EKONOMI') THEN 'ekonomi'
    WHEN n LIKE '%HUBUNGAN INTERNASIONAL%' THEN 'hi'
    WHEN n LIKE '%HUKUM%' THEN 'hukum'
    WHEN n LIKE '%ADMINISTRASI PUBLIK%' OR n LIKE '%ADMINISTRASI NEGARA%' THEN 'adm_publik'
    WHEN n LIKE '%ILMU POLITIK%' OR n LIKE '%ILMU PEMERINTAHAN%' THEN 'politik'
    WHEN n = 'SOSIOLOGI' THEN 'sosiologi'
    WHEN n LIKE '%SASTRA INGGRIS%' THEN 'sastra_inggris'
    WHEN n LIKE '%SASTRA INDONESIA%' THEN 'sastra_indo'
    WHEN n LIKE '%PARIWISATA%' THEN 'pariwisata'
    WHEN n LIKE '%ILMU KELAUTAN%' OR n LIKE '%PERIKANAN%' THEN 'kelautan'
    WHEN n LIKE '%KEHUTANAN%' THEN 'kehutanan'
    WHEN (n LIKE 'SENI%' OR n LIKE '%MUSIK%' OR n LIKE '%FILM%' OR n LIKE '%TELEVISI%') AND n NOT LIKE '%KULINER%' THEN 'seni'
    ELSE 'x' END AS f
  FROM base b
),
rk AS (
  SELECT fam.*,
    ROW_NUMBER() OVER (PARTITION BY f ORDER BY pem25 DESC) AS r_pop,
    ROW_NUMBER() OVER (PARTITION BY f ORDER BY CASE WHEN pem25 >= 20 AND dt25 > 0 THEN dt25 / pem25 ELSE -1 END DESC) AS r_pel
  FROM fam WHERE f <> 'x'
)
SELECT CONCAT_WS('|', f, kode_prodi, n, nama_ptn,
  CASE jenjang WHEN 'Sarjana' THEN 'S1' WHEN 'Sarjana Terapan' THEN 'D4' ELSE 'D3' END,
  dt26, IFNULL(pem25, ''), IFNULL(dt25, ''), IF(r_pop <= 5, 'P', 'A')) AS r
FROM rk
WHERE r_pop <= 5 OR (r_pel <= 3 AND pem25 >= 20 AND dt25 > 0)
ORDER BY f, r_pop;

-- Ringkasan per rumpun (bagian `ringkasan` di js/data-snbp.js):
-- SELECT CONCAT_WS('|', f, COUNT(*), COUNT(DISTINCT kode_ptn), SUM(dt26)) FROM fam WHERE f <> 'x' GROUP BY f ORDER BY f;
-- (ganti SELECT terakhir di atas dengan query ini; CTE base dan fam tetap sama)
