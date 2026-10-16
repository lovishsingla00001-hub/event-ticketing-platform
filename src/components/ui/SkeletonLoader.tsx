/**
 * SkeletonLoader.tsx
 * Shimmer skeleton loaders for VelvetSeat.
 *
 * Named exports:
 *  - EventCardSkeleton   — mimics the EventCard grid tile
 *  - EventDetailSkeleton — mimics the full EventDetail page layout
 *
 * Default export:
 *  - Skeleton            — generic reusable shimmer block
 *
 * The "shimmer" keyframe animation must be present in globals.css:
 *
 *   @keyframes shimmer {
 *     0%   { background-position: -800px 0; }
 *     100% { background-position:  800px 0; }
 *   }
 */

import React from 'react';

// ─── Base shimmer block ────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Width — any valid CSS value. Default: '100%' */
  width?:        string;
  /** Height — any valid CSS value. Default: '1rem' */
  height?:       string;
  /** Override border-radius. Default: '0' (editorial, no rounding) */
  borderRadius?: string;
  style?:        React.CSSProperties;
  className?:    string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '0', style, className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={['shimmer', className].filter(Boolean).join(' ')}
      style={{
        width,
        height,
        borderRadius,
        // Shimmer gradient — moves across the element via keyframe
        background:
          'linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 37%, var(--color-surface-2) 63%)',
        backgroundSize: '800px 100%',
        animation:      'shimmer 1.6s ease-in-out infinite',
        flexShrink:     0,
        ...style,
      }}
    />
  );
}

// ─── EventCard skeleton ────────────────────────────────────────────────────────

/**
 * Mimics the layout of an EventCard:
 * [ image area ]
 * [ badge  date ]
 * [ title       ]
 * [ venue line  ]
 * [ price  btn  ]
 */
export function EventCardSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="Loading event"
      style={{
        display:        'flex',
        flexDirection:  'column',
        background:     'var(--color-surface)',
        border:         '1px solid var(--color-border)',
        overflow:       'hidden',
      }}
    >
      {/* Hero image placeholder */}
      <Skeleton height="220px" />

      {/* Content area */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Badge + date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="72px" height="18px" />
          <Skeleton width="90px" height="14px" />
        </div>

        {/* Title — two lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Skeleton height="22px" />
          <Skeleton width="65%" height="22px" />
        </div>

        {/* Venue line */}
        <Skeleton width="55%" height="14px" />

        {/* Price + button row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
          <Skeleton width="70px" height="20px" />
          <Skeleton width="100px" height="36px" />
        </div>
      </div>
    </article>
  );
}

// ─── EventDetail skeleton ──────────────────────────────────────────────────────

/**
 * Mimics the full EventDetail page:
 * [ wide hero image          ]
 * [ breadcrumb               ]
 * [ title                    ]
 * [ metadata row             ]
 * [ two-col: description | sidebar ]
 */
export function EventDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading event details"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}
    >
      {/* Hero */}
      <Skeleton height="clamp(240px, 40vw, 520px)" style={{ marginBottom: '2rem' }} />

      {/* Breadcrumb */}
      <Skeleton width="220px" height="14px" style={{ marginBottom: '1.5rem' }} />

      {/* Title */}
      <Skeleton height="clamp(2rem, 5vw, 3rem)" style={{ marginBottom: '0.6rem' }} />
      <Skeleton width="50%" height="clamp(1.5rem, 4vw, 2.2rem)" style={{ marginBottom: '2rem' }} />

      {/* Metadata row (date / venue / city chips) */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {[140, 180, 110].map(w => (
          <Skeleton key={w} width={`${w}px`} height="20px" />
        ))}
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display:     'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap:         '3rem',
        }}
      >
        {/* Description column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[100, 88, 95, 72, 90, 65].map((pct, i) => (
            <Skeleton key={i} width={`${pct}%`} height="16px" />
          ))}
          <Skeleton height="16px" style={{ marginTop: '1rem' }} />
          {[82, 91, 78].map((pct, i) => (
            <Skeleton key={`b${i}`} width={`${pct}%`} height="16px" />
          ))}
        </div>

        {/* Sidebar / booking panel */}
        <div
          style={{
            background:  'var(--color-surface)',
            border:      '1px solid var(--color-border)',
            padding:     '1.5rem',
            display:     'flex',
            flexDirection: 'column',
            gap:         '1rem',
            alignSelf:   'start',
          }}
        >
          <Skeleton height="16px" width="60%" />
          <Skeleton height="2.5rem" />
          <Skeleton height="14px" width="75%" />
          <Skeleton height="14px" width="50%" />
          <Skeleton height="48px" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Default export ────────────────────────────────────────────────────────────
export default Skeleton;
