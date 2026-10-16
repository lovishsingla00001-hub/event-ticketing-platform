/**
 * Checkout.tsx
 * Multi-step checkout page with order summary, seat hold timer,
 * attendee details form, payment method selection, and payment modals.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  Smartphone,
  Building2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Ticket,
  RefreshCw,
} from 'lucide-react';

import {
  useCheckoutStore,
  createBookingFromCheckout,
  type CheckoutAttendeeForm,
  type PaymentMethod,
  type AttendeeDetails,
} from '../stores/checkoutStore';
import { useSeatStore } from '../stores/seatStore';
import { useToastStore } from '../stores/uiStore';
import { useCountdown } from '../hooks';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';

// ─── Constants ───────────────────────────────────────────────
const CONVENIENCE_FEE_RATE = 0.025;
const PROCESSING_MESSAGES = [
  'Authenticating your payment…',
  'Connecting to secure gateway…',
  'Verifying card details…',
  'Processing transaction…',
  'Almost there…',
];

const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'PNB'];

// ─── Helpers ─────────────────────────────────────────────────

/** Format a raw card number string as XXXX XXXX XXXX XXXX */
const maskCardNumber = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/** Format expiry as MM/YY */
const maskExpiry = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

/** Detect card type from first digit */
const detectCardType = (num: string): 'visa' | 'mastercard' | null => {
  const d = num.replace(/\s/g, '');
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5') || d.startsWith('2')) return 'mastercard';
  return null;
};

// ─── Sub-components ──────────────────────────────────────────

/**
 * SeatHoldTimer — countdown badge in the order summary.
 * Turns urgent red when < 2 minutes remain.
 */
