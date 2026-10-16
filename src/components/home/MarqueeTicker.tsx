/**
 * MarqueeTicker.tsx
 * ───────────────────────────────────────────────────────────────────────────
 * Infinite-loop horizontal ticker strip showing upcoming event names.
 * - Two copies of the content side-by-side for seamless wrap
 * - CSS marquee keyframe animation (25 s linear)
 * - Pauses on hover via CSS animation-play-state
 * - aria-hidden: decorative — screen readers don't need this
 * ───────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

/* ── Data ───────────────────────────────────────────────────────────────── */
const TICKER_ITEMS: string[] = [
  'Arijit Singh Live — Mumbai',
  'Coldplay World Tour — Ahmedabad',
  'Kenny Sebastian — Bangalore',
  'Nucleya: Bass Raja — Pune',
  'Hamlet (NSD) — Delhi',
  'Google Cloud Next India — Hyderabad',
  'MI vs CSK — Wankhede',
  'Jaipur Literature Festival',
  'Priyanka Chopra Jonas Masterclass — Delhi',
  'BRICS Innovation Expo — Chennai',
];

/* ── Separator component ─────────────────────────────────────────────────── */
function Diamond() {
  return (
    <span
      aria-hidden="true"
      style={{
        color: 'var(--color-on-accent)',
        margin: '0 20px',
        fontSize: '10px',
        lineHeight: 1,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      ◆
    </span>
  );
}

/* ── Single strip of ticker content ─────────────────────────────────────── */
function TickerContent() {
  return (
    <>
      {TICKER_ITEMS.map((item, i) => (
        <React.Fragment key={i}>
          <span
            style={{
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {item}
          </span>
          <Diamond />
        </React.Fragment>
      ))}
    </>
  );
}

/* ── MarqueeTicker ───────────────────────────────────────────────────────── */
export default function MarqueeTicker() {
  return (
    <>
      {/* Inject marquee keyframes + hover pause */}
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 25s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        aria-hidden="true"
        role="presentation"
        style={{
          height: '44px',
          background: 'var(--color-gold)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* The track: two identical copies placed inline for seamless loop */}
        <div
          className="marquee-track"
          style={{
            display: 'flex',
            alignItems: 'center',
            willChange: 'transform',
            /* Width must be at least 200% to hold both copies */
            width: 'max-content',
          }}
        >
          {/* Copy 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-on-accent)',
              paddingRight: '0px',
            }}
          >
            <TickerContent />
          </div>

          {/* Copy 2 — exact duplicate for seamless wrap */}
          <div
            aria-hidden="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-on-accent)',
            }}
          >
            <TickerContent />
          </div>
        </div>
      </div>
    </>
  );
}
