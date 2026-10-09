/**
 * Backend Tes Minat & Bakat Bareng Cerebrum (Google Apps Script)
 *
 * Cara pasang (detail di README.md):
 * 1. Buka Google Sheet > Extensions > Apps Script, tempel seluruh isi file ini.
 * 2. Pilih fungsi "setup" lalu klik Run (sekali saja, izinkan akses).
 * 3. Deploy > New deployment > Web app
 *      Execute as: Me   |   Who has access: Anyone
 * 4. Salin URL Web App ke js/config.js (APPS_SCRIPT_URL).
 *
 * Tab yang dipakai:
 *   Peserta : data pendaftar (diisi otomatis oleh web)
 *   Syarat  : daftar syarat yang tampil di pop-up. EDIT DI SINI untuk mengubah syarat.
 *   Sekolah : daftar sekolah untuk pilihan "Asal sekolah" (diisi dari export Centil)
 */

var VERSI_BACKEND = '2026.10.10';
var SHEET_PESERTA = 'Peserta';
var SHEET_SYARAT = 'Syarat';
var SHEET_SEKOLAH = 'Sekolah';
var SHEET_PENGATURAN = 'Pengaturan';
var NAMA_FOLDER = 'Bukti Syarat - Tes Minat & Bakat Bareng Cerebrum';
var TZ = 'Asia/Jakarta';
var MAX_FILE_BYTES = 5 * 1024 * 1024;

var HEADER_PESERTA = ['Waktu Daftar', 'ID Peserta', 'Nama', 'WhatsApp', 'Asal Sekolah', 'NPSN', 'Persetujuan', 'Bukti Syarat'];
var HEADER_SYARAT = ['No', 'Syarat', 'Link (opsional)', 'Aktif (Ya/Tidak)'];
var HEADER_SEKOLAH = ['NPSN', 'Nama Sekolah', 'Kabupaten/Kota', 'Provinsi'];
var HEADER_PENGATURAN = ['Kunci (jangan diubah)', 'Nilai', 'Keterangan'];
var ISI_PENGATURAN = [
  ['grup_umum', '', 'Link grup WhatsApp untuk semua peserta. Dipakai jika grup per rumpun di bawah kosong. Format: https://chat.whatsapp.com/...'],
  ['grup_saintek', '', 'Link grup WhatsApp untuk peserta yang rekomendasi utamanya rumpun Saintek (opsional)'],
  ['grup_soshum', '', 'Link grup WhatsApp untuk peserta yang rekomendasi utamanya rumpun Soshum (opsional)'],
  ['grup_campuran', '', 'Link grup WhatsApp untuk rumpun campuran, misalnya Psikologi, DKV, Pendidikan (opsional)'],
  ['wa_sales', '', 'Nomor WhatsApp tim sales untuk tombol konsultasi. Lebih dari satu? Pisahkan dengan koma. Peserta dibagi bergiliran secara otomatis.'],
  ['link_tryout', 'https://app.cerebrum.id', 'Link aplikasi atau web untuk tombol Tryout SNBT'],
  ['teks_tryout', 'Ikut Tryout SNBT 2027 GRATIS', 'Teks tombol tryout']
];

/* ---------- Setup (jalankan sekali) ---------- */
function setup() {
  var ss = SpreadsheetApp.getActive();

  var peserta = getOrCreateSheet_(ss, SHEET_PESERTA, HEADER_PESERTA);
  peserta.getRange('D:D').setNumberFormat('@');   // WhatsApp sebagai teks
  peserta.getRange('F:F').setNumberFormat('@');   // NPSN sebagai teks

  var syarat = getOrCreateSheet_(ss, SHEET_SYARAT, HEADER_SYARAT);
  if (syarat.getLastRow() < 2) {
    syarat.getRange(2, 1, 2, 4).setValues([
      [1, 'Follow Instagram @cerebrum.id', 'https://www.instagram.com/cerebrum.id/', 'Ya'],
      [2, 'Like, save, repost, dan tag 3 teman kamu di kolom komentar postingan Cerebrum', '', 'Ya']
    ]);
  }

  var sekolah = getOrCreateSheet_(ss, SHEET_SEKOLAH, HEADER_SEKOLAH);
  sekolah.getRange('A:A').setNumberFormat('@');

  var pengaturan = getOrCreateSheet_(ss, SHEET_PENGATURAN, HEADER_PENGATURAN);
  var kunciAda = pengaturan.getLastRow() > 1 ? pengaturan.getRange(2, 1, pengaturan.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  ISI_PENGATURAN.forEach(function (row) { if (kunciAda.indexOf(row[0]) === -1) pengaturan.appendRow(row); });
  pengaturan.getRange('B:B').setNumberFormat('@');
  pengaturan.setColumnWidth(1, 160); pengaturan.setColumnWidth(2, 320); pengaturan.setColumnWidth(3, 520);
  if (!pengaturan.getProtections(SpreadsheetApp.ProtectionType.RANGE).some(function (p) { return p.getRange().getColumn() === 1 && p.getRange().getNumRows() > 1; })) {
    pengaturan.getRange(1, 1, Math.max(pengaturan.getLastRow(), 2), 1).protect().setDescription('Kunci pengaturan, jangan diubah').setWarningOnly(true);
  }

  getFolder_();

  /* Poka-yoke: baris judul diberi peringatan bila ada yang mencoba mengubahnya */
  [peserta, syarat, sekolah, pengaturan].forEach(function (sh) {
    var ada = sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).some(function (p) { return p.getRange().getRow() === 1; });
    if (!ada) sh.getRange(1, 1, 1, sh.getLastColumn()).protect().setDescription('Judul kolom, jangan diubah').setWarningOnly(true);
  });

  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  Logger.log('Setup selesai. Folder bukti: ' + getFolder_().getUrl());
}

