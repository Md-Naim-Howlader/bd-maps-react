import React, { useState, useEffect, useRef, useMemo } from 'react';
import { THEMES, bnNum } from '../data/bangladeshData';
import { drawHeader, drawFooter, roundRect, textAt, FONT } from '../utils/canvasRenderer';
import { saveBlob } from '../utils/exporter';

const CT_ORDER = ['as', 'eu', 'af', 'na', 'sa', 'oc'];
const CT_BN = {
  as: 'এশিয়া',
  eu: 'ইউরোপ',
  af: 'আফ্রিকা',
  na: 'উত্তর আমেরিকা',
  sa: 'দক্ষিণ আমেরিকা',
  oc: 'ওশেনিয়া'
};

const WPW = 1200;
const WMAP = { x: 60, y: 270 };

export default function WorldMapTab() {
  const [worldData, setWorldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => {
    try {
      const saved = localStorage.getItem('bdmap.world');
      return saved ? new Set(JSON.parse(saved)) : new Set(['BGD']);
    } catch {
      return new Set(['BGD']);
    }
  });

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('bdmap.theme') || 'emerald';
  });

  const [showLabels, setShowLabels] = useState(() => {
    const saved = localStorage.getItem('bdmap.wlabels');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('bdmap.name') || '';
  });

  const [query, setQuery] = useState('');
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pathsRef = useRef({});
  const bgPathRef = useRef(null);
  const wByIdRef = useRef({});

  const currentTheme = useMemo(() => {
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  }, [themeId]);

  // Load world.json
  useEffect(() => {
    fetch('/world.json')
      .then((r) => r.json())
      .then((data) => {
        setWorldData(data);
        const byId = {};
        const paths = {};
        for (const f of data.f) {
          byId[f.i] = f;
          paths[f.i] = new Path2D(f.d);
        }
        wByIdRef.current = byId;
        pathsRef.current = paths;
        bgPathRef.current = new Path2D(data.bg);
        setLoading(false);
      })
      .catch((err) => console.error('Failed to load world.json:', err));
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdmap.world', JSON.stringify([...selected]));
      localStorage.setItem('bdmap.wlabels', JSON.stringify(showLabels));
    } catch {}
  }, [selected, showLabels]);

  const placeWorldLabels = (ctx, ids) => {
    ctx.font = `600 17px ${FONT}`;
    const placed = [], out = [];
    const list = ids
      .map((i) => wByIdRef.current[i])
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.i === 'BGD') - (a.i === 'BGD') ||
          (a.sm || 0) - (b.sm || 0) ||
          a.c[1] - b.c[1]
      );

    const tries = [
      [0, -10], [0, 22], [10, 6], [-10, 6], [0, -30], [0, 40],
      [24, -10], [-24, -10], [24, 22], [-24, 22], [0, -48], [0, 58]
    ];

    for (const f of list) {
      const cx = WMAP.x + f.c[0] * WMAP.s;
      const cy = WMAP.y + f.c[1] * WMAP.s;
      const w = ctx.measureText(f.b).width + 6;
      const h = 22;

      for (const [dx, dy] of tries) {
        const align = dx > 0 ? 'left' : dx < 0 ? 'right' : 'center';
        const x0 =
          align === 'left' ? cx + dx : align === 'right' ? cx + dx - w : cx - w / 2;
        const y0 = cy + dy - h + 4;
        const box = { x: x0, y: y0, w, h };

        if (x0 < 12 || x0 + w > WPW - 12 || y0 < WMAP.y - 30 || y0 + h > WMAP.y + WMAP.h + 30) {
          continue;
        }
        if (!placed.some((b) => b.x < box.x + box.w && box.x < b.x + b.w && b.y < box.y + box.h && box.y < b.y + b.h)) {
          placed.push(box, { x: cx - 4, y: cy - 4, w: 8, h: 8 });
          out.push({ n: f.b, align, tx: cx + dx, ty: cy + dy });
          break;
        }
      }
    }
    return out;
  };

  const drawWorld = (ctx, scale) => {
    if (!worldData) return;
    const t = currentTheme;
    const n = selected.size;
    const WPH = Math.round(WMAP.y + WMAP.h + 160);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, WPW, WPH);

    const title = userName && userName.trim() ? `${userName.trim()}-এর পৃথিবী` : 'আমার পৃথিবী';
    drawHeader(ctx, t, WPW, 'বিশ্ব ভ্রমণ ম্যাপ', title, n, '১৯৫', null);

    ctx.save();
    ctx.translate(WMAP.x, WMAP.y);
    ctx.scale(WMAP.s, WMAP.s);
    ctx.lineJoin = 'round';

    ctx.fillStyle = t.land;
    if (bgPathRef.current) ctx.fill(bgPathRef.current);

    for (const f of worldData.f) {
      if (selected.has(f.i)) continue;
      const p = pathsRef.current[f.i];
      if (p) {
        ctx.fillStyle = t.land;
        ctx.fill(p);
        ctx.strokeStyle = t.stroke;
        ctx.lineWidth = 0.9 / WMAP.s;
        ctx.stroke(p);
      }
    }

    const vg = ctx.createLinearGradient(0, 0, worldData.w, worldData.h);
    vg.addColorStop(0, t.v1);
    vg.addColorStop(1, t.v2);

    for (const i of selected) {
      const p = pathsRef.current[i];
      if (p) {
        ctx.fillStyle = vg;
        ctx.fill(p);
        ctx.strokeStyle = t.vStroke;
        ctx.lineWidth = 1.1 / WMAP.s;
        ctx.stroke(p);
      }
    }
    ctx.restore();

    // Tiny island dots
    for (const i of selected) {
      const f = wByIdRef.current[i];
      if (!f || !f.sm) continue;
      const cx = WMAP.x + f.c[0] * WMAP.s;
      const cy = WMAP.y + f.c[1] * WMAP.s;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = t.v1;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = t.bg;
      ctx.stroke();
    }

    if (showLabels && n > 0) {
      const labels = placeWorldLabels(ctx, [...selected]);
      ctx.font = `600 17px ${FONT}`;
      ctx.lineJoin = 'round';
      for (const l of labels) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = t.halo;
        ctx.fillStyle = t.label;
        textAt(ctx, l.n, l.tx, l.ty, l.align);
      }
    }

    const cts = CT_ORDER.filter((c) =>
      [...selected].some((i) => wByIdRef.current[i]?.ct === c)
    ).length;
    const pct = Math.round((n / 195) * 100);

    drawFooter(
      ctx,
      t,
      WPW,
      WPH,
      n / 195,
      `বিশ্বের ${bnNum(pct)}% দেশ ঘোরা হয়েছে`,
      `${bnNum(n)}টি দেশ · ৬টির মধ্যে ${bnNum(cts)}টি মহাদেশে পা রেখেছেন`
    );

    ctx.restore();
  };

  const redraw = () => {
    const cv = canvasRef.current;
    if (!cv || !worldData) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    WMAP.s = (WPW - 2 * WMAP.x) / worldData.w;
    WMAP.h = worldData.h * WMAP.s;
    const WPH = Math.round(WMAP.y + WMAP.h + 160);

    cv.width = WPW * dpr;
    cv.height = WPH * dpr;
    const ctx = cv.getContext('2d');
    drawWorld(ctx, dpr);
  };

  useEffect(() => {
    redraw();
  }, [worldData, selected, currentTheme, showLabels, userName]);

  // Hit test
  const hitTest = (e) => {
    if (!worldData) return null;
    const cv = canvasRef.current;
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * WPW;
    const y = ((e.clientY - r.top) / r.height) * (WMAP.y + WMAP.h + 160);
    const mx = (x - WMAP.x) / WMAP.s;
    const my = (y - WMAP.y) / WMAP.s;
    const ctx = cv.getContext('2d');

    // Tiny dots
    for (const f of worldData.f) {
      if (f.sm) {
        const d = Math.hypot(x - (WMAP.x + f.c[0] * WMAP.s), y - (WMAP.y + f.c[1] * WMAP.s));
        if (d < 16) return f;
      }
    }
    for (const f of worldData.f) {
      const p = pathsRef.current[f.i];
      if (p && ctx.isPointInPath(p, mx, my)) return f;
    }
    return null;
  };

  const handleMouseMove = (e) => {
    const f = hitTest(e);
    if (!f) {
      setHoveredCountry(null);
      return;
    }
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHoveredCountry({
      name: f.i,
      bn: f.b,
      x: e.clientX - r.left,
      y: e.clientY - r.top
    });
  };

  const handleCanvasClick = (e) => {
    const f = hitTest(e);
    if (f) toggleCountry(f.i);
  };

  const toggleCountry = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownload = (kind) => {
    if (!worldData) return;
    setDownloading(kind);
    try {
      const WPH = Math.round(WMAP.y + WMAP.h + 160);
      const c = document.createElement('canvas');
      c.width = WPW * 2;
      c.height = WPH * 2;
      const ctx = c.getContext('2d');
      drawWorld(ctx, 2);

      c.toBlob((blob) => {
        if (!blob) return;
        saveBlob(blob, `amar-prithibi-map.${kind === 'jpg' ? 'jpg' : 'png'}`);
        setDownloading(null);
      }, kind === 'jpg' ? 'image/jpeg' : 'image/png');
    } catch {
      setDownloading(null);
    }
  };

  const q = query.trim().toLowerCase();
  const continentGroups = useMemo(() => {
    if (!worldData) return [];
    return CT_ORDER.map((ct) => {
      const list = worldData.f
        .filter((f) => f.ct === ct)
        .sort((a, b) => a.b.localeCompare(b.b, 'bn'));

      const filtered = list.filter((f) => {
        if (!q) return true;
        return (
          f.b.toLowerCase().includes(q) ||
          f.n.toLowerCase().includes(q) ||
          f.i.toLowerCase().includes(q)
        );
      });

      return {
        id: ct,
        bn: CT_BN[ct],
        countries: filtered,
        total: list.length,
        selectedCount: list.filter((f) => selected.has(f.i)).length,
        isVisible: filtered.length > 0
      };
    });
  }, [worldData, query, selected]);

  return (
    <div>
      <header className="hero">
        <span className="pill">১৯৫টি দেশ · ৬ মহাদেশ</span>
        <h1>
          <span>পৃথিবীর</span> কতটুকু ঘুরে দেখেছেন?
        </h1>
        <p>
          যেসব দেশে গিয়েছেন সেগুলো বেছে নিন, পছন্দের রঙের থিম দিন, আর ডাউনলোড
          করুন আপনার বিশ্ব ভ্রমণের সুন্দর একটি ম্যাপ।
        </p>
      </header>

      <main className="app">
        <aside className="card picker">
          <div className="picker-head">
            <h2>যেসব দেশে গিয়েছি</h2>
            <span className="count">
              {bnNum(selected.size)} / {bnNum(195)}
            </span>
          </div>

          <label className="search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="দেশ খুঁজুন (বাংলা বা English)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="tools">
            <button className="link" onClick={() => setSelected(new Set())}>
              সব মুছুন
            </button>
          </div>

          <div className="groups">
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
                দেশের তালিকা লোড হচ্ছে…
              </p>
            ) : (
              continentGroups.map((g) => {
                if (!g.isVisible) return null;
                return (
                  <div key={g.id} className="group">
                    <div className="group-h">
                      <b>
                        {g.bn}{' '}
                        <small>
                          {bnNum(g.selectedCount)}/{bnNum(g.total)}
                        </small>
                      </b>
                    </div>
                    <div className="chips">
                      {g.countries.map((c) => {
                        const isSel = selected.has(c.i);
                        return (
                          <button
                            key={c.i}
                            className={`chip ${isSel ? 'active' : ''}`}
                            onClick={() => toggleCountry(c.i)}
                            type="button"
                          >
                            {c.b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="card stage">
          <div className="stage-top">
            <div className="themes" role="radiogroup">
              <span>থিম</span>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`sw ${themeId === t.id ? 'active' : ''}`}
                  onClick={() => setThemeId(t.id)}
                  title={t.name}
                  type="button"
                >
                  <i style={{ background: t.bg }}></i>
                  <i
                    style={{
                      background: `linear-gradient(135deg, ${t.v1}, ${t.v2})`
                    }}
                  ></i>
                </button>
              ))}
            </div>

            <div className="opts">
              <input
                className="name"
                maxLength={28}
                placeholder="আপনার নাম (ঐচ্ছিক)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                <span>দেশের নাম</span>
              </label>
            </div>
          </div>

          <div className="canvas-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="map-canvas"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredCountry(null)}
              onClick={handleCanvasClick}
            />
            {hoveredCountry && (
              <div
                className="tip"
                style={{
                  left: `${hoveredCountry.x}px`,
                  top: `${hoveredCountry.y}px`,
                  opacity: 1
                }}
              >
                {hoveredCountry.bn} {selected.has(hoveredCountry.name) ? '✓' : ''}
              </div>
            )}
          </div>

          <p className="hint">
            টিপস: ম্যাপের দেশে সরাসরি ক্লিক করেও বাছাই করতে পারেন। ছোট দেশগুলো
            তালিকা থেকে বাছাই করা সহজ।
          </p>

          <h3 className="dl-title">আপনার বিশ্ব ম্যাপ ডাউনলোড করুন</h3>
          <div className="dl">
            <button
              className="btn primary"
              disabled={downloading !== null}
              onClick={() => handleDownload('png')}
            >
              {downloading === 'png' ? 'তৈরি হচ্ছে…' : '↓ PNG'}
            </button>
            <button
              className="btn"
              disabled={downloading !== null}
              onClick={() => handleDownload('jpg')}
            >
              {downloading === 'jpg' ? 'তৈরি হচ্ছে…' : '↓ JPG'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
