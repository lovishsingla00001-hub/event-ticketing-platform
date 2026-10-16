/**
 * EventDetail.tsx — Individual event detail page
 *
 * Full-bleed hero, two-column editorial layout, ticket pricing table,
 * and a "Select Your Seats" CTA. Related events section at the bottom.
 */

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Timer,
  ChevronRight,
  Tag,
  Mic,
  Ticket,
} from 'lucide-react';
import events, { type Event } from '../data/events';

// ─── Page transition ──────────────────────────────────────────────────────────
const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR = (n: number): string =>
  n === 0 ? 'Free' : `₹${n.toLocaleString('en-IN')}`;

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/** Mocked sold-seat factor: 30% of total seats sold for display */
const SOLD_FRACTION = 0.3;

const totalRemaining = (event: Event): number => {
  const total = event.totalSeats.Regular + event.totalSeats.Premium + event.totalSeats.VIP;
  return Math.round(total * (1 - SOLD_FRACTION));
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
function EventDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading event details"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="shimmer"
          style={{
            height: i === 0 ? '360px' : '24px',
            marginBottom: '1rem',
            borderRadius: '2px',
            width: i === 0 ? '100%' : `${60 + ((i * 17) % 30)}%`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Info row (sidebar) ───────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Icon size={16} style={{ color: 'var(--color-gold)', marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-ivory-dim)',
            margin: '0 0 2px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-ivory)',
            margin: 0,
            fontWeight: 500,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Pricing tier row ─────────────────────────────────────────────────────────
function PricingRow({
  tier,
  price,
  seats,
}: {
  tier: 'Regular' | 'Premium' | 'VIP';
  price: number;
  seats: number;
}) {
  const accentColour =
    tier === 'VIP' ? 'var(--color-gold)' : tier === 'Premium' ? 'var(--color-ivory)' : 'var(--color-ivory-dim)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        border: '1px solid var(--color-border)',
        marginBottom: '6px',
        background: tier === 'VIP' ? 'var(--color-accent-tint)' : 'var(--color-surface-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: accentColour,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: accentColour,
            letterSpacing: '0.06em',
          }}
        >
          {tier}
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-gold)',
            margin: 0,
          }}
        >
          {formatINR(price)}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            color: 'var(--color-ivory-dim)',
            margin: 0,
          }}
        >
          {seats} total seats
        </p>
      </div>
    </div>
  );
}