/* ---------- GET: syarat & pencarian sekolah ---------- */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  try {
    if (action === 'syarat') return json_({ ok: true, syarat: getSyarat_() });
    if (action === 'cek') return json_(cek_());
    if (action === 'pengaturan') return json_({ ok: true, pengaturan: getPengaturan_() });
    if (action === 'sekolah') return json_(cariSekolah_(e.parameter.q || ''));
    return json_({ ok: true, pesan: 'Backend Tes Minat & Bakat Bareng Cerebrum aktif.' });
  } catch (err) {
    return json_({ ok: false, pesan: String(err) });
  }
}

function getSyarat_() {
  var cache = CacheService.getScriptCache();
  var c = cache.get('syarat');
  if (c) return JSON.parse(c);
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_SYARAT);
  if (!sh || sh.getLastRow() < 2) return [];
  var out = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(function (r) { return String(r[1]).trim() && String(r[3]).trim().toLowerCase() !== 'tidak'; })
    .map(function (r) {
      var link = String(r[2]).trim();
      if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;   /* poka-yoke: link tanpa https */
      return { teks: String(r[1]).trim(), link: link };
    });
  cache.put('syarat', JSON.stringify(out), 60);
  return out;
}

/* Hapus cache otomatis begitu tab Syarat diedit (trigger onEdit sederhana) */
function onEdit(e) {
  if (!e || !e.range) return;
  var n = e.range.getSheet().getName();
  if (n === SHEET_SYARAT) CacheService.getScriptCache().remove('syarat');
  if (n === SHEET_PENGATURAN) CacheService.getScriptCache().remove('pengaturan');
}

/* Pengaturan langkah lanjut (grup, sales, tryout), dengan poka-yoke format */
function getPengaturan_() {
  var cache = CacheService.getScriptCache();
  var c = cache.get('pengaturan');
  if (c) return JSON.parse(c);
  var out = { grup: {}, wa_sales: [], link_tryout: '', teks_tryout: '', masalah: [] };
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_PENGATURAN);
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues().forEach(function (r) {
      var k = String(r[0]).trim(), v = String(r[1]).trim();
      if (!v) return;
      if (/^grup_/.test(k)) {
        if (/^(https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(v)) out.grup[k.slice(5)] = /^https?:/.test(v) ? v : 'https://' + v;
        else out.masalah.push(k + ': bukan link grup WhatsApp');
      } else if (k === 'wa_sales') {
        v.split(/[,;\n]+/).forEach(function (n) {
          var w = normalisasiWA_(n);
          if (w) out.wa_sales.push(w); else if (n.trim()) out.masalah.push('wa_sales: nomor tidak valid (' + n.trim() + ')');
        });
      } else if (k === 'link_tryout') {
        out.link_tryout = /^https?:\/\//.test(v) ? v : 'https://' + v;
      } else if (k === 'teks_tryout') {
        out.teks_tryout = v.slice(0, 60);
      }
    });
  }
  cache.put('pengaturan', JSON.stringify(out), 60);
  return out;
}

function cek_() {
  var ss = SpreadsheetApp.getActive();
  var hitung = function (n) { var sh = ss.getSheetByName(n); return sh ? Math.max(0, sh.getLastRow() - 1) : -1; };
  var folderOk = false;
  try { folderOk = !!getFolder_(); } catch (e) {}
  return { ok: true, versi: VERSI_BACKEND, syarat: getSyarat_().length, sekolah: hitung(SHEET_SEKOLAH), peserta: hitung(SHEET_PESERTA), folder: folderOk, pengaturan: getPengaturan_() };
}

