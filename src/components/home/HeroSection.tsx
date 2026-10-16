/**
 * HeroSection.tsx
 * ───────────────────────────────────────────────────────────────────────────
 * Full-viewport hero for the VelvetSeat homepage.
 * Features:
 *  - Full-bleed Unsplash background with Framer Motion parallax on scroll
 *  - Dark gradient overlay (reduced in light theme via data-theme attr)
 *  - Bottom-left editorial content layout
 *  - Live countdown timer to event date
 *  - Staggered fade-up reveal animations
 *  - Accessible scroll indicator with bobbing animation
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import { MapPin, Calendar, Ticket, ChevronDown } from 'lucide-react';
import events from '../../data/events';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface HeroSectionProps {
  /** Slug of the featured event — defaults to the Arijit Singh show */
  featuredSlug?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function getCountdown(targetDate: string): CountdownState {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/* ── Animation variants ─────────────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── CountdownUnit ──────────────────────────────────────────────────────── */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '48px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3vw, 32px)',
          fontWeight: 600,
          color: 'var(--color-gold)',
          lineHeight: 1,
          letterSpacing: '0.02em',
          animation: 'countdown-pulse 2s ease-in-out infinite',
        }}
        aria-label={`${value} ${label}`}
      >
        {pad(value)}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ivory-dim)',
          marginTop: '4px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── HeroSection ────────────────────────────────────────────────────────── */
export default function HeroSection({
  featuredSlug = 'arijit-singh-live-mumbai',
}: HeroSectionProps) {
  const event = events.find((e) => e.slug === featuredSlug) ?? events[0];
  const [countdown, setCountdown] = useState<CountdownState>(
    getCountdown(event.date)
  );
  const prefersReducedMotion = useReducedMotion();

  /* Countdown tick */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.date]);

  /* Parallax setup */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  // Image moves at 0.5× scroll speed (50dvh range)
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : ['0%', '30%']
  );

  /* Formatted date */
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const priceMin = Math.min(...Object.values(event.prices));
  const priceMax = Math.max(...Object.values(event.prices));

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        height: '100dvh',
        minHeight: '600px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
      }}
      aria-label={`Featured event: ${event.title}`}
    >
      {/* ── Parallax background image ── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-20% 0 -20% 0',
          y: imageY,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <img
          src={event.heroImage}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
          fetchPriority="high"
        />
      </motion.div>

      {/* ── Gradient overlay (dark theme: 70%; light theme: reduced) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, var(--color-hero-overlay-strong) 0%, var(--color-hero-overlay-medium) 45%, var(--color-hero-overlay-soft) 75%, transparent 100%)',
        }}
        /* Light theme override via data-attr in parent html element */
        className="hero-overlay"
      />

      {/* ── Ambient Studio Spotlight & Atmospheric Glow ── */}
      <div
        aria-hidden="true"
        className="ambient-gold-glow"
        style={{ bottom: '-100px', left: '-100px' }}
      />
      <div
        aria-hidden="true"
        className="ambient-gold-glow"
        style={{ top: '10%', right: '-150px', opacity: 0.7 }}
      />

      {/* ── Thin gold bottom edge line ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
          opacity: 0.5,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          padding: 'clamp(24px, 5vw, 64px)',
          paddingBottom: 'clamp(48px, 7vw, 80px)',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '760px' }}
        >
          {/* Overline */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--color-gold)',
              }}
            />
            Featured Event
          </motion.p>

          {/* Giant title */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 8vw, 96px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.0,
              color: 'var(--color-on-hero)',
              marginBottom: '12px',
            }}
          >
            {event.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(16px, 2vw, 22px)',
              fontStyle: 'italic',
              color: 'var(--color-on-hero-muted)',
              marginBottom: '28px',
              letterSpacing: '0.01em',
            }}
          >
            {event.subtitle}
          </motion.p>

          {/* Meta strip */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '28px',
            }}
            role="list"
            aria-label="Event details"
          >
            {[
              {
                Icon: MapPin,
                text: `${event.venue}, ${event.city}`,
                label: 'Venue',
              },
              { Icon: Calendar, text: eventDate, label: 'Date' },
              {
                Icon: Ticket,
                text: `₹${priceMin.toLocaleString('en-IN')} – ₹${priceMax.toLocaleString('en-IN')}`,
                label: 'Price range',
              },
            ].map(({ Icon, text, label }) => (
              <div
                key={label}
                role="listitem"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: 'var(--color-on-hero-muted)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}
              >
                <Icon size={14} color="var(--color-gold)" aria-hidden="true" />
                <span aria-label={label}>{text}</span>
              </div>
            ))}
          </motion.div>

          {/* Countdown */}
          <motion.div variants={itemVariants} style={{ marginBottom: '36px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-on-hero-subtle)',
                marginBottom: '10px',
              }}
              aria-label="Countdown to event"
            >
              Event starts in
            </p>
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}
              role="timer"
              aria-live="off"
              aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining`}
            >
              <CountdownUnit value={countdown.days} label="Days" />
              <span
                style={{
                  color: 'var(--color-gold-dim)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  lineHeight: 1,
                  marginTop: '2px',
                }}
                aria-hidden="true"
              >
                :
              </span>
              <CountdownUnit value={countdown.hours} label="Hours" />
              <span
                style={{
                  color: 'var(--color-gold-dim)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  lineHeight: 1,
                  marginTop: '2px',
                }}
                aria-hidden="true"
              >
                :
              </span>
              <CountdownUnit value={countdown.minutes} label="Mins" />
              <span
                style={{
                  color: 'var(--color-gold-dim)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  lineHeight: 1,
                  marginTop: '2px',
                }}
                aria-hidden="true"
              >
                :
              </span>
              <CountdownUnit value={countdown.seconds} label="Secs" />
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
          >
            {/* Primary: Book Seats */}
            <Link
              to={`/events/${event.slug}/seats`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                background: 'var(--color-gold)',
                color: 'var(--color-on-accent)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'background 0.2s ease, transform 0.15s ease',
              }}
              aria-label={`Book seats for ${event.title}`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  'var(--color-gold-light)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  'var(--color-gold)';
              }}
            >
              <Ticket size={15} aria-hidden="true" />
              Book Seats
            </Link>

            {/* Secondary: Learn More */}
            <Link
              to={`/events/${event.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 32px',
                border: '1px solid var(--color-on-hero-border)',
                color: 'var(--color-on-hero-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'border-color 0.2s ease, color 0.2s ease',
              }}
              aria-label={`Learn more about ${event.title}`}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'var(--color-gold)';
                el.style.color = 'var(--color-gold)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'var(--color-on-hero-border)';
                el.style.color = 'var(--color-on-hero-muted)';
              }}
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        aria-label="Scroll down"
        role="img"
        style={{
          position: 'absolute',
          bottom: '32px',
          right: 'clamp(24px, 5vw, 64px)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--color-on-hero-subtle)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
          }}
        >
          Scroll
        </span>
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </motion.div>
      </motion.div>

    </section>
  );
}
