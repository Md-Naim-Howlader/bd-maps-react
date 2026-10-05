import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DATA, BN, DIV_BN, ORDER, THEMES, bnNum } from '../data/bangladeshData';
import { PW, PH, MAP, getPaths, drawBangladeshMap } from '../utils/canvasRenderer';
import { exportBangladeshMap } from '../utils/exporter';
import WavingFlag from './WavingFlag';

export default function BangladeshMapTab() {
  const [selected, setSelected] = useState(() => {
    try {
      const saved = localStorage.getItem('bdmap.sel');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('bdmap.theme') || 'emerald';
  });

  const [showLabels, setShowLabels] = useState(() => {
    const saved = localStorage.getItem('bdmap.labels');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('bdmap.name') || '';
  });

  const [photoImg, setPhotoImg] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [query, setQuery] = useState('');
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const currentTheme = useMemo(() => {
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  }, [themeId]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdmap.sel', JSON.stringify([...selected]));
      localStorage.setItem('bdmap.theme', themeId);
      localStorage.setItem('bdmap.labels', JSON.stringify(showLabels));
      localStorage.setItem('bdmap.name', userName);
    } catch {}
  }, [selected, themeId, showLabels, userName]);

  // Update theme CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--sel', currentTheme.v1);
    document.documentElement.style.setProperty('--sel-ink', '#fff');
  }, [currentTheme]);

  // Canvas redraw
  const redraw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = PW * dpr;
    cv.height = PH * dpr;
    drawBangladeshMap(ctx, dpr, {
      selected,
      theme: currentTheme,
      userName,
      showLabels,
      photoImg
    });
  };

  useEffect(() => {
    redraw();
  }, [selected, currentTheme, showLabels, userName, photoImg]);

  // Hit test
  const hitTest = (e) => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * PW;
    const y = ((e.clientY - r.top) / r.height) * PH;
    const mx = (x - MAP.x) / MAP.s;
    const my = (y - MAP.y) / MAP.s;
    const ctx = cv.getContext('2d');
    const paths = getPaths();

    for (const f of DATA.f) {
      if (ctx.isPointInPath(paths[f.n], mx, my)) return f;
    }
    return null;
  };

  const handleMouseMove = (e) => {
    const f = hitTest(e);
    if (!f) {
      setHoveredDistrict(null);
      return;
    }
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHoveredDistrict({
      name: f.n,
      bn: BN[f.n] || f.n,
      x: e.clientX - r.left,
      y: e.clientY - r.top
    });
  };

  const handleCanvasClick = (e) => {
    const f = hitTest(e);
    if (f) toggleDistrict(f.n);
  };

  const toggleDistrict = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(DATA.f.map((f) => f.n)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const toggleDivision = (dvName) => {
    const list = DATA.f.filter((f) => f.dv === dvName).map((f) => f.n);
    const allSelected = list.every((n) => selected.has(n));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        list.forEach((n) => next.delete(n));
      } else {
        list.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPhotoImg(img);
        setPhotoUrl(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoImg(null);
    setPhotoUrl(null);
  };

  const handleDownload = async (kind) => {
    setDownloading(kind);
    try {
      await exportBangladeshMap({
        kind,
        selected,
        theme: currentTheme,
        userName,
        showLabels,
        photoImg
      });
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloading(null), 500);
    }
  };

  // Grouped districts for sidebar
  const q = query.trim().toLowerCase();
  const divisionGroups = useMemo(() => {
    return ORDER.map((dv) => {
      const list = DATA.f
        .filter((f) => f.dv === dv)
        .map((f) => f.n)
        .sort((a, b) => (BN[a] || a).localeCompare(BN[b] || b, 'bn'));

      const filtered = list.filter((n) => {
        if (!q) return true;
        const bnName = BN[n] || '';
        const dvBn = DIV_BN[dv] || '';
        return (
          n.toLowerCase().includes(q) ||
          bnName.toLowerCase().includes(q) ||
          dvBn.toLowerCase().includes(q)
        );
      });

      return {
        name: dv,
        bn: DIV_BN[dv] || dv,
        total: list.length,
        selectedCount: list.filter((n) => selected.has(n)).length,
        allSelected: list.length > 0 && list.every((n) => selected.has(n)),
        districts: filtered,
        isVisible: filtered.length > 0
      };
    });
  }, [query, selected]);

  return (
    <div>
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <WavingFlag size="medium" />
        </div>
        <span className="pill">৬৪ জেলা · ৮ বিভাগ</span>
        <h1>
          <span>বাংলাদেশের</span> কতটুকু ঘুরে দেখেছেন?
        </h1>
        <p>
          যে জেলাগুলোতে গিয়েছেন সেগুলো বেছে নিন, পছন্দের রঙের থিম দিন, আর
          ডাউনলোড করুন আপনার ভ্রমণের সুন্দর একটি ম্যাপ।
        </p>
        <button
          className="cta"
          onClick={() => {
            document.getElementById('make-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          জেলা বাছাই শুরু করুন <span aria-hidden="true">↓</span>
        </button>
        <div className="steps">
          <div>
            <b>১</b>জেলা বাছাই করুন
          </div>
          <div>
            <b>২</b>থিম বেছে নিন
          </div>
          <div>
            <b>৩</b>PNG, JPG বা PDF ডাউনলোড করুন
          </div>
        </div>
      </header>

      <main className="app" id="make-section">
        {/* Left Picker */}
        <aside className="card picker">
          <div className="picker-head">
            <h2>যেসব জেলায় গিয়েছি</h2>
            <span className="count">
              {bnNum(selected.size)} / {bnNum(64)}
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
              placeholder="জেলা খুঁজুন…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="জেলা খুঁজুন"
            />
          </label>

          <div className="tools">
            <button className="link" onClick={selectAll}>
              সব বাছাই করুন
            </button>
            <button className="link" onClick={clearAll}>
              সব মুছুন
            </button>
          </div>

          <div className="groups">
            {divisionGroups.map((g) => {
              if (!g.isVisible) return null;
              return (
                <div key={g.name} className="group">
                  <div className="group-h">
                    <b>
                      {g.bn} বিভাগ{' '}
                      <small>
                        {bnNum(g.selectedCount)}/{bnNum(g.total)}
                      </small>
                    </b>
                    <button
                      className="link"
                      onClick={() => toggleDivision(g.name)}
                    >
                      {g.allSelected ? 'মুছুন' : 'সব বাছাই'}
                    </button>
                  </div>
                  <div className="chips">
                    {g.districts.map((n) => {
                      const isSel = selected.has(n);
                      return (
                        <button
                          key={n}
                          className={`chip ${isSel ? 'active' : ''}`}
                          onClick={() => toggleDistrict(n)}
                          type="button"
                        >
                          {BN[n] || n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Stage */}
        <section className="card stage">
          <div className="stage-top">
            <div className="themes" role="radiogroup" aria-label="ম্যাপের থিম">
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
              <label className="upload" title="ম্যাপে আপনার ছবি যোগ করুন">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoUpload}
                />
                <span
                  className="avatar"
                  style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : {}}
                >
                  {!photoUrl && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                    </svg>
                  )}
                </span>
                <span>
                  {photoUrl ? 'ছবি বদলান' : 'আপনার ছবি যোগ করুন'}
                </span>
              </label>

              {photoUrl && (
                <button className="link" onClick={removePhoto} type="button">
                  সরান
                </button>
              )}

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
                <span>জেলার নাম</span>
              </label>
            </div>
          </div>

          <div className="canvas-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="map-canvas"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredDistrict(null)}
              onClick={handleCanvasClick}
              aria-label="আপনার বাংলাদেশ ভ্রমণ ম্যাপ"
            />
            {hoveredDistrict && (
              <div
                className="tip"
                style={{
                  left: `${hoveredDistrict.x}px`,
                  top: `${hoveredDistrict.y}px`,
                  opacity: 1
                }}
              >
                {hoveredDistrict.bn} {selected.has(hoveredDistrict.name) ? '✓' : ''}
              </div>
            )}
          </div>

          <p className="hint">
            টিপস: ম্যাপের জেলায় সরাসরি ক্লিক করেও বাছাই করতে পারেন।
          </p>

          <h3 className="dl-title">আপনার ম্যাপ ডাউনলোড করুন</h3>
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
            <button
              className="btn"
              disabled={downloading !== null}
              onClick={() => handleDownload('pdf')}
            >
              {downloading === 'pdf' ? 'তৈরি হচ্ছে…' : '↓ PDF'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