const SeatHoldTimer: React.FC<{
  holdExpiry: string | null;
  onExpire: () => void;
}> = ({ holdExpiry, onExpire }) => {
  const countdown = useCountdown(holdExpiry);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (countdown.expired && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire();
    }
  }, [countdown.expired, onExpire]);

  const totalSeconds = countdown.minutes * 60 + countdown.seconds;
  const isUrgent = !countdown.expired && totalSeconds < 120;
  const mm = String(countdown.minutes).padStart(2, '0');
  const ss = String(countdown.seconds).padStart(2, '0');

  return (
    <div
      role="timer"
      aria-label={`Seat hold expires in ${mm}:${ss}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.9rem',
        background: isUrgent
          ? 'rgba(185, 28, 28, 0.15)'
          : 'rgba(212, 175, 55, 0.08)',
        border: `1px solid ${isUrgent ? 'rgba(185,28,28,0.4)' : 'var(--color-gold-dim)'}`,
        marginTop: '1rem',
      }}
    >
      <Timer
        size={14}
        style={{ color: isUrgent ? '#ef4444' : 'var(--color-gold)' }}
        aria-hidden="true"
      />
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          letterSpacing: '0.05em',
          color: isUrgent ? '#ef4444' : 'var(--color-gold)',
          fontWeight: 600,
        }}
      >
        {countdown.expired ? 'EXPIRED' : `${mm}:${ss}`}
      </span>
      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--color-ivory-dim)',
          marginLeft: '0.2rem',
        }}
      >
        seat hold remaining
      </span>
    </div>
  );
};

/**
 * OrderSummary — left sidebar showing event info, seat list, and totals.
 */
const OrderSummary: React.FC<{ onExpire: () => void }> = ({ onExpire }) => {
  const { event, seats, total, holdExpiry } = useCheckoutStore();

  if (!event) return null;

  const convenienceFee = Math.round(total * CONVENIENCE_FEE_RATE);
  const grandTotal = total + convenienceFee;

  return (
    <aside
      aria-label="Order summary"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '2rem',
        position: 'sticky',
        top: '6rem',
        height: 'fit-content',
      }}
    >
      {/* Event image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          marginBottom: '1.25rem',
        }}
        className="image-hover-zoom"
      >
        <img
          src={event.image}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Event info */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: 'var(--color-ivory)',
          fontWeight: 600,
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}
      >
        {event.title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={13} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ivory-dim)' }}>
            {formatDate(event.date)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={13} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ivory-dim)' }}>
            {formatTime(event.date)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={13} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ivory-dim)' }}>
            {event.venue}, {event.city}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '1rem' }} />

      {/* Seat list */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          Selected Seats
        </h3>
        <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {seats.map((seat) => (
            <li
              key={seat.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ticket size={12} style={{ color: 'var(--color-gold-dim)' }} aria-hidden="true" />
                <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory-dim)' }}>
                  Row {seat.row}, Seat {seat.seatNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--color-gold)',
                    background: 'rgba(212,175,55,0.1)',
                    padding: '0.1rem 0.4rem',
                    border: '1px solid var(--color-gold-dim)',
                  }}
                >
                  {seat.category}
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory)', fontWeight: 600 }}>
                {formatPrice(seat.price)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory-dim)' }}>Subtotal</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory)' }}>
            {formatPrice(total)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory-dim)' }}>
            Convenience fee (2.5%)
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory)' }}>
            {formatPrice(convenienceFee)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              color: 'var(--color-ivory)',
              fontWeight: 700,
            }}
          >
            Grand Total
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              color: 'var(--color-gold)',
              fontWeight: 700,
            }}
          >
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      {/* Timer */}
      <SeatHoldTimer holdExpiry={holdExpiry} onExpire={onExpire} />

      {/* Security badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          opacity: 0.6,
        }}
      >
        <ShieldCheck size={13} aria-hidden="true" style={{ color: 'var(--color-gold)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--color-ivory-dim)' }}>
          256-bit SSL encrypted checkout
        </span>
      </div>
    </aside>
  );
};

// ─── Form field component ─────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FieldProps> = ({ label, id, error, children }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <label
      htmlFor={id}
      style={{
        display: 'block',
        fontFamily: 'var(--font-display)',
        fontSize: '0.95rem',
        color: 'var(--color-ivory)',
        marginBottom: '0.4rem',
        letterSpacing: '0.02em',
        fontStyle: 'italic',
      }}
    >
      {label}
    </label>
    {children}
    {error && (
      <motion.p
        role="alert"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: '#ef4444',
          marginTop: '0.35rem',
        }}
      >
        <AlertCircle size={11} aria-hidden="true" />
        {error}
      </motion.p>
    )}
  </div>
);

/** Shared input style — bottom-border only, elegant */
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-border-2)',
  outline: 'none',
  padding: '0.55rem 0',
  fontSize: '0.9rem',
  color: 'var(--color-ivory)',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.2s',
};

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderBottomColor: 'var(--color-gold)',
};

/** Input that highlights on focus */
const ElegantInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
> = ({ error, style: _style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{
        ...(focused ? inputFocusStyle : inputStyle),
        borderBottomColor: error
          ? '#ef4444'
          : focused
          ? 'var(--color-gold)'
          : 'var(--color-border-2)',
        ..._style,
      }}
    />
  );
};

const ElegantSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  children,
  style: _style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{
        ...(focused ? inputFocusStyle : inputStyle),
        borderBottomColor: focused ? 'var(--color-gold)' : 'var(--color-border-2)',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.2rem center',
        paddingRight: '1.5rem',
        ..._style,
      }}
    >
      {children}
    </select>
  );
};

// ─── Step 1: Attendee Details ─────────────────────────────────

interface AttendeeErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const validateAttendee = (d: AttendeeDetails): AttendeeErrors => {
  const errors: AttendeeErrors = {};
  if (!d.name || d.name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
    errors.email = 'Enter a valid email address';
  if (!d.phone || !/^[6-9]\d{9}$/.test(d.phone))
    errors.phone = 'Enter a valid 10-digit Indian mobile number';
  return errors;
};

const AttendeeForm: React.FC<{
  details: AttendeeDetails;
  errors: AttendeeErrors;
  onChange: (field: keyof AttendeeDetails, value: string) => void;
}> = ({ details, errors, onChange }) => (
  <div>
    <FormField label="Full Name" id="attendee-name" error={errors.name}>
      <ElegantInput
        id="attendee-name"
        type="text"
        value={details.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="e.g. Arjun Mehta"
        autoComplete="name"
        error={!!errors.name}
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'attendee-name-error' : undefined}
      />
    </FormField>

    <FormField label="Email Address" id="attendee-email" error={errors.email}>
      <ElegantInput
        id="attendee-email"
        type="email"
        value={details.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        error={!!errors.email}
        aria-invalid={!!errors.email}
      />
    </FormField>

    <FormField label="Mobile Number" id="attendee-phone" error={errors.phone}>
      <ElegantInput
        id="attendee-phone"
        type="tel"
        value={details.phone}
        onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="9XXXXXXXXX"
        autoComplete="tel"
        error={!!errors.phone}
        aria-invalid={!!errors.phone}
      />
    </FormField>
  </div>
);

// ─── Step 2: Payment method ───────────────────────────────────

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

interface CardErrors {
  number?: string;
  name?: string;
  expiry?: string;
  cvv?: string;
}

const validateCard = (c: CardData): CardErrors => {
  const errors: CardErrors = {};
  const digits = c.number.replace(/\s/g, '');
  if (digits.length !== 16) errors.number = 'Enter a valid 16-digit card number';
  if (!c.name.trim()) errors.name = 'Enter cardholder name';
  if (!/^\d{2}\/\d{2}$/.test(c.expiry)) errors.expiry = 'Enter expiry as MM/YY';
  if (!/^\d{3,4}$/.test(c.cvv)) errors.cvv = 'Enter valid CVV';
  return errors;
};

const validateUPI = (upiId: string): string | undefined => {
  if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId))
    return 'Enter a valid UPI ID (e.g. user@paytm)';
};

/** Card brand badge */
const CardTypeBadge: React.FC<{ type: 'visa' | 'mastercard' | null }> = ({ type }) => {
  if (!type) return null;
  return (
    <span
      aria-label={type}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.5rem',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: type === 'visa' ? '#1a1f71' : '#eb001b',
        background: type === 'visa' ? '#e8eaf6' : '#fff',
        marginLeft: '0.5rem',
      }}
    >
      {type === 'visa' ? 'VISA' : 'MC'}
    </span>
  );
};

const CardForm: React.FC<{
  data: CardData;
  errors: CardErrors;
  onChange: (field: keyof CardData, value: string) => void;
}> = ({ data, errors, onChange }) => {
  const cardType = detectCardType(data.number);
  return (
    <div>
      <FormField label="Card Number" id="card-number" error={errors.number}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ElegantInput
            id="card-number"
            type="text"
            inputMode="numeric"
            value={data.number}
            onChange={(e) => onChange('number', maskCardNumber(e.target.value))}
            placeholder="XXXX XXXX XXXX XXXX"
            maxLength={19}
            error={!!errors.number}
            aria-invalid={!!errors.number}
          />
          <CardTypeBadge type={cardType} />
        </div>
      </FormField>

      <FormField label="Cardholder Name" id="card-name" error={errors.name}>
        <ElegantInput
          id="card-name"
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="As printed on card"
          autoComplete="cc-name"
          error={!!errors.name}
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <FormField label="Expiry (MM/YY)" id="card-expiry" error={errors.expiry}>
          <ElegantInput
            id="card-expiry"
            type="text"
            inputMode="numeric"
            value={data.expiry}
            onChange={(e) => onChange('expiry', maskExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            error={!!errors.expiry}
          />
        </FormField>
        <FormField label="CVV" id="card-cvv" error={errors.cvv}>
          <ElegantInput
            id="card-cvv"
            type="password"
            inputMode="numeric"
            value={data.cvv}
            onChange={(e) => onChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            maxLength={4}
            error={!!errors.cvv}
            autoComplete="cc-csc"
          />
        </FormField>
      </div>
    </div>
  );
};

const UPIForm: React.FC<{
  upiId: string;
  error?: string;
  onChange: (val: string) => void;
}> = ({ upiId, error, onChange }) => (
  <div>
    <FormField label="UPI ID" id="upi-id" error={error}>
      <ElegantInput
        id="upi-id"
        type="text"
        value={upiId}
        onChange={(e) => onChange(e.target.value)}
        placeholder="yourname@paytm"
        autoComplete="off"
        error={!!error}
      />
    </FormField>
    <p style={{ fontSize: '0.75rem', color: 'var(--color-ivory-faint)', marginTop: '-1rem' }}>
      Accepts all UPI handles: @paytm, @gpay, @phonepe, @upi, etc.
    </p>
  </div>
);

const NetBankingForm: React.FC<{
  bank: string;
  onChange: (val: string) => void;
}> = ({ bank, onChange }) => (
  <div>
    <FormField label="Select Bank" id="bank-select">
      <ElegantSelect
        id="bank-select"
        value={bank}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select your bank"
      >
        <option value="" disabled>
          Choose your bank
        </option>
        {BANKS.map((b) => (
          <option key={b} value={b} style={{ background: 'var(--color-surface)' }}>
            {b}
          </option>
        ))}
      </ElegantSelect>
    </FormField>
  </div>
);

// ─── Payment Tabs ─────────────────────────────────────────────

const TAB_CONFIG: { id: PaymentMethod; label: string; Icon: React.FC<{ size: number }> }[] = [
  { id: 'card', label: 'Card', Icon: CreditCard },
  { id: 'upi', label: 'UPI', Icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', Icon: Building2 },
];

// ─── Processing Modal ─────────────────────────────────────────

const ProcessingModal: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="processing-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Processing payment"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10, 8, 6, 0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Spinning ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--color-gold)',
            borderRightColor: 'var(--color-gold-dim)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
          }}
        />
        <ShieldCheck
          size={24}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--color-gold)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Cycling message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            color: 'var(--color-ivory)',
            fontStyle: 'italic',
          }}
        >
          {PROCESSING_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-ivory-faint)' }}>
        Do not close this window
      </p>
    </motion.div>
  );
};

// ─── Result Modal ─────────────────────────────────────────────

const ResultModal: React.FC<{
  success: boolean;
  bookingId: string | null;
  errorReason?: string;
  onViewTicket: () => void;
  onTryAgain: () => void;
  onChangeMethod: () => void;
}> = ({ success, bookingId, errorReason, onViewTicket, onTryAgain, onChangeMethod }) => (
  <motion.div
    key="result-modal"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    role="dialog"
    aria-modal="true"
    aria-label={success ? 'Payment successful' : 'Payment failed'}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(10, 8, 6, 0.94)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(8px)',
    }}
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '3rem 2.5rem',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.2rem',
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
      >
        {success ? (
          <CheckCircle2
            size={56}
            style={{ color: '#22c55e' }}
            aria-hidden="true"
          />
        ) : (
          <XCircle
            size={56}
            style={{ color: '#ef4444' }}
            aria-hidden="true"
          />
        )}
      </motion.div>

      {/* Heading */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          color: 'var(--color-ivory)',
          fontWeight: 700,
        }}
      >
        {success ? 'Payment Successful!' : 'Payment Failed'}
      </h2>

      {/* Body */}
      {success && bookingId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ivory-dim)' }}>
            Your booking is confirmed. Check your email for details.
          </p>
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              marginTop: '0.5rem',
            }}
          >
            <p style={{ fontSize: '0.7rem', color: 'var(--color-ivory-faint)', marginBottom: '0.2rem' }}>
              BOOKING ID
            </p>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                color: 'var(--color-gold)',
                letterSpacing: '0.08em',
              }}
            >
              {bookingId}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ivory-dim)' }}>
          {errorReason || 'Something went wrong. Please try again.'}
        </p>
      )}

      {/* Actions */}
      {success ? (
        <button
          onClick={onViewTicket}
          style={{
            marginTop: '0.5rem',
            padding: '0.9rem 2.5rem',
            background: 'var(--color-gold)',
            color: '#0a0806',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            width: '100%',
          }}
        >
          View Ticket
          <ChevronRight size={16} style={{ display: 'inline', marginLeft: '0.4rem' }} aria-hidden="true" />
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            onClick={onTryAgain}
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'var(--color-gold)',
              color: '#0a0806',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Try Again
          </button>
          <button
            onClick={onChangeMethod}
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'transparent',
              color: 'var(--color-ivory)',
              border: '1px solid var(--color-border-2)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          >
            Change Method
          </button>
        </div>
      )}
    </motion.div>
  </motion.div>
);

// ─── Main Checkout Page ───────────────────────────────────────

type Step = 1 | 2;
type ModalState = 'none' | 'processing' | 'success' | 'failure';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const {
    event,
    seats,
    total,
    attendee,
    paymentMethod,
    holdExpiry,
    bookingId,
    updateAttendee,
    setPaymentMethod,
    setPaymentStatus,
    setBookingId,
    addBooking,
    clearCheckout,
  } = useCheckoutStore();
  const { commitBooking } = useSeatStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<Step>(1);
  const [attendeeErrors, setAttendeeErrors] = useState<AttendeeErrors>({});
  const [modal, setModal] = useState<ModalState>('none');
  const [failureReason, setFailureReason] = useState('');

  // Payment form state
  const [card, setCard] = useState<CardData>({ number: '', name: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState<string | undefined>();
  const [selectedBank, setSelectedBank] = useState('');
  const paymentInFlight = useRef(false);
  const holdExpired = useRef(false);

  const convenienceFee = Math.round(total * CONVENIENCE_FEE_RATE);
  const grandTotal = total + convenienceFee;

  // Guard: redirect if no checkout data
  useEffect(() => {
    if (!event || seats.length === 0) {
      navigate('/');
    }
  }, [event, seats, navigate]);

  /** Called when the seat hold timer expires */
  const handleTimerExpire = () => {
    if (!event || holdExpired.current) return;
    holdExpired.current = true;
    addToast('Your seat hold has expired. Seats have been released.', 'error');
    useSeatStore.getState().clearSelection();
    clearCheckout();
    navigate(`/events/${event.slug}/seats`, { replace: true });
  };

  /** Validate step 1 and advance */
  const handleStep1Submit = () => {
    const errors = validateAttendee(attendee);
    setAttendeeErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /** Validate step 2 payment form */
  const validatePayment = (): boolean => {
    if (paymentMethod === 'card') {
      const errors = validateCard(card);
      setCardErrors(errors);
      return Object.keys(errors).length === 0;
    }
    if (paymentMethod === 'upi') {
      const err = validateUPI(upiId);
      setUpiError(err);
      return !err;
    }
    if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        addToast('Please select a bank to proceed.', 'warning');
        return false;
      }
      return true;
    }
    return false;
  };

  /** Simulate payment flow */
  const handlePay = async () => {
    if (paymentInFlight.current || modal === 'processing') return;
    const expiry = holdExpiry ? Date.parse(holdExpiry) : 0;
    if (!expiry || expiry <= Date.now()) {
      handleTimerExpire();
      return;
    }
    if (!validatePayment()) return;

    paymentInFlight.current = true;
    setModal('processing');
    setPaymentStatus('processing');

    await new Promise((res) => setTimeout(res, 1200));

    if (Date.parse(holdExpiry) <= Date.now()) {
      paymentInFlight.current = false;
      handleTimerExpire();
      return;
    }

    // Mock gateway outcomes stay balanced and injectable via Math.random in QA.
    const success = Math.random() < 0.5;

    if (success) {
      const newBooking = createBookingFromCheckout(event!, seats, attendee, paymentMethod);
      setBookingId(newBooking.bookingId);
      setPaymentStatus('success');
      commitBooking(event!.id, seats.map((s) => s.id));
      addBooking(newBooking);
      setModal('success');
    } else {
      setPaymentStatus('failed');
      const reasons = [
        'Insufficient funds. Please check your balance.',
        'Card declined by issuing bank.',
        'Transaction limit exceeded.',
        'Network timeout. Please try again.',
      ];
      setFailureReason(reasons[Math.floor(Math.random() * reasons.length)]);
      setModal('failure');
    }
    paymentInFlight.current = false;
  };

  const handleViewTicket = () => {
    const id = useCheckoutStore.getState().bookingId;
    clearCheckout();
    navigate(`/confirmation/${id}`);
  };

  const handleTryAgain = () => {
    if (holdExpiry && Date.parse(holdExpiry) <= Date.now()) {
      handleTimerExpire();
      return;
    }
    setModal('none');
    setPaymentStatus('idle');
  };

  const handleChangeMethod = () => {
    setModal('none');
    setPaymentStatus('idle');
    setStep(2);
  };

  if (!event) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}
    >
      {/* Page header */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--color-surface)',
        }}
      >
        <Ticket size={18} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            color: 'var(--color-ivory)',
            fontWeight: 600,
          }}
        >
          VelvetSeat Checkout
        </h1>
        {/* Step indicator */}
        <div
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          aria-label={`Step ${step} of 2`}
        >
          {([1, 2] as const).map((s) => (
            <React.Fragment key={s}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: step >= s ? 'var(--color-gold)' : 'var(--color-surface-2)',
                  color: step >= s ? '#0a0806' : 'var(--color-ivory-dim)',
                  border: `1px solid ${step >= s ? 'var(--color-gold)' : 'var(--color-border)'}`,
                  transition: 'all 0.3s',
                }}
                aria-current={step === s ? 'step' : undefined}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: step > s ? 'var(--color-gold)' : 'var(--color-border)',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </React.Fragment>
          ))}
          <span
            style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--color-ivory-dim)' }}
          >
            {step === 1 ? 'Your Details' : 'Payment'}
          </span>
        </div>
      </div>

      {/* Content grid */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Main form area */}
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                aria-labelledby="step1-heading"
              >
                <h2
                  id="step1-heading"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    color: 'var(--color-ivory)',
                    marginBottom: '0.3rem',
                    fontWeight: 600,
                  }}
                >
                  Your Details
                </h2>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-ivory-dim)',
                    marginBottom: '2rem',
                  }}
                >
                  Tickets will be sent to the email address provided below.
                </p>

                <AttendeeForm
                  details={attendee}
                  errors={attendeeErrors}
                  onChange={(field, value) => {
                    updateAttendee({ [field]: value });
                    if (attendeeErrors[field]) {
                      setAttendeeErrors((prev) => ({ ...prev, [field]: undefined }));
                    }
                  }}
                />

                <button
                  onClick={handleStep1Submit}
                  style={{
                    marginTop: '0.5rem',
                    padding: '1rem 2.5rem',
                    background: 'var(--color-gold)',
                    color: '#0a0806',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Continue to Payment
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                aria-labelledby="step2-heading"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    onClick={() => setStep(1)}
                    aria-label="Go back to attendee details"
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-ivory-dim)',
                      cursor: 'pointer',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    ← Back
                  </button>
                  <h2
                    id="step2-heading"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.6rem',
                      color: 'var(--color-ivory)',
                      fontWeight: 600,
                    }}
                  >
                    Payment
                  </h2>
                </div>

                {/* Tab bar */}
                <div
                  role="tablist"
                  aria-label="Payment method"
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '1.75rem',
                  }}
                >
                  {TAB_CONFIG.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={paymentMethod === id}
                      onClick={() => setPaymentMethod(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: `2px solid ${paymentMethod === id ? 'var(--color-gold)' : 'transparent'}`,
                        color:
                          paymentMethod === id
                            ? 'var(--color-gold)'
                            : 'var(--color-ivory-dim)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.88rem',
                        fontWeight: paymentMethod === id ? 600 : 400,
                        transition: 'all 0.2s',
                        marginBottom: '-1px',
                      }}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab panel */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={paymentMethod}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    role="tabpanel"
                    aria-label={`${paymentMethod} payment form`}
                  >
                    {paymentMethod === 'card' && (
                      <CardForm
                        data={card}
                        errors={cardErrors}
                        onChange={(field, value) => {
                          setCard((prev) => ({ ...prev, [field]: value }));
                          if (cardErrors[field]) {
                            setCardErrors((prev) => ({ ...prev, [field]: undefined }));
                          }
                        }}
                      />
                    )}
                    {paymentMethod === 'upi' && (
                      <UPIForm
                        upiId={upiId}
                        error={upiError}
                        onChange={(val) => {
                          setUpiId(val);
                          if (upiError) setUpiError(undefined);
                        }}
                      />
                    )}
                    {paymentMethod === 'netbanking' && (
                      <NetBankingForm
                        bank={selectedBank}
                        onChange={setSelectedBank}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Pay button */}
                <motion.button
                  onClick={handlePay}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '1.1rem 2rem',
                    background: 'var(--color-gold)',
                    color: '#0a0806',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                  }}
                  aria-label={`Pay ${formatPrice(grandTotal)} securely`}
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                  Pay {formatPrice(grandTotal)} Securely
                </motion.button>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--color-ivory-faint)',
                    marginTop: '0.75rem',
                  }}
                >
                  By paying, you agree to VelvetSeat's Terms & Conditions and Privacy Policy.
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Order summary sidebar */}
        <OrderSummary onExpire={handleTimerExpire} />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'processing' && <ProcessingModal key="proc" />}
        {(modal === 'success' || modal === 'failure') && (
          <ResultModal
            key="result"
            success={modal === 'success'}
            bookingId={bookingId}
            errorReason={failureReason}
            onViewTicket={handleViewTicket}
            onTryAgain={handleTryAgain}
            onChangeMethod={handleChangeMethod}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default Checkout;
