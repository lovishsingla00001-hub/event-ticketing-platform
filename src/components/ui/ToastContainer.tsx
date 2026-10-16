/**
 * ToastContainer.tsx
 * Animated toast notification stack for VelvetSeat.
 *
 * - Reads from useToastStore (uiStore)
 * - Positioned top-right, z-9999
 * - Each toast slides in from the right via framer-motion
 * - Types: success (gold border) | error (burgundy) | info (ivory) | warning (amber)
 * - Auto-dismiss is handled by the store (4s timeout)
 * - Manual dismiss via X button
 * - Glassmorphism surface with backdrop-filter
 * - Max 5 visible toasts (oldest auto-removed by store)
 */

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { type Toast, useToastStore } from '../../stores/uiStore';

// ─── Toast type → border colour ──────────────────────────────────────────────
const BORDER_COLOR: Record<Toast['type'], string> = {
  success: 'var(--color-success)',
  error:   'var(--color-burgundy)',
  info:    'var(--color-ivory)',
  warning: 'var(--color-accent-warm)',
};

// ─── Toast type → icon colour ─────────────────────────────────────────────────
const ICON_COLOR: Record<Toast['type'], string> = {
  success: 'var(--color-success)',
  error:   'var(--color-burgundy)',
  info:    'var(--color-ivory-dim)',
  warning: 'var(--color-accent-warm)',
};

// ─── Toast type → label for aria-live ─────────────────────────────────────────
const TYPE_LABEL: Record<Toast['type'], string> = {
  success: 'Success',
  error:   'Error',
  info:    'Info',
  warning: 'Warning',
};

// ─── Framer-motion variants ───────────────────────────────────────────────────
const toastVariants: Variants = {
  initial: { opacity: 0, x: 80, scale: 0.94 },
  animate: { opacity: 1, x: 0,  scale: 1,   transition: { type: 'spring', stiffness: 340, damping: 28 } },
  exit:    { opacity: 0, x: 80, scale: 0.94, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  // Only render up to 5 toasts — show the most recent ones
  const visible = toasts.slice(-5);

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position:       'fixed',
        top:            'clamp(72px, 10vw, 88px)',   // below the navbar
        right:          'clamp(0.75rem, 2vw, 1.5rem)',
        zIndex:         9999,
        display:        'flex',
        flexDirection:  'column',
        gap:            '0.6rem',
        alignItems:     'flex-end',
        pointerEvents:  'none',         // pass-through — individual toasts re-enable
        maxWidth:       'min(420px, calc(100vw - 1.5rem))',
        width:          '100%',
      }}
    >
      <AnimatePresence initial={false}>
        {visible.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Single toast item ─────────────────────────────────────────────────────────
interface ToastItemProps {
  toast:     Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const borderColor = BORDER_COLOR[toast.type];
  const iconColor   = ICON_COLOR[toast.type];

  return (
    <motion.div
      role="alert"
      aria-label={`${TYPE_LABEL[toast.type]}: ${toast.message}`}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      style={{
        pointerEvents:     'auto',
        display:           'flex',
        alignItems:        'flex-start',
        gap:               '0.75rem',
        padding:           '0.9rem 1rem',
        width:             '100%',
        background:        'rgba(20, 16, 12, 0.72)',
        backdropFilter:    'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:            '1px solid var(--color-border)',
        borderLeft:        `3px solid ${borderColor}`,
        boxShadow:         '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* Coloured type indicator dot */}
      <span
        aria-hidden="true"
        style={{
          flexShrink:   0,
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   iconColor,
          marginTop:    '5px',
        }}
      />

      {/* Message */}
      <p
        style={{
          flex:        1,
          margin:      0,
          fontFamily:  'var(--font-body)',
          fontSize:    '0.83rem',
          lineHeight:  '1.55',
          color:       'var(--color-ivory)',
          letterSpacing: '0.01em',
        }}
      >
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          flexShrink:  0,
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          color:       'var(--color-ivory-faint)',
          padding:     '2px',
          display:     'flex',
          lineHeight:  1,
          transition:  'color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ivory)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ivory-faint)')}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
