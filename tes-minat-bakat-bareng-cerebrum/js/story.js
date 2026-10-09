/*
 * Generator gambar Instagram Story (1080 x 1920) — gaya Pop Art.
 * Konten penting dijaga di area aman (sekitar 230 px dari atas dan bawah)
 * supaya tidak tertutup tampilan Instagram.
 */
(function () {
  "use strict";

  const W = 1080, H = 1920;
  /* Tema warna. Pilih lewat CONFIG.STORY_TEMA di js/config.js */
  const TEMA = {
    "maroon-krem": {
      bg: "#8A1C1C", ray: "#7E1919", dots: ["rgba(255,255,255,.09)", "rgba(255,241,220,.14)", "rgba(0,0,0,.14)"],
      kicker: "#FFF1DC", kickerText: "#8A1C1C", bubble: "#FFFFFF", typeFill: "#8A1C1C",
      burst: "#F2D7B6", burstText: "#8A1C1C", burstLabel: "#1A1011",
      card: "#FFF8EE", cardDots: "rgba(138,28,28,.14)", chart: "rgba(138,28,28,.6)",
      bars: ["#8A1C1C", "#B5651D", "#E4C59E"], label: "#1A1011", labelText: "#FFF1DC",
      stickers: ["#FFFFFF", "#FFF1DC", "#F2D7B6"], num: "#8A1C1C", pct: "#8A1C1C",
      cta: "#FFF8EE", ctaText: "#1A1011"
    },
    "maroon-mustard": {
      bg: "#8A1C1C", ray: "#7E1919", dots: ["rgba(255,255,255,.08)", "rgba(242,183,5,.18)", "rgba(0,0,0,.14)"],
      kicker: "#F2B705", kickerText: "#1A1011", bubble: "#FFFFFF", typeFill: "#8A1C1C",
      burst: "#F2B705", burstText: "#8A1C1C", burstLabel: "#1A1011",
      card: "#FFFFFF", cardDots: "rgba(242,183,5,.35)", chart: "rgba(138,28,28,.6)",
      bars: ["#8A1C1C", "#F2B705", "#1A1011"], label: "#1A1011", labelText: "#F2B705",
      stickers: ["#FFFFFF", "#FFFFFF", "#FFFFFF"], num: "#F2B705", pct: "#8A1C1C",
      cta: "#FFFFFF", ctaText: "#1A1011", numStroke: true
    },
    "krem-maroon": {
      bg: "#FBEFE3", ray: "#F6E3D1", dots: ["rgba(138,28,28,.14)", "rgba(138,28,28,.10)", "rgba(138,28,28,.08)"],
      kicker: "#8A1C1C", kickerText: "#FFFFFF", bubble: "#FFFFFF", typeFill: "#8A1C1C",
      burst: "#8A1C1C", burstText: "#FFFFFF", burstLabel: "#FBEFE3",
      card: "#FFFFFF", cardDots: "rgba(138,28,28,.12)", chart: "rgba(138,28,28,.6)",
      bars: ["#8A1C1C", "#B84A4A", "#E2A9A9"], label: "#8A1C1C", labelText: "#FFFFFF",
      stickers: ["#FFFFFF", "#FFFFFF", "#FFFFFF"], num: "#8A1C1C", pct: "#8A1C1C",
      cta: "#8A1C1C", ctaText: "#FFFFFF"
    },
    "maroon-monokrom": {
      bg: "#8A1C1C", ray: "#801A1A", dots: ["rgba(0,0,0,.22)", "rgba(0,0,0,.2)", "rgba(255,255,255,.07)"],
      kicker: "#1A1011", kickerText: "#FFFFFF", bubble: "#FFFFFF", typeFill: "#8A1C1C",
      burst: "#1A1011", burstText: "#FFFFFF", burstLabel: "#FFFFFF",
      card: "#FFFFFF", cardDots: "rgba(26,16,17,.12)", chart: "rgba(138,28,28,.65)",
      bars: ["#8A1C1C", "#1A1011", "#9A8A8A"], label: "#FFFFFF", labelText: "#1A1011",
      stickers: ["#FFFFFF", "#FFFFFF", "#FFFFFF"], num: "#8A1C1C", pct: "#1A1011",
      cta: "#1A1011", ctaText: "#FFFFFF"
    }
  };
  const INK = "#1A1011";
  let C = TEMA["krem-maroon"];

  /* Font khusus Story disimpan di dalam web (assets/fonts), bukan dari Google Fonts,
     supaya hasilnya SELALU sama, termasuk di browser bawaan Instagram atau sinyal lemah. */
  const POP = '"TMB Bangers", Impact, sans-serif';
  const HEAD = '"TMB Montserrat", sans-serif';
  const BODY = '"TMB Jakarta", sans-serif';
  const FONT_STORY = [
    ["TMB Bangers", "assets/fonts/bangers-400.woff2", "400"],
    ["TMB Montserrat", "assets/fonts/montserrat-800.woff2", "800"],
    ["TMB Jakarta", "assets/fonts/jakarta-600.woff2", "600"],
    ["TMB Jakarta", "assets/fonts/jakarta-700.woff2", "700"]
  ];
  const CTA_1 = "Cek minat & bakat kamu sekarang di";
  const CTA_2 = "Cerebrum App di Play Store / App Store";

  /* Muat semua font Story dan PASTIKAN siap sebelum menggambar */
  let janjiFont = null;
  function muatSatuFont(fam, url, weight, coba) {
    return new FontFace(fam, `url(${url}) format("woff2")`, { weight: weight, style: "normal", display: "block" })
      .load()
      .then((f) => { document.fonts.add(f); return true; })
      .catch(() => (coba > 0 ? new Promise((r) => setTimeout(r, 800)).then(() => muatSatuFont(fam, url, weight, coba - 1)) : false));
  }
  function pastikanFontPop() {
    if (!janjiFont) {
      janjiFont = Promise.all(FONT_STORY.map(([fam, url, w]) => muatSatuFont(fam, url, w, 2)))
        .then((hasil) => {
          const siap = hasil.every(Boolean) && FONT_STORY.every(([fam, , w]) => document.fonts.check(`${w} 40px "${fam}"`));
          if (!siap) janjiFont = null;   /* boleh dicoba lagi nanti */
          return siap;
        });
    }
    return janjiFont;
  }

  function loadImg(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  function hexPts(cx, cy, r) {
    return [0, 1, 2, 3, 4, 5].map((k) => {
      const a = (-90 + k * 60) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  }

  /* Bentuk "ditempel": bayangan keras hitam + garis tepi tebal */
  function stiker(ctx, pathFn, fill, opt) {
    const o = Object.assign({ shadow: 14, lw: 7 }, opt || {});
    ctx.save();
    ctx.translate(o.shadow, o.shadow);
    pathFn(); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
    pathFn(); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = o.lw; ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.stroke();
  }

  /* Teks bergaya komik: isi warna + outline hitam + bayangan */
  function teksPop(ctx, text, x, y, o) {
    const opt = Object.assign({ size: 80, fill: "#FFFFFF", lw: 10, shadow: 8, font: POP, weight: "" }, o || {});
    ctx.font = `${opt.weight} ${opt.size}px ${opt.font}`.trim();
    ctx.lineJoin = "round"; ctx.miterLimit = 2;
    if (opt.shadow) {
      ctx.fillStyle = INK; ctx.strokeStyle = INK;
      if (opt.lw > 0) { ctx.lineWidth = opt.lw; ctx.strokeText(text, x + opt.shadow, y + opt.shadow); }
      ctx.fillText(text, x + opt.shadow, y + opt.shadow);
    }
    if (opt.lw > 0) { ctx.strokeStyle = INK; ctx.lineWidth = opt.lw; ctx.strokeText(text, x, y); }
    ctx.fillStyle = opt.fill; ctx.fillText(text, x, y);
  }

  /* Perkecil ukuran font sampai teks muat */
  function ukuranMuat(ctx, text, maxW, size, font, weight) {
    let s = size;
    do { ctx.font = `${weight || ""} ${s}px ${font}`.trim(); if (ctx.measureText(text).width <= maxW) break; s -= 4; } while (s > 20);
    return s;
  }
  function potong(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t.trim() + "…";
  }

  /* Pola titik halftone yang membesar ke arah satu titik pusat */
  function halftone(ctx, cx, cy, radius, color, step, maxDot) {
    ctx.fillStyle = color;
    for (let y = cy - radius; y < cy + radius; y += step) {
      for (let x = cx - radius; x < cx + radius; x += step) {
        const off = (Math.round((y - cy) / step) % 2) * step / 2;
        const px = x + off, d = Math.hypot(px - cx, y - cy);
        if (d > radius) continue;
        const r = maxDot * (1 - d / radius);
        if (r < .8) continue;
        ctx.beginPath(); ctx.arc(px, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function starburst(cx, cy, rOut, rIn, n, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? rIn : rOut * (i % 4 === 0 ? 1 : .9);
      const a = rot + i * Math.PI / n;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  async function buatStory(o) {
    if (!(await pastikanFontPop())) {
      throw new Error("FONT_BELUM_SIAP");
    }
    C = TEMA[o.tema] || TEMA["krem-maroon"];

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

    /* ---- Latar: sinar matahari kuning + halftone ---- */
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const sx = 540, sy = 760, rays = 28;
    ctx.fillStyle = C.ray;
    for (let i = 0; i < rays; i += 2) {
      const a1 = i * 2 * Math.PI / rays, a2 = (i + 1) * 2 * Math.PI / rays;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 2400 * Math.cos(a1), sy + 2400 * Math.sin(a1));
      ctx.lineTo(sx + 2400 * Math.cos(a2), sy + 2400 * Math.sin(a2));
      ctx.closePath(); ctx.fill();
    }
    halftone(ctx, 0, 0, 520, C.dots[0], 30, 11);
    halftone(ctx, W, H, 560, C.dots[1], 30, 11);
    halftone(ctx, W, 980, 300, C.dots[2], 28, 9);

    /* ---- Logo dalam pil putih, sedikit miring ---- */
    const logo = await loadImg(o.logoSrc);
    const lh = 50, lw = logo ? logo.width / logo.height * lh : 300;
    const pw = lw + 60, ph = lh + 36;
    ctx.save(); ctx.translate(W / 2, 275); ctx.rotate(-.04);
    stiker(ctx, () => roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2), "#FFFFFF", { shadow: 10, lw: 6 });
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    if (logo) ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
    ctx.restore();

    /* ---- Label pink "HASIL TES MINAT & BAKAT" ---- */
    ctx.save(); ctx.translate(W / 2, 380); ctx.rotate(.03);
    ctx.font = `48px ${POP}`;
    const kw = ctx.measureText("HASIL TES MINAT & BAKAT").width + 70;
    stiker(ctx, () => roundRect(ctx, -kw / 2, -42, kw, 76, 14), C.kicker, { shadow: 9, lw: 6 });
    teksPop(ctx, "HASIL TES MINAT & BAKAT", 0, 14, { size: 48, fill: C.kickerText, lw: 0, shadow: 0 });
    ctx.restore();

    /* ---- Balon kata ---- */
    const bx = 70, by = 450, bw = 700, bh = 300;
    const bubble = () => {
      ctx.beginPath();
      ctx.moveTo(bx + 40, by);
      ctx.lineTo(bx + bw - 40, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 40);
      ctx.lineTo(bx + bw, by + bh - 40); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 40, by + bh);
      ctx.lineTo(bx + 230, by + bh); ctx.lineTo(bx + 120, by + bh + 80); ctx.lineTo(bx + 150, by + bh);
      ctx.lineTo(bx + 40, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 40);
      ctx.lineTo(bx, by + 40); ctx.quadraticCurveTo(bx, by, bx + 40, by);
      ctx.closePath();
    };
    stiker(ctx, bubble, C.bubble, { shadow: 16, lw: 8 });
    const cxB = bx + bw / 2;
    const sapa = o.nama ? `Hai, aku ${o.nama}!` : "Hai, kenalan yuk!";
    ctx.fillStyle = INK;
    const sSapa = ukuranMuat(ctx, sapa, bw - 80, 50, HEAD, "800");
    ctx.font = `800 ${sSapa}px ${HEAD}`; ctx.fillText(sapa, cxB, by + 80);
    ctx.font = `700 38px ${BODY}`; ctx.fillStyle = "#4A3B3C";
    ctx.fillText("Ternyata aku tuh si…", cxB, by + 133);
    const tipe = o.types[o.code[0]].id.toUpperCase() + "!";
    const sTipe = ukuranMuat(ctx, tipe, bw - 90, 136, POP, "");
    teksPop(ctx, tipe, cxB, by + 262, { size: sTipe, fill: C.typeFill, lw: 12, shadow: 9 });

    /* ---- Ledakan komik berisi kode Holland ---- */
    const kx = 865, ky = 520;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(.12);
    stiker(ctx, () => poly(ctx, starburst(0, 0, 175, 118, 14, 0)), C.burst, { shadow: 14, lw: 8 });
    ctx.restore();
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(.12);
    teksPop(ctx, "KODEKU", 0, -48, { size: 40, fill: C.burstLabel, lw: 0, shadow: 0 });
    teksPop(ctx, o.code.join(""), 0, 58, { size: 112, fill: C.burstText, lw: 11, shadow: 7 });
    ctx.restore();

    /* ---- Kartu grafik ---- */
    const gx = 120, gy = 845, gw = 840, gh = 380;
    ctx.save(); ctx.translate(W / 2, gy + gh / 2); ctx.rotate(-.02);
    stiker(ctx, () => roundRect(ctx, -gw / 2, -gh / 2, gw, gh, 36), C.card, { shadow: 16, lw: 8 });
    halftone(ctx, gw / 2 - 40, -gh / 2 + 40, 150, C.cardDots, 20, 6);
    const cx = -165, cy = 8, R = 122;
    ctx.strokeStyle = "rgba(20,16,16,.18)"; ctx.lineWidth = 3;
    [1 / 3, 2 / 3, 1].forEach((f) => { poly(ctx, hexPts(cx, cy, R * f)); ctx.stroke(); });
    const shape = o.order.map((t, k) => {
      const a = (-90 + k * 60) * Math.PI / 180, r = Math.max(.06, o.scores[t]) * R;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
    poly(ctx, shape); ctx.fillStyle = C.chart; ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.stroke();
    hexPts(cx, cy, R + 34).forEach(([x, y], k) => {
      ctx.fillStyle = INK; ctx.font = `40px ${POP}`; ctx.fillText(o.order[k], x, y + 14);
    });
    /* Tiga tipe teratas dengan bar skor */
    ctx.textAlign = "left";
    o.code.forEach((t, i) => {
      const yy = -100 + i * 90, xx = 30;
      ctx.fillStyle = INK; ctx.font = `44px ${POP}`;
      ctx.fillText(`${t} · ${o.types[t].id.toUpperCase()}`, xx, yy);
      const bwid = 270, pct = Math.round(o.scores[t] * 100);
      roundRect(ctx, xx, yy + 16, bwid, 28, 14); ctx.fillStyle = "#FFFFFF"; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      roundRect(ctx, xx, yy + 16, Math.max(28, bwid * o.scores[t]), 28, 14);
      ctx.fillStyle = C.bars[i]; ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = `800 24px ${HEAD}`;
      ctx.fillText(pct + "%", xx + bwid + 14, yy + 40);
    });
    ctx.textAlign = "center";
    ctx.restore();

    /* ---- Stiker prodi paling cocok ---- */
    ctx.save(); ctx.translate(250, 1285); ctx.rotate(-.05);
    ctx.font = `40px ${POP}`;
    const hw = ctx.measureText("PRODI PALING COCOK").width + 50;
    stiker(ctx, () => roundRect(ctx, -hw / 2, -34, hw, 62, 12), C.label, { shadow: 0, lw: 0 });
    teksPop(ctx, "PRODI PALING COCOK", 0, 12, { size: 40, fill: C.labelText, lw: 0, shadow: 0 });
    ctx.restore();

    const warna = C.stickers;
    o.top3.forEach((r, i) => {
      const yy = 1360 + i * 74, rot = [.02, -.015, .025][i];
      ctx.save(); ctx.translate(W / 2, yy); ctx.rotate(rot);
      const sw = 820, sh = 60;
      stiker(ctx, () => roundRect(ctx, -sw / 2, -sh / 2, sw, sh, 18), warna[i], { shadow: 8, lw: 6 });
      ctx.textAlign = "left";
      teksPop(ctx, "#" + (i + 1), -sw / 2 + 22, 16, { size: 46, fill: C.num, lw: C.numStroke ? 6 : 0, shadow: 0 });
      ctx.fillStyle = INK; ctx.font = `800 34px ${HEAD}`;
      ctx.fillText(potong(ctx, r.label, sw - 250), -sw / 2 + 100, 12);
      ctx.textAlign = "right";
      teksPop(ctx, r.m + "%", sw / 2 - 34, 16, { size: 46, fill: C.pct, lw: 0, shadow: 0 });
      ctx.restore();
    });
    ctx.textAlign = "center";

    /* ---- CTA ---- */
    ctx.save(); ctx.translate(W / 2, 1632); ctx.rotate(-.015);
    const cw = 940, ch = 124;
    stiker(ctx, () => roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 22), C.cta, { shadow: 12, lw: 6 });
    ctx.fillStyle = C.ctaText;
    const s1 = ukuranMuat(ctx, CTA_1, cw - 80, 36, BODY, "600");
    ctx.font = `600 ${s1}px ${BODY}`; ctx.fillText(CTA_1, 0, -10);
    const s2 = ukuranMuat(ctx, CTA_2, cw - 80, 38, HEAD, "800");
    ctx.font = `800 ${s2}px ${HEAD}`; ctx.fillText(CTA_2, 0, 40);
    ctx.restore();

    return new Promise((res) => cv.toBlob(res, "image/png"));
  }

  window.buatStory = buatStory;
  window.STORY_VERSI = "2026.10.11";
  window.siapkanFontStory = pastikanFontPop;
  window.STORY_TEMA = Object.keys(TEMA);
})();
