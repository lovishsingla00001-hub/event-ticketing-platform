/**
 * Navbar.tsx
 * Premium sticky navigation for VelvetSeat.
 *
 * Behaviour:
 *  - Transparent on top → frosted-glass surface on scroll
 *  - Gold left-border accent on active NavLink
 *  - Dark/Light theme toggle (animated Sun ↔ Moon)
 *  - Mobile hamburger → full-height slide-in panel from the right
 */

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, Ticket, X } from 'lucide-react';
import { useThemeStore } from '../../stores/uiStore';

// ─── Nav links config ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Events',      to: '/events'   },
  { label: 'My Bookings', to: '/bookings' },
] as const;

// ─── Active link style helper ────────────────────────────────────────────────
const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative text-sm tracking-widest uppercase transition-colors duration-200 font-body',
    isActive
      ? 'text-[var(--color-gold)]'
      : 'text-[var(--color-ivory-dim)] hover:text-[var(--color-ivory)]',
  ].join(' ');

// ─── Component ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { theme, toggle } = useThemeStore();
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const menuButtonRef  = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Track scroll to apply background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Focus the close button when menu opens; return focus on close
  useEffect(() => {
    if (menuOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* ── Main bar ──────────────────────────────────────────────────────── */}
      <header
        role="banner"
        style={{
          position:        'sticky',
          top:             0,
          zIndex:          50,
          height:          'clamp(64px, 10vw, 72px)',
          display:         'flex',
          alignItems:      'center',
          padding:         '0 clamp(1rem, 4vw, 3rem)',
          transition:      'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
          background:      scrolled ? 'var(--color-surface)'  : 'transparent',
          backdropFilter:  scrolled ? 'blur(18px)'            : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)'       : 'none',
          borderBottom:    scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="VelvetSeat — home"
          style={{ display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none', flexShrink: 0 }}
        >
          <span
            style={{
              fontFamily:  'var(--font-display)',
              fontStyle:   'italic',
              fontWeight:  600,
              fontSize:    'clamp(1.25rem, 3vw, 1.6rem)',
              color:       'var(--color-ivory)',
              lineHeight:  1,
            }}
          >
            Velvet
          </span>
          <span
            style={{
              fontFamily:  'var(--font-body)',
              fontWeight:  700,
              fontSize:    'clamp(1.05rem, 2.5vw, 1.3rem)',
              color:       'var(--color-gold)',
              lineHeight:  1,
            }}
          >
            Seat
          </span>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Desktop nav */}
        <nav
          aria-label="Primary navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} className={getNavLinkClass}>
              {({ isActive }) => (
                <>
                  {label}
                  {/* Gold underline for active link */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-underline"
                      style={{
                        position:    'absolute',
                        bottom:      '-4px',
                        left:        0,
                        right:       0,
                        height:      '1px',
                        background:  'var(--color-gold)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Theme toggle — desktop */}
          <ThemeToggle theme={theme} onToggle={toggle} />
        </nav>

        {/* Mobile controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="visible-mobile">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            ref={menuButtonRef}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            style={{
              background:  'none',
              border:      'none',
              cursor:      'pointer',
              color:       'var(--color-ivory)',
              display:     'flex',
              padding:     '6px',
            }}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Mobile slide-in panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
              style={{
                position:   'fixed',
                inset:      0,
                zIndex:     48,
                background: 'rgba(0,0,0,0.55)',
              }}
            />

            {/* Panel */}
            <motion.nav
              id="mobile-menu"
              key="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                position:   'fixed',
                top:        0,
                right:      0,
                bottom:     0,
                zIndex:     49,
                width:      'min(320px, 88vw)',
                background: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-border)',
                display:    'flex',
                flexDirection: 'column',
                padding:    '1.5rem',
              }}
            >
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                {/* Logo echo */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle:  'italic',
                    fontSize:   '1.4rem',
                    color:      'var(--color-ivory)',
                  }}
                >
                  Velvet<span style={{ color: 'var(--color-gold)', fontStyle: 'normal', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem' }}>Seat</span>
                </span>

                <button
                  ref={closeButtonRef}
                  aria-label="Close navigation menu"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    color:      'var(--color-ivory-dim)',
                    display:    'flex',
                    padding:    '6px',
                  }}
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>

              {/* Links */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {NAV_LINKS.map(({ label, to }, i) => (
                  <motion.li
                    key={to}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06 }}
                  >
                    <NavLink
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      style={({ isActive }) => ({
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '0.75rem',
                        padding:      '0.85rem 1rem',
                        fontFamily:   'var(--font-body)',
                        fontSize:     '0.9rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        color:        isActive ? 'var(--color-gold)' : 'var(--color-ivory-dim)',
                        borderLeft:   isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                        background:   isActive ? 'rgba(212,175,55,0.06)' : 'transparent',
                        transition:   'all 0.2s ease',
                      })}
                    >
                      <Ticket size={16} aria-hidden="true" />
                      {label}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              {/* Push to bottom */}
              <div style={{ flex: 1 }} />

              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle:  'italic',
                  fontSize:   '0.85rem',
                  color:      'var(--color-ivory-faint)',
                  textAlign:  'center',
                }}
              >
                Where every seat tells a story.
              </p>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/*
       * Inline scoped styles for responsive visibility.
       * These complement Tailwind if present; otherwise work standalone.
       */}
      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .visible-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ─── Theme toggle button ─────────────────────────────────────────────────────
interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        position:        'relative',
        width:           '38px',
        height:          '38px',
        borderRadius:    '50%',
        border:          '1px solid var(--color-border)',
        background:      'var(--color-surface-2)',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        overflow:        'hidden',
        flexShrink:      0,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span
            key="sun"
            initial={{ rotate: -60, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate:  60,  opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', color: 'var(--color-gold)' }}
          >
            <Sun size={17} aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 60,  opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate: -60,  opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', color: 'var(--color-ivory-dim)' }}
          >
            <Moon size={17} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
