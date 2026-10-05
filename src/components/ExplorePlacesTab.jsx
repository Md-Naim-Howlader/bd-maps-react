import React, { useState, useEffect, useMemo } from "react";
import { DATA, BN, DIV_BN, ORDER } from "../data/bangladeshData";

/* ------------------------------------------------------------------ */
/* Image helpers                                                       */
/* ------------------------------------------------------------------ */

// Jodi tumi nijer host/CDN-e image rakho, ekhane base URL dao. Eg: "https://cdn.example.com"
const CDN = "https://bd-maps-react.vercel.app/";

// Local path (public/assets/...) -> absolute path
const localUrl = (img) =>
  img?.f ? `${CDN}/${String(img.f).replace(/^\/+/, "")}` : null;

// Wikimedia Commons page URL -> direct image URL
const wikiUrl = (img, width = 800) => {
  if (!img?.src) return null;
  const part = img.src.split("/wiki/File:")[1];
  if (!part) return null;
  let name = part;
  try {
    name = decodeURIComponent(part);
  } catch (e) {
    /* already plain */
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    name,
  )}?width=${width}`;
};

// Prothome local file try korbe, na pele Wikimedia, tarpor fallback emoji
function SmartImg({ img, alt, width = 800, style, className }) {
  const sources = useMemo(
    () => [localUrl(img), wikiUrl(img, width)].filter(Boolean),
    [img, width],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => setIdx(0), [sources]);

  if (!sources.length || idx >= sources.length) {
    return <span style={{ fontSize: 28 }}>🏞️</span>;
  }
  return (
    <img
      src={sources[idx]}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

const credit = (img) =>
  img?.by
    ? `📷 ${String(img.by).split("\n")[0].trim()}${
        img.lic ? " · " + img.lic : ""
      }`
    : null;

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                    */
/* ------------------------------------------------------------------ */

const TRANSPORT_BN = {
  bus: "🚌 বাস",
  launch: "🚢 লঞ্চ",
  train: "🚆 ট্রেন",
  air: "✈️ বিমান",
  car: "🚗 গাড়ি",
  local: "🛺 শহরের ভেতরে",
};

const box = {
  marginTop: 12,
  background: "var(--bg)",
  padding: 14,
  borderRadius: 12,
};
const boxTitle = { margin: "0 0 6px", fontSize: 15 };
const boxText = { margin: 0, fontSize: 14, color: "var(--muted)" };

function InfoBox({ title, children }) {
  return (
    <div style={box}>
      <h4 style={boxTitle}>{title}</h4>
      {children}
    </div>
  );
}

const mapsUrl = (spot) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    spot.n + " " + spot.districtBn,
  )}`;

