# Tes Minat & Bakat Bareng Cerebrum

Web tes minat berbasis teori RIASEC (Holland Code) yang merekomendasikan rumpun program studi PTN, lengkap dengan data resmi daya tampung, peminat, dan keketatan dari SNPMB.

## Fitur

- **Profil singkat**: nama panggilan dan rencana jalur masuk (SNBP / SNBT / belum tahu).
- **Tes minat 18 pernyataan**: skala 1–5, peta minat berbentuk segi enam terbentuk langsung saat menjawab.
- **Hasil**: kode Holland tiga huruf beserta penjelasannya.
- **Rekomendasi prodi**: 46 rumpun prodi diurutkan berdasarkan kecocokan, dengan filter Saintek / Soshum / campuran.
- **Data persaingan resmi** per rumpun: jumlah PTN, jumlah prodi, total kursi SNBP 2026, 5 prodi paling diminati, dan prodi dengan peluang lebih besar.

## Sumber data

| Data | Sumber | Diperbarui |
|---|---|---|
| Daya tampung 2026, peminat 2025, daya tampung 2025 (jalur SNBP) | Portal SNPMB, diimpor ke Centil Cerebrum (data source `cerejur`, tabel `snpmb_prodi` dan `snpmb_sebaran`) | 29 April 2026 |

Data sudah divalidasi: total daya tampung SNBP 2026 sama persis dengan paparan resmi Panitia SNPMB (Akademik 151.079, Vokasi 26.929, PTKIN 11.009; total 189.017 kursi di 146 PTN).

**Keketatan** dihitung dari peminat dan daya tampung di tahun yang sama (2025), bukan mencampur tahun yang berbeda.

Pernyataan tes dan pemetaan rumpun prodi ke kode RIASEC adalah konten editorial tim Cerebrum, bukan data statistik.

**Belum tersedia:** data jalur SNBT. Lihat bagian "Memperbarui data".

## Struktur

```
index.html            Halaman utama
css/style.css         Tampilan (warna mengikuti logo Cerebrum)
js/riasec.js          Tipe RIASEC, pernyataan tes, pemetaan rumpun prodi
js/data-snbp.js       Data resmi SNBP (hasil export dari Centil)
js/app.js             Logika aplikasi
assets/               Logo dan favicon Cerebrum
scripts/export-snbp.sql  Query untuk export ulang data dari Centil
```

Situs ini statis (HTML, CSS, JS biasa), tanpa build step dan tanpa dependency.

## Menjalankan di komputer

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx serve .
# atau
python3 -m http.server 8000
```

## Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Tes Minat & Bakat Bareng Cerebrum"
git branch -M main
git remote add origin https://github.com/USERNAME/tes-minat-bakat-bareng-cerebrum.git
git push -u origin main
```

## Deploy ke Vercel

1. Login ke vercel.com, klik **Add New → Project**.
2. Pilih repo `tes-minat-bakat-bareng-cerebrum`, lalu **Import**.
3. Framework Preset: **Other**. Build Command dan Output Directory dikosongkan.
4. Klik **Deploy**.

Setiap `git push` ke branch `main` akan otomatis memperbarui situs.

## Memperbarui data

1. Jalankan `scripts/export-snbp.sql` di Centil (data source `cerejur`).
2. Tempel hasil query utama ke bagian `prodi` di `js/data-snbp.js`, dan hasil query ringkasan ke bagian `ringkasan`.
3. Perbarui `meta.diperbarui` di file yang sama.
4. Commit dan push.

**Menambah data SNBT:** setelah data SNBT masuk ke Centil, buat file `js/data-snbt.js` dengan format yang sama, lalu tampilkan sesuai pilihan jalur pengguna di `js/app.js` (bagian `renderResult`).

**Menambah atau mengubah rumpun prodi:** kunci rumpun di `js/riasec.js` harus sama dengan nilai CASE di `scripts/export-snbp.sql`.
