/**
 * EmptyState.tsx
 * Elegant empty-state component — used for no results, no bookings, expired seats, etc.
 *
 * Props:
 *  - icon        : React node (e.g. a lucide-react icon)
 *  - title       : short serif heading
 *  - description : body explanation
 *  - action?     : optional CTA { label, onClick }
 *
 * Visual language: editorial, restrained — NOT cartoon/playful.
 */

import React from 'react';
import { motion } from 'framer-motion';

// ─── Props ────────────────────────────────────────────────────────────────────
interface EmptyStateAction {
  label:   string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** Large icon — pass a lucide-react component instance with desired size */
  icon:         React.ReactNode;
  /** Short serif heading */
  title:        string;
  /** Explanatory body text */
  description:  string;
  /** Optional call-to-action button */
  action?:      EmptyStateAction;
  /** Optional extra className for the wrapper */
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      role="status"
      aria-label={title}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
      className={className}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        'clamp(3rem, 10vw, 6rem) clamp(1.5rem, 5vw, 3rem)',
        gap:            '1.25rem',
        maxWidth:       '480px',
        margin:         '0 auto',
      }}
    >
      {/* Icon wrapper — gold tint, no decoration */}
      <div
        aria-hidden="true"
        style={{
          color:         'var(--color-gold-dim)',
          marginBottom:  '0.5rem',
          lineHeight:    1,
        }}
      >
        {icon}
      </div>

      {/* Thin gold rule */}
      <div
        aria-hidden="true"
        style={{
          width:      '32px',
          height:     '1px',
          background: 'var(--color-gold-dim)',
        }}
      />

      {/* Title */}
      <h2
        style={{
          fontFamily:  'var(--font-display)',
          fontWeight:  400,
          fontStyle:   'italic',
          fontSize:    'clamp(1.4rem, 3vw, 1.9rem)',
          color:       'var(--color-ivory)',
          margin:      0,
          lineHeight:  '1.25',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h2>

      {/* Description */}
      <p
        style={{
          fontFamily:  'var(--font-body)',
          fontSize:    'clamp(0.82rem, 1.5vw, 0.9rem)',
          color:       'var(--color-ivory-dim)',
          margin:      0,
          lineHeight:  '1.7',
          maxWidth:    '360px',
          letterSpacing: '0.01em',
        }}
      >
        {description}
      </p>

      {/* Optional CTA */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop:     '0.5rem',
            padding:       '0.7rem 2rem',
            background:    'transparent',
            border:        '1px solid var(--color-gold)',
            color:         'var(--color-gold)',
            fontFamily:    'var(--font-body)',
            fontSize:      '0.78rem',
            fontWeight:    600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            transition:    'background 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-gold)';
            e.currentTarget.style.color      = 'var(--color-bg)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color      = 'var(--color-gold)';
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
