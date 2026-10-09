# Tes Minat & Bakat Bareng Cerebrum

Web tes minat berbasis teori RIASEC (Holland Code) yang merekomendasikan rumpun program studi PTN, lengkap dengan data resmi daya tampung, peminat, dan keketatan dari SNPMB.

## Fitur

- **Pop-up syarat di awal**: peserta wajib mengunggah screenshot bukti untuk setiap syarat. Daftar syarat diatur dari tab "Syarat" di Google Sheet.
- **Data diri**: nama, nomor WhatsApp, dan asal sekolah (dengan pencarian dari tab "Sekolah"), plus centang persetujuan. Data dan bukti tersimpan otomatis ke Google Sheet dan Google Drive.
- **Tes minat 18 pernyataan** dengan skala 1–5. Grafik baru muncul di halaman hasil.
- **Hasil**: kode Holland tiga huruf, grafik segi enam, dan penjelasan tiap tipe.
- **Bagikan ke Instagram Story**: gambar 1080×1920 bergaya Cerebrum, bisa langsung dibagikan dari HP atau diunduh.
- **Rekomendasi prodi**: 46 rumpun prodi diurutkan berdasarkan kecocokan, lengkap dengan data resmi SNBP.

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
index.html               Halaman utama
css/style.css            Tampilan (warna mengikuti logo Cerebrum)
js/config.js             PENGATURAN: URL Apps Script, Instagram, teks persetujuan
js/riasec.js             Tipe RIASEC, pernyataan tes, pemetaan rumpun prodi
js/data-snbp.js          Data resmi SNBP (hasil export dari Centil)
js/story.js              Pembuat gambar Instagram Story
js/app.js                Logika aplikasi
apps-script/Code.gs      Backend Google Sheet (ditempel ke Apps Script, bukan di-deploy ke Vercel)
assets/                  Logo dan favicon Cerebrum
scripts/export-snbp.sql  Query untuk export ulang data SNBP dari Centil
```

## Setup Google Sheet (sekali saja)

Lakukan dengan akun Google pemilik spreadsheet.

1. Buka spreadsheet **Tes Minat & Bakat Bareng Cerebrum**.
2. Klik **Extensions → Apps Script**. Hapus isi editor, lalu tempel seluruh isi `apps-script/Code.gs`. Klik ikon simpan.
3. Di bagian atas editor, pilih fungsi **setup**, lalu klik **Run**. Saat diminta, klik **Review permissions**, pilih akun, lalu **Allow**. (Jika muncul "Google hasn't verified this app", klik **Advanced → Go to … (unsafe)**. Ini normal untuk script milik sendiri.)
   Hasilnya: tab **Peserta**, **Syarat**, dan **Sekolah** terbentuk, beserta folder Drive **Bukti Syarat - Tes Minat & Bakat Bareng Cerebrum**.
4. Klik **Deploy → New deployment**. Klik ikon roda gigi, pilih **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Klik **Deploy**, lalu salin **Web app URL** (berakhiran `/exec`).
5. Buka `js/config.js`, tempel URL tadi ke `APPS_SCRIPT_URL`, lalu commit dan push ke GitHub.

Selama `APPS_SCRIPT_URL` masih kosong, web berjalan dalam **mode demo** (ada label di atas halaman) dan data tidak disimpan.

**Jika `Code.gs` diubah di kemudian hari:** buka **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL tetap sama.

## Mengelola dari Google Sheet

- **Mengubah syarat:** edit tab **Syarat**. Kolom "Syarat" berisi teks yang tampil, "Link" opsional (misalnya link postingan yang harus di-like), dan "Aktif" diisi `Tidak` untuk menyembunyikan syarat. Perubahan langsung berlaku tanpa deploy ulang. Hanya orang yang punya akses edit ke spreadsheet yang bisa mengubah syarat.
- **Melihat peserta:** tab **Peserta**. Kolom "Bukti Syarat" berisi link file di Google Drive (hanya bisa dibuka akun pemilik dan yang diberi akses).
- **Daftar sekolah:** isi tab **Sekolah** (kolom NPSN, Nama Sekolah, Kabupaten/Kota, Provinsi) dari export Centil. Selama tab ini kosong, kolom asal sekolah menjadi isian bebas.

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
