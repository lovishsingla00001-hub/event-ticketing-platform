import type { Seat, SeatCategory, SeatStatus } from '../stores/seatStore';

/**
 * Generate a seat layout for a given event.
 * Returns all seats with their positions in the SVG grid.
 *
 * Layout:
 *  - Section VIP (rows A1-A3, 10 seats/row): y starting at 80
 *  - Section Premium (rows B1-B5, 15 seats/row): y starting at 220
 *  - Section Regular (rows C1-C8, 20 seats/row): y starting at 460
 */

export interface SeatPosition extends Seat {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeatLayout {
  seats: SeatPosition[];
  viewBox: string;
  stageY: number;
  sections: {
    label: string;
    category: SeatCategory;
    y: number;
    color: string;
  }[];
}

// Pre-reserved seat IDs for realism (a fixed set per event)
const RESERVED_PATTERN = new Set([
  'A1-3', 'A2-7', 'A3-2', 'A3-8',
  'B1-5', 'B2-10', 'B3-3', 'B3-12', 'B4-7', 'B5-1', 'B5-14',
  'C1-8', 'C1-15', 'C2-4', 'C2-19', 'C3-10', 'C4-2', 'C4-14',
  'C5-7', 'C5-18', 'C6-3', 'C6-11', 'C7-6', 'C7-16', 'C8-9', 'C8-20',
]);

export function generateSeatLayout(prices: { Regular: number; Premium: number; VIP: number }): SeatLayout {
  const seats: SeatPosition[] = [];

  const SEAT_W = 20;
  const SEAT_H = 16;
  const SEAT_GAP_X = 4;
  const SEAT_GAP_Y = 6;

  // Total width: max is Regular section (20 seats)
  // 20 * (20+4) - 4 = 476, + 2 aisles of 20px = 516, + row label = 564
  const TOTAL_W = 620;

  // === VIP Section (rows 1-3, 10 seats) ===
  const VIP_ROWS = 3;
  const VIP_SEATS = 10;
  const vipSectionW = VIP_SEATS * (SEAT_W + SEAT_GAP_X) - SEAT_GAP_X;
  const vipStartX = (TOTAL_W - vipSectionW) / 2;
  const vipStartY = 110;

  for (let row = 1; row <= VIP_ROWS; row++) {
    for (let seatNum = 1; seatNum <= VIP_SEATS; seatNum++) {
      const id = `A${row}-${seatNum}`;
      const x = vipStartX + (seatNum - 1) * (SEAT_W + SEAT_GAP_X);
      const y = vipStartY + (row - 1) * (SEAT_H + SEAT_GAP_Y);
      seats.push({
        id,
        row,
        seatNumber: seatNum,
        category: 'VIP',
        price: prices.VIP,
        x,
        y,
        width: SEAT_W + 2, // VIP seats slightly wider
        height: SEAT_H + 2,
      });
    }
  }

  const vipBottom = vipStartY + VIP_ROWS * (SEAT_H + SEAT_GAP_Y);

  // === Premium Section (rows 1-5, 15 seats) ===
  const PREM_ROWS = 5;
  const PREM_SEATS = 15;
  const premSectionW = PREM_SEATS * (SEAT_W + SEAT_GAP_X) - SEAT_GAP_X;
  const premStartX = (TOTAL_W - premSectionW) / 2;
  const premStartY = vipBottom + 36;

  for (let row = 1; row <= PREM_ROWS; row++) {
    for (let seatNum = 1; seatNum <= PREM_SEATS; seatNum++) {
      const id = `B${row}-${seatNum}`;
      const x = premStartX + (seatNum - 1) * (SEAT_W + SEAT_GAP_X);
      const y = premStartY + (row - 1) * (SEAT_H + SEAT_GAP_Y);
      seats.push({
        id,
        row,
        seatNumber: seatNum,
        category: 'Premium',
        price: prices.Premium,
        x,
        y,
        width: SEAT_W,
        height: SEAT_H,
      });
    }
  }

  const premBottom = premStartY + PREM_ROWS * (SEAT_H + SEAT_GAP_Y);

  // === Regular Section (rows 1-8, 20 seats) ===
  const REG_ROWS = 8;
  const REG_SEATS = 20;
  const regSectionW = REG_SEATS * (SEAT_W + SEAT_GAP_X) - SEAT_GAP_X;
  const regStartX = (TOTAL_W - regSectionW) / 2;
  const regStartY = premBottom + 36;

  // Split into two halves with aisle in middle for Regular
  const AISLE = 24;
  const halfSeats = REG_SEATS / 2; // 10 each side

  for (let row = 1; row <= REG_ROWS; row++) {
    for (let seatNum = 1; seatNum <= REG_SEATS; seatNum++) {
      const id = `C${row}-${seatNum}`;
      // Add aisle gap in middle
      const halfIndex = seatNum <= halfSeats ? seatNum - 1 : seatNum - 1;
      const aisleOffset = seatNum > halfSeats ? AISLE : 0;
      const x = regStartX + halfIndex * (SEAT_W + SEAT_GAP_X) + aisleOffset;
      const y = regStartY + (row - 1) * (SEAT_H + SEAT_GAP_Y);
      seats.push({
        id,
        row,
        seatNumber: seatNum,
        category: 'Regular',
        price: prices.Regular,
        x,
        y,
        width: SEAT_W,
        height: SEAT_H,
      });
    }
  }

  const regBottom = regStartY + REG_ROWS * (SEAT_H + SEAT_GAP_Y);
  const totalHeight = regBottom + 30;

  return {
    seats,
    viewBox: `0 0 ${TOTAL_W} ${totalHeight}`,
    stageY: 30,
    sections: [
      { label: 'VIP', category: 'VIP', y: vipStartY - 20, color: '#c9a84c' },
      { label: 'PREMIUM', category: 'Premium', y: premStartY - 20, color: '#e8c97a' },
      { label: 'REGULAR', category: 'Regular', y: regStartY - 20, color: '#a09888' },
    ],
  };
}

/**
 * Get default status for a seat (ignoring session selection and sold state)
 */
export function getDefaultSeatStatus(seatId: string): SeatStatus {
  if (RESERVED_PATTERN.has(seatId)) return 'reserved';
  return 'available';
}
