/**
 * EventCard.tsx
 * ───────────────────────────────────────────────────────────────────────────
 * Editorial event card — sharp-cornered, no conventional card border.
 * Personality: 2px gold left-bar accent on the info section.
 *
 * Props:
 *  - event: Event
 *  - featured?: boolean — if true, card renders in a wider "featured" style
 *    (used by EventGrid for the first item)
 *  - listMode?: boolean — horizontal layout (image left, info right)
 *
 * Scroll-triggered fade-up via Framer Motion viewport detection.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { type Event } from '../../data/events';

/* ── Category badge ─────────────────────────────────────────────────────── */
const CATEGORY_LABELS: Record<Event['category'], string> = {
  concert: 'Concert',
  standup: 'Stand-up',
  theatre: 'Theatre',
  tech: 'Tech',
  sports: 'Sports',
  literature: 'Literature',
  masterclass: 'Masterclass',
  expo: 'Expo',
};

function Badge({ category }: { category: Event['category'] }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: 'var(--color-gold)',
        color: 'var(--color-on-accent)',
        fontFamily: 'var(--font-body)',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

/* ── Props ──────────────────────────────────────────────────────────────── */
interface EventCardProps {
  event: Event;
  /** Renders wider featured layout (used for first card in grid) */
  featured?: boolean;
  /** Renders horizontal layout for list view */
  listMode?: boolean;
  /** Stagger delay in seconds */
  delay?: number;
}

/* ── EventCard ──────────────────────────────────────────────────────────── */
export default function EventCard({
  event,
  featured = false,
  listMode = false,
  delay = 0,
}: EventCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const priceMin = Math.min(...Object.values(event.prices));

  /* Formatted date */
  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  /* ── List mode: horizontal layout ── */
  if (listMode) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      >
        <Link
          to={`/events/${event.slug}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          aria-label={`View ${event.title} in ${event.city}`}
        >
          <article
            style={{
              display: 'flex',
              gap: '0',
              background: 'var(--color-surface)',
              transition: 'background 0.2s ease',
              borderBottom: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'var(--color-surface-2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'var(--color-surface)';
            }}
          >
            {/* Image — 1/3 width */}
            <div
              className="image-hover-zoom"
              style={{ width: '33.333%', flexShrink: 0, aspectRatio: '16/9' }}
            >
              <img
                src={event.image}
                alt={event.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            {/* Info — 2/3 width, left gold bar */}
            <div
              style={{
                flex: 1,
                padding: '24px 28px',
                borderLeft: '2px solid var(--color-gold)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Badge category={event.category} />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 2vw, 26px)',
                    fontWeight: 600,
                    color: 'var(--color-ivory)',
                    marginTop: '10px',
                    marginBottom: '8px',
                    lineHeight: 1.15,
                  }}
                >
                  {event.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--color-ivory-dim)',
                    lineHeight: 1.5,
                    marginBottom: '12px',
                  }}
                >
                  {event.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Meta */}
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: 'var(--color-ivory-dim)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <MapPin size={12} aria-hidden="true" />
                    {event.city}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: 'var(--color-ivory-dim)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Calendar size={12} aria-hidden="true" />
                    {formattedDate}
                  </span>
                </div>

                {/* Price + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-gold)',
                    }}
                  >
                    From ₹{priceMin.toLocaleString('en-IN')}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline',
                      textDecorationColor: 'transparent',
                      textUnderlineOffset: '3px',
                      transition: 'text-decoration-color 0.2s',
                    }}
                    className="card-cta-link"
                  >
                    Get Tickets <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  /* ── Grid mode: vertical layout ── */
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <Link
        to={`/events/${event.slug}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        aria-label={`View ${event.title} in ${event.city}`}
      >
        <article
          style={{
            background: 'var(--color-surface)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'var(--color-surface-2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'var(--color-surface)';
          }}
        >
          {/* Image — 16:9 */}
          <div
            className="image-hover-zoom"
            style={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}
          >
            <img
              src={event.image}
              alt={event.title}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Category badge — top-left overlay */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 2,
              }}
            >
              <Badge category={event.category} />
            </div>
          </div>

          {/* Info section — left gold bar, no other border */}
          <div
            style={{
              borderLeft: '2px solid var(--color-gold)',
              padding: '18px 20px 20px',
            }}
          >
            {/* Title */}
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: featured ? 'clamp(24px, 3vw, 36px)' : 'clamp(18px, 2vw, 24px)',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                marginBottom: '6px',
                lineHeight: 1.15,
              }}
            >
              {event.title}
            </h3>

            {/* Subtitle / description */}
            {featured && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--color-ivory-dim)',
                  lineHeight: 1.55,
                  marginBottom: '12px',
                }}
              >
                {event.description}
              </p>
            )}

            {/* Meta row */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                marginBottom: '14px',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: 'var(--color-ivory-dim)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <MapPin size={11} aria-hidden="true" />
                {event.city}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: 'var(--color-ivory-dim)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Calendar size={11} aria-hidden="true" />
                {formattedDate}
              </span>
            </div>

            {/* Price + CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-gold)',
                }}
              >
                From ₹{priceMin.toLocaleString('en-IN')}
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative',
                }}
                className="card-cta-link"
              >
                Get Tickets <ArrowRight size={12} aria-hidden="true" />
              </span>
            </div>
          </div>
        </article>
      </Link>

      {/* Hover underline animation for CTA links */}
      <style>{`
        .card-cta-link {
          text-decoration: underline;
          text-decoration-color: transparent;
          text-underline-offset: 3px;
          transition: text-decoration-color 0.2s ease;
        }
        article:hover .card-cta-link {
          text-decoration-color: var(--color-gold);
        }
      `}</style>
    </motion.div>
  );
}
