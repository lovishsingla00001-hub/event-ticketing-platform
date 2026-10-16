/**
 * Badge.tsx
 * Category badge — small pill with coloured text and thin border.
 *
 * Props:
 *  - category : event category key (concert | standup | theatre | ...)
 *  - size     : 'sm' (10px) | 'md' (12px)
 *
 * Uses getCategoryLabel and getCategoryColor from utils/helpers.
 * No solid background — coloured text + matching thin border only.
 */

import { getCategoryColor, getCategoryLabel } from '../../utils/helpers';

// ─── Props ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  category:  string;
  size?:     'sm' | 'md';
  className?: string;
}

// ─── Map Tailwind colour class → CSS colour value ─────────────────────────────
// getCategoryColor returns a Tailwind class like 'text-gold', 'text-amber-400', etc.
// We need the actual colour for border — this mapping covers all known categories.
const TAILWIND_TO_CSS: Record<string, string> = {
  'text-gold':       'var(--color-gold)',
  'text-amber-400':  'var(--color-category-amber)',
  'text-burgundy':   'var(--color-burgundy)',
  'text-sky-400':    'var(--color-category-sky)',
  'text-green-400':  'var(--color-green)',
  'text-purple-400': 'var(--color-category-purple)',
  'text-rose-400':   'var(--color-category-rose)',
  'text-teal-400':   'var(--color-category-teal)',
  'text-ivory':      'var(--color-ivory)',
};

function resolveBorderColor(twClass: string): string {
  return TAILWIND_TO_CSS[twClass] ?? 'var(--color-ivory-dim)';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Badge({ category, size = 'sm', className }: BadgeProps) {
  const label       = getCategoryLabel(category);
  const colorClass  = getCategoryColor(category);
  const borderColor = resolveBorderColor(colorClass);

  const fontSize    = size === 'sm' ? '10px' : '12px';
  const padding     = size === 'sm' ? '2px 7px' : '3px 9px';

  return (
    <span
      aria-label={`Category: ${label}`}
      className={className}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        padding,
        fontSize,
        fontFamily:     'var(--font-body)',
        fontWeight:     600,
        letterSpacing:  '0.1em',
        textTransform:  'uppercase',
        lineHeight:     '1.6',
        border:         `1px solid ${borderColor}`,
        background:     'transparent',
        whiteSpace:     'nowrap',
        // Colour applied via the className from getCategoryColor
        // but since we can't easily apply Tailwind classes here as CSS vars,
        // we derive the CSS colour from the same map:
        color:          borderColor,
      }}
    >
      {label}
    </span>
  );
}
