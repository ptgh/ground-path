

## Next Steps Plan

### What's been completed
- Dedicated `/book` page with practitioner selection and GSAP animations
- Discrete time slot generation (session duration + buffer)
- Teams Link button removed (unsupported scopes)
- Booking notification email fix (practitioner dashboard link)

### Remaining work

#### Step 1: Use Teams connector for booking notifications via channel messages
Since the Teams connector supports `ChannelMessage.Send`, we can post booking notifications to a Teams channel when new requests come in, bookings are confirmed, or cancelled.

- Create edge function `teams-booking-notify/index.ts` that posts formatted messages to a configured Teams channel via the connector gateway
- Call it from the existing `booking-notification` edge function as an additional notification channel
- Message includes client name, date, time, and a link to the practitioner dashboard

#### Step 2: Fix remaining booking flow issues
- Verify the `/book` page slot generation works with real availability data
- Ensure the email notification link points to `/practitioner/dashboard?tab=booking`
- Test the calendar only appears after practitioner selection

#### Step 3: Homepage booking CTA cleanup
- Replace inline `NativeBookingPanel` on the homepage with a simple "Book a Session" CTA card linking to `/book`
- Update `HowSessionsWork` CTA to navigate to `/book` in native_beta mode

#### Step 4: Document Microsoft integration limitations
- Add a note in the practitioner dashboard settings explaining that video meeting links must be manually added for now
- Future: custom Microsoft Entra app registration would unlock `OnlineMeetings.ReadWrite` and `Calendars.ReadWrite` for full automation

### Technical details

- **New file**: `supabase/functions/teams-booking-notify/index.ts` — uses `MICROSOFT_TEAMS_API_KEY` + `LOVABLE_API_KEY` to post to Teams channel via gateway (`https://connector-gateway.lovable.dev/microsoft_teams/teams/{teamId}/channels/{channelId}/messages`)
- **Modified**: `supabase/functions/booking-notification/index.ts` — call `teams-booking-notify` after sending email
- **Modified**: `src/components/HowSessionsWork.tsx` — CTA navigates to `/book` instead of scrolling to inline panel
- **Modified**: `src/pages/Index.tsx` — replace inline booking panel with CTA card
- **Modified**: `src/components/dashboard/NativeBooking.tsx` — add "Paste meeting link" input field for practitioners to manually add video links to confirmed bookings

### Microsoft integration scope summary

| Feature | Required Scope | Available? | Status |
|---------|---------------|------------|--------|
| Channel notifications | `ChannelMessage.Send` | Yes | Can implement now |
| Chat messages | `Chat.ReadWrite` | Yes (add scope) | Can implement |
| Create meetings | `OnlineMeetings.ReadWrite` | No | Requires custom OAuth |
| Calendar sync | `Calendars.ReadWrite` | No | Requires custom OAuth |

