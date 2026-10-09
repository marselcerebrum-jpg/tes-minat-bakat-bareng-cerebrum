(function () {
  "use strict";

  const VERSI = "2026.10.09";
  const $ = (id) => document.getElementById(id);

  /* ===== POKA-YOKE 1: file wajib harus terbaca, kalau tidak tampilkan pesan jelas ===== */
  function layarGangguan(pesan) {
    document.body.innerHTML = '<div style="max-width:520px;margin:80px auto;padding:28px;font-family:system-ui,sans-serif;text-align:center;border:1px solid #E6DADA;border-radius:18px;background:#fff;color:#26191A">' +
      '<h1 style="font-size:1.4rem;margin:0 0 10px">Sedang ada gangguan</h1>' +
      '<p style="color:#6E5C5D;margin:0 0 18px">Halaman ini belum bisa dibuka. Coba muat ulang beberapa saat lagi.</p>' +
      '<button onclick="location.reload()" style="background:#8A1C1C;color:#fff;border:0;border-radius:12px;padding:12px 22px;font-weight:700;cursor:pointer">Muat ulang</button>' +
      '<p style="color:#9a8a8a;font-size:.8rem;margin:22px 0 0">Kode untuk admin: ' + pesan + '</p></div>';
  }
  const hilang = [["riasec.js", window.RIASEC], ["data-snbp.js", window.SNBP_DATA], ["story.js", window.buatStory]].filter((x) => !x[1]).map((x) => x[0]);
  if (hilang.length) { layarGangguan("file tidak terbaca: " + hilang.join(", ")); return; }

  const R = window.RIASEC;
  const D = window.SNBP_DATA;
  const ORDER = R.order;

  /* Setiap tipe minat wajib punya minimal 1 pertanyaan */
  const tipeKosong = ORDER.filter((t) => !R.questions.some((q) => q[0] === t));
  const tipeAsing = R.questions.filter((q) => !ORDER.includes(q[0])).map((q) => q[0]);
  if (tipeKosong.length || tipeAsing.length) {
    layarGangguan("riasec.js: " + (tipeKosong.length ? "tipe tanpa pertanyaan " + tipeKosong.join(",") : "") + (tipeAsing.length ? " huruf tidak dikenal " + tipeAsing.join(",") : ""));
    return;
  }

  /* ===== POKA-YOKE 2: pengaturan & alamat server harus valid ===== */
  const CONFIG_HILANG = !window.CONFIG;
  const CFG = window.CONFIG || {};
  const API = (CFG.APPS_SCRIPT_URL || "").trim();
  const API_SALAH = !!API && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(API);
  const DEMO = !API || API_SALAH || CONFIG_HILANG;
  const MASALAH_CONFIG = CONFIG_HILANG ? "config.js tidak terbaca" : API_SALAH ? "APPS_SCRIPT_URL tidak valid (harus berakhiran /exec)" : "";

  /* ===== POKA-YOKE 3: semua file harus versi yang sama ===== */
  const versiFile = {
    "index.html": (document.querySelector('meta[name="tmb-versi"]') || {}).content || "lama",
    "riasec.js": R.versi || "lama",
    "data-snbp.js": (D.meta && D.meta.versi) || "lama",
    "story.js": window.STORY_VERSI || "lama",
    "app.js": VERSI
  };
  const fileTidakSinkron = Object.keys(versiFile).filter((k) => versiFile[k] !== VERSI);
  if (fileTidakSinkron.length) console.warn("[Tes Minat] File belum versi " + VERSI + ":", fileTidakSinkron.join(", "));

  /* Gangguan tak terduga: beri tahu peserta, jangan diam saja */
  window.addEventListener("error", (e) => {
    if (!e.message || /Script error/.test(e.message)) return;
    console.error("[Tes Minat]", e.message);
    toast("Terjadi gangguan kecil. Kalau ada yang tidak berfungsi, muat ulang halaman.");
  });
  function toast(pesan) {
    let t = $("tmb-toast");
    if (!t) {
      t = document.createElement("div"); t.id = "tmb-toast"; t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99;max-width:92vw;background:#26191A;color:#fff;padding:12px 18px;border-radius:12px;font-size:.9rem;box-shadow:0 10px 30px rgba(0,0,0,.25)";
      document.body.appendChild(t);
    }
    t.textContent = pesan; t.style.display = "block";
    clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = "none"; }, 5000);
  }

  const DI_APLIKASI = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent);
  const fmt = (n) => Number(n).toLocaleString("id-ID");

  /* ---------- Data SNBP ---------- */
  const summary = {};
  D.ringkasan.trim().split("\n").forEach((line) => {
    const [f, nProdi, nPtn, dt] = line.split("|");
    summary[f] = { nProdi: +nProdi, nPtn: +nPtn, dt: +dt };
  });
  const rows = {};
  D.prodi.trim().split("\n").forEach((line) => {
    const [f, kode, prodi, ptn, jenjang, dt26, pem25, dt25, grup] = line.split("|");
    (rows[f] = rows[f] || []).push({ kode, prodi, ptn, jenjang, dt26: +dt26, pem25: pem25 === "" ? null : +pem25, dt25: dt25 === "" ? 0 : +dt25, grup });
  });

  /* ---------- Helpers ---------- */
  const KEEP_UPPER = new Set(["UPN", "UIN", "ISI", "ISBI", "IPB", "PSDKU", "PGSD", "STEI-K", "STEI-R", "FSRD", "FTMD", "TOUNA", "D3", "D4"]);
  const LOWER = new Set(["dan", "di", "untuk", "&"]);
  function title(s) {
    return s.split(" ").map((w, i) => {
      const bare = w.replace(/[()",.]/g, "");
      if (KEEP_UPPER.has(bare)) return w;
      const lw = w.toLowerCase();
      if (i > 0 && LOWER.has(lw)) return lw;
      return lw.replace(/(^|[("-])([a-z])/g, (m, p, c) => p + c.toUpperCase());
    }).join(" ");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function keketatan(r) {
    if (!r.pem25 || !r.dt25) return { text: "—", sub: "data 2025 tidak tersedia", cls: "" };
    const ratio = r.pem25 / r.dt25, pct = (r.dt25 / r.pem25) * 100;
    let label, cls;
    if (pct < 8) { label = "Sangat ketat"; cls = "k-high"; }
    else if (pct < 20) { label = "Ketat"; cls = "k-mid"; }
    else { label = "Peluang lebih besar"; cls = "k-low"; }
    return { text: "1 : " + (ratio < 10 ? ratio.toFixed(1).replace(".", ",") : Math.round(ratio)), sub: label + " (" + pct.toFixed(1).replace(".", ",") + "% diterima)", cls };
  }
  function normalisasiWA(v) {
    let s = String(v || "").replace(/[^\d+]/g, "");
    if (s.startsWith("+")) s = s.slice(1);
    if (s.startsWith("0")) s = "62" + s.slice(1);
    if (s.startsWith("8")) s = "62" + s;
    return /^628\d{7,12}$/.test(s) ? s : "";
  }
  async function apiGet(params) {
    const url = API + (API.includes("?") ? "&" : "?") + new URLSearchParams(params).toString();
    const res = await fetch(url, { method: "GET" });
    return res.json();
  }
  async function apiPost(body) {
    /* text/plain menghindari preflight CORS di Apps Script */
    const res = await fetch(API, { method: "POST", body: JSON.stringify(body) });
    return res.json();
  }
  /* Kompres gambar ke JPEG maks 1600 px supaya unggahan ringan */
  function kompres(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1280, sc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        const dataUrl = cv.toDataURL("image/jpeg", 0.72);
        resolve({ mime: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File bukan gambar yang valid.")); };
      img.src = url;
    });
  }

  const KUNCI_PROGRES = "tmb-progres-v1", KUNCI_TERDAFTAR = "tmb-terdaftar-v1";

  /* ---------- State ---------- */
  const state = {
    nama: "", wa: "", sekolah: "", npsn: "", jalur: "", setuju: false,
    syarat: [], bukti: [], pesertaId: "",
    i: 0, ans: Array(R.questions.length).fill(0), filter: "semua", hasil: null
  };

  function scores() {
    const sum = {}, cnt = {};
    ORDER.forEach((t) => { sum[t] = 0; cnt[t] = 0; });
    R.questions.forEach(([t], k) => { cnt[t]++; sum[t] += state.ans[k] || 0; });
    const out = {};
    ORDER.forEach((t) => { out[t] = sum[t] / (cnt[t] * 5); });
    return out;
  }

  /* ---------- Grafik segi enam ---------- */
  function hexSVG(sc) {
    const cx = 160, cy = 165, RAD = 112;
    const pt = (k, r) => { const a = (-90 + k * 60) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let g = "";
    [1 / 3, 2 / 3, 1].forEach((f) => { g += `<polygon class="hex-grid" points="${ORDER.map((_, k) => pt(k, RAD * f).join(",")).join(" ")}"/>`; });
    ORDER.forEach((_, k) => { const [x, y] = pt(k, RAD); g += `<line class="hex-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
    g += `<polygon class="hex-shape" points="${ORDER.map((t, k) => pt(k, Math.max(.04, sc[t]) * RAD).join(",")).join(" ")}"/>`;
    ORDER.forEach((t, k) => { const [x, y] = pt(k, Math.max(.04, sc[t]) * RAD); g += `<circle class="hex-dot" cx="${x}" cy="${y}" r="3.5"/>`; });
    ORDER.forEach((t, k) => { const [x, y] = pt(k, RAD + 30); g += `<text class="hex-letter" x="${x}" y="${y - 6}">${t}</text><text class="hex-name" x="${x}" y="${y + 12}">${R.types[t].id}</text>`; });
    const label = ORDER.map((t) => R.types[t].name + " " + Math.round(sc[t] * 100) + "%").join(", ");
    return `<svg viewBox="0 0 320 340" role="img" aria-label="Peta minat RIASEC: ${label}">${g}</svg>`;
  }

  /* ---------- Navigasi ---------- */
  const VIEWS = ["profil", "tes", "hasil"];
  function show(v) {
    VIEWS.forEach((x) => $("v-" + x).classList.toggle("hidden", x !== v));
    const idx = VIEWS.indexOf(v);
    document.querySelectorAll("#steps li").forEach((li, k) => {
      li.className = k === idx ? "on" : k < idx ? "done" : "";
      if (k === idx) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0 });
  }

  /* ---------- Modal helper ---------- */
  let lastFocus = null;
  function openModal(id) {
    lastFocus = document.activeElement;
    $(id).classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const f = $(id).querySelector("button:not([disabled]), input, a");
    if (f) f.focus();
  }
  function closeModal(id) {
    $(id).classList.add("hidden");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  /* ========== 1. POP-UP SYARAT ========== */
  const KUNCI_SYARAT = "tmb-syarat-v1";
  function bacaCacheSyarat() {
    try { const v = JSON.parse(localStorage.getItem(KUNCI_SYARAT)); return Array.isArray(v) && v.length ? v : null; } catch (e) { return null; }
  }
  async function muatSyarat() {
    if (DEMO) { state.syarat = CFG.SYARAT_DEMO || []; renderSyarat(); return; }
    /* Tampilkan syarat dari kunjungan sebelumnya dulu supaya pop-up langsung terisi */
    const cache = bacaCacheSyarat();
    if (cache) { state.syarat = cache; renderSyarat(); }
    try {
      const r = await apiGet({ action: "syarat" });
      if (!r.ok) throw new Error(r.pesan);
      const baru = r.syarat || [];
      try { localStorage.setItem(KUNCI_SYARAT, JSON.stringify(baru)); } catch (e) {}
      if (JSON.stringify(baru) !== JSON.stringify(state.syarat)) {
        state.syarat = baru;
        state.bukti = state.bukti.slice(0, baru.length);
        renderSyarat();
      }
    } catch (e) {
      if (!cache) {
        $("syarat-error").textContent = "Syarat gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.";
        $("syarat-error").classList.remove("hidden");
        state.syarat = []; renderSyarat();
      }
    }
  }

  function renderSyarat() {
    const list = $("syarat-list");
    if (!state.syarat.length) { list.innerHTML = ""; cekSyarat(); return; }
    list.innerHTML = state.syarat.map((s, i) => {
      const b = state.bukti[i];
      return `<li>
        <div class="s-head"><div class="s-text">${esc(s.teks)}${s.link ? `<br><a href="${esc(s.link)}" target="_blank" rel="noopener">Buka tautan</a>` : ""}</div></div>
        <label class="drop ${b ? "done" : ""}">
          <input type="file" accept="image/*" data-i="${i}">
          <span class="thumb">${b ? `<img src="${b.preview}" alt="">` : "+"}</span>
          <span>${b ? "Bukti terunggah. Ketuk untuk mengganti." : "Unggah screenshot bukti"}</span>
        </label>
      </li>`;
    }).join("");
    cekSyarat();
  }

  function cekSyarat() {
    const lengkap = state.syarat.every((_, i) => state.bukti[i]);
    $("syarat-ok").disabled = !lengkap;
    const n = state.bukti.filter(Boolean).length, total = state.syarat.length;
    $("bukti-status").classList.toggle("ok", lengkap);
    $("bukti-text").textContent = lengkap ? `Bukti syarat lengkap (${n}/${total})` : `Bukti syarat: ${n}/${total} terunggah`;
    $("buka-syarat").textContent = lengkap ? "Ubah" : "Unggah bukti";
    return lengkap;
  }

  $("syarat-list").addEventListener("change", async (e) => {
    const inp = e.target.closest("input[type=file]"); if (!inp || !inp.files[0]) return;
    const i = +inp.dataset.i, file = inp.files[0];
    $("syarat-error").classList.add("hidden");
    if (file.size > 15 * 1024 * 1024) { $("syarat-error").textContent = "Ukuran file maksimal 15 MB."; $("syarat-error").classList.remove("hidden"); return; }
    try {
      const hasil = await kompres(file);
      const kembar = state.bukti.findIndex((b, k) => b && k !== i && b.data === hasil.data);
      if (kembar > -1) throw new Error(`Screenshot ini sama dengan bukti syarat ${kembar + 1}. Unggah bukti yang berbeda untuk setiap syarat.`);
      state.bukti[i] = hasil;
      simpanProgres();
      renderSyarat();
    } catch (err) {
      $("syarat-error").textContent = err.message; $("syarat-error").classList.remove("hidden");
    }
  });
  $("syarat-ok").addEventListener("click", () => { closeModal("m-syarat"); $("nama").focus(); });
  $("buka-syarat").addEventListener("click", () => { renderSyarat(); openModal("m-syarat"); });

  /* ========== 2. DATA DIRI ========== */
  $("hex-intro").innerHTML = hexSVG({ R: .55, I: .8, A: .45, S: .7, E: .4, C: .6 });
  $("teks-setuju").textContent = CFG.TEKS_PERSETUJUAN || "";

  document.querySelectorAll(".chips[data-key]").forEach((grp) => {
    grp.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      grp.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      state[grp.dataset.key] = b.dataset.v;
    });
  });

  /* Autocomplete sekolah (data dari tab "Sekolah" di Google Sheet) */
  let sekolahTersedia = !DEMO, timer = null, sugIdx = -1, sugData = [];
  const inpS = $("sekolah"), listS = $("sekolah-list");
  function tutupSaran() { listS.classList.add("hidden"); inpS.setAttribute("aria-expanded", "false"); sugIdx = -1; }
  function pilihSekolah(s) {
    state.sekolah = s.nama; state.npsn = s.npsn || "";
    inpS.value = s.nama;
    $("sekolah-hint").textContent = s.npsn ? `NPSN ${s.npsn}${s.kota ? " · " + s.kota : ""}` : "";
    tutupSaran();
  }
  function renderSaran(q) {
    const items = sugData.map((s, i) => `<li role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === sugIdx}">${esc(s.nama)}<small>${esc([s.kota, s.prov].filter(Boolean).join(", "))}${s.npsn ? " · NPSN " + esc(s.npsn) : ""}</small></li>`);
    items.push(`<li role="option" class="manual" data-i="manual" aria-selected="${sugIdx === sugData.length}">Sekolahku tidak ada di daftar, pakai "${esc(q)}"</li>`);
    listS.innerHTML = items.join("");
    listS.classList.remove("hidden"); inpS.setAttribute("aria-expanded", "true");
  }
  inpS.addEventListener("input", () => {
    const q = inpS.value.trim();
    state.sekolah = q; state.npsn = "";
    $("sekolah-hint").textContent = "";
    clearTimeout(timer);
    if (!sekolahTersedia || q.length < 3) { tutupSaran(); return; }
    timer = setTimeout(async () => {
      try {
        const r = await apiGet({ action: "sekolah", q });
        if (inpS.value.trim() !== q) return;
        if (!r.tersedia) { sekolahTersedia = false; state.sekolah = q; tutupSaran(); return; }
        sugData = r.data || []; sugIdx = -1; renderSaran(q);
      } catch (e) { sekolahTersedia = false; state.sekolah = q; tutupSaran(); }
    }, 300);
  });
  inpS.addEventListener("keydown", (e) => {
    if (listS.classList.contains("hidden")) return;
    const max = sugData.length;
    if (e.key === "ArrowDown") { e.preventDefault(); sugIdx = Math.min(max, sugIdx + 1); renderSaran(inpS.value.trim()); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sugIdx = Math.max(0, sugIdx - 1); renderSaran(inpS.value.trim()); }
    else if (e.key === "Enter" && sugIdx > -1) {
      e.preventDefault();
      if (sugIdx === max) { state.sekolah = inpS.value.trim(); tutupSaran(); } else pilihSekolah(sugData[sugIdx]);
    } else if (e.key === "Escape") tutupSaran();
  });
  listS.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li"); if (!li) return;
    e.preventDefault();
    if (li.dataset.i === "manual") { state.sekolah = inpS.value.trim(); state.npsn = ""; tutupSaran(); }
    else pilihSekolah(sugData[+li.dataset.i]);
  });
  inpS.addEventListener("blur", () => setTimeout(tutupSaran, 150));

  function tampilError(msg) { const el = $("form-error"); el.textContent = msg; el.classList.toggle("hidden", !msg); }

  $("form-profil").addEventListener("submit", async (e) => {
    e.preventDefault();
    state.nama = $("nama").value.trim();
    state.wa = normalisasiWA($("wa").value);
    state.setuju = $("setuju").checked;
    /* Nama sekolah yang diketik selalu diterima; memilih dari daftar hanya menambahkan NPSN */
    const ketikan = inpS.value.trim();
    if (ketikan !== state.sekolah) { state.sekolah = ketikan; state.npsn = ""; }

    if (!cekSyarat()) { tampilError("Unggah bukti syarat terlebih dahulu."); renderSyarat(); openModal("m-syarat"); return; }
    if (state.nama.length < 2 || !/[a-zA-Z]{2,}/.test(state.nama)) { tampilError("Isi nama lengkapmu dengan huruf."); $("nama").focus(); return; }
    if (!state.wa) { tampilError("Nomor WhatsApp belum benar. Contoh: 081234567890."); $("wa").focus(); return; }
    if (state.sekolah.length < 3) { tampilError("Isi asal sekolahmu."); inpS.focus(); return; }
    if (!state.jalur) { tampilError("Pilih rencana jalur masuk."); return; }
    if (!state.setuju) { tampilError("Centang persetujuan terlebih dahulu."); $("setuju").focus(); return; }
    tampilError("");

    if (!navigator.onLine) toast("Kamu sedang offline. Tes tetap bisa dikerjakan, datamu akan dikirim otomatis saat online.");
    /* Data dikirim di latar; peserta langsung mulai tes tanpa menunggu */
    state.mulai = true; simpanProgres();
    kirimPendaftaran();
    show("tes"); renderQ();
  });

  /* ---------- Pengiriman data di latar (dengan coba ulang otomatis) ---------- */
  (function buatStatusSimpan() {
    const box = document.createElement("div");
    box.id = "simpan-status"; box.className = "note hidden"; box.setAttribute("role", "alert");
    box.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 24px;font-weight:600;color:var(--brand);border:1px solid var(--brand-mid)";
    box.innerHTML = '<span id="simpan-text"></span><button type="button" class="btn ghost" id="simpan-ulang" style="padding:10px 16px">Coba kirim lagi</button>';
    $("v-hasil").prepend(box);
  })();
  let kirimJanji = null;
  function kirimPendaftaran() {
    if (DEMO) { kirimJanji = Promise.resolve({ ok: true }); return kirimJanji; }
    if (state.pesertaId) return (kirimJanji = Promise.resolve({ ok: true, id: state.pesertaId }));
    /* Nomor WA yang sama sudah pernah terdaftar dari perangkat ini: jangan kirim dobel */
    const lama = bacaJSON(KUNCI_TERDAFTAR);
    if (lama && lama.wa === state.wa && lama.id) { state.pesertaId = lama.id; return (kirimJanji = Promise.resolve({ ok: true, id: lama.id })); }
    if (kirimJanji && !kirimSelesai) return kirimJanji;
    const payload = {
      action: "daftar", nama: state.nama, wa: state.wa, sekolah: state.sekolah, npsn: state.npsn, setuju: true,
      bukti: state.bukti.map((b) => ({ mime: b.mime, data: b.data })), hp: ""
    };
    kirimSelesai = false;
    kirimJanji = (async () => {
      let terakhir = null;
      for (let coba = 0; coba < 3; coba++) {
        try {
          const r = await apiPost(payload);
          kirimSelesai = true;
          if (r.ok) {
            state.pesertaId = r.id;
            tulisJSON(KUNCI_TERDAFTAR, { wa: state.wa, id: r.id });
            simpanProgres();
            return r;
          }
          return r; /* ditolak server (data tidak valid): tidak perlu dicoba ulang */
        } catch (e) {
          terakhir = e;
          await new Promise((res) => setTimeout(res, 2000 * (coba + 1)));
        }
      }
      kirimSelesai = true;
      return { ok: false, pesan: "Gagal terhubung ke server.", jaringan: true, err: terakhir };
    })();
    return kirimJanji;
  }
  let kirimSelesai = true;
  /* Begitu kembali online, kirim ulang otomatis kalau tadi gagal */
  window.addEventListener("online", () => {
    if (!DEMO && state.mulai && !state.pesertaId && kirimSelesai) { kirimJanji = null; kirimPendaftaran(); }
  });

  async function pastikanTersimpan() {
    const r = await (kirimJanji || kirimPendaftaran());
    const el = $("simpan-status");
    if (r && r.ok) { el.classList.add("hidden"); return; }
    el.classList.remove("hidden");
    $("simpan-text").textContent = r && !r.jaringan && r.pesan
      ? "Data kamu belum tersimpan: " + r.pesan
      : "Data kamu belum tersimpan karena koneksi bermasalah.";
  }
  $("simpan-ulang").addEventListener("click", async () => {
    const b = $("simpan-ulang");
    b.disabled = true; b.textContent = "Mengirim…";
    kirimJanji = null;
    await kirimPendaftaran(); await pastikanTersimpan();
    b.disabled = false; b.textContent = "Coba kirim lagi";
  });

  /* ========== 3. TES (tanpa grafik) ========== */
  function renderQ() {
    const q = R.questions[state.i];
    const answered = state.ans.filter(Boolean).length;
    $("qcount").textContent = `Pernyataan ${state.i + 1} dari ${R.questions.length}`;
    $("qtext").textContent = q[1];
    $("bar").style.width = (answered / R.questions.length * 100) + "%";
    $("scale").innerHTML = R.scale.map(([v, l]) =>
      `<button type="button" data-v="${v}" aria-pressed="${state.ans[state.i] === v}"><b>${v}</b>${l}</button>`).join("");
    $("back").disabled = state.i === 0;
    $("lihat").classList.toggle("hidden", answered < R.questions.length);
  }
  let kunciKetuk = false;
  $("scale").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || kunciKetuk) return;
    /* Cegah ketukan ganda yang tanpa sengaja menjawab pertanyaan berikutnya */
    kunciKetuk = true; setTimeout(() => { kunciKetuk = false; }, 350);
    state.ans[state.i] = +b.dataset.v;
    const next = state.ans.findIndex((a, k) => !a && k > state.i);
    const anyEmpty = state.ans.findIndex((a) => !a);
    if (next > -1) state.i = next; else if (anyEmpty > -1) state.i = anyEmpty;
    simpanProgres();
    renderQ();
  });
  $("back").addEventListener("click", () => { if (state.i > 0) { state.i--; simpanProgres(); renderQ(); } });
  $("lihat").addEventListener("click", async () => {
    const b = $("lihat");
    b.disabled = true; b.setAttribute("aria-busy", "true"); b.textContent = "Menyiapkan hasil…";
    await pastikanTersimpan();
    b.disabled = false; b.removeAttribute("aria-busy"); b.textContent = "Lihat hasil";
    if (state.ans.some((a) => !a)) { state.i = state.ans.findIndex((a) => !a); renderQ(); toast("Masih ada pertanyaan yang belum dijawab."); return; }
    state.selesai = true; simpanProgres();
    renderResult(); show("hasil");
  });

  /* ========== 4. HASIL ========== */
  function holland(sc) { return [...ORDER].sort((a, b) => sc[b] - sc[a]).slice(0, 3); }
  function matchScore(sc, code) {
    const w = [3, 2, 1]; let s = 0;
    code.split("").forEach((t, k) => { s += sc[t] * w[k]; });
    return Math.round(s / 6 * 100);
  }
  function ranking(sc, filter) {
    return Object.entries(R.rumpun)
      .map(([id, r]) => ({ id, ...r, m: matchScore(sc, r.code), s: summary[id] }))
      .filter((r) => r.s && (filter === "semua" || r.kelompok === filter))
      .sort((a, b) => b.m - a.m || b.s.nPtn - a.s.nPtn);
  }

  function renderResult() {
    const sc = scores(), code = holland(sc);
    state.hasil = { sc, code };
    const panggilan = state.nama ? esc(state.nama.split(" ")[0]) + ", kamu" : "Kamu";
    $("res-title").innerHTML = `${panggilan} adalah seorang ${R.types[code[0]].id}.`;
    $("res-code").innerHTML = code.map((t) => `<span title="${R.types[t].name}">${t}</span>`).join("");
    $("res-types").innerHTML = code.map((t) =>
      `<div class="type"><h3>${R.types[t].id} <small>(${R.types[t].name}, ${Math.round(sc[t] * 100)}%)</small></h3><p>${R.types[t].desc}</p></div>`).join("");
    $("hex-result").innerHTML = hexSVG(sc);

    $("jalur-note").innerHTML = state.jalur === "SNBP"
      ? `Data daya tampung dan peminat di bawah ini adalah data resmi <strong>jalur SNBP</strong> dari SNPMB, diperbarui ${D.meta.diperbarui}.`
      : `Rekomendasi jurusan berlaku untuk semua jalur. Data daya tampung dan peminat yang tersedia saat ini adalah <strong>jalur SNBP</strong>; data SNBT sedang kami siapkan. Untuk SNBT, cek daya tampungnya di <a href="https://snpmb.id" target="_blank" rel="noopener">snpmb.id</a>.`;

    $("filters").innerHTML = [["semua", "Semua"], ["saintek", "Saintek"], ["soshum", "Soshum"], ["campuran", "Bisa dari semua jurusan"]]
      .map(([v, l]) => `<button class="chip" type="button" data-f="${v}" aria-pressed="${state.filter === v}">${l}</button>`).join("");
    renderRecs(sc);
  }

  function rowsTable(list) {
    return `<div class="tbl"><table>
      <thead><tr><th>PTN</th><th>Prodi</th><th>Jenjang</th><th>Daya tampung 2026</th><th>Peminat 2025</th><th>Keketatan 2025</th></tr></thead>
      <tbody>${list.map((r) => {
        const k = keketatan(r);
        return `<tr><td>${esc(title(r.ptn))}</td><td>${esc(title(r.prodi))}<small>Kode ${r.kode}</small></td><td>${r.jenjang}</td>
          <td class="num">${fmt(r.dt26)}</td><td class="num">${r.pem25 == null ? "—" : fmt(r.pem25)}</td>
          <td class="num ${k.cls}">${k.text}<small>${k.sub}</small></td></tr>`;
      }).join("")}</tbody></table></div>`;
  }

  function renderRecs(sc) {
    const list = ranking(sc, state.filter).slice(0, 8);
    if (!list.length) { $("recs").innerHTML = `<p class="empty">Belum ada rumpun prodi di kelompok ini. Coba pilih filter lain.</p>`; return; }
    $("recs").innerHTML = list.map((r) => {
      const all = rows[r.id] || [];
      const pop = all.filter((x) => x.grup === "P"), alt = all.filter((x) => x.grup === "A");
      return `<article class="rec">
        <div class="rec-head">
          <div><h3>${r.label}</h3><p class="desc">${r.desc}</p>
            <div class="tags">${r.code.split("").map((t) => `<span class="tag">${R.types[t].id}</span>`).join("")}</div></div>
          <div class="match"><b>${r.m}%</b><small>kecocokan</small></div>
        </div>
        <div class="facts">
          <span>Dibuka di <strong>${fmt(r.s.nPtn)} PTN</strong></span>
          <span><strong>${fmt(r.s.nProdi)}</strong> program studi</span>
          <span><strong>${fmt(r.s.dt)}</strong> kursi SNBP 2026</span>
        </div>
        <p class="desc"><strong>Contoh karier:</strong> ${r.karier}</p>
        <details>
          <summary>Lihat PTN dan tingkat persaingannya</summary>
          <p class="subhead">Paling diminati</p>
          <p class="subnote">5 prodi dengan peminat SNBP 2025 terbanyak di rumpun ini.</p>
          ${rowsTable(pop)}
          ${alt.length ? `<p class="subhead">Peluang lebih besar</p><p class="subnote">Prodi dengan persentase diterima tertinggi di SNBP 2025 (minimal 20 peminat).</p>${rowsTable(alt)}` : ""}
        </details>
      </article>`;
    }).join("");
  }

  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.filter = b.dataset.f;
    document.querySelectorAll("#filters .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderRecs(scores());
  });
  $("ulang").addEventListener("click", () => {
    if (!confirm("Ulangi tes dari awal? Jawabanmu sebelumnya akan dihapus.")) return;
    state.ans.fill(0); state.i = 0; state.filter = "semua"; state.selesai = false;
    simpanProgres();
    show("tes"); renderQ();
  });

  /* ========== 5. INSTAGRAM STORY ========== */
  let storyFile = null, storyUrl = "";
  $("btn-story").addEventListener("click", async () => {
    const btn = $("btn-story");
    btn.disabled = true;
    try {
      const { sc, code } = state.hasil;
      const site = (CFG.SITE_URL || location.host || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      const blob = await window.buatStory({
        nama: state.nama.split(" ")[0], code, scores: sc, order: ORDER, types: R.types,
        top3: ranking(sc, "semua").slice(0, 3).map((r) => ({ label: r.label, m: r.m })),
        url: site || "cerebrum.id", instagram: CFG.INSTAGRAM || "@cerebrum.id",
        logoSrc: $("logo").src,
        tema: CFG.STORY_TEMA
      });
      storyFile = new File([blob], "hasil-tes-minat-cerebrum.png", { type: "image/png" });
      if (storyUrl) URL.revokeObjectURL(storyUrl);
      storyUrl = URL.createObjectURL(blob);
      $("story-img").src = storyUrl;
      const bisaShare = !!(navigator.canShare && navigator.canShare({ files: [storyFile] }));
      $("story-share").classList.toggle("hidden", !bisaShare);
      $("story-hint").textContent = DI_APLIKASI
        ? "Kamu membuka lewat aplikasi (misalnya Instagram). Tekan lama gambar di bawah lalu pilih Simpan. Kalau tidak bisa, ketuk menu ⋯ di pojok kanan atas, pilih Buka di browser, lalu ulangi."
        : bisaShare
          ? "Ketuk Bagikan lalu pilih Instagram, atau unduh gambarnya dulu lalu unggah ke Story."
          : "Unduh gambar ini, lalu unggah ke Instagram Story dari HP-mu.";
      openModal("m-story");
    } catch (err) {
      console.error(err);
      toast("Gambar gagal dibuat. Coba lagi, atau buka di browser Chrome/Safari.");
    } finally { btn.disabled = false; }
  });
  $("story-share").addEventListener("click", async () => {
    try {
      await navigator.share({ files: [storyFile], title: "Hasil Tes Minat & Bakat", text: `Hasil tes minat & bakatku bareng Cerebrum ${CFG.INSTAGRAM || ""}` });
    } catch (e) { /* dibatalkan pengguna */ }
  });
  $("story-download").addEventListener("click", () => {
    if (DI_APLIKASI) toast("Kalau gambar tidak tersimpan, tekan lama gambarnya lalu pilih Simpan.");
    const a = document.createElement("a");
    a.href = storyUrl; a.download = storyFile.name;
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("story-close").addEventListener("click", () => closeModal("m-story"));
  $("m-story").addEventListener("click", (e) => { if (e.target.id === "m-story") closeModal("m-story"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("m-story").classList.contains("hidden")) closeModal("m-story"); });

  /* ===== POKA-YOKE 4: progres tersimpan di perangkat, tidak hilang kalau ter-refresh ===== */
  function bacaJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function tulisJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function hapusProgres() { try { localStorage.removeItem(KUNCI_PROGRES); } catch (e) {} }
  function simpanProgres() {
    const data = { ts: Date.now(), nama: state.nama, wa: state.wa, sekolah: state.sekolah, npsn: state.npsn, jalur: state.jalur,
      pesertaId: state.pesertaId, ans: state.ans, i: state.i, mulai: !!state.mulai, selesai: !!state.selesai,
      /* bukti hanya disimpan selama belum terkirim */
      bukti: state.pesertaId ? [] : state.bukti.map((b) => b && { mime: b.mime, data: b.data, preview: b.preview }) };
    if (!tulisJSON(KUNCI_PROGRES, data)) { data.bukti = []; tulisJSON(KUNCI_PROGRES, data); }
  }

  /* ===== POKA-YOKE 5: halaman cek kesehatan untuk admin (buka dengan ?cek=1) ===== */
  async function halamanCek() {
    closeModal("m-syarat");
    const baris = [];
    const tambah = (ok, judul, ket) => baris.push({ ok, judul, ket });
    tambah(!CONFIG_HILANG, "config.js terbaca", CONFIG_HILANG ? "File config.js hilang atau ada salah ketik (tanda kutip/koma)." : "OK");
    tambah(!!API && !API_SALAH, "Alamat Apps Script", !API ? "APPS_SCRIPT_URL masih kosong (mode demo)." : API_SALAH ? "Format salah. Harus https://script.google.com/macros/s/…/exec" : "Format benar");
    tambah(!fileTidakSinkron.length, "Semua file versi " + VERSI, fileTidakSinkron.length ? "Belum diperbarui: " + fileTidakSinkron.map((f) => f + " (" + versiFile[f] + ")").join(", ") + ". Pastikan diupload ke folder yang benar." : "Sinkron");
    if (API && !API_SALAH) {
      try {
        const r = await apiGet({ action: "cek" });
        if (r && r.versi) {
          tambah(true, "Backend Google terhubung", "Versi backend " + r.versi);
          tambah(r.syarat > 0, "Syarat aktif di tab Syarat", r.syarat + " syarat");
          tambah(true, "Tab Sekolah", r.sekolah > 0 ? r.sekolah + " sekolah (pencarian aktif)" : "Masih kosong (asal sekolah diisi bebas)");
          tambah(true, "Peserta terdaftar", r.peserta + " baris di tab Peserta");
          tambah(!!r.folder, "Folder bukti di Drive", r.folder ? "OK" : "Tidak ditemukan. Jalankan fungsi setup lagi.");
        } else {
          tambah(false, "Backend Google terhubung", "Terhubung, tapi Code.gs masih versi lama. Deploy versi baru (Manage deployments → Edit → New version).");
        }
      } catch (e) {
        tambah(false, "Backend Google terhubung", "Tidak bisa dihubungi. Cek URL dan pastikan akses Web app = Anyone.");
      }
    }
    tambah(!!(window.localStorage), "Penyimpanan progres di browser", window.localStorage ? "Tersedia" : "Tidak tersedia");
    const main = document.querySelector("main");
    main.innerHTML = '<section class="panel" style="max-width:720px;margin:0 auto"><h1 style="font-size:1.6rem;margin:0 0 6px">Cek kesehatan sistem</h1>' +
      '<p class="muted" style="margin:0 0 18px">Halaman khusus admin. Semua harus ✅ sebelum event dibagikan.</p>' +
      baris.map((b) => '<div style="display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--line)"><span style="font-size:1.2rem">' + (b.ok ? "✅" : "❌") + '</span><div><strong>' + esc(b.judul) + '</strong><div class="muted" style="margin:2px 0 0">' + esc(b.ket) + '</div></div></div>').join("") +
      '<p class="hint">Versi web: ' + VERSI + '</p></section>';
  }

  /* ---------- Footer & mulai ---------- */
  $("src").textContent = `${D.meta.sumber}, jalur ${D.meta.jalur}, diperbarui ${D.meta.diperbarui}. Mencakup ${fmt(D.meta.nasional.prodi)} prodi di ${D.meta.nasional.ptn} PTN dengan total ${fmt(D.meta.nasional.dayaTampung)} kursi.`;
  $("yr").textContent = new Date().getFullYear();
  if (DEMO) { $("demo-bar").classList.remove("hidden"); $("sekolah-hint").textContent = ""; }
  if (MASALAH_CONFIG) {
    const bar = $("demo-bar");
    bar.textContent = "Perhatian: pengaturan web bermasalah (" + MASALAH_CONFIG + "), jadi data peserta TIDAK tersimpan. Admin, buka halaman ini dengan ?cek=1.";
    bar.style.background = "#B4442A"; bar.style.color = "#fff";
  }
  const vEl = document.createElement("span");
  vEl.textContent = " · v" + VERSI; vEl.style.opacity = ".6";
  $("yr").parentNode.appendChild(vEl);

  /* Peringatan sebelum menutup halaman di tengah tes */
  window.addEventListener("beforeunload", (e) => {
    if (!$("v-tes").classList.contains("hidden") && state.ans.some(Boolean)) { e.preventDefault(); e.returnValue = ""; }
  });

  if (/[?&]cek=1/.test(location.search)) { halamanCek(); return; }

  /* Lanjutkan tes yang belum selesai (misalnya halaman tertutup atau ter-refresh) */
  const p = bacaJSON(KUNCI_PROGRES);
  const masihBaru = p && Date.now() - (p.ts || 0) < 24 * 3600 * 1000;
  if (masihBaru && p.mulai && !p.selesai && Array.isArray(p.ans) && p.ans.length === state.ans.length &&
      confirm("Kamu punya tes yang belum selesai (" + p.ans.filter(Boolean).length + " dari " + p.ans.length + " terjawab). Lanjutkan?")) {
    Object.assign(state, { nama: p.nama, wa: p.wa, sekolah: p.sekolah, npsn: p.npsn, jalur: p.jalur, setuju: true,
      pesertaId: p.pesertaId || "", bukti: p.bukti || [], ans: p.ans, i: Math.min(p.i || 0, p.ans.length - 1), mulai: true });
    if (!state.pesertaId) kirimPendaftaran();
    show("tes"); renderQ();
    muatSyarat();
  } else {
    if (p && !masihBaru) hapusProgres();
    show("profil");
    openModal("m-syarat");
    muatSyarat();
  }
  /* Panaskan font Story di latar supaya tombol Bagikan lebih cepat */
  if (window.requestIdleCallback) requestIdleCallback(() => { if (window.siapkanFontStory) window.siapkanFontStory(); });
  else setTimeout(() => { if (window.siapkanFontStory) window.siapkanFontStory(); }, 3000);
})();
