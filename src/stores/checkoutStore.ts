import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Seat } from './seatStore';
import type { Event } from '../data/events';
import type {
  BookingOrder,
  TicketItem,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  AttendeeDetails,
} from '../types/ticketModel';
import { maskEmail, maskPhone } from '../types/ticketModel';

export interface CheckoutAttendeeForm {
  name: string;
  email: string;
  phone: string;
  attendeeType?: 'General' | 'Student' | 'VIP';
}

export type { PaymentMethod, AttendeeDetails };

interface CheckoutStore {
  event: Event | null;
  seats: Seat[];
  total: number;
  holdExpiry: string | null; // ISO string
  attendee: CheckoutAttendeeForm;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingId: string | null;

  // Persistent Booking Orders
  bookings: BookingOrder[];

  // Actions
  initCheckout: (event: Event, seats: Seat[]) => void;
  setHoldExpiry: (expiry: string) => void;
  updateAttendee: (details: Partial<CheckoutAttendeeForm>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setBookingId: (id: string) => void;
  addBooking: (booking: BookingOrder) => void;
  cancelBooking: (bookingId: string) => void;
  checkInTicket: (ticketId: string) => { success: boolean; message: string; ticket?: TicketItem };
  removeBooking: (bookingId: string) => void;
  clearCheckout: () => void;
}

/**
 * Generate a random alphabetic + numeric token of given length.
 */
function randomToken(len: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * Helper to construct an immutable BookingOrder from payment checkout state.
 */
export function createBookingFromCheckout(
  event: Event,
  seats: Seat[],
  attendeeForm: CheckoutAttendeeForm,
  paymentMethod: PaymentMethod
): BookingOrder {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const bookingId = `BK-${dateStr}-${randomToken(4)}`;
  const confirmationNumber = `CN-${randomToken(4)}-VS`;
  const transactionRef = `TXN-${randomToken(8)}`;

  const totalSeats = seats.length;
  const baseAmount = seats.reduce((sum, s) => sum + s.price, 0);
  
  // Tax & Fee schedule
  // Convenience fee: 2.5% of base, GST: 18% of convenience fee, Facility fee: flat ₹50 per ticket
  const convenienceFeeTotal = Math.round(baseAmount * 0.025);
  const gstTotal = Math.round(convenienceFeeTotal * 0.18);
  const facilityFeeTotal = totalSeats * 50;
  const totalPaid = baseAmount + convenienceFeeTotal + gstTotal + facilityFeeTotal;

  // Event times parsing
  const eventDate = new Date(event.date);
  const doorsOpenTime = '18:00';
  const startTime = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const eventEndTime = new Date(eventDate.getTime() + 3.5 * 60 * 60 * 1000);
  const endTime = eventEndTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = eventDate.toLocaleDateString('en-IN', { weekday: 'long' });

  const validUntil = new Date(eventEndTime.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const validFrom = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000).toISOString();

  // Create individual tickets for each seat
  const tickets: TicketItem[] = seats.map((seat, index) => {
    const ticketId = `TKT-${randomToken(4)}-${randomToken(4)}`;
    const securityBackupCode = `VS-${ticketId.slice(4, 8)}`;
    
    const seatBase = seat.price;
    const seatConv = Math.round(seatBase * 0.025);
    const seatGst = Math.round(seatConv * 0.18);
    const seatFacility = 50;
    const totalForTicket = seatBase + seatConv + seatGst + seatFacility;

    let ticketType = 'General Admission';
    let accessLevel = 'Standard Tier Admission';
    let floorBlock = 'Main Arena - Level 1';

    if (seat.category === 'VIP') {
      ticketType = 'VIP Club Lounge Pass';
      accessLevel = 'All Access + Dedicated Gold Gate';
      floorBlock = 'Orchestra Pit & Royal Box';
    } else if (seat.category === 'Premium') {
      ticketType = 'Premium Reserved Seat';
      accessLevel = 'Fast-Track Entry + Tier-1 Seating';
      floorBlock = 'Club Level - Center Tier';
    }

    return {
      ticketId,
      ticketNumber: index + 1,
      ticketCount: `Ticket ${index + 1} of ${totalSeats}`,
      ticketType,
      accessLevel,
      seat: {
        id: seat.id,
        section: seat.category === 'VIP' ? 'Section A (VIP)' : seat.category === 'Premium' ? 'Section B (Premium)' : 'Section C (Regular)',
        row: seat.row,
        seatNumber: seat.seatNumber,
        floorBlock,
        category: seat.category,
      },
      price: seatBase,
      pricing: {
        baseSeatPrice: seatBase,
        convenienceFee: seatConv,
        integratedGST: seatGst,
        facilityFee: seatFacility,
        totalForTicket,
      },
      attendeesCovered: 1,
      validity: {
        validFrom,
        validUntil,
        entryWindow: `Doors open ${doorsOpenTime} · Entry until ${endTime}`,
      },
      status: 'valid',
      checkedInAt: null,
      securityBackupCode,
    };
  });

  return {
    bookingId,
    confirmationNumber,
    status: 'Confirmed',
    bookedAt: now.toISOString(),
    platformName: 'VelvetSeat Concierge',
    paymentStatus: 'PAID',
    paymentMethod,
    transactionRef,
    currency: 'INR',
    baseAmount,
    convenienceFeeTotal,
    gstTotal,
    facilityFeeTotal,
    totalPaid,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle || event.artist,
      artist: event.artist,
      organizer: 'VelvetSeat Live Entertainment & Arts Pvt. Ltd.',
      category: event.category,
      venue: event.venue,
      fullAddress: `${event.venue}, Gate 4 Entrance Boulevard, ${event.city}`,
      city: event.city,
      entryGate: 'Gate 2A (North Wing VIP Concierge)',
      date: event.date,
      day: dayName,
      startTime,
      endTime,
      doorsOpenTime,
      duration: event.duration,
      image: event.image,
      tagline: 'Where every seat tells a story.',
    },
    attendee: {
      fullName: attendeeForm.name.trim(),
      email: attendeeForm.email.trim(),
      phone: attendeeForm.phone.trim(),
      attendeeType: attendeeForm.attendeeType || 'General',
      maskedEmail: maskEmail(attendeeForm.email.trim()),
      maskedPhone: maskPhone(attendeeForm.phone.trim()),
    },
    tickets,
    seats,
    total: totalPaid,
  };
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      event: null,
      seats: [],
      total: 0,
      holdExpiry: null,
      attendee: { name: '', email: '', phone: '', attendeeType: 'General' },
      paymentMethod: 'card',
      paymentStatus: 'idle',
      bookingId: null,
      bookings: [],

      initCheckout: (event, seats) => {
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const uniqueSeats = [...new Map(seats.map((seat) => [seat.id, seat])).values()].slice(0, 8);
        const seatTotal = uniqueSeats.reduce((sum, seat) => sum + seat.price, 0);
        set({
          event,
          seats: uniqueSeats,
          total: seatTotal,
          holdExpiry: expiry,
          paymentStatus: 'idle',
          bookingId: null,
        });
      },

      setHoldExpiry: (expiry) => set({ holdExpiry: expiry }),

      updateAttendee: (details) =>
        set((state) => ({ attendee: { ...state.attendee, ...details } })),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setPaymentStatus: (status) => set({ paymentStatus: status }),

      setBookingId: (id) => set({ bookingId: id }),

      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),

