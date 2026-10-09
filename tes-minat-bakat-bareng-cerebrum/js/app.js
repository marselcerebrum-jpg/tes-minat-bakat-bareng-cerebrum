(function () {
  "use strict";

  const CFG = window.CONFIG || {};
  const R = window.RIASEC;
  const D = window.SNBP_DATA;
  const ORDER = R.order;
  const API = (CFG.APPS_SCRIPT_URL || "").trim();
  const DEMO = !API;
  const $ = (id) => document.getElementById(id);
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
        const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        const dataUrl = cv.toDataURL("image/jpeg", 0.82);
        resolve({ mime: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File bukan gambar yang valid.")); };
      img.src = url;
    });
  }

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
  async function muatSyarat() {
    if (DEMO) { state.syarat = CFG.SYARAT_DEMO || []; return; }
    try {
      const r = await apiGet({ action: "syarat" });
      if (!r.ok) throw new Error(r.pesan);
      state.syarat = r.syarat || [];
    } catch (e) {
      $("syarat-error").textContent = "Syarat gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.";
      $("syarat-error").classList.remove("hidden");
      state.syarat = [];
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
      state.bukti[i] = await kompres(file);
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
    state.sekolah = sekolahTersedia ? "" : q; state.npsn = "";
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
    if (!sekolahTersedia) state.sekolah = inpS.value.trim();

    if (!cekSyarat()) { tampilError("Unggah bukti syarat terlebih dahulu."); renderSyarat(); openModal("m-syarat"); return; }
    if (state.nama.length < 2) { tampilError("Isi nama lengkapmu."); $("nama").focus(); return; }
    if (!state.wa) { tampilError("Nomor WhatsApp belum benar. Contoh: 081234567890."); $("wa").focus(); return; }
    if (!state.sekolah) { tampilError(sekolahTersedia ? "Pilih asal sekolah dari daftar, atau pilih opsi \"Sekolahku tidak ada di daftar\"." : "Isi asal sekolahmu."); inpS.focus(); return; }
    if (!state.jalur) { tampilError("Pilih rencana jalur masuk."); return; }
    if (!state.setuju) { tampilError("Centang persetujuan terlebih dahulu."); $("setuju").focus(); return; }
    tampilError("");

    const btn = $("mulai");
    btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = "Menyimpan data…";
    try {
      if (!DEMO) {
        const r = await apiPost({
          action: "daftar", nama: state.nama, wa: state.wa, sekolah: state.sekolah, npsn: state.npsn, setuju: true,
          bukti: state.bukti.map((b) => ({ mime: b.mime, data: b.data }))
        });
        if (!r.ok) throw new Error(r.pesan || "Gagal menyimpan data.");
        state.pesertaId = r.id;
      }
      show("tes"); renderQ();
    } catch (err) {
      tampilError(err.message.startsWith("Gagal") || err.message.includes("tidak valid") ? err.message : "Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
    } finally {
      btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = "Mulai tes minat";
    }
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
  $("scale").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    state.ans[state.i] = +b.dataset.v;
    const next = state.ans.findIndex((a, k) => !a && k > state.i);
    const anyEmpty = state.ans.findIndex((a) => !a);
    if (next > -1) state.i = next; else if (anyEmpty > -1) state.i = anyEmpty;
    renderQ();
  });
  $("back").addEventListener("click", () => { if (state.i > 0) { state.i--; renderQ(); } });
  $("lihat").addEventListener("click", () => { renderResult(); show("hasil"); });

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
    state.ans.fill(0); state.i = 0; state.filter = "semua";
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
      $("story-hint").textContent = bisaShare
        ? "Ketuk Bagikan lalu pilih Instagram, atau unduh gambarnya dulu lalu unggah ke Story."
        : "Unduh gambar ini, lalu unggah ke Instagram Story dari HP-mu.";
      openModal("m-story");
    } finally { btn.disabled = false; }
  });
  $("story-share").addEventListener("click", async () => {
    try {
      await navigator.share({ files: [storyFile], title: "Hasil Tes Minat & Bakat", text: `Hasil tes minat & bakatku bareng Cerebrum ${CFG.INSTAGRAM || ""}` });
    } catch (e) { /* dibatalkan pengguna */ }
  });
  $("story-download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = storyUrl; a.download = storyFile.name;
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("story-close").addEventListener("click", () => closeModal("m-story"));
  $("m-story").addEventListener("click", (e) => { if (e.target.id === "m-story") closeModal("m-story"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("m-story").classList.contains("hidden")) closeModal("m-story"); });

  /* ---------- Footer & mulai ---------- */
  $("src").textContent = `${D.meta.sumber}, jalur ${D.meta.jalur}, diperbarui ${D.meta.diperbarui}. Mencakup ${fmt(D.meta.nasional.prodi)} prodi di ${D.meta.nasional.ptn} PTN dengan total ${fmt(D.meta.nasional.dayaTampung)} kursi.`;
  $("yr").textContent = new Date().getFullYear();
  if (DEMO) { $("demo-bar").classList.remove("hidden"); $("sekolah-hint").textContent = ""; }

  show("profil");
  openModal("m-syarat");
  muatSyarat().then(renderSyarat);
})();
