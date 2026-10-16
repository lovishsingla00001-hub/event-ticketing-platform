import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Seat Types
// ============================================================
export type SeatStatus = 'available' | 'selected' | 'reserved' | 'sold';
export type SeatCategory = 'Regular' | 'Premium' | 'VIP';

export interface Seat {
  id: string;        // e.g. "R1-1" = row 1, seat 1
  row: number;
  seatNumber: number;
  category: SeatCategory;
  price: number;
}

export type SeatMap = Record<string, SeatStatus>; // seatId -> status
export type EventSeatMaps = Record<string, SeatMap>; // eventId -> SeatMap

// ============================================================
// Seat Store
// ============================================================
interface SeatStore {
  // Persisted: which seats are sold per event
  soldSeats: EventSeatMaps;
  // Session: current selection
  selectedSeats: Seat[];
  currentEventId: string | null;
  
  // Actions
  initEvent: (eventId: string, seats?: Seat[]) => void;
  selectSeat: (eventId: string, seat: Seat) => void;
  deselectSeat: (eventId: string, seatId: string) => void;
  clearSelection: () => void;
  commitBooking: (eventId: string, seatIds: string[]) => void;
  releaseBooking: (eventId: string, seatIds: string[]) => void;
  resetEventSeats: (eventId: string) => void;
  getSeatStatus: (eventId: string, seatId: string) => SeatStatus;
  getSelectedTotal: () => number;
}

const MAX_SEATS = 8;

export const useSeatStore = create<SeatStore>()(
  persist(
    (set, get) => ({
      soldSeats: {},
      selectedSeats: [],
      currentEventId: null,

      initEvent: (eventId) => {
        const { currentEventId } = get();
        if (currentEventId === eventId) return;
        set({ currentEventId: eventId, selectedSeats: [] });
      },

      selectSeat: (eventId, seat) => {
        const { selectedSeats, soldSeats, currentEventId } = get();
        if (currentEventId !== eventId) return;
        const sold = soldSeats[eventId] || {};
        if (sold[seat.id] === 'sold') return;
        if (selectedSeats.find((s) => s.id === seat.id)) return;
        if (selectedSeats.length >= MAX_SEATS) return;
        set({ selectedSeats: [...selectedSeats, seat] });
      },

      deselectSeat: (eventId, seatId) => {
        set((state) => ({
          selectedSeats: state.currentEventId === eventId
            ? state.selectedSeats.filter((s) => s.id !== seatId)
            : state.selectedSeats,
        }));
      },

      clearSelection: () => set({ selectedSeats: [] }),

      commitBooking: (eventId, seatIds) => {
        set((state) => {
          const prevSold = state.soldSeats[eventId] || {};
          const newSold = { ...prevSold };
          seatIds.forEach((id) => { newSold[id] = 'sold'; });
          return {
            soldSeats: { ...state.soldSeats, [eventId]: newSold },
            selectedSeats: [],
            currentEventId: null,
          };
        });
      },

      releaseBooking: (eventId, seatIds) => {
        set((state) => {
          const prevSold = state.soldSeats[eventId] || {};
          const newSold = { ...prevSold };
          seatIds.forEach((id) => {
            delete newSold[id];
          });
          return {
            soldSeats: { ...state.soldSeats, [eventId]: newSold },
          };
        });
      },

      resetEventSeats: (eventId) => {
        set((state) => {
          const newSold = { ...state.soldSeats };
          delete newSold[eventId];
          return {
            soldSeats: newSold,
            selectedSeats: state.currentEventId === eventId ? [] : state.selectedSeats,
          };
        });
      },

      getSeatStatus: (eventId, seatId) => {
        const { soldSeats, selectedSeats, currentEventId } = get();
        const sold = soldSeats[eventId] || {};
        if (sold[seatId] === 'sold') return 'sold';
        if (currentEventId === eventId && selectedSeats.find((s) => s.id === seatId)) return 'selected';
        // Pre-reserve some seats for realism
        return 'available';
      },

      getSelectedTotal: () => {
        const { selectedSeats, currentEventId } = get();
        return currentEventId ? selectedSeats.reduce((sum, s) => sum + s.price, 0) : 0;
      },
    }),
    { name: 'velvet-seats' }
  )
);
