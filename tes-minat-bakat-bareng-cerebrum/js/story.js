/*
 * Generator gambar Instagram Story (1080 x 1920) untuk hasil tes.
 * Konten penting dijaga di area aman (sekitar 250 px dari atas dan bawah)
 * supaya tidak tertutup tampilan Instagram.
 */
(function () {
  "use strict";

  const W = 1080, H = 1920;
  const C = {
    brand: "#8A1C1C", brandDark: "#6E1414", brandMid: "#A84040", soft: "#F6E6E5",
    ink: "#26191A", muted: "#6E5C5D", line: "#E6DADA", white: "#FFFFFF"
  };
  const HEAD = '"Montserrat", "Plus Jakarta Sans", system-ui, sans-serif';
  const BODY = '"Plus Jakarta Sans", system-ui, sans-serif';

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

  function hexPts(cx, cy, r) {
    return [0, 1, 2, 3, 4, 5].map((k) => {
      const a = (-90 + k * 60) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  }

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  /* Potong teks supaya muat dalam lebar tertentu */
  function fit(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t.trim() + "…";
  }

  async function buatStory(o) {
    try {
      await Promise.all([
        document.fonts.load('800 80px "Montserrat"'),
        document.fonts.load('700 40px "Montserrat"'),
        document.fonts.load('600 36px "Plus Jakarta Sans"')
      ]);
    } catch (e) { /* pakai font cadangan */ }

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");

    /* Latar maroon dengan pola segi enam */
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, C.brandMid); g.addColorStop(.45, C.brand); g.addColorStop(1, C.brandDark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 3;
    [[930, 260, 260], [930, 260, 170], [120, 1720, 300], [120, 1720, 200]].forEach(([x, y, r]) => { poly(ctx, hexPts(x, y, r)); ctx.stroke(); });

    /* Logo dalam pil putih */
    const logo = await loadImg(o.logoSrc);
    const lh = 54, lw = logo ? logo.width / logo.height * lh : 320;
    const pillW = lw + 64, pillX = (W - pillW) / 2, pillY = 230;
    ctx.fillStyle = C.white; roundRect(ctx, pillX, pillY, pillW, lh + 40, (lh + 40) / 2); ctx.fill();
    if (logo) ctx.drawImage(logo, pillX + 32, pillY + 20, lw, lh);

    /* Judul */
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = `700 30px ${HEAD}`;
    ctx.fillText("HASIL TES MINAT & BAKAT", W / 2, 400);

    ctx.fillStyle = C.white;
    ctx.font = `800 64px ${HEAD}`;
    const sapaan = o.nama ? fit(ctx, o.nama, 900) : "Aku";
    ctx.fillText(sapaan, W / 2, 478);
    ctx.font = `600 38px ${BODY}`;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(o.nama ? "adalah seorang" : "ternyata seorang", W / 2, 535);
    ctx.fillStyle = C.white;
    ctx.font = `800 84px ${HEAD}`;
    ctx.fillText(o.types[o.code[0]].id, W / 2, 625);

    /* Kartu putih */
    const cardX = 80, cardY = 680, cardW = W - 160, cardH = 880;
    ctx.fillStyle = C.white; roundRect(ctx, cardX, cardY, cardW, cardH, 48); ctx.fill();

    /* Kode Holland */
    const tile = 120, gap = 22, tx0 = (W - (tile * 3 + gap * 2)) / 2, ty = cardY + 44;
    const tileStyles = [[C.brand, C.white], [C.brandMid, C.white], [C.soft, C.brand]];
    o.code.forEach((t, i) => {
      const x = tx0 + i * (tile + gap);
      ctx.fillStyle = tileStyles[i][0]; roundRect(ctx, x, ty, tile, tile, 28); ctx.fill();
      ctx.fillStyle = tileStyles[i][1]; ctx.font = `800 68px ${HEAD}`; ctx.textBaseline = "middle";
      ctx.fillText(t, x + tile / 2, ty + tile / 2 + 4);
    });
    ctx.textBaseline = "alphabetic";

    /* Grafik segi enam */
    const cx = W / 2, cy = cardY + 400, R = 150;
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    [1 / 3, 2 / 3, 1].forEach((f) => { poly(ctx, hexPts(cx, cy, R * f)); ctx.stroke(); });
    hexPts(cx, cy, R).forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); });
    const shape = o.order.map((t, k) => {
      const a = (-90 + k * 60) * Math.PI / 180, r = Math.max(.05, o.scores[t]) * R;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
    poly(ctx, shape);
    ctx.fillStyle = "rgba(138,28,28,.22)"; ctx.fill();
    ctx.strokeStyle = C.brand; ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.stroke();
    ctx.fillStyle = C.brand;
    shape.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); });
    hexPts(cx, cy, R + 52).forEach(([x, y], k) => {
      const t = o.order[k];
      ctx.fillStyle = C.ink; ctx.font = `800 34px ${HEAD}`; ctx.fillText(t, x, y + 2);
      ctx.fillStyle = C.muted; ctx.font = `600 20px ${BODY}`; ctx.fillText(o.types[t].id, x, y + 28);
    });

    /* 3 rumpun teratas */
    let y = cardY + 668;
    ctx.textAlign = "left";
    ctx.fillStyle = C.muted; ctx.font = `700 26px ${HEAD}`;
    ctx.fillText("PRODI PALING COCOK", cardX + 56, y);
    y += 22;
    o.top3.forEach((r, i) => {
      const rowY = y + i * 62;
      ctx.fillStyle = C.soft; roundRect(ctx, cardX + 44, rowY, cardW - 88, 50, 14); ctx.fill();
      ctx.fillStyle = C.brand; ctx.font = `800 26px ${HEAD}`; ctx.textAlign = "left";
      ctx.fillText(String(i + 1), cardX + 66, rowY + 35);
      ctx.fillStyle = C.ink; ctx.font = `700 28px ${BODY}`;
      ctx.fillText(fit(ctx, r.label, cardW - 290), cardX + 104, rowY + 35);
      ctx.fillStyle = C.brand; ctx.font = `800 28px ${HEAD}`; ctx.textAlign = "right";
      ctx.fillText(r.m + "%", cardX + cardW - 66, rowY + 35);
    });

    /* Ajakan */
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = `600 34px ${BODY}`;
    ctx.fillText("Cek minat & bakatmu juga di", W / 2, 1625);
    ctx.fillStyle = C.white; ctx.font = `800 40px ${HEAD}`;
    ctx.fillText(fit(ctx, o.url + "  ·  " + o.instagram, 960), W / 2, 1680);

    return new Promise((res) => cv.toBlob(res, "image/png"));
  }

  window.buatStory = buatStory;
})();
