
What’s happening now

- The beta switch is only affecting the practitioner dashboard, not the public booking path.
- Right now, changing to “Groundpath Native” does these things:
  - shows the Booking tab in the practitioner dashboard
  - updates the session mode label in settings/profile
- It does not yet replace public Halaxy links or embeds.

Why you still see Halaxy

I checked the code and the public-facing booking flow is still hardwired to Halaxy in multiple places:
- `src/components/Contact.tsx` — main booking section still embeds Halaxy and says “All sessions are currently conducted online via Halaxy Telehealth”
- `src/components/HowSessionsWork.tsx` — still explains Halaxy steps and links to Halaxy
- `src/components/Services.tsx` — service cards still describe Halaxy Telehealth
- `src/components/PractitionerCard.tsx` — Book button still opens Halaxy
- `src/pages/ClientDashboard.tsx` — Book Session still opens Halaxy
- `src/components/Footer.tsx`, `src/components/VoiceCounsellingSection.tsx`, `src/pages/VoiceSession.tsx` — still link to Halaxy

So the current beta is an internal dashboard foundation only, not yet a full testable booking replacement.

What I recommend building next

1. Make the booking mode actually control the booking path
- Use the existing `session_mode` setting as the switch for booking behavior
- Keep two clearly separated pathways:
  - `halaxy` = current production booking
  - `native_beta` = Groundpath in-house beta test flow

2. Create a real native beta test entry point on the public site
- In `Contact.tsx`, replace the Halaxy embed area with conditional rendering:
  - Halaxy mode → keep current Halaxy embed untouched
  - Native beta mode → show a Groundpath beta booking panel instead
- This beta panel should not pretend to be full production yet; it should let you test:
  - availability view
  - session request / booking preview flow
  - clear beta badge and internal-testing wording

3. Add a lightweight client-facing native booking beta panel
- Reuse the tone and styling from `NativeBooking.tsx`, but make a client-safe version
- Include:
  - practitioner name
  - available times
  - select time button
  - “request booking” / “book beta session” CTA
  - “video via Microsoft/Teams-ready pathway later” message
- No billing or complex workflow yet

4. Route public “Book” actions through the active mode
- Update these to follow booking mode instead of hardcoded Halaxy:
  - `PractitionerCard.tsx`
  - `ClientDashboard.tsx`
  - `HowSessionsWork.tsx` CTA
  - `Contact.tsx`
- In beta mode, they should send you to the new Groundpath-native booking section instead of Halaxy

5. Keep production safe
- Do not remove Halaxy
- Do not replace Halaxy globally for everyone
- Only switch to native behavior when the active practitioner/admin mode is `native_beta`
- Preserve current Halaxy embed and links as the production fallback

6. Show the next setup steps clearly inside the dashboard
Add a “Next Setup Steps” card inside the Booking tab for beta users/admin, showing:
- Step 1: Enable Groundpath Native Beta
- Step 2: Set working days and hours
- Step 3: Add first availability blocks
- Step 4: Test client-facing booking flow
- Step 5: Later connect Microsoft calendar/video
This gives you a visible roadmap while the feature is still early.

7. Add an admin/founder setup direction panel
Inside the practitioner dashboard booking/settings area, add an admin-only “Practitioner rollout” panel with calm operational guidance:
- who is enabled for native beta
- which practitioners are still on Halaxy
- what’s missing before full rollout
- future fields for:
  - Microsoft account connection
  - calendar sync
  - booking status
  - onboarding readiness

What the next setup phase should be

Immediate next phase:
- make native beta testable on the public booking path

After that:
- persist availability and session settings to Supabase
- create practitioner booking configuration records
- add admin ability to enable native beta per practitioner cleanly
- add a basic booking request record/table
- then Microsoft integration later:
  - Outlook calendar sync
  - Teams meeting generation
  - Microsoft account connection for practitioners

Suggested implementation scope now

Files to update
- `src/components/Contact.tsx`
- `src/components/HowSessionsWork.tsx`
- `src/components/Services.tsx`
- `src/components/PractitionerCard.tsx`
- `src/pages/ClientDashboard.tsx`
- likely `src/components/Footer.tsx`
- optionally `src/components/VoiceCounsellingSection.tsx` and `src/pages/VoiceSession.tsx` if you want all booking references mode-aware

Files to add
- a small client-facing native booking beta component, separate from practitioner dashboard management UI
- optionally a small “Booking setup steps” card component for the dashboard

Technical details

- The existing `session_mode` field is already in place and being read in `Dashboard.tsx`
- The missing piece is that public booking components do not currently read that mode
- Best approach:
  - centralize session-mode-aware booking logic in a small helper/hook
  - use it wherever a booking CTA or embed appears
  - render Halaxy vs Native Beta UI based on that shared source of truth

Concise product direction

- Yes: Halaxy needs to be conditionally replaced for your beta testing path
- No: it should not be deleted yet
- Next step: connect the public booking entry points to the existing beta mode, then add a simple client-facing native beta booking panel so you can actually test the in-house flow end to end
