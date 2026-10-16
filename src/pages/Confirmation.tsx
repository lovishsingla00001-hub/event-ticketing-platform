import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  CalendarPlus,
  CheckCircle,
  ArrowLeft,
  Ticket as TicketIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Copy,
  ScanLine,
} from 'lucide-react';
import { useCheckoutStore } from '../stores/checkoutStore';
import { useToastStore } from '../stores/uiStore';
import { formatPrice, formatDate, formatTime, generateCalendarLink } from '../utils/helpers';
import PageTransition from '../components/layout/PageTransition';
import { LuxuryTicketCard } from '../components/ticket/LuxuryTicketCard';
import {
  downloadSingleTicketPdf,
  downloadAllTicketsPdf,
  downloadTicketPng,
  downloadCalendarIcs,
} from '../utils/ticketPdfGenerator';

export default function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings } = useCheckoutStore();
  const { addToast } = useToastStore();

  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const ticketContainerRef = useRef<HTMLDivElement>(null);

  const booking = bookings.find((b) => b.bookingId === bookingId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!booking) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full border border-token flex items-center justify-center mb-4 bg-surface text-gold">
            <TicketIcon size={32} />
          </div>
          <h2 className="text-3xl font-display mb-3 text-gold">Ticket Not Found</h2>
          <p className="text-ivory-dim mb-8 max-w-md text-sm leading-relaxed">
            We could not locate this booking pass in your browser records. It may have been cleared or booked on a different device.
          </p>
          <div className="flex gap-4">
            <Link
              to="/bookings"
              className="px-6 py-3 bg-surface border border-token text-gold hover:border-gold transition-colors font-medium text-xs tracking-widest uppercase"
            >
              My Bookings
            </Link>
            <Link
              to="/events"
              className="px-6 py-3 bg-surface-2 border border-token text-ivory hover:text-gold transition-colors font-medium text-xs tracking-widest uppercase"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const { event, attendee, tickets } = booking;
  const currentTicket = tickets[activeTicketIndex] || tickets[0];

  // Calendar sync URLs
  const calendarUrl = generateCalendarLink({
    title: event.title,
    date: event.date,
    venue: event.venue,
    city: event.city,
    description: event.subtitle || event.artist,
  });

  // Download handlers
  const handleDownloadSinglePdf = async () => {
    if (!ticketContainerRef.current) return;
    setDownloading(true);
    addToast('Generating 3x high-resolution ticket PDF…', 'info');
    try {
      await downloadSingleTicketPdf(
        ticketContainerRef.current,
        event.title,
        currentTicket.seat.id,
        currentTicket.ticketId
      );
      addToast('Ticket PDF saved to downloads!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate PDF. You can also print the pass directly.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllPdf = async () => {
    setDownloading(true);
    addToast(`Rendering multi-page PDF for all ${tickets.length} tickets…`, 'info');
    try {
      // Find all rendered ticket elements (hidden container renders all of them)
      const elements: HTMLElement[] = [];
      for (let i = 0; i < tickets.length; i++) {
        const el = document.getElementById(`ticket-render-target-${i}`);
        if (el) elements.push(el);
      }

      if (elements.length === 0 && ticketContainerRef.current) {
        elements.push(ticketContainerRef.current);
      }

      await downloadAllTicketsPdf(elements, event.title, booking.bookingId);
      addToast(`All ${tickets.length} tickets bundled into one PDF!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error rendering multi-page PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!ticketContainerRef.current) return;
    setDownloading(true);
    try {
      await downloadTicketPng(
        ticketContainerRef.current,
        event.title,
        currentTicket.seat.id,
        currentTicket.ticketId
      );
      addToast('Ticket PNG image saved!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export PNG.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadIcs = () => {
    downloadCalendarIcs({
      title: event.title,
      description: event.subtitle || event.artist,
      venue: event.venue,
      city: event.city,
      date: event.date,
      bookingId: booking.bookingId,
    });
    addToast('iCalendar event file (.ics) downloaded.', 'success');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Ticket: ${event.title}`,
          text: `I've booked ${event.title}! Booking ID: ${booking.bookingId}`,
          url: shareUrl,
        });
      } catch {
        // user dismissed share dialog
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Ticket link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        
        {/* ── Top Confirmed Status Ribbon ── */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          >
            <CheckCircle className="w-7 h-7" />
          </motion.div>
          <span className="text-[11px] tracking-[0.25em] uppercase text-gold font-bold">
            Admission Confirmed · Payment Complete
          </span>
          <h1 className="text-3xl md:text-5xl font-display mt-1 mb-2 font-semibold">
            Your Digital Pass is Ready
          </h1>
          <p className="text-ivory-dim text-xs md:text-sm max-w-lg mx-auto">
            Order <strong className="text-ivory font-mono">{booking.bookingId}</strong> has been secured and logged into your local concierge vault.
          </p>
        </div>

        {/* ── Multi-Seat Ticket Selector (if order has > 1 ticket) ── */}
        {tickets.length > 1 && (
          <div className="mb-6 flex items-center justify-between bg-surface border border-token p-3 sm:p-4 rounded-none">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ivory-dim font-medium uppercase tracking-wider">
                Viewing Ticket:
              </span>
              <span className="text-sm font-display text-gold font-bold">
                {activeTicketIndex + 1} of {tickets.length} ({currentTicket.seat.id})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTicketIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeTicketIndex === 0}
                className="p-1.5 border border-token bg-surface-2 text-ivory-dim hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous ticket"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex gap-1">
                {tickets.map((t, idx) => (
                  <button
                    key={t.ticketId}
                    onClick={() => setActiveTicketIndex(idx)}
                    className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                      idx === activeTicketIndex
                        ? 'border-gold text-gold bg-gold/10 font-bold'
                        : 'border-token text-ivory-dim hover:border-token-2'
                    }`}
                  >
                    {t.seat.id}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveTicketIndex((prev) => Math.min(tickets.length - 1, prev + 1))}
                disabled={activeTicketIndex === tickets.length - 1}
                className="p-1.5 border border-token bg-surface-2 text-ivory-dim hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next ticket"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── The Master Luxury Ticket Component (Display & Target) ── */}
        <div className="relative mb-8 overflow-x-auto pb-4">
          <div ref={ticketContainerRef} className="min-w-[720px] md:min-w-0">
            <LuxuryTicketCard
              booking={booking}
              ticket={currentTicket}
              enableHoverTilt={true}
            />
          </div>
        </div>

        {/* ── Hidden off-screen container for rendering all tickets into multi-page PDF ── */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '940px' }} aria-hidden="true">
          {tickets.map((t, idx) => (
            <div key={`hidden-${t.ticketId}`} id={`ticket-render-target-${idx}`}>
              <LuxuryTicketCard
                booking={booking}
                ticket={t}
                enableHoverTilt={false}
              />
            </div>
          ))}
        </div>

        {/* ── Primary Action Toolbar ── */}
        <div className="bg-surface border border-token p-6 mb-12 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-token pb-5 mb-5">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-ivory">
                Download & Save Passes
              </h3>
              <p className="text-xs text-ivory-dim mt-0.5">
                Razor-sharp 3x vector-grade documents with verified entrance barcodes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/verify"
                className="px-3.5 py-2 bg-surface-2 border border-token text-gold hover:border-gold transition-colors text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                title="Open entrance scanner to verify this ticket"
              >
                <ScanLine size={14} /> Admin Scanner
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Download This Ticket PDF */}
            <button
              onClick={handleDownloadSinglePdf}
              disabled={downloading}
              className="px-5 py-3 bg-gold text-[#0a0806] font-bold text-xs tracking-wider uppercase flex items-center gap-2 hover:bg-[#d4af37] transition-colors disabled:opacity-50"
            >
              <Download size={15} />
              Download This Ticket (PDF)
            </button>

            {/* Download ALL Tickets (Multi-Page PDF) */}
            {tickets.length > 1 && (
              <button
                onClick={handleDownloadAllPdf}
                disabled={downloading}
                className="px-5 py-3 bg-surface-2 border border-token text-gold hover:border-gold transition-colors font-bold text-xs tracking-wider uppercase flex items-center gap-2 disabled:opacity-50"
              >
                <FileText size={15} />
                Download All {tickets.length} Tickets (1 PDF)
              </button>
            )}

            {/* PNG Image download */}
            <button
              onClick={handleDownloadPng}
              disabled={downloading}
              className="px-4 py-3 bg-surface-2 border border-token text-ivory-dim hover:text-ivory transition-colors text-xs tracking-wider uppercase flex items-center gap-2 disabled:opacity-50"
            >
              <ImageIcon size={14} /> Save PNG
            </button>

            {/* Add to Calendar (.ics and Google Calendar) */}
            <button
              onClick={handleDownloadIcs}
              className="px-4 py-3 bg-surface-2 border border-token text-ivory-dim hover:text-ivory transition-colors text-xs tracking-wider uppercase flex items-center gap-2"
            >
              <CalendarPlus size={14} /> Add to Calendar (.ics)
            </button>

            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-surface-2 border border-token text-ivory-dim hover:text-ivory transition-colors text-xs tracking-wider uppercase flex items-center gap-2"
            >
              Google Cal
            </a>

            {/* Share / Copy Link */}
            <button
              onClick={handleShare}
              className="px-4 py-3 bg-surface-2 border border-token text-ivory-dim hover:text-ivory transition-colors text-xs tracking-wider uppercase flex items-center gap-2"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>

        {/* ── Order Summary Audit Strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-2/40 border border-token p-6 mb-10 text-xs">
          <div>
            <span className="text-ivory-faint uppercase tracking-wider block text-[10px] mb-1">
              Order Identifier
            </span>
            <span className="font-mono text-sm font-bold text-gold block">
              {booking.bookingId}
            </span>
            <span className="text-ivory-dim text-[11px] font-mono mt-0.5 block">
              Conf: {booking.confirmationNumber}
            </span>
          </div>

          <div>
            <span className="text-ivory-faint uppercase tracking-wider block text-[10px] mb-1">
              Total Charged
            </span>
            <span className="font-display text-lg font-bold text-ivory block">
              {formatPrice(booking.totalPaid)}
            </span>
            <span className="text-ivory-dim text-[11px] block">
              Paid via {booking.paymentMethod.toUpperCase()} · Ref {booking.transactionRef}
            </span>
          </div>

          <div>
            <span className="text-ivory-faint uppercase tracking-wider block text-[10px] mb-1">
              Security Protocol
            </span>
            <span className="text-ivory font-medium block">
              SHA-256 Tamper Checksum
            </span>
            <span className="text-ivory-dim text-[11px] block">
              Valid until {new Date(currentTicket.validity.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* ── Footer Navigation ── */}
        <div className="flex justify-between items-center border-t border-token pt-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs text-ivory-dim hover:text-gold transition-colors tracking-wider uppercase"
          >
            <ArrowLeft size={14} /> Back to Showcase
          </Link>

          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 text-xs text-gold hover:underline tracking-wider uppercase"
          >
            View All My Bookings →
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
