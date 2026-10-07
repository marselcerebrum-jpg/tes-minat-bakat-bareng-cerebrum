(function () {
  "use strict";

  const R = window.RIASEC;
  const D = window.SNBP_DATA;
  const ORDER = R.order;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Number(n).toLocaleString("id-ID");

  /* ---------- Data parsing ---------- */
  const summary = {};
  D.ringkasan.trim().split("\n").forEach((line) => {
    const [f, nProdi, nPtn, dt] = line.split("|");
    summary[f] = { nProdi: +nProdi, nPtn: +nPtn, dt: +dt };
  });

  const rows = {};
  D.prodi.trim().split("\n").forEach((line) => {
    const [f, kode, prodi, ptn, jenjang, dt26, pem25, dt25, grup] = line.split("|");
    (rows[f] = rows[f] || []).push({
      kode, prodi, ptn, jenjang,
      dt26: +dt26,
      pem25: pem25 === "" ? null : +pem25,
      dt25: dt25 === "" ? 0 : +dt25,
      grup
    });
  });

  /* ---------- Formatting helpers ---------- */
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
    const ratio = r.pem25 / r.dt25;
    const pct = (r.dt25 / r.pem25) * 100;
    let label, cls;
    if (pct < 8) { label = "Sangat ketat"; cls = "k-high"; }
    else if (pct < 20) { label = "Ketat"; cls = "k-mid"; }
    else { label = "Peluang lebih besar"; cls = "k-low"; }
    return { text: "1 : " + (ratio < 10 ? ratio.toFixed(1).replace(".", ",") : Math.round(ratio)), sub: label + " (" + pct.toFixed(1).replace(".", ",") + "% diterima)", cls };
  }

  /* ---------- State ---------- */
  const state = { nama: "", jalur: "", i: 0, ans: Array(R.questions.length).fill(0), filter: "semua" };

  function scores() {
    const sum = {}, cnt = {};
    ORDER.forEach((t) => { sum[t] = 0; cnt[t] = 0; });
    R.questions.forEach(([t], k) => { cnt[t]++; sum[t] += state.ans[k] || 0; });
    const out = {};
    ORDER.forEach((t) => { out[t] = sum[t] / (cnt[t] * 5); });
    return out;
  }

  /* ---------- Hexagon chart ---------- */
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

  /* ---------- Views ---------- */
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

  /* Profil */
  $("hex-intro").innerHTML = hexSVG({ R: .55, I: .8, A: .45, S: .7, E: .4, C: .6 });
  document.querySelectorAll(".chips[data-key]").forEach((grp) => {
    grp.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      grp.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      state[grp.dataset.key] = b.dataset.v;
      $("mulai").disabled = !state.jalur;
    });
  });
  $("nama").addEventListener("input", (e) => { state.nama = e.target.value.trim(); });
  $("mulai").addEventListener("click", () => { show("tes"); renderQ(); });

  /* Tes */
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
    $("hex-live").innerHTML = hexSVG(scores());
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

  /* Hasil */
  function holland(sc) { return [...ORDER].sort((a, b) => sc[b] - sc[a]).slice(0, 3); }
  function matchScore(sc, code) {
    const w = [3, 2, 1]; let s = 0;
    code.split("").forEach((t, k) => { s += sc[t] * w[k]; });
    return Math.round(s / 6 * 100);
  }

  function renderResult() {
    const sc = scores(), code = holland(sc);
    const who = state.nama ? esc(state.nama) + ", kamu" : "Kamu";
    $("res-title").innerHTML = `${who} adalah seorang ${R.types[code[0]].id}.`;
    $("res-code").innerHTML = code.map((t) => `<span title="${R.types[t].name}">${t}</span>`).join("");
    $("res-types").innerHTML = code.map((t) =>
      `<div class="type"><h3>${R.types[t].id} <small>(${R.types[t].name}, ${Math.round(sc[t] * 100)}%)</small></h3><p>${R.types[t].desc}</p></div>`).join("");
    $("hex-result").innerHTML = hexSVG(sc);

    const m = D.meta;
    $("jalur-note").innerHTML = state.jalur === "SNBP"
      ? `Data daya tampung dan peminat di bawah ini adalah data resmi <strong>jalur SNBP</strong> dari SNPMB, diperbarui ${m.diperbarui}.`
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
    const list = Object.entries(R.rumpun)
      .map(([id, r]) => ({ id, ...r, m: matchScore(sc, r.code), s: summary[id] }))
      .filter((r) => r.s && (state.filter === "semua" || r.kelompok === state.filter))
      .sort((a, b) => b.m - a.m || b.s.nPtn - a.s.nPtn)
      .slice(0, 8);

    if (!list.length) { $("recs").innerHTML = `<p class="empty">Belum ada rumpun prodi di kelompok ini. Coba pilih filter lain.</p>`; return; }

    $("recs").innerHTML = list.map((r) => {
      const all = rows[r.id] || [];
      const pop = all.filter((x) => x.grup === "P");
      const alt = all.filter((x) => x.grup === "A");
      return `<article class="rec">
        <div class="rec-head">
          <div>
            <h3>${r.label}</h3>
            <p class="desc">${r.desc}</p>
            <div class="tags">${r.code.split("").map((t) => `<span class="tag">${R.types[t].id}</span>`).join("")}</div>
          </div>
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
          ${alt.length ? `<p class="subhead">Peluang lebih besar</p>
          <p class="subnote">Prodi dengan persentase diterima tertinggi di SNBP 2025 (minimal 20 peminat).</p>
          ${rowsTable(alt)}` : ""}
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

  /* Footer */
  $("src").textContent = `${D.meta.sumber}, jalur ${D.meta.jalur}, diperbarui ${D.meta.diperbarui}. Mencakup ${fmt(D.meta.nasional.prodi)} prodi di ${D.meta.nasional.ptn} PTN dengan total ${fmt(D.meta.nasional.dayaTampung)} kursi.`;
  $("yr").textContent = new Date().getFullYear();

  show("profil");
})();
