
## Goal
One practitioner hub at `/practitioner/:id` that contains identity + contact + calendar + quick-pick upcoming slots + the user's own bookings. `/book` becomes a directory that funnels into the hub. Small directory card shows full credentials and drops the bio.

---

### 1. Fix the small directory card (`src/components/PractitionerCard.tsx`)
- **Query**: extend `select` to pull `aasw_membership_number`, `swe_registration_number`, `ahpra_number`, plus joined `practitioner_registrations(body_name, registration_number)`.
- **Render**: replace the single `formatProfessionLabel(profession)` line with `formatIdentitiesLine(buildProfessionalIdentities(...))` so the card shows e.g. *"Social Worker (AASW) · Counsellor (ACA)"* — matching the hub.
- **Remove the bio** block (lines ~80–82). Keeps the card compact and avoids duplicating what's on the hub.
- **Both buttons (Message/Book) → `/practitioner/:id`** (Book deep-links to `#booking`). This collapses "profile vs booking" into one destination.

### 2. Restore the "Upcoming sessions" quick-pick on the booking panel (`src/components/booking/InlineBookingPanel.tsx`)
- Add a compact section **above the calendar grid** titled "Next available — quick pick", powered by the existing `getNextAvailableSlots(availability, existingBookings, { limit: 4, sessionMinutes, bufferMinutes })`.
- Each chip onClick sets `selectedDate` + `selectedSlot` in one tap, then scrolls to the booking confirmation block. The full calendar stays for users who want to browse further dates.
- Empty state: hide the section if `getNextAvailableSlots` returns nothing (don't show an empty placeholder — the calendar already handles that).

### 3. Make `/practitioner/:id` the single booking hub (`src/pages/PractitionerProfile.tsx`)
The page already embeds `InlineBookingPanel`. Three small additions:
- **"Your upcoming bookings with {name}"** card (only when signed in and there's at least one row in `booking_requests`). Lifts the existing query from `Book.tsx` so users land on one screen for everything.
- **Sticky "Book" CTA** on mobile that scrolls to `#booking` — addresses "user may miss it" on long profiles.
- **Anchor nav strip** under the header: *About · Specialisations · Registrations · Book* (smooth-scroll buttons). Lightweight, keeps the page scannable.

### 4. Repurpose `/book` as a directory funnel (`src/pages/Book.tsx`)
- Keep the practitioner list + filters.
- **Remove the inline calendar/check-in flow** from this page. When a card is clicked (or `?practitioner=` deep-link), `navigate('/practitioner/:id#booking')` instead of expanding inline.
- Preserve the auto-resume after auth: read `pending_booking_selection` and forward to the hub with the same anchor.
- Delete the now-unused state and effects (selected practitioner availability, slots, bookings, GSAP for booking section). Reduces ~300 lines from `Book.tsx` and removes one of the two duplicate booking flows.

### 5. Crosslink + redirect safety
- Hero "Book a Session" CTA → keeps scrolling to `#practitioners`, but each card now routes through the hub.
- Old `/book?practitioner=<id>` URLs → `Book.tsx` detects the param on mount and redirects to `/practitioner/:id#booking` so any saved links still work.

---

### Why this layout vs. keeping both pages
- One canonical URL per practitioner = better SEO, easier sharing, no "did I miss the booking button" problem.
- Removes a 700+ line duplicate of booking logic from `Book.tsx`.
- The hub already does everything except the quick-pick slots and "your bookings" view — closing that gap is small, deleting `Book.tsx`'s booking flow is the real win.

### Files touched
- `src/components/PractitionerCard.tsx` — identities, drop bio, route to hub
- `src/components/booking/InlineBookingPanel.tsx` — add quick-pick slots row
- `src/pages/PractitionerProfile.tsx` — anchor nav, sticky mobile CTA, "your bookings" card
- `src/pages/Book.tsx` — strip inline booking, redirect deep-links
- No DB changes; no new dependencies.

### Out of scope (tell me if you want them folded in)
- Filtering/sorting on `/book` (specialisation, availability window).
- Calendar view of all the user's bookings across practitioners (currently only on dashboard).
