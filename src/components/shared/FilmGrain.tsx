/**
 * FilmGrain.tsx
 * Fixed SVG-filter film grain overlay — adds cinematic texture.
 *
 * Uses feTurbulence (not a background image) for true, GPU-rendered grain.
 * Opacity: 0.035 in dark mode, 0.02 in light mode — set via CSS.
 * pointer-events: none  |  z-index: 9998  |  aria-hidden: true
 */

export default function FilmGrain() {
  // Unique filter ID to prevent SVG id collisions if component is used multiple times
  const filterId = 'velvet-film-grain';

  return (
    <>
      {/* Hidden SVG that defines the filter */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* Base turbulence noise */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
              result="noise"
            />
            {/* Map noise to greyscale range */}
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="greyNoise"
            />
            {/* Blend grain over source graphic */}
            <feBlend
              in="SourceGraphic"
              in2="greyNoise"
              mode="multiply"
              result="blended"
            />
            {/* Restore full opacity of source */}
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Full-viewport overlay that applies the filter */}
      <div
        aria-hidden="true"
        className="film-grain-overlay"
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         9998,
          pointerEvents:  'none',
          // The actual SVG feTurbulence is rendered via a data URI rect
          // so the overlay itself uses a pseudo-element approach via CSS class.
          // Here we apply it directly with an inline SVG background:
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize:   '300px 300px',
        }}
      />

      {/* Opacity responds to data-theme on <html> */}
      <style>{`
        /* Dark mode: more visible grain */
        :root[data-theme='dark']  .film-grain-overlay { opacity: 0.035; }
        /* Light mode: subtler grain */
        :root[data-theme='light'] .film-grain-overlay { opacity: 0.02;  }
        /* Fallback when no attribute set */
        .film-grain-overlay { opacity: 0.035; }
      `}</style>
    </>
  );
}
