/*
 * PENGATURAN — Tes Minat & Bakat Bareng Cerebrum
 * Ini satu-satunya file yang perlu diubah saat setup.
 */
window.CONFIG = {
  /* URL Web App Google Apps Script (lihat README, bagian "Setup Google Sheet").
     Selama masih kosong, web berjalan dalam MODE DEMO: data tidak disimpan. */
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbypB58q-U6RQgUNFpHtvX8LaPpnEL3jARLwSGQXMeZYLJotsU-RKusGyCzJ_ITLu-MmuA/exec",
       STORY_TEMA: "krem-maroon",

  /* Ditampilkan di template Instagram Story */
  INSTAGRAM: "@cerebrum.id",

  /* Alamat situs yang ditampilkan di Story. Kosongkan = otomatis pakai alamat situs saat ini. */
  SITE_URL: "",

  /* Kalimat persetujuan yang wajib dicentang peserta */
  TEKS_PERSETUJUAN: "Saya setuju data saya (nama, nomor WhatsApp, asal sekolah) dan bukti syarat disimpan oleh Cerebrum untuk keperluan program ini. Jika saya berusia di bawah 18 tahun, saya sudah mendapat izin orang tua atau wali.",

  /* Syarat cadangan, HANYA dipakai di mode demo.
     Syarat yang berlaku sebenarnya diatur di tab "Syarat" pada Google Sheet. */
  SYARAT_DEMO: [
    { teks: "Follow Instagram @cerebrum.id", link: "https://www.instagram.com/cerebrum.id/" },
    { teks: "Like, save, repost, dan tag 3 teman kamu di kolom komentar postingan Cerebrum", link: "" }
  ]
};
