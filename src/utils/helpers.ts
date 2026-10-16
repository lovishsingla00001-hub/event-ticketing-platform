import { format, formatDistanceToNow, isPast } from 'date-fns';

/**
 * Format price in Indian Rupees
 */
export const formatPrice = (amount: number): string => {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date string to readable format
 */
export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), 'EEEE, dd MMMM yyyy');
};

/**
 * Format time from date string
 */
export const formatTime = (dateStr: string): string => {
  return format(new Date(dateStr), 'h:mm a');
};

/**
 * Format date + time together
 */
export const formatDateTime = (dateStr: string): string => {
  return format(new Date(dateStr), 'dd MMM yyyy, h:mm a');
};

/**
 * Get relative time (e.g. "in 3 days")
 */
export const getRelativeTime = (dateStr: string): string => {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
};

/**
 * Check if event is in the past
 */
export const isEventPast = (dateStr: string): boolean => {
  return isPast(new Date(dateStr));
};

/**
 * Generate a unique booking ID
 */
export const generateBookingId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'VS';
  const random = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${prefix}-${random}`;
};

/**
 * Generate Google Calendar link
 */
export const generateCalendarLink = (event: {
  title: string;
  date: string;
  venue: string;
  city: string;
  description: string;
}): string => {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3h default

  const formatGCal = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} — VelvetSeat`,
    dates: `${formatGCal(start)}/${formatGCal(end)}`,
    details: event.description,
    location: `${event.venue}, ${event.city}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Truncate text to n characters
 */
export const truncate = (text: string, n: number): string => {
  return text.length > n ? text.slice(0, n) + '…' : text;
};

/**
 * Get category label
 */
export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    concert: 'Concert',
    standup: 'Stand-up Comedy',
    theatre: 'Theatre',
    tech: 'Tech Summit',
    sports: 'Sports',
    literature: 'Literature',
    masterclass: 'Masterclass',
    expo: 'Expo',
  };
  return labels[category] || category;
};

/**
 * Get category color class
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    concert: 'text-gold',
    standup: 'text-amber-400',
    theatre: 'text-burgundy',
    tech: 'text-sky-400',
    sports: 'text-green-400',
    literature: 'text-purple-400',
    masterclass: 'text-rose-400',
    expo: 'text-teal-400',
  };
  return colors[category] || 'text-ivory';
};

/**
 * cn utility — merge class names
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
