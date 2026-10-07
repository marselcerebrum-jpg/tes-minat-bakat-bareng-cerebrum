/*
 * Konten tes minat berbasis teori RIASEC (John L. Holland).
 * Pernyataan tes dan pemetaan rumpun prodi ke kode RIASEC adalah konten editorial
 * tim Cerebrum (bukan data statistik). Data angka (daya tampung, peminat) ada di data-snbp.js.
 */
window.RIASEC = {
  order: ["R", "I", "A", "S", "E", "C"],

  types: {
    R: { name: "Realistic", id: "Praktisi", desc: "Kamu suka bekerja dengan tangan, alat, mesin, atau alam. Kamu lebih senang melihat hasil nyata daripada teori panjang." },
    I: { name: "Investigative", id: "Pemikir", desc: "Kamu penasaran, suka menganalisis, meneliti, dan memecahkan masalah rumit dengan logika." },
    A: { name: "Artistic", id: "Kreator", desc: "Kamu ekspresif dan imajinatif. Kamu senang menciptakan hal baru lewat visual, tulisan, atau pertunjukan." },
    S: { name: "Social", id: "Penolong", desc: "Kamu peduli pada orang lain dan senang mengajar, mendampingi, atau membantu menyelesaikan masalah orang." },
    E: { name: "Enterprising", id: "Penggerak", desc: "Kamu percaya diri memimpin, meyakinkan orang, dan mengambil peluang. Kamu suka target dan tantangan." },
    C: { name: "Conventional", id: "Pengatur", desc: "Kamu teliti, rapi, dan suka keteraturan. Kamu nyaman bekerja dengan data, angka, dan sistem yang jelas." }
  },

  scale: [[1, "Tidak suka"], [2, "Kurang suka"], [3, "Biasa saja"], [4, "Suka"], [5, "Sangat suka"]],

  questions: [
    ["R", "Merakit atau memperbaiki perangkat elektronik"],
    ["I", "Melakukan percobaan di laboratorium"],
    ["A", "Mendesain poster atau konten visual untuk media sosial"],
    ["S", "Mengajari teman yang kesulitan memahami pelajaran"],
    ["E", "Memimpin rapat organisasi atau kepanitiaan"],
    ["C", "Merapikan data di spreadsheet supaya mudah dibaca"],
    ["R", "Merawat tanaman, kebun, atau hewan peliharaan"],
    ["I", "Mencari tahu penyebab suatu penyakit"],
    ["A", "Menulis cerita, puisi, atau naskah drama"],
    ["S", "Mendengarkan curhat dan membantu masalah orang lain"],
    ["E", "Menjual produk atau meyakinkan orang tentang sebuah ide"],
    ["C", "Mengelola uang kas kelas atau organisasi"],
    ["R", "Membuat maket bangunan atau prototipe alat"],
    ["I", "Memecahkan soal logika atau matematika yang menantang"],
    ["A", "Bermain musik, menari, atau tampil di panggung"],
    ["S", "Ikut kegiatan relawan atau bakti sosial"],
    ["E", "Merencanakan usaha atau bisnis sendiri"],
    ["C", "Menyusun jadwal dan memastikan semuanya berjalan tertib"]
  ],

  /* kelompok: saintek | soshum | campuran */
  rumpun: {
    kedokteran:     { label: "Kedokteran", code: "ISR", kelompok: "saintek", desc: "Mempelajari tubuh manusia, penyakit, diagnosis, dan pengobatan.", karier: "Dokter, dokter spesialis, peneliti medis" },
    dokter_gigi:    { label: "Kedokteran Gigi", code: "IRS", kelompok: "saintek", desc: "Mempelajari kesehatan gigi, mulut, dan perawatannya.", karier: "Dokter gigi, dokter gigi spesialis" },
    dokter_hewan:   { label: "Kedokteran Hewan", code: "IRS", kelompok: "saintek", desc: "Mempelajari kesehatan dan pengobatan hewan.", karier: "Dokter hewan, karantina, peternakan" },
    farmasi:        { label: "Farmasi", code: "ICR", kelompok: "saintek", desc: "Mempelajari obat: kandungan, pembuatan, dan penggunaannya.", karier: "Apoteker, industri farmasi, peneliti obat" },
    keperawatan:    { label: "Keperawatan", code: "SIR", kelompok: "saintek", desc: "Merawat dan mendampingi pasien dalam proses pemulihan.", karier: "Perawat, perawat klinis, pendidik kesehatan" },
    kesmas:         { label: "Kesehatan Masyarakat", code: "SIC", kelompok: "saintek", desc: "Mencegah penyakit dan meningkatkan kesehatan di tingkat komunitas.", karier: "Epidemiolog, promotor kesehatan, K3" },
    gizi:           { label: "Gizi", code: "ISC", kelompok: "saintek", desc: "Mempelajari makanan, nutrisi, dan pengaruhnya bagi kesehatan.", karier: "Ahli gizi, konsultan nutrisi, industri pangan" },
    informatika:    { label: "Informatika & Ilmu Komputer", code: "IRC", kelompok: "saintek", desc: "Merancang perangkat lunak, algoritma, dan sistem komputer.", karier: "Software engineer, data engineer, AI engineer" },
    sisfo:          { label: "Sistem Informasi", code: "CIE", kelompok: "saintek", desc: "Menghubungkan teknologi informasi dengan kebutuhan bisnis dan organisasi.", karier: "System analyst, product manager, konsultan IT" },
    elektro:        { label: "Teknik Elektro & Telekomunikasi", code: "RIC", kelompok: "saintek", desc: "Merancang sistem kelistrikan, elektronika, dan jaringan telekomunikasi.", karier: "Insinyur listrik, elektronika, telekomunikasi" },
    sipil:          { label: "Teknik Sipil", code: "RIC", kelompok: "saintek", desc: "Merancang dan membangun jalan, jembatan, gedung, dan infrastruktur.", karier: "Insinyur struktur, konsultan konstruksi" },
    mesin:          { label: "Teknik Mesin", code: "RIC", kelompok: "saintek", desc: "Merancang mesin, sistem energi, dan proses manufaktur.", karier: "Insinyur mesin, otomotif, manufaktur" },
    industri:       { label: "Teknik Industri", code: "ECI", kelompok: "saintek", desc: "Mengoptimalkan sistem produksi, logistik, dan proses bisnis.", karier: "Supply chain, quality control, konsultan operasi" },
    tekkim:         { label: "Teknik Kimia", code: "IRC", kelompok: "saintek", desc: "Mengolah bahan mentah menjadi produk lewat proses kimia skala industri.", karier: "Insinyur proses, industri migas dan pangan" },
    lingkungan:     { label: "Teknik Lingkungan", code: "RIS", kelompok: "saintek", desc: "Mengelola air, limbah, dan pencemaran untuk lingkungan yang sehat.", karier: "Konsultan lingkungan, pengelola limbah" },
    arsitektur:     { label: "Arsitektur", code: "ARI", kelompok: "saintek", desc: "Merancang bangunan dan ruang yang fungsional sekaligus indah.", karier: "Arsitek, desainer interior, perencana kota" },
    agrotek:        { label: "Agroteknologi", code: "RIE", kelompok: "saintek", desc: "Mengembangkan teknologi budidaya tanaman dan ketahanan pangan.", karier: "Agronom, konsultan pertanian, agripreneur" },
    agribisnis:     { label: "Agribisnis", code: "ECR", kelompok: "saintek", desc: "Mengelola bisnis di sektor pertanian dari hulu ke hilir.", karier: "Manajer agribisnis, analis pasar komoditas" },
    kehutanan:      { label: "Kehutanan", code: "RIS", kelompok: "saintek", desc: "Mengelola dan melestarikan hutan serta sumber dayanya.", karier: "Rimbawan, konservasi, pengelola hutan" },
    kelautan:       { label: "Ilmu Kelautan & Perikanan", code: "RIC", kelompok: "saintek", desc: "Mempelajari laut, sumber daya perikanan, dan budidayanya.", karier: "Peneliti kelautan, budidaya, industri perikanan" },
    statistika:     { label: "Statistika & Sains Data", code: "CIE", kelompok: "saintek", desc: "Mengolah dan menafsirkan data untuk mengambil keputusan.", karier: "Data analyst, aktuaris, peneliti survei" },
    matematika:     { label: "Matematika", code: "ICR", kelompok: "saintek", desc: "Mendalami konsep, logika, dan pemodelan matematis.", karier: "Analis kuantitatif, peneliti, aktuaris" },
    sains:          { label: "Biologi, Kimia & Fisika", code: "IRC", kelompok: "saintek", desc: "Meneliti alam lewat eksperimen di laboratorium dan lapangan.", karier: "Peneliti, analis laboratorium, industri" },
    dkv:            { label: "Desain Komunikasi Visual", code: "AER", kelompok: "campuran", desc: "Menyampaikan pesan lewat desain grafis, ilustrasi, dan media digital.", karier: "Desainer grafis, UI designer, art director" },
    desain:         { label: "Desain (Produk, Interior, Mode)", code: "ARE", kelompok: "campuran", desc: "Merancang produk, ruang, atau busana yang estetis dan fungsional.", karier: "Desainer produk, interior, fashion" },
    seni:           { label: "Seni, Film & Televisi", code: "ASE", kelompok: "campuran", desc: "Berkarya dan mengkaji seni pertunjukan, musik, film, dan media.", karier: "Sineas, seniman, produser konten" },
    psikologi:      { label: "Psikologi", code: "SIA", kelompok: "campuran", desc: "Mempelajari perilaku dan proses mental manusia.", karier: "Psikolog, HR, konselor, peneliti perilaku" },
    pgsd:           { label: "Pendidikan Guru SD", code: "SAC", kelompok: "campuran", desc: "Menyiapkan guru yang mengajar dan mendampingi anak usia SD.", karier: "Guru SD, pengembang kurikulum" },
    bk:             { label: "Bimbingan dan Konseling", code: "SIA", kelompok: "campuran", desc: "Mendampingi siswa dalam masalah belajar, pribadi, dan karier.", karier: "Guru BK, konselor sekolah" },
    pend_inggris:   { label: "Pendidikan Bahasa Inggris", code: "SAE", kelompok: "campuran", desc: "Menyiapkan pengajar bahasa Inggris yang kompeten.", karier: "Guru, tutor, pengembang materi ajar" },
    pend_mtk:       { label: "Pendidikan Matematika", code: "SIC", kelompok: "saintek", desc: "Menyiapkan pengajar matematika yang menguasai materi dan cara mengajar.", karier: "Guru matematika, pengembang soal" },
    olahraga:       { label: "Pendidikan Jasmani & Olahraga", code: "RSE", kelompok: "campuran", desc: "Mempelajari olahraga, kebugaran, dan cara melatihnya.", karier: "Guru olahraga, pelatih, instruktur kebugaran" },
    komunikasi:     { label: "Ilmu Komunikasi", code: "EAS", kelompok: "soshum", desc: "Mempelajari penyampaian pesan lewat media, PR, dan jurnalisme.", karier: "Jurnalis, public relations, content strategist" },
    akuntansi:      { label: "Akuntansi", code: "CEI", kelompok: "soshum", desc: "Mencatat, menganalisis, dan mengaudit laporan keuangan.", karier: "Akuntan, auditor, analis keuangan" },
    manajemen:      { label: "Manajemen", code: "ECS", kelompok: "soshum", desc: "Mengelola organisasi: pemasaran, SDM, operasi, dan keuangan.", karier: "Manajer, marketing, konsultan bisnis" },
    bisnis_digital: { label: "Bisnis Digital & Kewirausahaan", code: "EAC", kelompok: "soshum", desc: "Menggabungkan bisnis, pemasaran digital, dan teknologi.", karier: "Digital marketer, founder startup" },
    adm_bisnis:     { label: "Administrasi Bisnis", code: "ECS", kelompok: "soshum", desc: "Mengelola administrasi dan operasional bisnis secara efektif.", karier: "Business admin, staf pemasaran, wirausaha" },
    ekonomi:        { label: "Ilmu Ekonomi", code: "ICE", kelompok: "soshum", desc: "Menganalisis perilaku ekonomi, pasar, dan kebijakan pembangunan.", karier: "Ekonom, analis kebijakan, perbankan" },
    hukum:          { label: "Ilmu Hukum", code: "ESI", kelompok: "soshum", desc: "Mempelajari aturan, keadilan, dan penyelesaian sengketa.", karier: "Advokat, notaris, hakim, legal officer" },
    hi:             { label: "Hubungan Internasional", code: "EIS", kelompok: "soshum", desc: "Mempelajari politik, diplomasi, dan kerja sama antarnegara.", karier: "Diplomat, analis kebijakan, organisasi internasional" },
    adm_publik:     { label: "Administrasi Publik", code: "ECS", kelompok: "soshum", desc: "Mempelajari tata kelola pemerintahan dan pelayanan publik.", karier: "ASN, analis kebijakan publik" },
    politik:        { label: "Ilmu Politik & Pemerintahan", code: "ESI", kelompok: "soshum", desc: "Mempelajari kekuasaan, pemerintahan, dan proses politik.", karier: "Analis politik, ASN, konsultan kebijakan" },
    sosiologi:      { label: "Sosiologi", code: "SIA", kelompok: "soshum", desc: "Mempelajari masyarakat, interaksi sosial, dan perubahannya.", karier: "Peneliti sosial, pemberdayaan masyarakat" },
    sastra_inggris: { label: "Sastra Inggris", code: "AIS", kelompok: "soshum", desc: "Mendalami bahasa, sastra, dan budaya berbahasa Inggris.", karier: "Penerjemah, editor, penulis" },
    sastra_indo:    { label: "Sastra & Bahasa Indonesia", code: "AIS", kelompok: "soshum", desc: "Mendalami bahasa dan sastra Indonesia beserta pengajarannya.", karier: "Penulis, editor, jurnalis, pengajar" },
    pariwisata:     { label: "Pariwisata", code: "SEA", kelompok: "soshum", desc: "Mengelola destinasi, perjalanan, dan layanan wisata.", karier: "Pengelola destinasi, travel, perhotelan" }
  }
};
