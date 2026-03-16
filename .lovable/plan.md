

## Plan: Three Targeted Auth Flow Fixes

### Fix 1: Remove signup redirect race in AuthPage.tsx
Remove the `onAuthStateChange` listener (lines ~35-49) that does `window.location.href = '/practitioner/dashboard'` on `SIGNED_IN`. This fires during signup and overrides the `navigate('/verify-email')` call. The listener should only handle OAuth callbacks, not interfere with the signup flow.

**File:** `src/components/AuthPage.tsx`
- Remove or narrow the `onAuthStateChange` `useEffect` so it no longer redirects on `SIGNED_IN` during signup
- Keep the explicit `navigate('/verify-email')` in `handleSignUp` and `navigate('/practitioner/dashboard')` in `handleSignIn`

### Fix 2: Fix Dashboard practitioner guard
The current guard checks `!profile.verification_status`, but the DB trigger sets it to `'unverified'` by default (never null). Change the condition to also check for `=== 'unverified'`.

**File:** `src/components/Dashboard.tsx`
- Change the redirect condition to: `profile.user_type === 'practitioner' && (!profile.verification_status || profile.verification_status === 'unverified')`
- Redirect to `/practitioner/verify`

### Fix 3: No other changes
- Keep existing `/verify-email` page as-is (link-based confirmation)
- No OTP fields
- No UI redesign
- No route changes

### Files modified
- `src/components/AuthPage.tsx`
- `src/components/Dashboard.tsx`

