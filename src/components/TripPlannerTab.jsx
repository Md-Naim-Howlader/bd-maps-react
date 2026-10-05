import React, { useState } from 'react';
import { DATA, BN, bnNum } from '../data/bangladeshData';

export default function TripPlannerTab() {
  const [startDistrict, setStartDistrict] = useState('Dhaka');
  const [selectedStops, setSelectedStops] = useState(['Cox\'s Bazar', 'Sylhet']);
  const [days, setDays] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(15000);
  const [optimizeRoute, setOptimizeRoute] = useState(true);

  const districtsList = DATA.f
    .map((f) => f.n)
    .sort((a, b) => (BN[a] || a).localeCompare(BN[b] || b, 'bn'));

  const toggleStop = (dist) => {
    setSelectedStops((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
    );
  };

  const perPersonCost = Math.round(budget / Math.max(1, travelers));

  return (
    <div>
      <header className="hero">
        <span className="pill">আপনার মতো করে সাজানো ভ্রমণ</span>
        <h1>
          ট্রিপ <span>প্ল্যানার</span>
        </h1>
        <p>
          কোথা থেকে শুরু করবেন আর কোন কোন জেলায় যাবেন বেছে নিন — সাজিয়ে দেওয়া
          হবে কোথায় আগে যাবেন, প্রতিদিন কী দেখবেন, কোথায় থাকবেন আর মোট কত খরচ
          হতে পারে।
        </p>
      </header>

      <main className="tp">
        <aside className="card tp-form">
          {/* Step 1 */}
          <div className="tp-step">
            <h3>
              <b>১</b>কোথা থেকে শুরু করবেন?
            </h3>
            <select
              className="tp-sel"
              value={startDistrict}
              onChange={(e) => setStartDistrict(e.target.value)}
            >
              {districtsList.map((d) => (
                <option key={d} value={d}>
                  {BN[d] || d}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2 */}
          <div className="tp-step">
            <h3>
              <b>২</b>কোন কোন জেলায় যাবেন?
            </h3>
            <select
              className="tp-sel"
              onChange={(e) => {
                if (e.target.value && !selectedStops.includes(e.target.value)) {
                  toggleStop(e.target.value);
                }
              }}
              value=""
            >
              <option value="">+ জেলা যোগ করুন</option>
              {districtsList
                .filter((d) => d !== startDistrict && !selectedStops.includes(d))
                .map((d) => (
                  <option key={d} value={d}>
                    {BN[d] || d}
                  </option>
                ))}
            </select>

            <div className="chips" style={{ marginTop: '12px' }}>
              {selectedStops.map((d) => (
                <span
                  key={d}
                  className="chip active"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {BN[d] || d}
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px'
                    }}
                    onClick={() => toggleStop(d)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div className="tp-step">
            <h3>
              <b>৩</b>কত দিন, কত বাজেট?
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span>কত দিনের ট্যুর:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', borderRadius: '99px', padding: '2px 8px', border: '1px solid var(--line)' }}>
                <button
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                >
                  −
                </button>
                <b style={{ minWidth: '40px', textAlign: 'center' }}>
                  {bnNum(days)} দিন
                </b>
                <button
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}
                  onClick={() => setDays((d) => d + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span>কতজন যাবেন:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', borderRadius: '99px', padding: '2px 8px', border: '1px solid var(--line)' }}>
                <button
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}
                  onClick={() => setTravelers((p) => Math.max(1, p - 1))}
                >
                  −
                </button>
                <b style={{ minWidth: '40px', textAlign: 'center' }}>
                  {bnNum(travelers)} জন
                </b>
                <button
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}
                  onClick={() => setTravelers((p) => p + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '14px', marginTop: '10px' }}>
              মোট আনুমানিক বাজেট (টাকায়):
              <input
                type="number"
                className="tp-sel"
                style={{ marginTop: '6px' }}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <button
            className="btn primary"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={() => window.print()}
          >
            🖨️ প্ল্যান প্রিন্ট / PDF সেভ করুন
          </button>
        </aside>

        {/* Right Itinerary Overview */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div className="tp-stat">
              <small>মোট সময়</small>
              <b>{bnNum(days)} দিন</b>
            </div>
            <div className="tp-stat">
              <small>ভ্রমণকারী</small>
              <b>{bnNum(travelers)} জন</b>
            </div>
            <div className="tp-stat">
              <small>জনপ্রতি খরচ (আনুমানিক)</small>
              <b>৳{bnNum(perPersonCost.toLocaleString('bn-BD'))}</b>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px' }}>ভ্রমণের প্রস্তাবিত রুট ও সূচি</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span className="pill" style={{ background: '#fdecee', color: '#a3152a' }}>
                ★ {BN[startDistrict] || startDistrict} (শুরু)
              </span>
              {selectedStops.map((s, idx) => (
                <React.Fragment key={s}>
                  <span style={{ color: 'var(--muted)' }}>➔</span>
                  <span className="pill">{BN[s] || s}</span>
                </React.Fragment>
              ))}
              <span style={{ color: 'var(--muted)' }}>➔</span>
              <span className="pill" style={{ background: '#e3f0ea', color: 'var(--brand)' }}>
                {BN[startDistrict] || startDistrict} (প্রত্যাবর্তন)
              </span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {Array.from({ length: days }).map((_, dayIndex) => {
                const dayNum = dayIndex + 1;
                const stopName =
                  selectedStops[dayIndex % Math.max(1, selectedStops.length)] ||
                  startDistrict;

                return (
                  <div
                    key={dayNum}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '16px',
                      background: 'var(--bg)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="tp-no">{bnNum(dayNum)}</span>
                      <h4 style={{ margin: 0, fontSize: '17px' }}>
                        দিন {bnNum(dayNum)}: {BN[stopName] || stopName} ভ্রমণ
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                      সকালের নাস্তা শেষে স্থানীয় জনপ্রিয় দর্শনীয় স্থানসমূহ পরিদর্শন,
                      ঐতিহ্যবাহী খাবারের স্বাদ গ্রহণ এবং পরবর্তী গন্তব্যের উদ্দেশ্যে
                      যাত্রা।
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
