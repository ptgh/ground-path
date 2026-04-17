

## Plan: Polish Teams experience + in-app session join (no full embed)

### Quick answer on the embed question
**Microsoft does not allow Teams meetings to be fully embedded in third-party websites via iframe.** The Teams web client explicitly blocks iframe embedding (`X-Frame-Options: DENY`) and the Graph "join URL" must be opened in either the Teams app or Microsoft's hosted web client at `teams.live.com` / `teams.microsoft.com`.

So a true in-page Teams call is **not possible**. But we can get 90% of that experience: a polished in-app "Join Session" page that hands off to Teams' web client in a new tab/PWA-friendly way, with full mobile support, a fallback if Teams isn't installed, and the same join link in the email — so users get one consistent journey whether they click the email or come via the website.

I'd recommend doing this rather than trying to embed. Embedding would be brittle, break randomly when Microsoft changes headers, and fail on iOS Safari. The handoff pattern is what every clinical platform does (Halaxy, SimplePractice, Coviu).

### Scope

**1. Better logo in emails (full quality)**
- Replace the small 512px PNG with a properly sized 600px-wide branded email header (sage card with full "groundpath" wordmark + tagline) generated as a high-DPI PNG.
- Keep "GP" text fallback for image-blocked clients.
- Apply consistently across all 5 email templates (request received, confirmed, meeting ready, reminder, cancellation).

**2. New in-app Join Session page** — `/session/:bookingId`
- Mobile-first page showing: practitioner name, time, countdown ("Starts in 4 min" / "Live now"), big "Join Teams Meeting" button.
- Two clear options:
  - **Open in Teams app** (deep-link `msteams:` — works if Teams installed)
  - **Join in browser** (uses the Graph `joinWebUrl` which opens `teams.live.com` in a new tab — no install required, works on mobile Safari/Chrome)
- "How to join" instructions inline (lobby wait, mic/camera permissions, headphones recommended).
- Auth-protected: only the booked client or assigned practitioner can view.
- Real-time meeting status: shows "Setting up meeting..." if `meeting_status !== 'created'` and updates live via Supabase realtime.

**3. Update email + dashboard to point at this page**
- The "Your Teams Session is Ready" and reminder emails get **two buttons**: "Open in Groundpath" (→ `/session/:id`) and "Join Teams directly" (→ Graph `joinWebUrl`).
- "My Bookings" Join Session button on `MyBookings.tsx` and `ClientDashboard.tsx` routes to `/session/:id` instead of opening Teams directly.
- Practitioner dashboard gets the same in-app launcher.

**4. Fix lingering time bug** in `MyBookings.tsx` and `NativeBookingPanel.tsx` (`formatTime` still strips minutes — same bug we fixed in the email function but not in these two components).

**5. Mobile polish**
- Test the join page at 375px viewport.
- Ensure tap targets ≥44px, button stack vertically on narrow screens.
- iOS-safe `msteams:` deep link with graceful fallback when the app isn't installed.

### Files to add/edit
- `src/pages/JoinSession.tsx` — new page
- `src/App.tsx` — add `/session/:bookingId` route (auth-protected)
- `src/components/booking/MyBookings.tsx` — fix formatTime; route to `/session/:id`
- `src/components/booking/NativeBookingPanel.tsx` — fix formatTime
- `src/components/dashboard/NativeBooking.tsx` — practitioner Join button → `/session/:id`
- `supabase/functions/booking-notification/index.ts` — add "Open in Groundpath" CTA alongside Teams link in `meeting_ready` and `session_reminder` templates
- `public/email/groundpath-logo.png` — regenerate at 600×160 with full wordmark

### What I'm NOT doing (and why)
- **Not embedding Teams in an iframe** — Microsoft blocks it; would break.
- **Not building a custom WebRTC client** — out of scope, would require months of work and licensing review.

