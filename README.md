# VelvetSeat — Event Ticketing Platform

VelvetSeat is a React and TypeScript event discovery and mock ticket-booking app. It uses an editorial ivory, ink, and gold visual system, an interactive SVG seat map, and a simulated checkout flow.

## Setup

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build and preview:

```bash
npm run build
npm run preview
```

Available scripts: `dev`, `build` (TypeScript plus Vite), `lint` (Oxlint), and `preview`. There is currently no automated test script or test suite.

## Feature checklist

| Must-have | Implementation | Status |
|---|---|---|
| Event listing | Home and `/events` catalogue, event details at `/events/:slug` | Implemented; route responses checked |
| Seat selection | `/events/:slug/seats`, interactive SVG seats, eight-seat cap, local sold-seat state | Implemented; store and build checked |
| Mock payment | `/checkout`, attendee and payment-method validation, processing and retry/failure states | Implemented; not exercised end to end in this audit |
| Ticket confirmation | `/confirmation/:bookingId`, QR ticket, print/share/calendar actions, `/bookings` archive | Implemented; unknown IDs now show the not-found state |

## Project map

- `src/pages/`: Home, event catalogue/detail, seat selection, checkout, confirmation, bookings, and 404 routes.
- `src/components/`: page layout, event cards/hero, seat summary/tooltip, and shared UI states.
- `src/stores/`: Zustand seat, checkout, theme, and toast stores.
- `src/data/`: event catalogue and seat-layout data.
- `src/hooks/` and `src/utils/`: shared hooks and formatting/calendar helpers.
- `src/styles/`: global theme tokens and motion/print styles.

## What changed

- Fixed the TypeScript build errors in motion variants and stylesheet declarations.
- Scoped seat selections to the active event, kept the eight-seat cap, deduplicated checkout seats, and calculate the checkout subtotal from the selected seat prices.
- Persisted the checkout session and hold expiry so a refresh can restore the flow. Payment form values remain component-local and are not persisted.
- On hold expiry, clear the selected seats and checkout session before returning to the event seat map. The mock gateway uses a balanced 50/50 result and blocks duplicate submissions while processing.
- Confirmation now requires an exact booking ID rather than falling back to another booking. Share/copy handles unavailable browser clipboard APIs.
- Fixed the persisted theme bootstrap, added a visible keyboard focus ring to SVG seats, and loaded the existing animation/print stylesheet so ticket printing styles actually apply.
- Removed unused imports/values, corrected the media-query hook subscription, and cleaned the Oxlint warnings.

## QA notes and limits

- `npm run build`: passes. Vite reports a 586 kB minified JavaScript chunk (177 kB gzip), above its 500 kB advisory threshold.
- `npm run lint`: passes with no warnings.
- HTTP checks returned the Vite SPA shell for `/`, `/events`, an event detail, its seats, `/checkout`, `/confirmation/QA-BOOKING`, `/bookings`, and an unknown route. This confirms route fallback/serving, not that each page's interactive flow was exercised.
- Full browser QA (both themes, mobile widths, success and failure checkout, keyboard-only flow, print layout, and console inspection) could not be run: the desktop computer-use runtime exited during initialization. No automated tests are defined in this project.
- The payment flow is intentionally simulated and does not contact a payment provider.

## Further improvements

1. Add focused store and checkout tests, plus browser end-to-end coverage for payment success/failure and hold expiry.
2. Split route bundles and lazy-load event imagery to reduce the initial JavaScript payload.
3. Add server-backed seat holds and booking verification for multi-device/concurrent booking support.
