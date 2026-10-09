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

var SHEET_PESERTA = 'Peserta';
var SHEET_SYARAT = 'Syarat';
var SHEET_SEKOLAH = 'Sekolah';
var NAMA_FOLDER = 'Bukti Syarat - Tes Minat & Bakat Bareng Cerebrum';
var TZ = 'Asia/Jakarta';
var MAX_FILE_BYTES = 5 * 1024 * 1024;

var HEADER_PESERTA = ['Waktu Daftar', 'ID Peserta', 'Nama', 'WhatsApp', 'Asal Sekolah', 'NPSN', 'Persetujuan', 'Bukti Syarat'];
var HEADER_SYARAT = ['No', 'Syarat', 'Link (opsional)', 'Aktif (Ya/Tidak)'];
var HEADER_SEKOLAH = ['NPSN', 'Nama Sekolah', 'Kabupaten/Kota', 'Provinsi'];

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

  getFolder_();

  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  Logger.log('Setup selesai. Folder bukti: ' + getFolder_().getUrl());
}

/* ---------- GET: syarat & pencarian sekolah ---------- */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  try {
    if (action === 'syarat') return json_({ ok: true, syarat: getSyarat_() });
    if (action === 'sekolah') return json_(cariSekolah_(e.parameter.q || ''));
    return json_({ ok: true, pesan: 'Backend Tes Minat & Bakat Bareng Cerebrum aktif.' });
  } catch (err) {
    return json_({ ok: false, pesan: String(err) });
  }
}

function getSyarat_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_SYARAT);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(function (r) { return String(r[1]).trim() && String(r[3]).trim().toLowerCase() !== 'tidak'; })
    .map(function (r) { return { teks: String(r[1]).trim(), link: String(r[2]).trim() }; });
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
    SpreadsheetApp.getActive().getSheetByName(SHEET_PESERTA).appendRow([
      Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      id,
      aman_(nama),
      wa,
      aman_(sekolah),
      aman_(String(d.npsn || '')),
      'Ya',
      links.join('\n')
    ]);
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, pesan: 'Gagal menyimpan: ' + err.message });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Helpers ---------- */
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
