/**
 * Footer.tsx
 * Premium editorial footer for VelvetSeat.
 *
 * Layout: 4-column grid on desktop, stacked on mobile.
 * Left-aligned, not centered — intentional editorial tone.
 */

import { Link } from 'react-router-dom';

// ─── Column data ─────────────────────────────────────────────────────────────
const EXPLORE_LINKS = [
  { label: 'Home',        to: '/'        },
  { label: 'Events',      to: '/events'  },
  { label: 'My Bookings', to: '/bookings'},
] as const;

const SUPPORT_LINKS = [
  { label: 'FAQ',      to: '/faq'     },
  { label: 'Contact',  to: '/contact' },
  { label: 'Terms',    to: '/terms'   },
] as const;

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'] as const;

// ─── Shared link style ────────────────────────────────────────────────────────
const footerLinkStyle: React.CSSProperties = {
  display:        'block',
  fontFamily:     'var(--font-body)',
  fontSize:       '0.82rem',
  letterSpacing:  '0.04em',
  color:          'var(--color-ivory-dim)',
  textDecoration: 'none',
  lineHeight:     '2',
  transition:     'color 0.2s ease',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        background:  'var(--color-surface)',
        borderTop:   '1px solid var(--color-gold-dim)',
        marginTop:   'auto',
      }}
    >
      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth:  '1280px',
          margin:    '0 auto',
          padding:   'clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 4vw, 3rem)',
          display:   'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap:       'clamp(2rem, 4vw, 3.5rem)',
          alignItems: 'start',
        }}
      >
        {/* ── Brand column ─────────────────────────────────────────────── */}
        <div style={{ gridColumn: 'span 1' }}>
          {/* Logo */}
          <Link
            to="/"
            aria-label="VelvetSeat — home"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: '2px', marginBottom: '1rem' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle:  'italic',
                fontWeight: 600,
                fontSize:   '1.5rem',
                color:      'var(--color-ivory)',
                lineHeight: 1,
              }}
            >
              Velvet
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize:   '1.2rem',
                color:      'var(--color-gold)',
                lineHeight: 1,
              }}
            >
              Seat
            </span>
          </Link>

          {/* Tagline */}
          <p
            style={{
              fontFamily:  'var(--font-display)',
              fontStyle:   'italic',
              fontSize:    '0.95rem',
              color:       'var(--color-ivory-faint)',
              margin:      '0.5rem 0 0',
              lineHeight:  '1.6',
              maxWidth:    '200px',
            }}
          >
            Where every seat tells a story.
          </p>
        </div>

        {/* ── Explore column ────────────────────────────────────────────── */}
        <nav aria-label="Explore links">
          <FooterColumnHeading>Explore</FooterColumnHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {EXPLORE_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  style={footerLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ivory)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-dim)')}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Support column ────────────────────────────────────────────── */}
        <nav aria-label="Support links">
          <FooterColumnHeading>Support</FooterColumnHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {SUPPORT_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  style={footerLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ivory)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-dim)')}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Cities column ─────────────────────────────────────────────── */}
        <div>
          <FooterColumnHeading>Cities</FooterColumnHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CITIES.map(city => (
              <li key={city}>
                <Link
                  to={`/events?city=${city.toLowerCase()}`}
                  style={footerLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ivory)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-dim)')}
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop:  '1px solid var(--color-border)',
          padding:    '1.25rem clamp(1rem, 4vw, 3rem)',
          maxWidth:   '1280px',
          margin:     '0 auto',
          display:    'flex',
          flexWrap:   'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap:        '1rem',
        }}
      >
        {/* Copyright */}
        <p
          style={{
            fontFamily:  'var(--font-body)',
            fontSize:    '0.75rem',
            color:       'var(--color-ivory-faint)',
            margin:      0,
            letterSpacing: '0.03em',
          }}
        >
          © 2026 VelvetSeat. Crafted with obsessive attention to detail.
        </p>

        {/* Social icons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SocialIcon href="https://twitter.com" label="VelvetSeat on X (Twitter)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </SocialIcon>
          <SocialIcon href="https://instagram.com" label="VelvetSeat on Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </SocialIcon>
          <SocialIcon href="https://linkedin.com" label="VelvetSeat on LinkedIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect width="4" height="12" x="2" y="9"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </SocialIcon>
        </div>
      </div>
    </footer>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FooterColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily:    'var(--font-body)',
        fontWeight:    700,
        fontSize:      '0.7rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color:         'var(--color-gold)',
        margin:        '0 0 1rem',
      }}
    >
      {children}
    </h3>
  );
}

interface SocialIconProps {
  href:     string;
  label:    string;
  children: React.ReactNode;
}

function SocialIcon({ href, label, children }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display:    'flex',
        color:      'var(--color-ivory-faint)',
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-faint)')}
    >
      {children}
    </a>
  );
}
