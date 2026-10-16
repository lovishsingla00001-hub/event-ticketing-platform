/**
 * Home.tsx
 * ───────────────────────────────────────────────────────────────────────────
 * VelvetSeat homepage — composed of:
 *  1. HeroSection        — full-viewport featured event
 *  2. MarqueeTicker      — gold ticker strip
 *  3. StatsSection       — "The stage is set" quote + platform stats
 *  4. EventGrid          — filterable, searchable event listings
 *
 * Page transition: fade-up from bottom via Framer Motion.
 * Sets document.title on mount.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import MarqueeTicker from '../components/home/MarqueeTicker';
import EventGrid from '../components/home/EventGrid';

/* ── Page transition variant ─────────────────────────────────────────────── */
const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

/* ── Stat item ───────────────────────────────────────────────────────────── */
interface StatItemProps {
  value: string;
  label: string;
  delay: number;
}

function StatItem({ value, label, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ borderLeft: '2px solid var(--color-gold)', paddingLeft: '20px' }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 600,
          color: 'var(--color-gold)',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ivory-dim)',
        }}
      >
        {label}
      </p>
    </motion.div>
  );
}

/* ── StatsSection ────────────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'clamp(48px, 6vw, 96px) clamp(16px, 5vw, 64px)',
      }}
      aria-label="Platform highlights"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 'clamp(32px, 5vw, 80px)',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Left: editorial quote */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: '520px' }}
        >
          {/* Overline */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '20px',
                height: '1px',
                background: 'var(--color-gold)',
              }}
            />
            VelvetSeat
          </p>

          {/* Quote */}
          <blockquote
            style={{
              margin: 0,
              padding: 0,
              border: 'none',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 4.5vw, 60px)',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                marginBottom: '20px',
              }}
            >
              The stage is set.
              <br />
              <em
                style={{
                  color: 'var(--color-gold)',
                  fontStyle: 'italic',
                }}
              >
                Is your seat?
              </em>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--color-ivory-dim)',
                lineHeight: 1.65,
                maxWidth: '380px',
              }}
            >
              From sold-out concerts to intimate theatre, VelvetSeat puts
              India's finest live experiences at your fingertips — with
              zero compromise on quality or convenience.
            </p>
          </blockquote>
        </motion.div>

        {/* Right: stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            flexShrink: 0,
          }}
          role="list"
          aria-label="Platform statistics"
        >
          {[
            { value: '10+', label: 'Live Events', delay: 0 },
            { value: '10K+', label: 'Tickets Sold', delay: 0.1 },
            { value: '8', label: 'Cities', delay: 0.2 },
          ].map((stat) => (
            <div key={stat.label} role="listitem">
              <StatItem {...stat} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 640px) {
          [aria-label="Platform highlights"] > div {
            grid-template-columns: 1fr !important;
          }
          [aria-label="Platform statistics"] {
            flex-direction: row !important;
            flex-wrap: wrap;
            gap: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ── Home ────────────────────────────────────────────────────────────────── */
export default function Home() {
  /* Page title */
  useEffect(() => {
    document.title = 'VelvetSeat — India\'s Premium Event Ticketing Platform';
    return () => {
      document.title = 'VelvetSeat';
    };
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100vh' }}
    >
      {/* 1 ── Hero */}
      <HeroSection featuredSlug="arijit-singh-live-mumbai" />

      {/* 2 ── Marquee ticker */}
      <MarqueeTicker />

      {/* 3 ── Stats / editorial quote */}
      <StatsSection />

      {/* 4 ── Event grid */}
      <EventGrid />
    </motion.div>
  );
}