const PAGE_SIZE = 48;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ExplorePlacesTab() {
  const [placesData, setPlacesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalSpot, setActiveModalSpot] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/places.json")
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        setPlacesData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load places.json:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // filter bodlale pagination reset
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedDivision, selectedDistrict, searchQuery]);

  // Esc diye modal bondho
  useEffect(() => {
    if (!activeModalSpot) return;
    const onKey = (e) => e.key === "Escape" && setActiveModalSpot(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModalSpot]);

  const divisions = ["all", ...ORDER];

  const districts = useMemo(() => {
    const list =
      selectedDivision === "all"
        ? DATA.f
        : DATA.f.filter((f) => f.dv === selectedDivision);
    return list
      .map((f) => f.n)
      .sort((a, b) => (BN[a] || a).localeCompare(BN[b] || b, "bn"));
  }, [selectedDivision]);

  const allSpots = useMemo(() => {
    if (!placesData) return [];
    const spotsList = [];
    const q = searchQuery.trim().toLowerCase();

    for (const [distName, distInfo] of Object.entries(placesData)) {
      if (selectedDistrict && distName !== selectedDistrict) continue;
      const distDv = DATA.f.find((f) => f.n === distName)?.dv;
      if (selectedDivision !== "all" && distDv !== selectedDivision) continue;

      (distInfo.spots || []).forEach((spot) => {
        const matchQuery =
          !q ||
          spot.n?.toLowerCase().includes(q) ||
          spot.d?.toLowerCase().includes(q) ||
          (BN[distName] || "").toLowerCase().includes(q) ||
          distName.toLowerCase().includes(q);

        if (matchQuery) {
          spotsList.push({
            ...spot,
            districtName: distName,
            districtBn: BN[distName] || distName,
            // spot-er nijer stay thakle seta, na hole jelar stay
            stay:
              spot.stay && spot.stay.length ? spot.stay : distInfo.stay || [],
            go: distInfo.go || [],
            distKm: distInfo.km,
            distTime: distInfo.time,
            distCost: distInfo.cost,
            distFood: distInfo.food,
          });
        }
      });
    }
    return spotsList;
  }, [placesData, selectedDivision, selectedDistrict, searchQuery]);

  const shownSpots = allSpots.slice(0, visibleCount);

  return (
    <div>
      <header className="hero">
        <span className="pill">৬৪ জেলা · ২৪০+ দর্শনীয় স্থান</span>
        <h1>
          কোথায় <span>ঘুরতে</span> যাবেন?
        </h1>
        <p>
          জেলা বেছে নিন — দেখুন সেখানকার জনপ্রিয় ও কম পরিচিত দর্শনীয় স্থান,
          কীভাবে যাবেন, কত খরচ আর কোথায় থাকবেন।
        </p>
      </header>

      <section className="card ex-picker">
        <div className="ex-top">
          <label className="search" style={{ flex: 1, margin: 0 }}>
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
              placeholder="জেলা বা জায়গার নাম খুঁজুন…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          {(selectedDistrict || searchQuery) && (
            <button
              className="link"
              onClick={() => {
                setSelectedDistrict(null);
                setSearchQuery("");
              }}
            >
              বাছাই মুছুন
            </button>
          )}
        </div>

        <div className="dvrow" style={{ marginTop: 12 }}>
          {divisions.map((dv) => (
            <button
              key={dv}
              className={`dvchip ${selectedDivision === dv ? "active" : ""}`}
              onClick={() => {
                setSelectedDivision(dv);
                setSelectedDistrict(null);
              }}
            >
              {dv === "all" ? "সব বিভাগ" : DIV_BN[dv] || dv}
            </button>
          ))}
        </div>

        <div className="chips ex-chips" style={{ marginTop: 8 }}>
          {districts.map((d) => (
            <button
              key={d}
              className={`chip ${selectedDistrict === d ? "active" : ""}`}
              onClick={() =>
                setSelectedDistrict((prev) => (prev === d ? null : d))
              }
            >
              {BN[d] || d}
            </button>
          ))}
        </div>
      </section>

      <div className="notice">
        ⚠️ ভাড়া, খরচ ও হোটেলের তথ্য আনুমানিক এবং সময়ের সাথে বদলায়। যাওয়ার
        আগে সর্বশেষ তথ্য যাচাই করে নিন। দুর্গম পাহাড়ি এলাকা বা সেন্টমার্টিনের
        মতো জায়গায় যাওয়ার আগে সরকারি নির্দেশনা দেখে নিন।
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
          তথ্য লোড হচ্ছে…
        </p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
          তথ্য লোড করা যায়নি। public/places.json আছে কিনা দেখুন।
        </p>
      ) : allSpots.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
          কিছু পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন বা বাছাই মুছুন।
        </p>
      ) : (
        <>
          <div className="spots">
            {shownSpots.map((spot) => (
              <div
                key={`${spot.districtName}-${spot.n}`}
                className="spot"
                onClick={() => setActiveModalSpot(spot)}
              >
                <div className="ph">
                  <SmartImg img={spot.img} alt={spot.n} width={600} />
                  <span className="badge">{spot.districtBn}</span>
                </div>
                <div className="sb">
                  <h4>{spot.n}</h4>
                  <p>{spot.d || "বাংলাদেশের একটি মনোরম দর্শনীয় স্থান।"}</p>
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="gmap"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(mapsUrl(spot), "_blank", "noopener");
                      }}
                    >
                      📍 ম্যাপে দেখুন
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allSpots.length > visibleCount && (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <button
                className="link"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                আরও দেখুন ({allSpots.length - visibleCount}টি বাকি)
              </button>
            </div>
          )}
        </>
      )}

      {/* ---------------- Spot Details Modal ---------------- */}
      {activeModalSpot && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setActiveModalSpot(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="বন্ধ করুন"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                border: "none",
                background: "var(--chip)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold",
                zIndex: 2,
              }}
              onClick={() => setActiveModalSpot(null)}
            >
              ✕
            </button>

            {/* Main image */}
            {activeModalSpot.img && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--chip)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <SmartImg
                    img={activeModalSpot.img}
                    alt={activeModalSpot.n}
                    width={1000}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                {credit(activeModalSpot.img) && (
                  <a
                    href={activeModalSpot.img.src}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    {credit(activeModalSpot.img)}
                  </a>
                )}
              </div>
            )}

            <span className="pill">{activeModalSpot.districtBn}</span>
            <h2 style={{ margin: "12px 0 8px", fontSize: 24 }}>
              {activeModalSpot.n}
            </h2>
            <p style={{ color: "#3d4440", fontSize: 15 }}>
              {activeModalSpot.h || activeModalSpot.d}
            </p>

            {/* Quick facts */}
            {(activeModalSpot.best ||
              activeModalSpot.dur ||
              activeModalSpot.cost) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                {activeModalSpot.best && (
                  <div style={{ ...box, margin: 0 }}>
                    <h4 style={boxTitle}>🗓️ সেরা সময়</h4>
                    <p style={boxText}>{activeModalSpot.best}</p>
                  </div>
                )}
                {activeModalSpot.dur && (
                  <div style={{ ...box, margin: 0 }}>
                    <h4 style={boxTitle}>⏱️ সময় লাগবে</h4>
                    <p style={boxText}>{activeModalSpot.dur}</p>
                  </div>
                )}
                {activeModalSpot.cost && (
                  <div style={{ ...box, margin: 0 }}>
                    <h4 style={boxTitle}>💰 খরচ</h4>
                    <p style={boxText}>{activeModalSpot.cost}</p>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {activeModalSpot.hx?.length > 0 && (
              <InfoBox title="📜 ইতিহাস ও পরিচিতি">
                {activeModalSpot.hx.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      ...boxText,
                      marginBottom: i < activeModalSpot.hx.length - 1 ? 8 : 0,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </InfoBox>
            )}

            {/* Facts table */}
            {activeModalSpot.facts?.length > 0 && (
              <InfoBox title="ℹ️ এক নজরে">
                <div style={{ display: "grid", gap: 4 }}>
                  {activeModalSpot.facts.map(([k, v], i) => (
                    <div
                      key={i}
                      style={{ fontSize: 14, color: "var(--muted)" }}
                    >
                      <strong style={{ color: "inherit" }}>{k}:</strong> {v}
                    </div>
                  ))}
                </div>
              </InfoBox>
            )}

            {/* To-do */}
            {activeModalSpot.todo?.length > 0 && (
              <InfoBox title="✅ কী কী করবেন">
                <ul style={{ margin: 0, paddingLeft: 18, ...boxText }}>
                  {activeModalSpot.todo.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {/* How to reach the spot */}
            {activeModalSpot.how && (
              <InfoBox title="📍 স্থানে পৌঁছানো">
                <p style={boxText}>{activeModalSpot.how}</p>
              </InfoBox>
            )}

            {/* How to reach the district */}
            {activeModalSpot.go?.length > 0 && (
              <InfoBox
                title={`🚗 ঢাকা থেকে ${activeModalSpot.districtBn} যাবেন যেভাবে`}
              >
                {(activeModalSpot.distTime || activeModalSpot.distKm > 0) && (
                  <p style={{ ...boxText, marginBottom: 8 }}>
                    {activeModalSpot.distKm > 0 &&
                      `প্রায় ${activeModalSpot.distKm} কিমি`}
                    {activeModalSpot.distKm > 0 &&
                      activeModalSpot.distTime &&
                      " · "}
                    {activeModalSpot.distTime}
                  </p>
                )}
                <ul style={{ margin: 0, paddingLeft: 18, ...boxText }}>
                  {activeModalSpot.go.map(([type, text], i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      <strong>{TRANSPORT_BN[type] || type}:</strong> {text}
                    </li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {/* Stay */}
            {activeModalSpot.stay?.length > 0 && (
              <InfoBox title="🏨 কোথায় থাকবেন">
                <ul style={{ margin: 0, paddingLeft: 18, ...boxText }}>
                  {activeModalSpot.stay.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {/* Budget + food (district level) */}
            {(activeModalSpot.distCost || activeModalSpot.distFood) && (
              <InfoBox title="🍽️ খরচ ও খাবার (জেলা)">
                {activeModalSpot.distCost && (
                  <p style={boxText}>💰 {activeModalSpot.distCost}</p>
                )}
                {activeModalSpot.distFood && (
                  <p style={boxText}>🍴 {activeModalSpot.distFood}</p>
                )}
              </InfoBox>
            )}

            {/* Tips */}
            {activeModalSpot.tips?.length > 0 && (
              <InfoBox title="💡 টিপস">
                <ul style={{ margin: 0, paddingLeft: 18, ...boxText }}>
                  {activeModalSpot.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {/* Nearby */}
            {activeModalSpot.near?.length > 0 && (
              <InfoBox title="🧭 আশেপাশে">
                <ul style={{ margin: 0, paddingLeft: 18, ...boxText }}>
                  {activeModalSpot.near.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </InfoBox>
            )}

            {/* Gallery */}
            {activeModalSpot.gal?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <h4 style={boxTitle}>🖼️ আরও ছবি</h4>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    paddingBottom: 6,
                  }}
                >
                  {activeModalSpot.gal.map((g, i) => (
                    <a
                      key={i}
                      href={g.src}
                      target="_blank"
                      rel="noreferrer"
                      title={credit(g) || ""}
                      style={{
                        flex: "0 0 auto",
                        width: 150,
                        height: 100,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "var(--chip)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <SmartImg
                        img={g}
                        alt={`${activeModalSpot.n} ${i + 1}`}
                        width={400}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    margin: "4px 0 0",
                  }}
                >
                  ছবি: Wikimedia Commons (CC লাইসেন্স)। ছবিতে ক্লিক করলে
                  আলোকচিত্রীর তথ্য ও লাইসেন্স দেখা যাবে।
                </p>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <a
                className="cta"
                href={mapsUrl(activeModalSpot)}
                target="_blank"
                rel="noreferrer"
                style={{ width: "100%", justifyContent: "center" }}
              >
                গুগল ম্যাপে লোকেশন দেখুন →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
