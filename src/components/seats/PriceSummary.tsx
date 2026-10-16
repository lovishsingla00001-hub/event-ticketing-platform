/**
 * PriceSummary.tsx — Seat selection checkout sidebar
 *
 * Displays selected seats with per-seat remove controls, a running
 * subtotal with convenience fee, and the "Proceed to Checkout" CTA.
 * Receives the event and seat-store hooks as props so it stays
 * composable and testable.
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Info } from 'lucide-react';
import type { Event } from '../../data/events';
import type { Seat } from '../../stores/seatStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_SEATS = 8;
const CONVENIENCE_FEE_RATE = 0.025; // 2.5 %

// ─── Props ───────────────────────────────────────────────────────────────────
interface PriceSummaryProps {
  event: Event;
  selectedSeats: Seat[];
  onRemoveSeat: (seatId: string) => void;
  onClearAll: () => void;
  onProceed: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatINR = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Category accent colour */
const categoryColour = (cat: string): string => {
  if (cat === 'VIP')     return 'var(--color-gold)';
  if (cat === 'Premium') return 'var(--color-ivory)';
  return 'var(--color-ivory-dim)';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single selected-seat row */
function SeatRow({ seat, onRemove }: { seat: Seat; onRemove: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
        gap: '8px',
      }}
    >
      {/* Seat identity */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-ivory)',
              letterSpacing: '0.04em',
            }}
          >
            {seat.id}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: categoryColour(seat.category),
              background: 'var(--color-surface-3)',
              padding: '1px 6px',
              borderRadius: '2px',
            }}
          >
            {seat.category}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            color: 'var(--color-ivory-dim)',
            marginTop: '2px',
            display: 'block',
          }}
        >
          Row {seat.row} · Seat {seat.seatNumber}
        </span>
      </div>

      {/* Price */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-gold)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatINR(seat.price)}
      </span>

      {/* Remove button */}
      <button
        onClick={() => onRemove(seat.id)}
        aria-label={`Remove seat ${seat.id}`}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: 'var(--color-ivory-faint)',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '2px',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-burgundy)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-faint)')}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Divider line */
function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0' }}
    />
  );
}

/** Totals row */
function TotalsRow({
  label,
  value,
  large,
  gold,
}: {
  label: string;
  value: string;
  large?: boolean;
  gold?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: large ? 0 : '6px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: large ? '0.85rem' : '0.78rem',
          fontWeight: large ? 600 : 400,
          color: large ? 'var(--color-ivory)' : 'var(--color-ivory-dim)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: large ? 'var(--font-display)' : 'var(--font-body)',
          fontSize: large ? '1.25rem' : '0.85rem',
          fontWeight: large ? 700 : 500,
          color: gold ? 'var(--color-gold)' : large ? 'var(--color-ivory)' : 'var(--color-ivory-dim)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PriceSummary({
  event,
  selectedSeats,
  onRemoveSeat,
  onClearAll,
  onProceed,
}: PriceSummaryProps) {
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * CONVENIENCE_FEE_RATE);
  const total = subtotal + convenienceFee;
  const count = selectedSeats.length;
  const hasSeats = count > 0;

  const handleProceed = useCallback(() => {
    if (!hasSeats) return;
    onProceed();
  }, [hasSeats, onProceed]);

  return (
    <aside
      aria-label="Price summary"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        position: 'sticky',
        top: '88px',
      }}
    >
      {/* ── Event header ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '4px',
          }}
        >
          Your Selection
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--color-ivory)',
            lineHeight: 1.25,
            margin: '0 0 4px',
          }}
        >
          {event.title}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-ivory-dim)',
          }}
        >
          {formatDate(event.date)} · {event.venue}
        </p>
      </div>

      <Divider />

      {/* ── Seat counter ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-ivory-dim)',
          }}
        >
          <span
            style={{
              color: hasSeats ? 'var(--color-gold)' : 'var(--color-ivory-dim)',
              fontWeight: 700,
            }}
          >
            {count}
          </span>
          /{MAX_SEATS} seats selected
        </span>

        {/* Clear all */}
        <AnimatePresence>
          {hasSeats && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={onClearAll}
              aria-label="Clear all selected seats"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                color: 'var(--color-ivory-dim)',
                padding: '0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-burgundy)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-dim)')}
            >
              <Trash2 size={12} />
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Seat list ── */}
      <div
        style={{
          minHeight: '60px',
          maxHeight: '240px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent',
        }}
        role="list"
        aria-label="Selected seats"
      >
        <AnimatePresence initial={false}>
          {hasSeats ? (
            selectedSeats.map(seat => (
              <SeatRow key={seat.id} seat={seat} onRemove={onRemoveSeat} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--color-ivory-faint)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
              }}
            >
              No seats selected yet.
              <br />
              Click a seat on the map to begin.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Divider />

      {/* ── Totals ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <TotalsRow label="Subtotal" value={hasSeats ? formatINR(subtotal) : '—'} />
        <TotalsRow
          label="Convenience fee (2.5%)"
          value={hasSeats ? formatINR(convenienceFee) : '—'}
        />

        <div
          style={{
            height: '1px',
            background: 'var(--color-border)',
            margin: '10px 0',
          }}
          aria-hidden="true"
        />

        <TotalsRow
          label="Total"
          value={hasSeats ? formatINR(total) : '—'}
          large
          gold
        />
      </div>

      {/* ── Max-seats notice ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          marginBottom: '1rem',
          padding: '8px 10px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Info size={12} style={{ color: 'var(--color-gold)', marginTop: '2px', flexShrink: 0 }} />
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            color: 'var(--color-ivory-dim)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Maximum {MAX_SEATS} seats per booking. Prices include all taxes.
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleProceed}
          disabled={!hasSeats}
          aria-disabled={!hasSeats}
          aria-label={
            hasSeats
              ? `Proceed to checkout — ${formatINR(total)}`
              : 'Select at least one seat to proceed'
          }
          style={{
            width: '100%',
            padding: '14px 20px',
            background: hasSeats ? 'var(--color-gold)' : 'var(--color-surface-3)',
            color: hasSeats ? 'var(--color-bg)' : 'var(--color-ivory-faint)',
            border: hasSeats ? 'none' : '1px solid var(--color-border)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: hasSeats ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s, opacity 0.2s',
            opacity: hasSeats ? 1 : 0.5,
          }}
          onMouseEnter={e => {
            if (hasSeats) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-gold-light)';
          }}
          onMouseLeave={e => {
            if (hasSeats) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-gold)';
          }}
        >
          <ShoppingBag size={16} />
          {hasSeats ? `Proceed to Checkout` : 'Select Seats to Continue'}
        </button>
      </div>
    </aside>
  );
}
