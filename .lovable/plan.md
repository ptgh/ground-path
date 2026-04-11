

## Issues Identified & Plan

### Problems Found

1. **Booking slots show full day range (9 AM - 5 PM) instead of individual time slots** -- `NativeBookingPanel` displays raw availability blocks rather than splitting them into bookable slots based on session duration (e.g., 50 min slots).

2. **No practitioner selection before booking** -- The booking panel assumes a single practitioner. User wants to select a practitioner first, then see a calendar.

3. **No dedicated booking page** -- Currently embedded inline on the home page. Needs its own route for a proper experience with GSAP animations.

4. **Teams meeting link fails (403 Forbidden)** -- Edge function logs show `Teams API error: 403`. The Microsoft Teams connector only supports scopes: `Team.ReadBasic.All, Channel.ReadBasic.All, ChannelMessage.Send, User.Read`. **`OnlineMeetings.ReadWrite` and `Calendars.ReadWrite` are NOT available** in this connector's scope catalog. The Teams connector gateway cannot create meetings or sync calendars -- it only supports channel messaging and team/channel reads.

5. **Email "Review Request" links to wrong page** -- `booking-notification` function links to `https://groundpath.com.au/dashboard` (client dashboard) instead of `https://groundpath.com.au/practitioner/dashboard` with the Booking tab active.

6. **Microsoft Calendar not included** -- The Teams connector does not support Outlook calendar scopes. A separate Microsoft Outlook connector would be needed, but even then, the connector accesses the developer's mailbox, not individual practitioner mailboxes. Per-practitioner calendar sync would require a custom OAuth flow.

---

### Plan

#### Step 1: Create dedicated `/book` page with practitioner selection
- New route `/book` and page `src/pages/Book.tsx`
- Lists practitioners with GSAP entrance animations
- Clicking a practitioner reveals a date-picker calendar (react-day-picker) with GSAP slide-in
- Calendar highlights days with availability; selecting a date shows individual time slots broken by session duration
- "Book" buttons on the home page and `PractitionerCard` navigate to `/book` (or `/book?practitioner=<id>` to pre-select)

#### Step 2: Fix time slot display in booking flow
- Instead of showing "9:00 AM - 5:00 PM" as one block, split availability into individual bookable slots: 9:00-9:50, 10:00-10:50, etc. using the practitioner's `sessionDuration` and `bufferMinutes` from their settings
- Grey out slots that already have pending/confirmed bookings

#### Step 3: Fix email notification links
- Change `handleNewRequest` link from `/dashboard` to `/practitioner/dashboard` 
- Append a query param or hash so the page auto-scrolls to the Booking tab on load

#### Step 4: Remove Teams meeting link button (not supported)
- The connector gateway does not support `OnlineMeetings.ReadWrite` -- remove the "Teams Link" button and `create-teams-meeting` edge function to avoid user confusion
- Update the "Next Setup Steps" roadmap text to reflect that Microsoft video integration is not yet available through this connector
- Update the footer text in `NativeBookingPanel` from "Microsoft Teams integration coming soon" to a general "secure video" message

#### Step 5: Clean up home page booking section
- Replace the inline `NativeBookingPanel` on the home page with a CTA card that links to `/book`
- Keep it simple: "Book a Session" card with a button that navigates to the new page

### Technical details

- New file: `src/pages/Book.tsx` -- standalone page with Header, practitioner list, animated calendar, and slot picker
- Modified: `src/App.tsx` -- add `/book` route
- Modified: `src/components/PractitionerCard.tsx` -- "Book" button navigates to `/book?practitioner=<id>`
- Modified: `supabase/functions/booking-notification/index.ts` -- fix URL from `/dashboard` to `/practitioner/dashboard`
- Modified: `src/components/dashboard/NativeBooking.tsx` -- remove Teams Link button and `handleCreateTeamsMeeting`
- Deleted: `supabase/functions/create-teams-meeting/index.ts`
- The date-picker calendar uses the existing `react-day-picker` component already in the project
- Slot generation logic: for each availability block, generate slots at `sessionDuration + bufferMinutes` intervals

