/**
 * ticketPdfGenerator.ts
 * Generates ultra high-fidelity, razor-sharp 3x rasterized PDF tickets using jsPDF and html2canvas.
 *
 * Key Capabilities:
 * - Single ticket download: EventName_Seat-A12_TKT-8F3K-2Q9X.pdf
 * - Multi-ticket download: EventName_AllTickets_BK-XXXX.pdf (one ticket per landscape page)
 * - PNG ticket download
 * - Pre-loads fonts & embeds images with crossOrigin bypass to guarantee clean capture
 * - Special character sanitation for file naming
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Sanitize filename strings by stripping special characters.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
}

/**
 * Capture a target HTML element as an HTMLCanvasElement at 3x scale.
 */
async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Wait for web fonts if document.fonts is supported
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }

  return await html2canvas(element, {
    scale: 3, // 3x scale ensures ultra-sharp typography and crisp QR codes
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });
}

/**
 * Download a single ticket as PDF.
 */
export async function downloadSingleTicketPdf(
  element: HTMLElement,
  eventName: string,
  seatId: string,
  ticketId: string
): Promise<void> {
  const canvas = await captureElementToCanvas(element);
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // A4 Landscape orientation: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  // Fit image into A4 page with 10mm margins
  const marginX = 10;
  const marginY = 12;
  const targetW = pdfWidth - marginX * 2;
  const targetH = (canvas.height * targetW) / canvas.width;
  const finalH = Math.min(targetH, pdfHeight - marginY * 2);

  pdf.addImage(imgData, 'JPEG', marginX, marginY, targetW, finalH, undefined, 'FAST');

  const safeEvent = sanitizeFileName(eventName);
  const safeSeat = sanitizeFileName(seatId);
  const safeTicket = sanitizeFileName(ticketId);
  const fileName = `${safeEvent}_Seat-${safeSeat}_${safeTicket}.pdf`;

  pdf.save(fileName);
}

/**
 * Download all tickets in a booking as ONE multi-page PDF.
 */
export async function downloadAllTicketsPdf(
  elements: HTMLElement[],
  eventName: string,
  bookingId: string
): Promise<void> {
  if (elements.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 297;
  const pdfHeight = 210;
  const marginX = 10;
  const marginY = 12;
  const targetW = pdfWidth - marginX * 2;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const canvas = await captureElementToCanvas(el);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    const targetH = (canvas.height * targetW) / canvas.width;
    const finalH = Math.min(targetH, pdfHeight - marginY * 2);

    pdf.addImage(imgData, 'JPEG', marginX, marginY, targetW, finalH, undefined, 'FAST');
  }

  const safeEvent = sanitizeFileName(eventName);
  const safeBooking = sanitizeFileName(bookingId);
  const fileName = `${safeEvent}_AllTickets_${safeBooking}.pdf`;

  pdf.save(fileName);
}

/**
 * Download ticket preview as PNG image.
 */
export async function downloadTicketPng(
  element: HTMLElement,
  eventName: string,
  seatId: string,
  ticketId: string
): Promise<void> {
  const canvas = await captureElementToCanvas(element);
  const imgUrl = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  const safeEvent = sanitizeFileName(eventName);
  const safeSeat = sanitizeFileName(seatId);
  const safeTicket = sanitizeFileName(ticketId);
  link.download = `${safeEvent}_Seat-${safeSeat}_${safeTicket}.png`;
  link.href = imgUrl;
  link.click();
}

/**
 * Generate and download an iCalendar (.ics) file for offline calendar import.
 */
export function downloadCalendarIcs(event: {
  title: string;
  description: string;
  venue: string;
  city: string;
  date: string;
  bookingId: string;
}): void {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 3.5 * 60 * 60 * 1000);

  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VelvetSeat Concierge//Event Ticketing//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:velvetseat-${event.bookingId}@velvetseat.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.title} — VelvetSeat Pass`,
    `DESCRIPTION:${event.description.replace(/\n/g, ' ')} (Booking ID: ${event.bookingId})`,
    `LOCATION:${event.venue}, ${event.city}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(event.title)}_VelvetSeat.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
