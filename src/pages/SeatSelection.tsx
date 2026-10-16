/**
 * SeatSelection.tsx — Interactive theatre seat-map page
 *
 * Renders a full SVG seat map with three sections (VIP / Premium / Regular),
 * pan + zoom via CSS transform, keyboard navigation, hover tooltips, and
 * a price-summary sidebar wired to the Zustand seat store.
 *
 * Seat ID convention:
 *   Section A (VIP)     → 'A{row}-{seat}' e.g. 'A1-5'
 *   Section B (Premium) → 'B{row}-{seat}' e.g. 'B3-7'
 *   Section C (Regular) → 'C{row}-{seat}' e.g. 'C6-12'
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import events from '../data/events';
import { useSeatStore, type Seat, type SeatStatus } from '../stores/seatStore';
import { useCheckoutStore } from '../stores/checkoutStore';
import PriceSummary from '../components/seats/PriceSummary';
import SeatTooltip from '../components/seats/SeatTooltip';

// ─── Page transition ──────────────────────────────────────────────────────────
const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const SVG_WIDTH    = 940;          // total viewBox width
const SVG_HEIGHT   = 780;          // total viewBox height
const STAGE_Y      = 20;           // stage rect top
const STAGE_H      = 50;           // stage rect height
const STAGE_X      = 60;
const STAGE_W      = SVG_WIDTH - 120;

// Section vertical offsets (top of first seat row in each section)
const VIP_Y        = STAGE_Y + STAGE_H + 60;
const PREMIUM_Y    = VIP_Y + 3 * 34 + 50;    // 3 VIP rows × row-height + gap
const REGULAR_Y    = PREMIUM_Y + 5 * 34 + 50; // 5 Premium rows × row-height + gap

// Seat dimensions
const REGULAR_W    = 18;
const REGULAR_H    = 16;
const VIP_W        = 22;
const VIP_H        = 18;
const ROW_HEIGHT   = 30;          // vertical spacing between rows

// Horizontal centering helpers
const centreX = (count: number, seatW: number, gap: number) =>
  (SVG_WIDTH - (count * seatW + (count - 1) * gap)) / 2;

// ─── Seat generation ──────────────────────────────────────────────────────────

/**
 * Build the complete flat seat list for the venue.
 * Pre-reserved seats are determined here so they are stable across renders.
 */
function generateAllSeats(
  prices: { Regular: number; Premium: number; VIP: number },
): { seat: Seat; reserved: boolean; sectionLabel: string }[] {
  const result: { seat: Seat; reserved: boolean; sectionLabel: string }[] = [];

  /* VIP — Section A: 3 rows × 10 seats */
  for (let row = 1; row <= 3; row++) {
    for (let seatNum = 1; seatNum <= 10; seatNum++) {
      const id = `A${row}-${seatNum}`;
      // Every 3rd seat in VIP row 2 is reserved
      const reserved = row === 2 && seatNum % 3 === 0;
      result.push({
        seat: { id, row, seatNumber: seatNum, category: 'VIP', price: prices.VIP },
        reserved,
        sectionLabel: 'A',
      });
    }
  }

  /* Premium — Section B: 5 rows × 15 seats */
  for (let row = 1; row <= 5; row++) {
    for (let seatNum = 1; seatNum <= 15; seatNum++) {
      const id = `B${row}-${seatNum}`;
      // Every 5th seat in Premium is reserved
      const reserved = seatNum % 5 === 0;
      result.push({
        seat: { id, row, seatNumber: seatNum, category: 'Premium', price: prices.Premium },
        reserved,
        sectionLabel: 'B',
      });
    }
  }

  /* Regular — Section C: 8 rows × 20 seats */
  for (let row = 1; row <= 8; row++) {
    for (let seatNum = 1; seatNum <= 20; seatNum++) {
      const id = `C${row}-${seatNum}`;
      // Every 7th seat in Regular is reserved
      const reserved = seatNum % 7 === 0;
      result.push({
        seat: { id, row, seatNumber: seatNum, category: 'Regular', price: prices.Regular },
        reserved,
        sectionLabel: 'C',
      });
    }
  }

  return result;
}

