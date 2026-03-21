

# Simplify LinkedIn URL to Manual + Add Copy Icons + Verification Status

## What's changing

1. **Keep LinkedIn URL as manual paste** — no re-verify flow, no auto-capture attempts
2. **Add copy-to-clipboard icons** next to all profile data fields in the Dashboard Settings view so users can easily extract their own data
3. **Show verified/unverified badge** on the profile — if unverified, show an "Unverify" status with a link/icon to go verify
4. **Remove the amber "missing LinkedIn URL" banner** from Dashboard since URL is manual and optional

## Plan

### 1. Dashboard Profile Settings — add copy icons + verification status
**File: `src/components/Dashboard.tsx`**

- Remove the amber LinkedIn URL missing banner (lines 609-628)
- For each profile data field (Display Name, Email, Profession, License Number, LinkedIn, Bio), add a small copy icon button that copies the value to clipboard with a toast confirmation
- Replace the LinkedIn section's conditional "Verified" badge with a clear verified/unverified indicator:
  - **Verified**: green badge + checkmark
  - **Unverified**: amber badge + link to `/practitioner/verify` to complete verification
- Import `Copy` from lucide-react

### 2. Professional Profile Modal — simplify LinkedIn section
**File: `src/components/ProfessionalProfileModal.tsx`**

- Remove the re-verify button logic (already not present, confirm clean)
- Keep the verified badge when verified, keep manual URL input always
- For unverified users, show an "Unverified" indicator with a small shield icon linking to `/practitioner/verify`
- Add copy icons next to each input field in the modal for easy extraction

### Files to modify
- `src/components/Dashboard.tsx` — remove amber banner, add copy icons to profile fields, show verified/unverified status
- `src/components/ProfessionalProfileModal.tsx` — ensure clean verified/unverified indicator, add copy icons

### Technical details
- Copy function: `navigator.clipboard.writeText(value)` with toast feedback
- Copy icon: `Copy` from lucide-react, small ghost button beside each value
- Verified status reads from `profile.professional_verified` or `profile.verification_method === 'linkedin'`
- Unverified icon links to `/practitioner/verify` using react-router `Link`

