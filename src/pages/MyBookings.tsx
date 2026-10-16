import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, ArrowRight, Trash2 } from 'lucide-react';
import { useCheckoutStore } from '../stores/checkoutStore';
import { useSeatStore } from '../stores/seatStore';
import { useToastStore } from '../stores/uiStore';
import { formatPrice, formatDate } from '../utils/helpers';
import PageTransition from '../components/layout/PageTransition';
import EmptyState from '../components/ui/EmptyState';

export default function MyBookings() {
  const { bookings, cancelBooking, removeBooking } = useCheckoutStore();
  const { releaseBooking } = useSeatStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCancelBooking = (booking: any) => {
    const seatIds = booking.tickets
      ? booking.tickets.map((t: any) => t.seat.id)
      : booking.seats.map((s: any) => s.id);

    releaseBooking(booking.event.id, seatIds);
    cancelBooking(booking.bookingId);
    addToast(
      `Booking ${booking.bookingId} marked Cancelled. Seats (${seatIds.join(', ')}) released back to inventory.`,
      'info'
    );
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-token pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">
              Archived Passes
            </span>
            <h1 className="text-3xl md:text-5xl font-display mt-2">
              My Bookings
            </h1>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-ivory-dim">
            Total Passes:{' '}
            <span className="text-gold font-mono font-medium">{bookings.length}</span>
          </div>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Ticket className="w-12 h-12" />}
            title="No passes reserved yet"
            description="Your personal ticket vault is currently empty. Explore upcoming concerts, theatre galas, and summits to secure your premiere seats."
            action={{
              label: 'Discover Events',
              onClick: () => {
                window.location.href = '/events';
              },
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {bookings.map((booking, index) => {
              const { event, bookingId } = booking;
              const seats = booking.seats || booking.tickets?.map((t) => t.seat) || [];
              const total = booking.total ?? booking.totalPaid ?? 0;
              return (
                <motion.div
                  key={bookingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface border border-token hover:border-gold-dim transition-all group overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span
                          className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 border inline-block mb-2 ${
                            booking.status === 'Confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {booking.status}
                        </span>
                        <h2 className="text-xl md:text-2xl font-display font-medium text-ivory group-hover:text-gold-light transition-colors">
                          {event.title}
                        </h2>
                        <p className="text-xs text-ivory-dim mt-0.5">{event.artist}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-ivory-faint block uppercase font-mono">
                          ID
                        </span>
                        <span className="text-xs font-mono font-bold text-gold">
                          {bookingId}
                        </span>
                        {booking.tickets && (
                          <span className="text-[10px] text-ivory-dim block mt-0.5 font-mono">
                            {booking.tickets.length} {booking.tickets.length === 1 ? 'ticket' : 'tickets'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-token my-4 text-xs">
                      <div>
                        <div className="text-[10px] text-ivory-faint uppercase flex items-center gap-1 mb-0.5">
                          <Calendar className="w-3 h-3 text-gold" /> Date
                        </div>
                        <div className="text-ivory font-medium">{formatDate(event.date)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-ivory-faint uppercase flex items-center gap-1 mb-0.5">
                          <MapPin className="w-3 h-3 text-gold" /> Venue
                        </div>
                        <div className="text-ivory font-medium truncate">{event.venue}</div>
                        <div className="text-[10px] text-ivory-dim">{event.city}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-ivory-faint uppercase tracking-wider mb-2">
                        Allocated Seats ({seats.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {seats.map((seat) => (
                          <span
                            key={seat.id}
                            className="px-2 py-0.5 bg-surface-2 text-[11px] font-mono text-ivory border border-token"
                          >
                            {seat.id} <span className="text-[9px] text-gold uppercase">({seat.category})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-surface-2/60 border-t border-token flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-ivory-faint uppercase block">Total</span>
                      <span className="text-base font-display font-semibold text-gold">
                        {formatPrice(total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        title="Cancel reservation and release seats"
                        className="p-2 bg-surface border border-token hover:border-red-500 hover:text-red-400 text-ivory-dim transition-colors text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Cancel</span>
                      </button>
                      <Link
                        to={`/events/${event.slug}`}
                        className="text-xs text-ivory-dim hover:text-ivory transition-colors flex items-center gap-1"
                      >
                        Event Info
                      </Link>
                      <Link
                        to={`/confirmation/${bookingId}`}
                        className="px-4 py-2 bg-surface border border-token text-xs font-medium uppercase tracking-wider text-gold hover:border-gold transition-colors flex items-center gap-1.5"
                      >
                        Pass & QR <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