      cancelBooking: (bookingId) =>
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.bookingId === bookingId) {
              return {
                ...b,
                status: 'Cancelled',
                tickets: b.tickets.map((t) => ({ ...t, status: 'cancelled' })),
              };
            }
            return b;
          }),
        })),

      checkInTicket: (ticketId) => {
        const { bookings } = get();
        for (const booking of bookings) {
          const tIndex = booking.tickets.findIndex((t) => t.ticketId === ticketId);
          if (tIndex !== -1) {
            const ticket = booking.tickets[tIndex];
            if (booking.status === 'Cancelled' || ticket.status === 'cancelled') {
              return { success: false, message: 'Ticket is CANCELLED and cannot be admitted.', ticket };
            }
            if (ticket.status === 'used') {
              return {
                success: false,
                message: `Ticket was ALREADY CHECKED IN at ${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'earlier'}.`,
                ticket,
              };
            }

            const updatedTicket: TicketItem = {
              ...ticket,
              status: 'used',
              checkedInAt: new Date().toISOString(),
            };

            const updatedTickets = [...booking.tickets];
            updatedTickets[tIndex] = updatedTicket;

            const updatedBookings = bookings.map((b) =>
              b.bookingId === booking.bookingId ? { ...b, tickets: updatedTickets } : b
            );

            set({ bookings: updatedBookings });
            return { success: true, message: 'Check-in successful! Admission granted.', ticket: updatedTicket };
          }
        }
        return { success: false, message: 'Ticket ID not found in local booking archives.' };
      },

      removeBooking: (bookingId) =>
        set((state) => ({
          bookings: state.bookings.filter((b) => b.bookingId !== bookingId),
        })),

      clearCheckout: () =>
        set({
          event: null,
          seats: [],
          total: 0,
          holdExpiry: null,
          attendee: { name: '', email: '', phone: '', attendeeType: 'General' },
          paymentStatus: 'idle',
          bookingId: null,
        }),
    }),
    {
      name: 'velvet-checkout',
      partialize: (state) => ({
        bookings: state.bookings,
        event: state.event,
        seats: state.seats,
        total: state.total,
        holdExpiry: state.holdExpiry,
        attendee: state.attendee,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);
