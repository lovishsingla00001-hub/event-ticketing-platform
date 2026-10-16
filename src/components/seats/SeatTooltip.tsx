/**
 * SeatTooltip.tsx — Floating seat info tooltip
 *
 * Renders a gold-bordered glass card near the mouse cursor showing
 * seat details. Stays within viewport bounds by flipping orientation
 * when the cursor is near an edge.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Seat } from '../../stores/seatStore';

// ─── Props ───────────────────────────────────────────────────────────────────
interface SeatTooltipProps {
  seat: Seat | null;
  position: { x: number; y: number };
  visible: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format price in INR with locale-aware thousands separator */
const formatINR = (price: number): string =>
  price === 0
    ? 'Free'
    : `₹${price.toLocaleString('en-IN')}`;

/** Category label colours */
const CATEGORY_COLOURS: Record<string, string> = {
  VIP:     'var(--color-gold)',
  Premium: 'var(--color-ivory)',
  Regular: 'var(--color-ivory-dim)',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SeatTooltip({ seat, position, visible }: SeatTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Offset so the tooltip doesn't sit directly under the cursor
  const OFFSET_X = 14;
  const OFFSET_Y = -8;

  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = position.x + OFFSET_X;
    let y = position.y + OFFSET_Y;

    // Flip horizontally if tooltip would overflow the right edge
    if (x + rect.width > vw - 12) {
      x = position.x - rect.width - OFFSET_X;
    }
    // Flip vertically if tooltip would overflow the bottom edge
    if (y + rect.height > vh - 12) {
      y = position.y - rect.height - 4;
    }

    setAdjustedPos({ x, y });
  }, [position, visible, OFFSET_Y]);

  return (
    <AnimatePresence>
      {visible && seat && (
        <motion.div
          ref={tooltipRef}
          role="tooltip"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: adjustedPos.x,
            top: adjustedPos.y,
            zIndex: 9999,
            pointerEvents: 'none',
            // Glass surface
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-gold)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            borderRadius: '4px',
            padding: '10px 14px',
            minWidth: '148px',
          }}
        >
          {/* Seat ID row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory-dim)',
              }}
            >
              Seat
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-ivory)',
                letterSpacing: '0.04em',
              }}
            >
              {seat.id}
            </span>
          </div>

          {/* Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory-dim)',
              }}
            >
              Row
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                color: 'var(--color-ivory)',
              }}
            >
              {seat.row}
            </span>
          </div>

          {/* Seat number */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory-dim)',
              }}
            >
              No.
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                color: 'var(--color-ivory)',
              }}
            >
              {seat.seatNumber}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: 'var(--color-border)',
              margin: '8px 0',
            }}
            aria-hidden="true"
          />

          {/* Category */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory-dim)',
              }}
            >
              Class
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: CATEGORY_COLOURS[seat.category] ?? 'var(--color-ivory)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {seat.category}
            </span>
          </div>

          {/* Price */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory-dim)',
              }}
            >
              Price
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
              }}
            >
              {formatINR(seat.price)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
