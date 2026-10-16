/**
 * ticketSecurity.ts
 * Browser-native Web Crypto SHA-256 Checksum generation and validation for VelvetSeat tickets.
 * 
 * QR Code Payload Architecture:
 * - Version: 1
 * - Compact base64url JSON containing only non-sensitive ticket verification tokens
 * - No plain-text phone numbers, full emails, or payment data
 * - 10-character truncated SHA-256 integrity checksum using client-side salt
 * 
 * NOTE ON SECURITY LIMITATIONS (Frontend-only environment):
 * In a pure frontend SPA without a backend server, the app-level salt resides in client code.
 * Therefore, this checksum prevents accidental typos, transcription faults, and casual client payload
 * tampering, but is not cryptographic unforgeability against a sophisticated actor inspecting JS sources.
 * Production systems require asymmetric public-key signatures (e.g. Ed25519) issued by a secure server.
 */

export interface QRPayload {
  v: number; // 1
  tid: string; // ticketId
  bid: string; // bookingId
  eid: string; // eventId
  seat: string; // e.g. "A1-5"
  sec: string; // Section e.g. "VIP"
  exp: string; // ISO validUntil
  iat: string; // ISO issuedAt
  chk: string; // 10-char checksum
}

const APP_SALT = 'VELVET_SEAT_VERIFY_SALT_2026_STAGE_PASS';

/**
 * Generate a deterministic 10-character SHA-256 checksum over the verification parameters.
 */
export async function generateTicketChecksum(
  ticketId: string,
  bookingId: string,
  eventId: string,
  seatId: string,
  validUntil: string,
  issuedAt: string
): Promise<string> {
  const message = `${ticketId}|${bookingId}|${eventId}|${seatId}|${validUntil}|${issuedAt}|${APP_SALT}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 10).toUpperCase();
  }
  
  // Fallback for non-subtle contexts (e.g. older testing runtimes)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash + message.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(10, '0').slice(0, 10).toUpperCase();
}

/**
 * Base64URL encode a Unicode string.
 */
function toBase64Url(str: string): string {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode a string to Unicode.
 */
function fromBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decoded = atob(base64);
  return decodeURIComponent(
    decoded
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Build the full verification URL embedded in the QR Code.
 */
export async function createTicketQRLink(
  origin: string,
  ticketId: string,
  bookingId: string,
  eventId: string,
  seatId: string,
  section: string,
  validUntil: string,
  issuedAt: string
): Promise<{ url: string; payload: QRPayload }> {
  const chk = await generateTicketChecksum(ticketId, bookingId, eventId, seatId, validUntil, issuedAt);
  const payload: QRPayload = {
    v: 1,
    tid: ticketId,
    bid: bookingId,
    eid: eventId,
    seat: seatId,
    sec: section,
    exp: validUntil,
    iat: issuedAt,
    chk,
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const baseUrl = origin ? origin.replace(/\/$/, '') : window.location.origin;
  const url = `${baseUrl}/admin/verify?d=${encoded}`;
  return { url, payload };
}

/**
 * Parse and verify a scanned QR link or raw payload string.
 */
export async function decodeAndVerifyQRPayload(rawInput: string): Promise<{
  validFormat: boolean;
  tampered: boolean;
  payload: QRPayload | null;
  error?: string;
}> {
  try {
    let base64Data = rawInput.trim();
    
    // If it's a URL, extract ?d= param
    if (base64Data.includes('?')) {
      const url = new URL(base64Data, window.location.origin);
      const dParam = url.searchParams.get('d');
      if (dParam) base64Data = dParam;
    }

    const jsonStr = fromBase64Url(base64Data);
    const parsed: QRPayload = JSON.parse(jsonStr);

    if (!parsed.tid || !parsed.bid || !parsed.eid || !parsed.seat || !parsed.chk) {
      return { validFormat: false, tampered: true, payload: null, error: 'Incomplete ticket payload attributes.' };
    }

    const expectedChecksum = await generateTicketChecksum(
      parsed.tid,
      parsed.bid,
      parsed.eid,
      parsed.seat,
      parsed.exp,
      parsed.iat
    );

    const isTampered = expectedChecksum !== parsed.chk.toUpperCase();

    return {
      validFormat: true,
      tampered: isTampered,
      payload: parsed,
      error: isTampered ? 'Security checksum mismatch: ticket payload has been altered or forged.' : undefined,
    };
  } catch (err: any) {
    return {
      validFormat: false,
      tampered: true,
      payload: null,
      error: 'Malformed QR payload format. Cannot decode base64url data.',
    };
  }
}
