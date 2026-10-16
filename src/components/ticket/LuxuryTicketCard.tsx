import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { BookingOrder, TicketItem } from '../../types/ticketModel';
import { createTicketQRLink } from '../../utils/ticketSecurity';
import { formatPrice } from '../../utils/helpers';
import { ShieldCheck, Sparkles, MapPin, Calendar, Clock, Ticket } from 'lucide-react';

interface LuxuryTicketCardProps {
  booking: BookingOrder;
  ticket: TicketItem;
  containerId?: string;
  enableHoverTilt?: boolean;
}

export const LuxuryTicketCard: React.FC<LuxuryTicketCardProps> = ({
  booking,
  ticket,
  containerId,
  enableHoverTilt = true,
}) => {
  const { event, attendee } = booking;
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    createTicketQRLink(
      typeof window !== 'undefined' ? window.location.origin : '',
      ticket.ticketId,
      booking.bookingId,
      event.id,
      ticket.seat.id,
      ticket.seat.category,
      ticket.validity.validUntil,
      booking.bookedAt
    ).then((res) => {
      if (active) setQrUrl(res.url);
    });
    return () => {
      active = false;
    };
  }, [ticket, booking, event]);

  const isVip = ticket.seat.category === 'VIP';
  const isPremium = ticket.seat.category === 'Premium';

  return (
    <div
      id={containerId}
      className={`luxury-ticket-root relative overflow-hidden select-none transition-all duration-300 ${
        enableHoverTilt ? 'hover:-translate-y-1 hover:shadow-2xl' : ''
      }`}
      style={{
        width: '100%',
        maxWidth: '940px',
        margin: '0 auto',
        backgroundColor: '#faf7f2', // Fixed warm ivory canvas across themes and PDF
        color: '#1a1f2c', // Fixed deep ink navy text
        fontFamily: "'Manrope', sans-serif",
        border: '1px solid #d4af37',
        boxShadow: '0 20px 45px -15px rgba(20, 24, 38, 0.25)',
      }}
    >
      {/* ── Security Microtext Border & Guilloche Background Overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#1a1f2c 1px, transparent 1px), radial-gradient(#d4af37 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px',
        }}
      />

      {/* ── Top Gold-Foil Gradient Header Bar ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #101626 0%, #1e2638 45%, #b38b30 75%, #e6c875 100%)',
          color: '#ffffff',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #d4af37',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '1.25rem',
              letterSpacing: '0.04em',
              color: '#f5f0e8',
            }}
          >
            Velvet<span style={{ fontStyle: 'normal', fontWeight: 800, color: '#e6c875' }}>Seat</span>
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              borderLeft: '1px solid rgba(212,175,55,0.4)',
              paddingLeft: '10px',
            }}
          >
            Official Premiere Pass
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Status Badge */}
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: '2px',
              backgroundColor: booking.status === 'Confirmed' ? 'rgba(58,158,108,0.2)' : 'rgba(198,40,40,0.2)',
              color: booking.status === 'Confirmed' ? '#4ade80' : '#f87171',
              border: `1px solid ${booking.status === 'Confirmed' ? '#22c55e' : '#ef4444'}`,
            }}
          >
            {booking.status}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#e6c875', fontFamily: 'monospace', fontWeight: 600 }}>
            {ticket.ticketCount}
          </span>
        </div>
      </div>

      {/* ── Ticket Grid: Main Body (68%) + Tear-Off Stub (32%) ── */}
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: '340px', position: 'relative' }}>
        
        {/* ========================================================== */}
        {/* MAIN BODY (Left Section) */}
        {/* ========================================================== */}
        <div style={{ flex: '1 1 68%', padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Top row: Category Ribbon + Access Level + Confirmation Number */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: isVip ? '#b38b30' : isPremium ? '#1e2638' : '#e2dbcb',
                    color: isVip ? '#ffffff' : isPremium ? '#f5f0e8' : '#2d3345',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '2px',
                  }}
                >
                  {ticket.ticketType}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#5a6275', letterSpacing: '0.04em' }}>
                  {ticket.accessLevel}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6rem', color: '#8c94a6', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
                  Confirmation No.
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#1a1f2c' }}>
                  {booking.confirmationNumber}
                </span>
              </div>
            </div>

            {/* Event Title & Subtitle */}
            <div style={{ marginBottom: '16px' }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '2.1rem',
                  lineHeight: 1.1,
                  fontWeight: 700,
                  color: '#0e1320',
                  margin: '0 0 4px',
                }}
              >
                {event.title}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#b38b30', fontStyle: 'italic', margin: 0, fontWeight: 600 }}>
                {event.subtitle || event.artist}
              </p>
            </div>

            {/* Event Time & Venue Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '12px 14px',
                backgroundColor: '#f1ede4',
                border: '1px solid #e2dbcb',
                borderRadius: '3px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a8294', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Calendar size={11} color="#b38b30" /> Date & Day
                </span>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#101626', margin: 0 }}>
                  {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#5a6275', margin: 0 }}>{event.day}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a8294', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Clock size={11} color="#b38b30" /> Schedule & Doors
                </span>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#101626', margin: 0 }}>
                  {event.startTime} - {event.endTime}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#5a6275', margin: 0 }}>Doors: {event.doorsOpenTime}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a8294', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <MapPin size={11} color="#b38b30" /> Venue & Gate
                </span>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#101626', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {event.venue}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#5a6275', margin: 0 }}>{event.city} · {event.entryGate}</p>
              </div>
            </div>

            {/* Seat, Attendee & Pricing Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', borderTop: '1px solid #e2dbcb', paddingTop: '12px' }}>
              <div>
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c94a6', display: 'block' }}>
                  Seat / Location
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#0e1320' }}>
                  {ticket.seat.id}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#5a6275', display: 'block' }}>
                  Row {ticket.seat.row} · Seat {ticket.seat.seatNumber}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c94a6', display: 'block' }}>
                  Guest Name
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#101626', display: 'block' }}>
                  {attendee.fullName}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#b38b30', fontWeight: 600 }}>
                  {attendee.attendeeType} Pass
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c94a6', display: 'block' }}>
                  Masked Contact
                </span>
                <span style={{ fontSize: '0.72rem', color: '#323a4d', fontFamily: 'monospace', display: 'block' }}>
                  {attendee.maskedEmail}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#323a4d', fontFamily: 'monospace', display: 'block' }}>
                  {attendee.maskedPhone}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c94a6', display: 'block' }}>
                  Ticket Total
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: '1.25rem', color: '#0e1320' }}>
                  {formatPrice(ticket.pricing.totalForTicket)}
                </span>
                <span style={{ fontSize: '0.6rem', color: '#7a8294', display: 'block' }}>
                  Base: {formatPrice(ticket.pricing.baseSeatPrice)} + GST/Fees
                </span>
              </div>
            </div>
          </div>

          {/* Micro Footer Bar with Security Identifiers */}
          <div style={{ borderTop: '1px solid #e2dbcb', paddingTop: '10px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.58rem', color: '#7a8294', display: 'block' }}>
                Booking ID: <strong style={{ color: '#101626', fontFamily: 'monospace' }}>{booking.bookingId}</strong> · Ticket ID: <strong style={{ color: '#101626', fontFamily: 'monospace' }}>{ticket.ticketId}</strong>
              </span>
              <span style={{ fontSize: '0.55rem', color: '#9aa0b0' }}>
                Ref: {booking.transactionRef} · {booking.paymentMethod.toUpperCase()} · Organizer: {event.organizer}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#b38b30" />
              <span style={{ fontSize: '0.6rem', color: '#b38b30', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Tamper-Verified Pass
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PERFORATION NOTCH SEPARATOR */}
        {/* ========================================================== */}
        <div
          style={{
            width: '0px',
            position: 'relative',
            borderRight: '2px dashed #b38b30',
            opacity: 0.8,
          }}
        >
          {/* Top Notch Cutout */}
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              left: '-14px',
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--color-bg, #0a0a0b)',
              borderRadius: '50%',
              border: '1px solid #d4af37',
              zIndex: 10,
            }}
          />
          {/* Bottom Notch Cutout */}
          <div
            style={{
              position: 'absolute',
              bottom: '-14px',
              left: '-14px',
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--color-bg, #0a0a0b)',
              borderRadius: '50%',
              border: '1px solid #d4af37',
              zIndex: 10,
            }}
          />
        </div>

        {/* ========================================================== */}
        {/* TEAR-OFF STUB (Right Section) */}
        {/* ========================================================== */}
        <div
          style={{
            flex: '0 0 32%',
            backgroundColor: '#f3eee4',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Hologram / Embossed Gold Seal */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b38b30', fontWeight: 800 }}>
              Admission Stub
            </span>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #e6c875 0%, #b38b30 70%, #5a4212 100%)',
                boxShadow: '0 2px 6px rgba(179,139,48,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={11} color="#ffffff" />
            </div>
          </div>

          {/* Seat Callout in Stub */}
          <div style={{ margin: '4px 0 8px' }}>
            <span style={{ fontSize: '0.6rem', color: '#7a8294', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Allocated Seat
            </span>
            <h3 style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 900, color: '#0e1320', margin: '2px 0' }}>
              {ticket.seat.id}
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#b38b30', fontWeight: 700, textTransform: 'uppercase' }}>
              {ticket.seat.category} · Row {ticket.seat.row}
            </span>
          </div>

          {/* Large High-Contrast Scannable QR Code */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              border: '1px solid #d4af37',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {qrUrl ? (
              <QRCodeSVG
                value={qrUrl}
                size={120}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div style={{ width: 120, height: 120, backgroundColor: '#eee' }} />
            )}
          </div>

          {/* Security Backup Code below QR */}
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '0.58rem', color: '#8c94a6', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
              Backup Code
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#101626', letterSpacing: '0.1em' }}>
              {ticket.securityBackupCode}
            </span>
          </div>

          {/* Verification hint */}
          <div style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '0.58rem', color: '#7a8294', display: 'block', lineHeight: 1.2 }}>
              Scan via Admin Entrance Scanner at admission turnstile
            </span>
          </div>
        </div>
      </div>

      {/* ── Fixed Footer Terms Strip ── */}
      <div
        style={{
          backgroundColor: '#eae3d5',
          borderTop: '1px solid #d4af37',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.58rem',
          color: '#656d80',
        }}
      >
        <div>
          <span>Non-transferable. Present matching Government Photo ID upon entry. Subject to venue security and admission guidelines.</span>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '12px' }}>
          <strong style={{ color: '#b38b30' }}>Demo Ticket</strong> · concierge@velvetseat.com
        </div>
      </div>
    </div>
  );
};
