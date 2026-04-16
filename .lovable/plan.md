
## Plan: Fix booking time + split confirmation into two emails

### Issues identified
1. **Time bug** — `formatTime()` in `booking-notification/index.ts` only reads the hour and hardcodes `:00`, so `10:50` shows as `10:00 AM`. That's why the email reads `10:00 AM – 10:00 AM` instead of `10:00 AM – 10:50 AM`.
2. **Single confirmation email, no Teams link** — On confirm, the dashboard fires `status_change` notification first, then separately calls `create-org-booking-meeting`. The email goes out before the meeting URL exists, so it just says "Meeting details will follow shortly" with no link.
3. **Wording** — User wants two distinct emails for the client around confirmation: a friendly "Booking confirmed with [practitioner]" first, then a separate "Your Teams meeting is ready" with the join link, how-to-join instructions, and a welcome tone.

### Changes

**1. `supabase/functions/booking-notification/index.ts`**
- Fix `formatTime` to render minutes correctly: parse both `H` and `M`, output e.g. `10:50 AM`, `2:15 PM`, `12:00 PM`.
- Update `handleStatusChange` confirmed copy to say: *"Your booking with [Practitioner] is confirmed. We'll send your Teams meeting link in a separate email shortly."* Remove the inline "Join Teams Meeting" button from this email — it now stays purely a confirmation.
- Add a new notification type `meeting_ready` that sends a separate, welcoming "Your Teams session is ready" email to the client with:
  - Practitioner name + date/time block (using fixed formatTime)
  - Prominent **Join Teams Meeting** button (Teams purple)
  - Short "How to join" guide: click 5 min early, allow camera/mic, you'll wait briefly in the lobby until the practitioner admits you, browser fallback if Teams app isn't installed
  - Warm welcome line and reassurance about confidentiality

**2. `supabase/functions/create-org-booking-meeting/index.ts`**
- After successfully creating the meeting and persisting the URL, fire-and-forget invoke `booking-notification` with `{ type: 'meeting_ready', bookingId }` so the client gets the second email automatically as soon as the link exists.

**3. No client UI changes needed** — `NativeBooking.handleUpdateBookingStatus` already sends `status_change` then calls `handleCreateMeeting`. The new `meeting_ready` email is triggered server-side from the meeting-creation function so the flow stays: confirm → "Booking confirmed" email → meeting created → "Teams meeting ready" email.

### Resulting client email sequence
1. Request submitted → "Booking request received — pending approval" (existing)
2. Practitioner confirms → **"Booking Confirmed with [Practitioner]"** (no link yet, fixed time)
3. Teams meeting created → **"Your Teams Session is Ready"** (join button + how-to-join + welcome)

Practitioner-facing emails (new request, cancellation) are unchanged apart from the time-formatting fix.