/** Compute x position of a seat within its row */
function seatX(
  seatNum: number, // 1-indexed
  count: number,
  seatW: number,
  gap: number,
): number {
  const startX = centreX(count, seatW, gap);
  return startX + (seatNum - 1) * (seatW + gap);
}

/** Compute y position for a row within a section */
function rowY(row: number, sectionTopY: number, seatH: number): number {
  return sectionTopY + (row - 1) * ROW_HEIGHT + (ROW_HEIGHT - seatH) / 2;
}

// ─── Status colours ────────────────────────────────────────────────────────────
const STATUS_FILL: Record<SeatStatus, string> = {
  available: 'var(--color-seat-available)',
  selected:  'var(--color-gold)',
  reserved:  'var(--color-ivory-faint)',
  sold:      'var(--color-surface)',
};
const STATUS_STROKE: Record<SeatStatus, string> = {
  available: 'var(--color-seat-available-border)',
  selected:  'var(--color-gold)',
  reserved:  'var(--color-border)',
  sold:      'var(--color-border)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Legend item ─────────────────────────────────────────────────────────────
function LegendItem({ status, label }: { status: SeatStatus; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        aria-hidden="true"
        style={{
          width: '14px',
          height: '12px',
          background: STATUS_FILL[status],
          border: `1px solid ${STATUS_STROKE[status]}`,
          borderRadius: '2px',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          color: 'var(--color-ivory-dim)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Individual SVG seat ──────────────────────────────────────────────────────
interface SeatRectProps {
  seat: Seat;
  status: SeatStatus;
  x: number;
  y: number;
  w: number;
  h: number;
  onHover: (seat: Seat | null, pos: { x: number; y: number }) => void;
  onToggle: (seat: Seat) => void;
  focusKey: string;
}

function SeatRect({ seat, status, x, y, w, h, onHover, onToggle, focusKey }: SeatRectProps) {
  const isSelected  = status === 'selected';
  const isReserved  = status === 'reserved';
  const isSold      = status === 'sold';
  const isClickable = !isReserved && !isSold;

  // Hatch pattern id for reserved seats (defined once in <defs>)
  const hatchRef = 'reservedHatch';

  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGGElement>) => {
      if (isClickable) {
        onHover(seat, { x: e.clientX, y: e.clientY });
      }
    },
    [seat, isClickable, onHover],
  );

  const handleMouseLeave = useCallback(() => {
    onHover(null, { x: 0, y: 0 });
  }, [onHover]);

  const handleClick = useCallback(() => {
    if (isClickable) onToggle(seat);
  }, [isClickable, seat, onToggle]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<SVGGElement>) => {
      if ((e.key === ' ' || e.key === 'Enter') && isClickable) {
        e.preventDefault();
        onToggle(seat);
      }
    },
    [isClickable, seat, onToggle],
  );

  return (
    <g
      className="seat-group"
      data-seat-key={focusKey}
      tabIndex={isClickable ? 0 : -1}
      role="button"
      aria-label={`Seat ${seat.id}, ${seat.category}, ₹${seat.price.toLocaleString('en-IN')}, ${status}`}
      aria-pressed={isSelected}
      aria-disabled={!isClickable}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isClickable ? 'pointer' : 'default', outline: 'none' }}
    >
      {/* Main seat rect */}
      <rect
        className="seat-rect"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={isReserved ? `url(#${hatchRef})` : STATUS_FILL[status]}
        stroke={STATUS_STROKE[status]}
        strokeWidth={isSelected ? 0 : 1}
        style={{
          transition: 'fill 0.15s, stroke 0.15s',
        }}
      />

      {/* Selected pulse ring */}
      {isSelected && (
        <rect
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          rx={3}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={1.5}
          opacity={0.6}
          style={{
            animation: 'seatPulse 1.2s ease-in-out infinite',
          }}
        />
      )}

      {/* Sold X marker */}
      {isSold && (
        <>
          <line
            x1={x + 3} y1={y + 3}
            x2={x + w - 3} y2={y + h - 3}
            stroke="var(--color-border-2)"
            strokeWidth={1}
          />
          <line
            x1={x + w - 3} y1={y + 3}
            x2={x + 3} y2={y + h - 3}
            stroke="var(--color-border-2)"
            strokeWidth={1}
          />
        </>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SeatSelection() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // ── Stores ────────────────────────────────────────────────────────────────
  const {
    selectedSeats,
    currentEventId,
    initEvent,
    selectSeat,
    deselectSeat,
    clearSelection,
    getSeatStatus,
    resetEventSeats,
  } = useSeatStore();
  const { initCheckout } = useCheckoutStore();

  // ── Event resolution ──────────────────────────────────────────────────────
  const event = useMemo(() => events.find(e => e.slug === slug), [slug]);
  const currentSelectedSeats = useMemo(
    () => currentEventId === event?.id ? selectedSeats : [],
    [currentEventId, event?.id, selectedSeats],
  );

  useEffect(() => {
    if (!event) { navigate('/404', { replace: true }); return; }
    initEvent(event.id, []);
    document.title = `Select Seats — ${event.title} — VelvetSeat`;
    return () => { document.title = 'VelvetSeat'; };
  }, [event, navigate, initEvent]);

  // ── Seat data ─────────────────────────────────────────────────────────────
  const allSeatsData = useMemo(
    () => (event ? generateAllSeats(event.prices) : []),
    [event],
  );

  // ── Tooltip state ─────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{
    seat: Seat | null;
    position: { x: number; y: number };
    visible: boolean;
  }>({ seat: null, position: { x: 0, y: 0 }, visible: false });

  const handleHover = useCallback((seat: Seat | null, pos: { x: number; y: number }) => {
    if (seat) {
      setTooltip({ seat, position: pos, visible: true });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, []);

  // ── Seat toggle ───────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (seat: Seat) => {
      if (!event) return;
      const status = getSeatStatus(event.id, seat.id);
      if (status === 'selected') {
        deselectSeat(event.id, seat.id);
      } else {
        selectSeat(event.id, seat);
      }
    },
    [event, getSeatStatus, selectSeat, deselectSeat],
  );

  // ── Pan / Zoom state ──────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastTouchDist = useRef<number | null>(null);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.91;
    setTransform(t => {
      const ns = Math.min(3, Math.max(0.5, t.scale * delta));
      return { ...t, scale: ns };
    });
  }, []);

  // Mouse pan
  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform(t => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
  }, []);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      isPanning.current = true;
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: transform.x,
        ty: transform.y,
      };
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current !== null) {
        const ratio = dist / lastTouchDist.current;
        setTransform(t => ({
          ...t,
          scale: Math.min(3, Math.max(0.5, t.scale * ratio)),
        }));
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTransform(t => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
    lastTouchDist.current = null;
  }, []);

  // ── Keyboard navigation between seats ────────────────────────────────────
  const handleMapKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const focused = document.activeElement as SVGGElement | null;
      if (!focused?.dataset?.seatKey) return;
      const keys = allSeatsData.map(d => d.seat.id);
      const idx = keys.indexOf(focused.dataset.seatKey);
      if (idx === -1) return;

      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = Math.min(idx + 1, keys.length - 1);
      else if (e.key === 'ArrowLeft') nextIdx = Math.max(idx - 1, 0);
      else if (e.key === 'ArrowDown') {
        // Jump to next row (rough: skip one row's worth of seats)
        const cat = allSeatsData[idx].sectionLabel;
        const perRow = cat === 'A' ? 10 : cat === 'B' ? 15 : 20;
        nextIdx = Math.min(idx + perRow, keys.length - 1);
      } else if (e.key === 'ArrowUp') {
        const cat = allSeatsData[idx].sectionLabel;
        const perRow = cat === 'A' ? 10 : cat === 'B' ? 15 : 20;
        nextIdx = Math.max(idx - perRow, 0);
      } else {
        return;
      }

      e.preventDefault();
      const target = document.querySelector<SVGGElement>(
        `[data-seat-key="${keys[nextIdx]}"]`,
      );
      target?.focus();
    },
    [allSeatsData],
  );

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleProceed = useCallback(() => {
    if (!event || currentSelectedSeats.length === 0) return;
    initCheckout(event, currentSelectedSeats);
    clearSelection();
    navigate('/checkout');
  }, [event, currentSelectedSeats, initCheckout, clearSelection, navigate]);

  // ── Remove seat ───────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (seatId: string) => {
      if (!event) return;
      deselectSeat(event.id, seatId);
    },
    [event, deselectSeat],
  );

  // ── Derive status for every seat (reactive on selectedSeats / soldSeats) ──
  const statusMap = (() => {
    const map: Record<string, SeatStatus> = {};
    allSeatsData.forEach(({ seat, reserved }) => {
      if (reserved) {
        map[seat.id] = 'reserved';
      } else {
        map[seat.id] = event ? getSeatStatus(event.id, seat.id) : 'available';
      }
    });
    return map;
  })();

  if (!event) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="main"
      aria-label={`Seat selection for ${event.title}`}
      style={{ minHeight: '100vh', background: 'var(--color-bg)' }}
    >
      {/* ── Pulse animation keyframes (injected once) ── */}
      <style>{`
        @keyframes seatPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>

      {/* ── Header ── */}
      <header
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.5rem 2rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <button
            onClick={() => navigate(`/events/${event.slug}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-ivory-dim)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              padding: '0',
              marginBottom: '10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-dim)')}
            aria-label="Back to event details"
          >
            <ArrowLeft size={14} />
            Back to event
          </button>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 600,
              color: 'var(--color-ivory)',
              margin: '0 0 4px',
              lineHeight: 1.15,
            }}
          >
            {event.title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: 'var(--color-ivory-dim)',
              margin: 0,
            }}
          >
            {event.venue} · {event.city} · {formatDate(event.date)}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            alignSelf: 'flex-end',
          }}
        >
          <button
            onClick={() => {
              resetEventSeats(event.id);
            }}
            title="Reset booked seats for this event to available"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--color-gold)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-gold)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
            }}
          >
            Release All Booked Seats
          </button>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--color-ivory-dim)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
            }}
          >
            Scroll to zoom · Drag to pan
          </div>
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.5rem 2rem 4rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* ══════ SEAT MAP ══════════════════════════════════════════════════ */}
        <div>
          {/* Section labels + legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '1rem',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                margin: 0,
              }}
            >
              Seat Map — {event.venue}
            </p>
            {/* Legend */}
            <div
              role="list"
              aria-label="Seat status legend"
              style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
            >
              <LegendItem status="available" label="Available" />
              <LegendItem status="selected"  label="Selected"  />
              <LegendItem status="reserved"  label="Reserved"  />
              <LegendItem status="sold"      label="Sold"      />
            </div>
          </div>

          {/* Pan / zoom container */}
          <div
            ref={mapContainerRef}
            role="region"
            aria-label="Interactive seat map — use arrow keys to navigate, Space or Enter to select"
            style={{
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              position: 'relative',
              cursor: 'grab',
              userSelect: 'none',
              touchAction: 'none',
              height: '540px',
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleMapKeyDown}
            tabIndex={-1}
          >
            {/* Zoom / pan transform wrapper */}
            <div
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: 'center top',
                transition: 'transform 0.05s linear',
                width: '100%',
                height: '100%',
              }}
            >
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                width="100%"
                height="100%"
                aria-label="Theatre seat map"
                role="img"
                style={{ display: 'block' }}
              >
                {/* ── Defs: hatch pattern for reserved, pulse keyframes ── */}
                <defs>
                  <pattern id="reservedHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="4" stroke="var(--color-border)" strokeWidth="1.5" />
                  </pattern>

                  {/* Gold glow filter for selected seats */}
                  <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* ── Stage ── */}
                <rect
                  x={STAGE_X}
                  y={STAGE_Y}
                  width={STAGE_W}
                  height={STAGE_H}
                  rx={4}
                  fill="rgba(212,175,55,0.08)"
                  stroke="var(--color-gold)"
                  strokeWidth={1.5}
                />
                <text
                  x={SVG_WIDTH / 2}
                  y={STAGE_Y + STAGE_H / 2 + 6}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: '700',
                    fill: 'var(--color-gold)',
                    letterSpacing: '0.2em',
                  }}
                >
                  STAGE
                </text>

                {/* ── VIP section label ── */}
                <text
                  x={SVG_WIDTH / 2}
                  y={VIP_Y - 16}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    fontWeight: '700',
                    fill: 'var(--color-gold)',
                    letterSpacing: '0.2em',
                  }}
                >
                  ── VIP ──
                </text>

                {/* ── VIP seats (Section A, 3 rows × 10) ── */}
                {allSeatsData
                  .filter(d => d.sectionLabel === 'A')
                  .map(({ seat }) => {
                    const x = seatX(seat.seatNumber, 10, VIP_W, 6);
                    const y = rowY(seat.row, VIP_Y, VIP_H);
                    const status = statusMap[seat.id] ?? 'available';
                    return (
                      <g key={seat.id}>
                        {/* Row label on leftmost seat */}
                        {seat.seatNumber === 1 && (
                          <text
                            x={x - 8}
                            y={y + VIP_H / 2 + 4}
                            textAnchor="end"
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '8px',
                              fill: 'var(--color-ivory-dim)',
                            }}
                          >
                            R{seat.row}
                          </text>
                        )}
                        <SeatRect
                          seat={seat}
                          status={status}
                          x={x}
                          y={y}
                          w={VIP_W}
                          h={VIP_H}
                          onHover={handleHover}
                          onToggle={handleToggle}
                          focusKey={seat.id}
                        />
                      </g>
                    );
                  })}

                {/* Aisle gap line between VIP and Premium */}
                <line
                  x1={60} y1={VIP_Y + 3 * ROW_HEIGHT + 10}
                  x2={SVG_WIDTH - 60} y2={VIP_Y + 3 * ROW_HEIGHT + 10}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />

                {/* ── Premium section label ── */}
                <text
                  x={SVG_WIDTH / 2}
                  y={PREMIUM_Y - 16}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    fontWeight: '700',
                    fill: 'var(--color-ivory)',
                    letterSpacing: '0.2em',
                  }}
                >
                  ── PREMIUM ──
                </text>

                {/* ── Premium seats (Section B, 5 rows × 15) ── */}
                {allSeatsData
                  .filter(d => d.sectionLabel === 'B')
                  .map(({ seat }) => {
                    const x = seatX(seat.seatNumber, 15, REGULAR_W, 4);
                    const y = rowY(seat.row, PREMIUM_Y, REGULAR_H);
                    const status = statusMap[seat.id] ?? 'available';
                    return (
                      <g key={seat.id}>
                        {seat.seatNumber === 1 && (
                          <text
                            x={x - 8}
                            y={y + REGULAR_H / 2 + 4}
                            textAnchor="end"
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '8px',
                              fill: 'var(--color-ivory-dim)',
                            }}
                          >
                            R{seat.row}
                          </text>
                        )}
                        <SeatRect
                          seat={seat}
                          status={status}
                          x={x}
                          y={y}
                          w={REGULAR_W}
                          h={REGULAR_H}
                          onHover={handleHover}
                          onToggle={handleToggle}
                          focusKey={seat.id}
                        />
                      </g>
                    );
                  })}

                {/* Aisle gap line between Premium and Regular */}
                <line
                  x1={60} y1={PREMIUM_Y + 5 * ROW_HEIGHT + 10}
                  x2={SVG_WIDTH - 60} y2={PREMIUM_Y + 5 * ROW_HEIGHT + 10}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />

                {/* ── Regular section label ── */}
                <text
                  x={SVG_WIDTH / 2}
                  y={REGULAR_Y - 16}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '9px',
                    fontWeight: '700',
                    fill: 'var(--color-ivory-dim)',
                    letterSpacing: '0.2em',
                  }}
                >
                  ── REGULAR ──
                </text>

                {/* ── Regular seats (Section C, 8 rows × 20) ── */}
                {allSeatsData
                  .filter(d => d.sectionLabel === 'C')
                  .map(({ seat }) => {
                    const x = seatX(seat.seatNumber, 20, REGULAR_W, 3);
                    const y = rowY(seat.row, REGULAR_Y, REGULAR_H);
                    const status = statusMap[seat.id] ?? 'available';
                    return (
                      <g key={seat.id}>
                        {seat.seatNumber === 1 && (
                          <text
                            x={x - 8}
                            y={y + REGULAR_H / 2 + 4}
                            textAnchor="end"
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '8px',
                              fill: 'var(--color-ivory-dim)',
                            }}
                          >
                            R{seat.row}
                          </text>
                        )}
                        <SeatRect
                          seat={seat}
                          status={status}
                          x={x}
                          y={y}
                          w={REGULAR_W}
                          h={REGULAR_H}
                          onHover={handleHover}
                          onToggle={handleToggle}
                          focusKey={seat.id}
                        />
                      </g>
                    );
                  })}

                {/* ── Left aisle labels ── */}
                <text
                  x={30}
                  y={VIP_Y + 1.5 * ROW_HEIGHT}
                  textAnchor="middle"
                  transform={`rotate(-90, 30, ${VIP_Y + 1.5 * ROW_HEIGHT})`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '8px',
                    fill: 'var(--color-gold)',
                    letterSpacing: '0.1em',
                    fontWeight: '700',
                  }}
                >
                  VIP
                </text>
                <text
                  x={30}
                  y={PREMIUM_Y + 2.5 * ROW_HEIGHT}
                  textAnchor="middle"
                  transform={`rotate(-90, 30, ${PREMIUM_Y + 2.5 * ROW_HEIGHT})`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '8px',
                    fill: 'var(--color-ivory)',
                    letterSpacing: '0.1em',
                    fontWeight: '700',
                  }}
                >
                  PREM
                </text>
                <text
                  x={30}
                  y={REGULAR_Y + 4 * ROW_HEIGHT}
                  textAnchor="middle"
                  transform={`rotate(-90, 30, ${REGULAR_Y + 4 * ROW_HEIGHT})`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '8px',
                    fill: 'var(--color-ivory-dim)',
                    letterSpacing: '0.1em',
                    fontWeight: '700',
                  }}
                >
                  REG
                </text>
              </svg>
            </div>
          </div>

          {/* Zoom reset button */}
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
              aria-label="Reset zoom"
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ivory-dim)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-gold)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-gold)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ivory-dim)';
              }}
            >
              Reset View
            </button>
          </div>
        </div>

        {/* ══════ PRICE SUMMARY SIDEBAR ══════════════════════════════════════ */}
        <PriceSummary
          event={event}
          selectedSeats={currentSelectedSeats}
          onRemoveSeat={handleRemove}
          onClearAll={clearSelection}
          onProceed={handleProceed}
        />
      </div>

      {/* Floating tooltip — rendered outside SVG so it can escape overflow */}
      <SeatTooltip
        seat={tooltip.seat}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </motion.div>
  );
}
