import React from 'react';

/*
  CSS-animated Bangladesh flag using SVG + keyframe wave illusion.
  Pole on the left, flag waves to the right naturally.
*/
export default function WavingFlag() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: 0,
        userSelect: 'none',
      }}
      title="বাংলাদেশ জাতীয় পতাকা"
      aria-label="বাংলাদেশ পতাকা"
    >
      {/* Pole */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        {/* Finial ball */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4af37, #b8860b)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          marginBottom: -1
        }} />
        {/* Shaft */}
        <div style={{
          width: 4, height: 100,
          background: 'linear-gradient(to right, #a0a0a0, #e0e0e0, #a0a0a0)',
          borderRadius: '2px',
          boxShadow: '1px 0 4px rgba(0,0,0,0.25)',
        }} />
      </div>

      {/* Flag cloth with CSS wave */}
      <div className="bd-flag-cloth">
        {/* Green background */}
        <div className="bd-flag-green" />
        {/* Red circle */}
        <div className="bd-flag-circle" />
        {/* Shading overlay to simulate 3D wave */}
        <div className="bd-flag-shade" />
      </div>

      <style>{`
        .bd-flag-cloth {
          position: relative;
          width: 130px;
          height: 78px;
          margin-top: 6px;
          overflow: hidden;
          border-radius: 0 2px 2px 0;
          transform-origin: left center;
          animation: flagWave 1.6s ease-in-out infinite;
          box-shadow: 2px 2px 8px rgba(0,0,0,0.18);
        }

        @keyframes flagWave {
          0%   { transform: perspective(300px) rotateY(0deg)  skewY(0deg);   }
          25%  { transform: perspective(300px) rotateY(6deg)  skewY(1.2deg); }
          50%  { transform: perspective(300px) rotateY(0deg)  skewY(0deg);   }
          75%  { transform: perspective(300px) rotateY(-5deg) skewY(-1deg);  }
          100% { transform: perspective(300px) rotateY(0deg)  skewY(0deg);   }
        }

        .bd-flag-green {
          position: absolute;
          inset: 0;
          background: #006A4E;
        }

        .bd-flag-circle {
          position: absolute;
          top: 50%;
          left: 44%;          /* slightly left of center per BD flag spec */
          transform: translate(-50%, -50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #F42A41;
        }

        /* Gradient overlay = simulates left-edge shadow & right-edge highlight during wave */
        .bd-flag-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0,0,0,0.18) 0%,
            rgba(255,255,255,0.08) 40%,
            rgba(0,0,0,0.12) 80%,
            rgba(255,255,255,0.05) 100%
          );
          animation: shadeShift 1.6s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes shadeShift {
          0%   { opacity: 0.6; }
          25%  { opacity: 1;   }
          50%  { opacity: 0.6; }
          75%  { opacity: 0.9; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