// ─── Related event mini-card ───────────────────────────────────────────────────
function RelatedCard({ event }: { event: Event }) {
  return (
    <Link
      to={`/events/${event.slug}`}
      aria-label={`View ${event.title}`}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <article
        style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
      >
        <div
          className="image-hover-zoom"
          style={{ height: '160px', overflow: 'hidden', position: 'relative' }}
        >
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ padding: '14px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              margin: '0 0 4px',
            }}
          >
            {event.city}
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--color-ivory)',
              margin: '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            {event.title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--color-ivory-dim)',
              margin: 0,
            }}
          >
            {formatDate(event.date)}
          </p>
        </div>
      </article>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Resolve event from slug
  const event = useMemo(() => events.find(e => e.slug === slug), [slug]);

  // Related events: same category, different slug, max 3
  const related = useMemo(
    () => events.filter(e => e.category === event?.category && e.slug !== slug).slice(0, 3),
    [event, slug],
  );

  // Document title + redirect on not-found
  useEffect(() => {
    if (!event) {
      navigate('/404', { replace: true });
      return;
    }
    document.title = `${event.title} — VelvetSeat`;
    return () => { document.title = 'VelvetSeat'; };
  }, [event, navigate]);

  // Show skeleton while resolving (this is near-instant with static data,
  // but good practice for async-ready pattern)
  if (!event) return <EventDetailSkeleton />;

  const seatsRemaining = totalRemaining(event);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="main"
      aria-label={`Event detail for ${event.title}`}
    >
      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          height: '60vh',
          minHeight: '380px',
          maxHeight: '680px',
          overflow: 'hidden',
        }}
        aria-label={`Hero image for ${event.title}`}
      >
        {/* Background image */}
        <img
          src={event.heroImage}
          alt={`${event.title} hero`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />

        {/* Gradient overlay — bottom heavy, dark for legibility */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, var(--color-hero-overlay-strong) 0%, var(--color-hero-overlay-medium) 45%, var(--color-hero-overlay-soft) 100%)',
          }}
        />

        {/* Hero text */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem)',
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          {/* Category badge */}
          <span
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              border: '1px solid var(--color-gold)',
              padding: '3px 10px',
              marginBottom: '12px',
            }}
          >
            {event.category}
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.75rem)',
              fontWeight: 700,
              color: 'var(--color-ivory)',
              lineHeight: 1.1,
              margin: '0 0 8px',
              textShadow: '0 2px 12px var(--color-text-shadow)',
            }}
          >
            {event.title}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              color: 'var(--color-ivory-dim)',
              margin: 0,
            }}
          >
            {event.subtitle}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          BODY — Two column
      ════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7fr) minmax(280px, 3fr)',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: main content ── */}
        <div>
          {/* Long description */}
          <section aria-label="About this event" style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                margin: '0 0 1rem',
              }}
            >
              About This Event
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--color-ivory-dim)',
                margin: 0,
              }}
            >
              {event.longDescription}
            </p>
          </section>

          {/* Tags */}
          <section aria-label="Event tags" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {event.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'var(--color-ivory-dim)',
                    border: '1px solid var(--color-border)',
                    padding: '4px 10px',
                    background: 'var(--color-surface-2)',
                  }}
                >
                  <Tag size={10} aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Artist info */}
          <section
            aria-label="Artist information"
            style={{
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Mic size={16} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold)',
                  margin: 0,
                }}
              >
                Performing Artist
              </h3>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                margin: 0,
              }}
            >
              {event.artist}
            </p>
          </section>
        </div>

        {/* ── RIGHT: sidebar ── */}
        <aside aria-label="Event booking panel">

          {/* Event info panel */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                margin: '0 0 4px',
              }}
            >
              Event Details
            </h2>
            <InfoRow icon={Calendar} label="Date"     value={formatDate(event.date)} />
            <InfoRow icon={Clock}    label="Time"     value={formatTime(event.date)} />
            <InfoRow icon={Building2} label="Venue"   value={event.venue} />
            <InfoRow icon={MapPin}   label="City"     value={event.city} />
            <InfoRow icon={Timer}    label="Duration" value={event.duration} />
          </div>

          {/* Pricing table */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Ticket size={14} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
              <h2
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold)',
                  margin: 0,
                }}
              >
                Ticket Prices
              </h2>
            </div>

            <PricingRow tier="VIP"     price={event.prices.VIP}     seats={event.totalSeats.VIP} />
            <PricingRow tier="Premium" price={event.prices.Premium} seats={event.totalSeats.Premium} />
            <PricingRow tier="Regular" price={event.prices.Regular} seats={event.totalSeats.Regular} />
          </div>

          {/* Availability indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              marginBottom: '1rem',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: seatsRemaining < 50 ? 'var(--color-burgundy)' : 'var(--color-gold)',
                flexShrink: 0,
                boxShadow: seatsRemaining < 50 ? '0 0 6px var(--color-burgundy)' : '0 0 6px var(--color-gold)',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                color: 'var(--color-ivory-dim)',
                margin: 0,
              }}
            >
              <strong
                style={{
                  color: seatsRemaining < 50 ? 'var(--color-burgundy)' : 'var(--color-ivory)',
                  fontWeight: 700,
                }}
              >
                {seatsRemaining.toLocaleString('en-IN')}
              </strong>{' '}
              seats remaining
            </p>
          </div>

          {/* CTA — Select Your Seats */}
          <Link
            to={`/events/${event.slug}/seats`}
            aria-label={`Select seats for ${event.title}`}
            style={{ display: 'block', textDecoration: 'none' }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: 'var(--color-gold)',
                color: 'var(--color-bg)',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Select Your Seats
              <ChevronRight size={16} aria-hidden="true" />
            </motion.button>
          </Link>
        </aside>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          RELATED EVENTS
      ════════════════════════════════════════════════════════════════ */}
      {related.length > 0 && (
        <section
          aria-label="Related events"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 2.5rem) 5rem',
          }}
        >
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '3rem',
              marginBottom: '2rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                margin: 0,
              }}
            >
              You Might Also Like
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {related.map(ev => (
              <RelatedCard key={ev.id} event={ev} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
