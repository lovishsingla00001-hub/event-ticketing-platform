import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Keyboard,
  KeyRound,
  Download,
  Search,
  RefreshCw,
  Ticket,
  Calendar,
  User,
  MapPin,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useCheckoutStore } from '../stores/checkoutStore';
import { useToastStore } from '../stores/uiStore';
import { decodeAndVerifyQRPayload, type QRPayload } from '../utils/ticketSecurity';
import { formatPrice } from '../utils/helpers';
import PageTransition from '../components/layout/PageTransition';
import type { BookingOrder, TicketItem } from '../types/ticketModel';

// Demo passcode from environment or default demo code
const DEMO_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'velvet2026';

type VerificationState =
  | 'idle'
  | 'valid'
  | 'already_used'
  | 'tampered'
  | 'not_found_local'
  | 'cancelled'
  | 'not_yet_valid'
  | 'expired';

export default function AdminVerify() {
  const [searchParams] = useSearchParams();
  const { bookings, checkInTicket } = useCheckoutStore();
  const { addToast } = useToastStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('velvet_admin_auth') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Scanner Mode: 'camera' | 'upload' | 'manual'
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Verification Results
  const [verifying, setVerifying] = useState(false);
  const [resultState, setResultState] = useState<VerificationState>('idle');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [decodedPayload, setDecodedPayload] = useState<QRPayload | null>(null);
  const [matchedBooking, setMatchedBooking] = useState<BookingOrder | null>(null);
  const [matchedTicket, setMatchedTicket] = useState<TicketItem | null>(null);

  // Search & Filter for Dashboard Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'used' | 'cancelled'>('all');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'admin-qr-reader-region';

  // Handle URL parameter auto-verification (?d=...)
  useEffect(() => {
    const dParam = searchParams.get('d');
    if (dParam && isAuthenticated) {
      handleVerifyInput(dParam);
    }
  }, [searchParams, isAuthenticated]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === DEMO_PASSCODE) {
      sessionStorage.setItem('velvet_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError(false);
      addToast('Admin entrance scanner unlocked.', 'success');
    } else {
      setAuthError(true);
      addToast('Incorrect passcode. Use default: velvet2026', 'error');
    }
  };

  const handleLogout = () => {
    stopCameraScanner();
    sessionStorage.removeItem('velvet_admin_auth');
    setIsAuthenticated(false);
  };

  // ── Camera Scanner Handlers ──
  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device. Please use Image Upload or Manual Input.');
        return;
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleVerifyInput(decodedText);
          stopCameraScanner();
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization issue:', err);
      setCameraError(
        'Unable to access camera. Please grant camera permission or use the File Upload / Manual Code tab.'
      );
      setCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // scanner stopped
      }
    }
    setCameraActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifying(true);
    try {
      const qrScanner = new Html5Qrcode('qr-temp-file-reader');
      const text = await qrScanner.scanFile(file, true);
      handleVerifyInput(text);
      qrScanner.clear();
    } catch (err) {
      setResultState('tampered');
      setResultMessage('Could not detect a valid QR code in the uploaded image.');
      addToast('No QR code found in uploaded image.', 'error');
    } finally {
      setVerifying(false);
      e.target.value = '';
    }
  };

  // ── Core Verification Routine ──
  const handleVerifyInput = async (rawInput: string) => {
    setVerifying(true);
    setResultState('idle');
    setDecodedPayload(null);
    setMatchedBooking(null);
    setMatchedTicket(null);

    const trimmed = rawInput.trim();

    // 1. Try decoding as QR link/base64 payload
    const decoded = await decodeAndVerifyQRPayload(trimmed);

    let ticketIdToLookup = '';
    let isChecksumTampered = false;

    if (decoded.validFormat && decoded.payload) {
      setDecodedPayload(decoded.payload);
      ticketIdToLookup = decoded.payload.tid;
      isChecksumTampered = decoded.tampered;
    } else {
      // Might be a manual ticket ID or backup code input
      ticketIdToLookup = trimmed.toUpperCase();
    }

    if (isChecksumTampered) {
      setResultState('tampered');
      setResultMessage('Security Checksum Mismatch: QR payload has been altered or forged.');
      setVerifying(false);
      return;
    }

    // 2. Lookup in Local Records
    let foundBooking: BookingOrder | null = null;
    let foundTicket: TicketItem | null = null;

    for (const b of bookings) {
      for (const t of b.tickets) {
        if (
          t.ticketId.toUpperCase() === ticketIdToLookup ||
          t.securityBackupCode.toUpperCase() === ticketIdToLookup ||
          (decoded.payload && t.ticketId === decoded.payload.tid)
        ) {
          foundBooking = b;
          foundTicket = t;
          break;
        }
      }
      if (foundTicket) break;
    }

    setMatchedBooking(foundBooking);
    setMatchedTicket(foundTicket);

    // 3. Analyze Ticket State
    if (!foundTicket) {
      if (decoded.payload) {
        // Payload was validly decoded & checksum passed, but order not on this device
        setResultState('not_found_local');
        setResultMessage(
          'Payload format and checksum are valid, but this order is not stored in this browser’s localStorage.'
        );
      } else {
        setResultState('tampered');
        setResultMessage('Ticket identifier not recognized.');
      }
      setVerifying(false);
      return;
    }

    // Found in local records — check status & validity window
    if (foundBooking?.status === 'Cancelled' || foundTicket.status === 'cancelled') {
      setResultState('cancelled');
      setResultMessage('This booking has been CANCELLED and is not eligible for entry.');
      setVerifying(false);
      return;
    }

    if (foundTicket.status === 'used') {
      setResultState('already_used');
      const timeStr = foundTicket.checkedInAt ? new Date(foundTicket.checkedInAt).toLocaleTimeString() : '';
      setResultMessage(`Ticket was ALREADY CHECKED IN at ${timeStr}. Duplicate entry rejected.`);
      setVerifying(false);
      return;
    }

    // Check entry validity window
    const nowMs = Date.now();
    const validFromMs = Date.parse(foundTicket.validity.validFrom);
    const validUntilMs = Date.parse(foundTicket.validity.validUntil);

    if (validUntilMs && nowMs > validUntilMs) {
      setResultState('expired');
      setResultMessage('This ticket has EXPIRED past its authorized validity window.');
      setVerifying(false);
      return;
    }

    if (validFromMs && nowMs < validFromMs) {
      setResultState('not_yet_valid');
      setResultMessage('Entry window has not opened yet for this event.');
      setVerifying(false);
      return;
    }

    // ALL CHECKS PASSED: Ticket is 100% VALID
    setResultState('valid');
    setResultMessage('Admission Pass is VALID and ready for check-in.');
    setVerifying(false);
  };

  // ── Admin Check-in Action ──
  const handleCheckInCurrent = () => {
    if (!matchedTicket) return;
    const res = checkInTicket(matchedTicket.ticketId);
    if (res.success) {
      setResultState('already_used');
      setResultMessage(`Check-in recorded at ${new Date().toLocaleTimeString()}.`);
      if (res.ticket) setMatchedTicket(res.ticket);
      addToast(`Seat ${matchedTicket.seat.id} checked in successfully!`, 'success');
    } else {
      addToast(res.message, 'error');
    }
  };

  // ── CSV Export ──
  const exportTicketsCsv = () => {
    const allTicketsList = bookings.flatMap((b) =>
      b.tickets.map((t) => ({
        bookingId: b.bookingId,
        ticketId: t.ticketId,
        event: b.event.title,
        seat: t.seat.id,
        category: t.seat.category,
        attendee: b.attendee.fullName,
        status: t.status,
        checkedInAt: t.checkedInAt || '',
        price: t.pricing.totalForTicket,
      }))
    );

    if (allTicketsList.length === 0) {
      addToast('No tickets available to export.', 'warning');
      return;
    }

    const headers = ['Booking ID', 'Ticket ID', 'Event', 'Seat', 'Category', 'Attendee', 'Status', 'Checked In At', 'Total INR'];
    const rows = allTicketsList.map((t) => [
      t.bookingId,
      t.ticketId,
      `"${t.event.replace(/"/g, '""')}"`,
      t.seat,
      t.category,
      `"${t.attendee.replace(/"/g, '""')}"`,
      t.status.toUpperCase(),
      t.checkedInAt,
      t.price,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VelvetSeat_Tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Tickets summary exported as CSV.', 'success');
  };

  // Compute dashboard metrics
  const allTickets = bookings.flatMap((b) => b.tickets);
  const totalSold = allTickets.length;
  const totalCheckedIn = allTickets.filter((t) => t.status === 'used').length;
  const totalRemaining = allTickets.filter((t) => t.status === 'valid').length;

  // Filtered tickets table
  const filteredTickets = bookings.flatMap((b) =>
    b.tickets
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.ticketId.toLowerCase().includes(q) ||
          b.bookingId.toLowerCase().includes(q) ||
          t.seat.id.toLowerCase().includes(q) ||
          b.attendee.fullName.toLowerCase().includes(q) ||
          b.event.title.toLowerCase().includes(q)
        );
      })
      .map((t) => ({ ticket: t, booking: b }))
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: Passcode gate if not authenticated
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-[75vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-surface border border-token p-8 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full border border-gold-dim flex items-center justify-center mx-auto mb-4 bg-surface-2 text-gold">
              <KeyRound size={22} />
            </div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-bold block text-center">
              Venue Admission Portal
            </span>
            <h1 className="text-2xl font-display text-center text-ivory mt-1 mb-2 font-semibold">
              Admin Ticket Scanner
            </h1>
            <p className="text-xs text-ivory-dim text-center mb-6 leading-relaxed">
              Restricted area for turnstile attendants and door coordinators.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ivory-dim block mb-1">
                  Access Passcode
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter demo passcode"
                  className={`w-full px-3 py-2.5 bg-surface-2 border text-sm font-mono text-ivory outline-none transition-colors ${
                    authError ? 'border-red-500' : 'border-token focus:border-gold'
                  }`}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gold text-[#0a0806] font-bold text-xs tracking-wider uppercase hover:bg-[#d4af37] transition-colors"
              >
                Unlock Scanner
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-ivory-faint font-mono">
                  Demo Passcode: <strong className="text-gold">velvet2026</strong>
                </span>
              </div>
            </form>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Full Scanner & Admission Portal
  // ─────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-14">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-token pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-bold">
                VelvetSeat Access Control
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono uppercase">
                Turnstile Active
              </span>
            </div>
            <h1 className="text-3xl font-display text-ivory font-semibold mt-1">
              Entrance Scanner & Verifier
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportTicketsCsv}
              className="px-3.5 py-2 bg-surface-2 border border-token text-ivory-dim hover:text-ivory transition-colors text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 border border-token text-xs text-red-400 hover:border-red-500 transition-colors uppercase tracking-wider"
            >
              Lock Scanner
            </button>
          </div>
        </div>

        {/* ── Real-Time Metrics Strip ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-token p-4">
            <span className="text-[10px] text-ivory-faint uppercase tracking-wider block mb-1">
              Total Tickets Sold
            </span>
            <span className="text-2xl font-display font-bold text-ivory">
              {totalSold}
            </span>
          </div>
          <div className="bg-surface border border-token p-4">
            <span className="text-[10px] text-ivory-faint uppercase tracking-wider block mb-1">
              Checked In (Admitted)
            </span>
            <span className="text-2xl font-display font-bold text-emerald-400">
              {totalCheckedIn}
            </span>
          </div>
          <div className="bg-surface border border-token p-4">
            <span className="text-[10px] text-ivory-faint uppercase tracking-wider block mb-1">
              Remaining at Gate
            </span>
            <span className="text-2xl font-display font-bold text-gold">
              {totalRemaining}
            </span>
          </div>
        </div>

        {/* ── Main Scanner Area (Split Grid) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Scanner Controls (5 cols) */}
          <div className="lg:col-span-5 bg-surface border border-token p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-token pb-3">
                <button
                  onClick={() => {
                    setScanMode('camera');
                    startCameraScanner();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border ${
                    scanMode === 'camera'
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-token text-ivory-dim hover:text-ivory'
                  }`}
                >
                  <Camera size={13} /> Camera
                </button>
                <button
                  onClick={() => {
                    setScanMode('upload');
                    stopCameraScanner();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border ${
                    scanMode === 'upload'
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-token text-ivory-dim hover:text-ivory'
                  }`}
                >
                  <Upload size={13} /> Image
                </button>
                <button
                  onClick={() => {
                    setScanMode('manual');
                    stopCameraScanner();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border ${
                    scanMode === 'manual'
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-token text-ivory-dim hover:text-ivory'
                  }`}
                >
                  <Keyboard size={13} /> Manual
                </button>
              </div>

              {/* Camera Scanner View */}
              {scanMode === 'camera' && (
                <div className="space-y-4">
                  <div
                    id={scannerContainerId}
                    className="w-full min-h-[260px] bg-black border border-token flex items-center justify-center overflow-hidden relative"
                  >
                    {!cameraActive && (
                      <div className="text-center p-6">
                        <Camera size={36} className="mx-auto mb-2 text-ivory-faint" />
                        <p className="text-xs text-ivory-dim mb-4">
                          Camera feed is idle. Start scanner to activate optical lens.
                        </p>
                        <button
                          onClick={startCameraScanner}
                          className="px-4 py-2 bg-gold text-[#0a0806] font-bold text-xs uppercase tracking-wider"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {cameraError}
                    </div>
                  )}

                  {cameraActive && (
                    <button
                      onClick={stopCameraScanner}
                      className="w-full py-2 bg-surface-2 border border-token text-ivory-dim text-xs uppercase tracking-wider hover:text-ivory"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>
              )}

              {/* Upload QR Image View */}
              {scanMode === 'upload' && (
                <div className="p-8 border-2 border-dashed border-token text-center">
                  <Upload size={32} className="mx-auto mb-2 text-gold" />
                  <p className="text-xs text-ivory mb-2 font-medium">
                    Select Ticket QR Screenshot or Photo
                  </p>
                  <p className="text-[11px] text-ivory-dim mb-4">
                    Supports PNG, JPG, WebP digital pass snapshots
                  </p>
                  <label className="inline-block px-5 py-2.5 bg-surface-2 border border-token text-gold hover:border-gold cursor-pointer text-xs uppercase tracking-wider font-semibold">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <div id="qr-temp-file-reader" className="hidden" />
                </div>
              )}

              {/* Manual Input View */}
              {scanMode === 'manual' && (
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-dim block">
                    Enter Ticket ID or Backup Code
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. TKT-XXXX-XXXX or VS-XXXX"
                    className="w-full px-3 py-2.5 bg-surface-2 border border-token text-sm font-mono text-ivory uppercase outline-none focus:border-gold"
                  />
                  <button
                    onClick={() => handleVerifyInput(manualCode)}
                    disabled={!manualCode.trim() || verifying}
                    className="w-full py-2.5 bg-gold text-[#0a0806] font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37] disabled:opacity-40"
                  >
                    Lookup Pass
                  </button>
                </div>
              )}
            </div>

            {/* Note on Architecture & Cross-Device Limitation */}
            <div className="mt-6 pt-4 border-t border-token text-[11px] text-ivory-dim leading-relaxed flex items-start gap-2">
              <HelpCircle size={14} className="text-gold shrink-0 mt-0.5" />
              <span>
                <strong>Device Isolation Note:</strong> As a client-only architecture, booking databases reside in this browser’s <code className="text-gold">localStorage</code>. Scanning a QR on another physical device will decode the ticket and verify its SHA-256 checksum, reporting <em>Not Found in Local Records</em>.
              </span>
            </div>
          </div>

          {/* Verification Result Card (7 cols) */}
          <div className="lg:col-span-7 bg-surface border border-token p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-faint block mb-2 font-mono">
                Verification Outcome
              </span>

              {/* Result State Indicator */}
              {resultState === 'idle' && (
                <div className="py-16 text-center border border-token/60 bg-surface-2/30">
                  <ShieldCheck size={42} className="mx-auto mb-2 text-ivory-faint opacity-40" />
                  <p className="text-sm font-display text-ivory-dim">
                    Ready to scan next ticket pass
                  </p>
                  <p className="text-xs text-ivory-faint mt-1">
                    Point camera at pass QR code or enter ticket backup code
                  </p>
                </div>
              )}

              {resultState !== 'idle' && (
                <div
                  className={`p-5 mb-6 border ${
                    resultState === 'valid'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : resultState === 'already_used'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : resultState === 'not_found_local'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                      : 'bg-red-500/10 border-red-500/40 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {resultState === 'valid' && <CheckCircle2 size={24} />}
                    {resultState === 'already_used' && <Clock size={24} />}
                    {resultState === 'not_found_local' && <AlertTriangle size={24} />}
                    {(resultState === 'tampered' || resultState === 'cancelled' || resultState === 'expired') && (
                      <XCircle size={24} />
                    )}
                    <h2 className="text-lg font-display font-bold uppercase tracking-wider">
                      {resultState === 'valid' && 'VALID PASS — ENTRY APPROVED'}
                      {resultState === 'already_used' && 'ALREADY CHECKED IN'}
                      {resultState === 'not_found_local' && 'VALID QR · NOT IN LOCAL STORE'}
                      {resultState === 'tampered' && 'INVALID / FORGED PAYLOAD'}
                      {resultState === 'cancelled' && 'CANCELLED BOOKING'}
                      {resultState === 'expired' && 'EXPIRED PASS'}
                      {resultState === 'not_yet_valid' && 'DOORS NOT OPEN YET'}
                    </h2>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{resultMessage}</p>
                </div>
              )}

              {/* Scanned Ticket Inspection Card */}
              {(matchedTicket || decodedPayload) && (
                <div className="bg-surface-2/60 border border-token p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-start border-b border-token pb-3">
                    <div>
                      <span className="text-[10px] text-ivory-faint uppercase block font-mono">
                        Event
                      </span>
                      <span className="text-sm font-display font-semibold text-ivory">
                        {matchedBooking?.event.title || 'Event Record in QR'}
                      </span>
                      <span className="text-xs text-gold block">
                        {matchedBooking?.event.venue || 'Venue verified'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-ivory-faint uppercase block font-mono">
                        Seat Callout
                      </span>
                      <span className="text-xl font-mono font-black text-ivory">
                        {matchedTicket?.seat.id || decodedPayload?.seat}
                      </span>
                      <span className="text-[10px] text-gold uppercase block">
                        {matchedTicket?.seat.category || decodedPayload?.sec}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-ivory-faint uppercase block">Attendee</span>
                      <span className="font-semibold text-ivory">
                        {matchedBooking?.attendee.fullName || 'Guest Pass'}
                      </span>
                      <span className="text-[11px] text-ivory-dim font-mono block">
                        {matchedBooking?.attendee.maskedEmail || ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-ivory-faint uppercase block">Security Identifiers</span>
                      <span className="font-mono text-[11px] text-ivory block">
                        Ticket: {matchedTicket?.ticketId || decodedPayload?.tid}
                      </span>
                      <span className="font-mono text-[11px] text-ivory-dim block">
                        Order: {matchedBooking?.bookingId || decodedPayload?.bid}
                      </span>
                    </div>
                  </div>

                  {matchedTicket?.checkedInAt && (
                    <div className="pt-2 border-t border-token text-[11px] text-amber-400 font-mono">
                      First Checked In At: {new Date(matchedTicket.checkedInAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Check-In Action Button */}
            {resultState === 'valid' && (
              <div className="mt-6 pt-4 border-t border-token">
                <button
                  onClick={handleCheckInCurrent}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Authorize & Check In Passenger
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── All Tickets Audit Table ── */}
        <div className="bg-surface border border-token p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-token pb-4 mb-4">
            <div>
              <h2 className="text-base font-display font-semibold text-ivory">
                Turnstile Audit Manifest
              </h2>
              <p className="text-xs text-ivory-dim">
                Real-time registry of all tickets booked on this instance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-ivory-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter ticket, seat, name…"
                  className="pl-8 pr-3 py-1.5 bg-surface-2 border border-token text-xs text-ivory outline-none focus:border-gold w-44"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-surface-2 border border-token text-xs text-ivory outline-none"
              >
                <option value="all">All States</option>
                <option value="valid">Valid Only</option>
                <option value="used">Used Only</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-ivory-faint">
              No matching tickets found in local database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-token text-ivory-faint font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Seat</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-token/60 font-mono">
                  {filteredTickets.map(({ ticket, booking }) => (
                    <tr key={ticket.ticketId} className="hover:bg-surface-2/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-gold">
                        {ticket.ticketId}
                      </td>
                      <td className="py-2.5 px-3 text-ivory font-bold">
                        {ticket.seat.id} <span className="text-[10px] text-ivory-dim font-sans">({ticket.seat.category})</span>
                      </td>
                      <td className="py-2.5 px-3 text-ivory font-sans max-w-[160px] truncate">
                        {booking.event.title}
                      </td>
                      <td className="py-2.5 px-3 text-ivory font-sans">
                        {booking.attendee.fullName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${
                            ticket.status === 'valid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ticket.status === 'used'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleVerifyInput(ticket.ticketId)}
                          className="px-2 py-1 bg-surface-2 border border-token hover:border-gold text-[10px] uppercase font-sans text-ivory"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