function cariSekolah_(q) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_SEKOLAH);
  var tersedia = !!sh && sh.getLastRow() > 1;
  q = String(q).toLowerCase().trim();
  if (!tersedia || q.length < 3) return { ok: true, tersedia: tersedia, data: [] };

  var words = q.split(/\s+/);
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getDisplayValues();
  var out = [];
  for (var i = 0; i < rows.length && out.length < 10; i++) {
    var hay = (rows[i][1] + ' ' + rows[i][2] + ' ' + rows[i][0]).toLowerCase();
    var hit = words.every(function (w) { return hay.indexOf(w) > -1; });
    if (hit) out.push({ npsn: rows[i][0], nama: rows[i][1], kota: rows[i][2], prov: rows[i][3] });
  }
  return { ok: true, tersedia: true, data: out };
}

/* ---------- POST: pendaftaran ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action !== 'daftar') return json_({ ok: false, pesan: 'Aksi tidak dikenal.' });

    var nama = String(d.nama || '').trim();
    var wa = normalisasiWA_(d.wa);
    var sekolah = String(d.sekolah || '').trim();
    if (nama.length < 2 || nama.length > 60) return json_({ ok: false, pesan: 'Nama tidak valid.' });
    if (!wa) return json_({ ok: false, pesan: 'Nomor WhatsApp tidak valid.' });
    if (!sekolah) return json_({ ok: false, pesan: 'Asal sekolah wajib diisi.' });
    if (d.setuju !== true) return json_({ ok: false, pesan: 'Persetujuan wajib dicentang.' });

    /* Poka-yoke anti-bot: kolom jebakan harus kosong */
    if (d.hp) return json_({ ok: true, id: 'TMB-X' });

    /* Poka-yoke anti-dobel: nomor WA yang sama tidak dibuat baris baru */
    var lama = cariPeserta_(wa);
    if (lama) return json_({ ok: true, id: lama, duplikat: true });

    var files = Array.isArray(d.bukti) ? d.bukti : [];
    var jumlahSyarat = getSyarat_().length;
    if (files.length < jumlahSyarat) return json_({ ok: false, pesan: 'Bukti syarat belum lengkap.' });

    var id = 'TMB-' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
    var folder = getFolder_();
    var links = files.map(function (f, i) {
      var bytes = Utilities.base64Decode(String(f.data || ''));
      if (bytes.length > MAX_FILE_BYTES) throw new Error('Ukuran file terlalu besar.');
      var mime = /^image\/(jpeg|png|webp)$/.test(f.mime) ? f.mime : 'image/jpeg';
      var blob = Utilities.newBlob(bytes, mime, id + '_syarat-' + (i + 1) + '.jpg');
      var file = folder.createFile(blob);
      return 'Syarat ' + (i + 1) + ': ' + file.getUrl();
    });

    lock.waitLock(20000);
    var dobel = cariPeserta_(wa);   /* cek ulang di dalam kunci, untuk kiriman yang bersamaan */
    if (dobel) return json_({ ok: true, id: dobel, duplikat: true });
    tulisBaris_({
      'Waktu Daftar': Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      'ID Peserta': id,
      'Nama': aman_(nama),
      'WhatsApp': wa,
      'Asal Sekolah': aman_(sekolah),
      'NPSN': aman_(String(d.npsn || '')),
      'Persetujuan': 'Ya',
      'Bukti Syarat': links.join('\n')
    });
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, pesan: 'Gagal menyimpan: ' + err.message });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Helpers ---------- */

/* Tulis berdasarkan NAMA kolom, jadi aman walau urutan kolom diubah atau kolom baru ditambahkan */
function tulisBaris_(obj) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_PESERTA) || getOrCreateSheet_(SpreadsheetApp.getActive(), SHEET_PESERTA, HEADER_PESERTA);
  var header = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
  Object.keys(obj).forEach(function (k) {
    if (header.indexOf(k) === -1) { header.push(k); sh.getRange(1, header.length).setValue(k).setFontWeight('bold'); }
  });
  var row = header.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sh.appendRow(row);
}

function cariPeserta_(wa) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_PESERTA);
  if (!sh || sh.getLastRow() < 2) return '';
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var cWa = header.indexOf('WhatsApp'), cId = header.indexOf('ID Peserta');
  if (cWa < 0 || cId < 0) return '';
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getDisplayValues();
  for (var i = data.length - 1; i >= 0; i--) if (String(data[i][cWa]).replace(/\D/g, '') === wa) return data[i][cId];
  return '';
}
function normalisasiWA_(v) {
  var s = String(v || '').replace(/[^\d+]/g, '');
  if (s.indexOf('+') === 0) s = s.slice(1);
  if (s.indexOf('0') === 0) s = '62' + s.slice(1);
  if (s.indexOf('8') === 0) s = '62' + s;
  return /^628\d{7,12}$/.test(s) ? s : '';
}

/* Cegah teks diperlakukan sebagai rumus di Sheets */
function aman_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function getOrCreateSheet_(ss, name, header) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function getFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var folder = DriveApp.createFolder(NAMA_FOLDER);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
