import { DATA, BN, ORDER, bnNum } from '../data/bangladeshData';

export const PW = 1200, PH = 1500;
export const MAP = { x: 0, y: 250, h: 1040 };
MAP.s = MAP.h / DATA.h;
MAP.w = DATA.w * MAP.s;
MAP.x = (PW - MAP.w) / 2 + 40;

export const FONT = '"Anek Bangla", system-ui, sans-serif';

let cachedPaths = null;
export function getPaths() {
  if (!cachedPaths) {
    cachedPaths = Object.fromEntries(DATA.f.map(f => [f.n, new Path2D(f.d)]));
  }
  return cachedPaths;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function textAt(ctx, text, x, y, align) {
  ctx.textAlign = align;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export function placeLabels(ctx, names) {
  ctx.font = `600 20px ${FONT}`;
  const placed = [], out = [];
  const byY = names.map(n => DATA.f.find(f => f.n === n)).filter(Boolean).sort((a, b) => a.c[1] - b.c[1]);
  const tries = [[0, -14], [0, 26], [12, 7], [-12, 7], [0, -36], [0, 48], [30, -14], [-30, -14], [30, 26], [-30, 26]];
  
  for (const f of byY) {
    const cx = MAP.x + f.c[0] * MAP.s;
    const cy = MAP.y + f.c[1] * MAP.s;
    const w = ctx.measureText(BN[f.n] || f.n).width + 8;
    const h = 26;
    let pick = null;
    
    for (const [dx, dy] of tries) {
      const align = dx > 0 ? "left" : dx < 0 ? "right" : "center";
      const x0 = align === "left" ? cx + dx : align === "right" ? cx + dx - w : cx - w / 2;
      const y0 = cy + dy - h + 4;
      const box = { x: x0, y: y0, w, h };
      if (!placed.some(b => b.x < box.x + box.w && box.x < b.x + b.w && b.y < box.y + box.h && box.y < b.y + b.h)) {
        pick = { box, align, tx: cx + dx, ty: cy + dy };
        break;
      }
    }
    if (!pick) {
      const box = { x: cx - w / 2, y: cy - 32, w, h };
      pick = { box, align: "center", tx: cx, ty: cy - 14 };
    }
    placed.push(pick.box, { x: cx - 5, y: cy - 5, w: 10, h: 10 });
    out.push({ n: BN[f.n] || f.n, cx, cy, ...pick });
  }
  return out;
}

export function drawHeader(ctx, t, W, sub, title, n, total, photoImg) {
  let tx = 80;
  if (photoImg) {
    const size = 104, x = 80, y = 84, rad = 30;
    ctx.save();
    const rg = ctx.createLinearGradient(x - 8, y - 8, x + size + 8, y + size + 8);
    rg.addColorStop(0, t.v1);
    rg.addColorStop(1, t.v2);
    roundRect(ctx, x - 7, y - 7, size + 14, size + 14, rad + 7);
    ctx.fillStyle = rg;
    ctx.fill();
    roundRect(ctx, x - 2, y - 2, size + 4, size + 4, rad + 2);
    ctx.fillStyle = t.bg;
    ctx.fill();
    roundRect(ctx, x + 1, y + 1, size - 2, size - 2, rad - 1);
    ctx.clip();
    const iw = photoImg.naturalWidth || photoImg.width;
    const ih = photoImg.naturalHeight || photoImg.height;
    const k = Math.max(size / iw, size / ih);
    ctx.drawImage(photoImg, x + size / 2 - iw * k / 2, y + size / 2 - ih * k / 2, iw * k, ih * k);
    ctx.restore();
    tx = x + size + 40;
  }
  
  ctx.fillStyle = t.muted;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(sub, tx, 112);
  
  ctx.fillStyle = t.ink;
  ctx.font = `700 40px ${FONT}`;
  const slashW = ctx.measureText("/" + total).width;
  ctx.font = `800 96px ${FONT}`;
  const countW = ctx.measureText(bnNum(n)).width + slashW + 6;
  const maxW = W - 80 - countW - 40 - tx;
  
  ctx.font = `800 64px ${FONT}`;
  let fs = 64;
  while (ctx.measureText(title).width > maxW && fs > 28) {
    fs -= 2;
    ctx.font = `800 ${fs}px ${FONT}`;
  }
  ctx.fillText(title, tx, 184);

  // big count
  ctx.textAlign = "left";
  const g = ctx.createLinearGradient(W - 300, 0, W - 80, 0);
  g.addColorStop(0, t.v1);
  g.addColorStop(1, t.v2);
  ctx.fillStyle = g;
  ctx.font = `800 96px ${FONT}`;
  textAt(ctx, bnNum(n), W - 80 - slashW - 6, 184, "right");
  ctx.fillStyle = t.muted;
  ctx.font = `700 40px ${FONT}`;
  textAt(ctx, "/" + total, W - 80, 184, "right");
}

export function drawFooter(ctx, t, W, H, frac, left, right) {
  const fy = H - 110;
  ctx.fillStyle = t.track;
  roundRect(ctx, 80, fy, W - 160, 12, 6);
  ctx.fill();
  if (frac > 0) {
    const pg = ctx.createLinearGradient(80, 0, W - 80, 0);
    pg.addColorStop(0, t.v1);
    pg.addColorStop(1, t.v2);
    ctx.fillStyle = pg;
    roundRect(ctx, 80, fy, Math.max(16, (W - 160) * Math.min(1, frac)), 12, 6);
    ctx.fill();
  }
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = t.ink;
  ctx.textAlign = "left";
  ctx.fillText(left, 80, fy + 56);
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = t.muted;
  textAt(ctx, right, W - 80, fy + 56, "right");
}

export function drawBangladeshMap(ctx, scale, { selected, theme, userName, showLabels, photoImg }) {
  const t = theme;
  const paths = getPaths();
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, PW, PH);

  const n = selected.size;
  const pct = Math.round(n / 64 * 100);
  const title = userName && userName.trim() ? `${userName.trim()}-এর বাংলাদেশ` : "আমার বাংলাদেশ";
  drawHeader(ctx, t, PW, "বাংলাদেশ ভ্রমণ ম্যাপ", title, n, "৬৪", photoImg);

  // map paths
  ctx.save();
  ctx.translate(MAP.x, MAP.y);
  ctx.scale(MAP.s, MAP.s);
  ctx.lineJoin = "round";

  // unselected
  for (const f of DATA.f) {
    if (selected.has(f.n)) continue;
    ctx.fillStyle = t.land;
    ctx.fill(paths[f.n]);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 1 / MAP.s * 1.4;
    ctx.stroke(paths[f.n]);
  }

  // selected
  const vg = ctx.createLinearGradient(0, 0, DATA.w, DATA.h);
  vg.addColorStop(0, t.v1);
  vg.addColorStop(1, t.v2);

  if (t.glow) {
    ctx.save();
    ctx.shadowColor = t.glow;
    ctx.shadowBlur = 24 * scale;
    for (const name of selected) {
      if (paths[name]) ctx.fill(paths[name]);
    }
    ctx.restore();
  }

  for (const name of selected) {
    if (!paths[name]) continue;
    ctx.fillStyle = vg;
    ctx.fill(paths[name]);
    ctx.strokeStyle = t.vStroke;
    ctx.lineWidth = 1 / MAP.s * 1.6;
    ctx.stroke(paths[name]);
  }
  ctx.restore();

  // labels
  if (showLabels && n > 0) {
    const L = placeLabels(ctx, [...selected]);
    for (const l of L) {
      ctx.beginPath();
      ctx.arc(l.cx, l.cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = t.dot;
      ctx.fill();
    }
    ctx.font = `600 20px ${FONT}`;
    ctx.lineJoin = "round";
    for (const l of L) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = t.halo;
      ctx.fillStyle = t.label;
      textAt(ctx, l.n, l.tx, l.ty, l.align);
    }
  }

  const divsCount = ORDER.filter(d => DATA.f.some(f => f.dv === d && selected.has(f.n))).length;
  drawFooter(
    ctx,
    t,
    PW,
    PH,
    n / 64,
    `${bnNum(pct)}% বাংলাদেশ ঘোরা হয়েছে`,
    `${bnNum(n)}টি জেলা · ৮টির মধ্যে ${bnNum(divsCount)}টি বিভাগে পা রেখেছেন`
  );
  ctx.restore();
}
