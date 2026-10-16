/**
 * Events.tsx — All Events listing page
 *
 * Displays the full catalogue of VelvetSeat events with filtering
 * via the EventGrid component. Applies a page-level Framer Motion
 * transition and sets the document title on mount.
 */

import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import EventGrid from '../components/home/EventGrid';

// ─── Page transition variants ────────────────────────────────────────────────
const pageVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.3, ease: 'easeIn' } },
};

// ─── Decorative heading underline ────────────────────────────────────────────
const GoldRule = () => (
  <div
    style={{
      width: '64px',
      height: '2px',
      background: 'var(--color-gold)',
      margin: '1rem 0 0',
      opacity: 0.7,
    }}
    aria-hidden="true"
  />
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Events() {
  // Set the browser tab title
  useEffect(() => {
    document.title = 'Events — VelvetSeat';
    return () => { document.title = 'VelvetSeat'; };
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="main"
      aria-label="Events listing page"
    >
      {/* ── Page header ── */}
      <header
        style={{
          padding: '4rem 2rem 2.5rem',
          maxWidth: '1280px',
          margin: '0 auto',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <p
          className="text-gold"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          Curated Experiences
        </p>

        <h1
          className="text-ivory"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          All Events
        </h1>

        <GoldRule />

        <p
          className="text-ivory-dim"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginTop: '1.25rem',
            maxWidth: '460px',
          }}
        >
          From standing ovations to sold-out stadiums.
        </p>
      </header>

      {/* ── Event grid with filtering ── */}
      <section
        style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}
        aria-label="All events"
      >
        <EventGrid />
      </section>
    </motion.div>
  );
}
