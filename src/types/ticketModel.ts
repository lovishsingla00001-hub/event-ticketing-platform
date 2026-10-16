/**
 * ticketModel.ts
 * Upgraded, tamper-evident, privacy-conscious Ticket & Booking Data Models.
 * 
 * Strict separation:
 * - Booking ID (e.g. BK-20261012-7QX4) identifies the entire multi-seat order.
 * - Ticket ID (e.g. TKT-8F3K-2Q9X) uniquely identifies each individual seat pass.
 * - Sensitive contact information is masked on public ticket displays.
 * - Card numbers, CVVs, and payment credentials are NEVER stored or transmitted.
 */

import type { Event } from '../data/events';
import type { Seat, SeatCategory } from '../stores/seatStore';

export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Refunded';
export type TicketStatus = 'valid' | 'used' | 'cancelled';
export type PaymentMethod = 'card' | 'upi' | 'netbanking';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';
export type AttendeeType = 'General' | 'Student' | 'VIP';

export interface AttendeeDetails {
  name: string;
  email: string;
  phone: string;
  attendeeType?: AttendeeType;
}

export interface TicketSeatDetails {
  id: string; // e.g. A1-5
  section: string; // Section A / B / C or VIP / Premium / Regular
  row: number;
  seatNumber: number;
  floorBlock: string; // e.g. "Main Bowl - Lower Tier"
  category: SeatCategory;
}

export interface TicketFeeBreakdown {
  baseSeatPrice: number;
  convenienceFee: number;
  integratedGST: number; // 18% of convenience fee
  facilityFee: number;
  totalForTicket: number;
}

export interface TicketItem {
  ticketId: string; // Unique, e.g. TKT-8F3K-2Q9X
  ticketNumber: number; // 1, 2, ...
  ticketCount: string; // e.g. "Ticket 2 of 4"
  ticketType: string; // e.g. "VIP Pass", "Premium Pass", "General Admission"
  accessLevel: string; // e.g. "All Access + Lounge", "Tier-1 Seated", "Standard"
  seat: TicketSeatDetails;
  price: number; // Base price
  pricing: TicketFeeBreakdown;
  attendeesCovered: 1;
  validity: {
    validFrom: string; // ISO string
    validUntil: string; // ISO string (e.g. 2 hours after event ends)
    entryWindow: string; // e.g. "Doors open 18:00 - Entry until 20:30"
  };
  status: TicketStatus;
  checkedInAt?: string | null;
  securityBackupCode: string; // Short code, e.g. "VS-8F3K"
}

export interface BookingEventSnapshot {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  artist: string;
  organizer: string;
  category: string;
  venue: string;
  fullAddress: string;
  city: string;
  entryGate: string;
  date: string; // ISO string
  day: string; // e.g. "Sunday"
  startTime: string; // e.g. "19:30"
  endTime: string; // e.g. "22:30"
  doorsOpenTime: string; // e.g. "18:00"
  duration: string;
  image: string;
  tagline: string;
}

export interface AttendeeProfile {
  fullName: string;
  email: string;
  phone: string;
  attendeeType: AttendeeType;
  maskedEmail: string; // e.g. l*****@gmail.com
  maskedPhone: string; // e.g. +91 ******3210
}

export interface BookingOrder {
  bookingId: string; // e.g. BK-20261012-7QX4
  confirmationNumber: string; // e.g. CN-9824-VS
  status: BookingStatus;
  bookedAt: string; // ISO string
  platformName: 'VelvetSeat Concierge';
  paymentStatus: 'PAID';
  paymentMethod: PaymentMethod;
  transactionRef: string; // e.g. TXN-4F8K2P91
  currency: 'INR';
  baseAmount: number;
  convenienceFeeTotal: number;
  gstTotal: number;
  facilityFeeTotal: number;
  totalPaid: number;
  event: BookingEventSnapshot;
  attendee: AttendeeProfile;
  tickets: TicketItem[];
  seats?: Seat[];
  total?: number;
}

/**
 * Mask an email address for public-facing tickets.
 * Example: "lovish.sharma@gmail.com" -> "l*****a@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '******@domain.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}*****${local[local.length - 1]}@${domain}`;
}

/**
 * Mask an Indian phone number for public-facing tickets.
 * Example: "9876543210" -> "+91 ******3210"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '+91 **********';
  const last4 = digits.slice(-4);
  return `+91 ******${last4}`;
}
