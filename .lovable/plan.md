

# Fix Auth Flow, Verification UX, Header State, and Halaxy Personalisation

## Problems Identified

1. **Verification page says "Finish" and shows confusing "Verification complete" message** that disappears after ~2 seconds, redirecting to homepage where user appears signed out
2. **After submitting registration, user is redirected to homepage and appears signed out** — the redirect goes to `/` (public page) instead of `/practitioner/dashboard`
3. **Header shows "Sign In/Sign Up" flip button even when user is logged in** on public pages — should show "Sign Out" instead
4. **Flip animation interval (3s) is too fast** and jarring
5. **Sign in/up stops working after submitting registration** — likely because the redirect to `/` loses auth context and the header still shows the flip login button
6. **Halaxy profile link is hardcoded** to a single practice URL for all users — each practitioner needs their own Halaxy link

## Plan

### 1. Fix PractitionerVerify page copy and redirect
- Change title from "Finish practitioner verification" to "Complete practitioner verification"
- Change success message from "Verification complete. Taking you to the site..." to "Verification complete. Redirecting to your dashboard..."
- Change both redirect targets (LinkedIn success and registration submit) from `navigate('/')` to `navigate('/practitioner/dashboard')`
- Increase the LinkedIn redirect delay from 1800ms to 3000ms so users can read the message

### 2. Fix Header to show Sign Out when logged in on public pages
- When `user` is truthy and NOT on a practitioner route, replace the `FlipLoginButton` with a proper signed-in state: avatar dropdown with Dashboard link and Sign Out
- Reuse the existing `AuthAwareSection` component for both practitioner and public pages
- Remove the condition `shouldShowAuth` that restricts the avatar to practitioner routes only

### 3. Slow down the flip animation
- Change the flip interval from 3000ms to 5000ms

### 4. Personalise Halaxy link per practitioner
- The `profiles` table already has a `halaxy_integration` JSONB field — use it to store the practitioner's own Halaxy profile URL
- In the Dashboard Settings tab, replace the hardcoded Halaxy link with the practitioner's stored URL, or show an input field to set it if not configured
- Add a Halaxy URL field to the `ProfessionalProfileModal` so practitioners can enter their own Halaxy profile link
- The top-right Halaxy logo in the dashboard welcome section should also link to the practitioner's own URL (or hide if not set)

### Files to edit
- `src/pages/PractitionerVerify.tsx` — fix copy, redirect targets, delay
- `src/components/Header.tsx` — show sign out when logged in on public pages, slow flip interval
- `src/components/Dashboard.tsx` — personalise Halaxy links from profile data
- `src/components/ProfessionalProfileModal.tsx` — add Halaxy URL field

### Technical details
- Header right-side logic changes from `shouldShowAuth ? <AuthAwareSection /> : <FlipLoginButton />` to checking `isLoggedIn` first — if logged in, always show `<AuthAwareSection />`, otherwise show Book a Session + FlipLoginButton on public pages
- Halaxy URL stored in existing `halaxy_integration` JSONB as `{ profile_url: "https://..." }` — no migration needed
- No changes to auth flow, forms library, or messaging system

