import { formatBookingDateLabel } from './booking-status';

type BookingWhatsAppMessageParams = {
  isOwnerBooking: boolean;
  venueName: string;
  bookingDate: string;
  startTimeLabel: string;
  endTimeLabel: string;
  totalHours: number;
  playerName: string;
  playerPhone: string;
  playerEmail: string;
  totalPrice: number;
  notes?: string | null;
};

export function sanitizeWhatsAppMessage(message: string): string {
  return message
    .replace(/\uFE0F/g, '')
    .replace(/\uFE0E/g, '')
    .replace(/[\u2500-\u257F]/g, '-');
}

function formatDuration(hours: number): string {
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

function buildDetailsBlock(
  bookingDate: string,
  startTimeLabel: string,
  endTimeLabel: string,
  totalHours: number,
  totalPrice: number,
  notes?: string | null
): string {
  return (
    `📅 *Date:* ${formatBookingDateLabel(bookingDate)}\n` +
    `⏰ *Time:* ${startTimeLabel} - ${endTimeLabel}\n` +
    `*Duration:* ${formatDuration(totalHours)}\n\n` +
    `💰 *Total Amount:* PKR ${totalPrice.toLocaleString()}` +
    `${notes?.trim() ? `\n\n📝 *Notes:*\n${notes.trim()}` : ''}`
  );
}

const FOOTER = `\n\n-----------------\n⭐ *PakPlay*\nwww.pakplay.co`;

export function buildBookingWhatsAppMessage({
  isOwnerBooking,
  venueName,
  bookingDate,
  startTimeLabel,
  endTimeLabel,
  totalHours,
  playerName,
  playerPhone,
  playerEmail,
  totalPrice,
  notes,
}: BookingWhatsAppMessageParams): string {
  const detailsBlock = buildDetailsBlock(
    bookingDate,
    startTimeLabel,
    endTimeLabel,
    totalHours,
    totalPrice,
    notes
  );

  const message = isOwnerBooking
    ? `🎾 *Booking Confirmation* 🎾\n\n` +
      `Hi ${playerName},\n\n` +
      `Your booking at *${venueName}* has been confirmed.\n\n` +
      detailsBlock +
      FOOTER
    : `🎾 *PakPlay Booking Request* 🎾\n\n` +
      `📍 *Venue:* ${venueName}\n` +
      detailsBlock +
      `\n\n👤 *Customer Details:*\n` +
      `Name: ${playerName}\n` +
      `Phone: ${playerPhone}\n` +
      `Email: ${playerEmail}` +
      FOOTER;

  return sanitizeWhatsAppMessage(message);
}

export function getBookingWhatsAppTarget(
  isOwnerBooking: boolean,
  playerPhone: string,
  venueWhatsAppNumber: string
): string {
  return isOwnerBooking ? playerPhone : venueWhatsAppNumber;
}

export function formatWhatsAppNumber(phoneNumber: string): string {
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '92' + cleanNumber.substring(1);
  }
  if (!cleanNumber.startsWith('92')) {
    cleanNumber = '92' + cleanNumber;
  }
  return cleanNumber;
}
