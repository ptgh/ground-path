

# Plan: Australia-Focus, QR Code Update, SWE Removal from Public, ACA Registration

## Summary

Make Groundpath Australia-specific for public-facing content. Remove SWE/UK "dual registered" references from public pages. Keep SWE/UK content in code but hide it behind admin control for future re-enablement. Update QR code URL. Add ACA registration number S89326. Adjust AI system prompts to be Australia-focused.

---

## Changes

### 1. QR Code URL — `src/components/Footer.tsx`
- Change QRCodeSVG `value` from `"https://ground-path.lovable.app"` to `"https://groundpath.com.au"`

### 2. Footer — Remove SWE from bottom bar — `src/components/Footer.tsx`
- Remove the `• SWE Registered` link from the bottom bar (line 111)
- Keep: `© 2026 groundpath. All rights reserved. • ABN: 98 434 283 298 • AASW Member`

### 3. Hero credentials — Remove SWE — `src/components/Hero.tsx`
- Remove the "SWE Registered" badge and its separator from the credentials bar (lines 107-112)
- Update ACA line: remove "(registration in progress)" — replace with "ACA Registered" with a green dot (since now registered)

### 4. HowGroundpathIsDifferent — Replace dual-registered card — `src/components/HowGroundpathIsDifferent.tsx`
- Change "Dual-Registered Social Worker" title to "AASW-Registered Social Worker"
- Change description to: "Qualified AASW-registered social worker delivering evidence-based mental health support across Australia."
- Change "Telehealth via Microsoft Teams" to "Telehealth via Halaxy Telehealth" in the Flexible Delivery card

### 5. About page — Hide SWE and UK & AUS cards — `src/components/About.tsx`
- Remove (or hide) the SWE button/card (lines 170-179) and the "UK & AUS" dual-country card (lines 192-201) from the public credential grid
- Keep the SWE modal and CountriesModal components in code (just don't render the trigger buttons)
- Update ACA card: change from "Registration in progress" to "Registered — S89326"

### 6. AI Assistant system prompt — `supabase/functions/ai-assistant/index.ts`
- Update the system prompt to be Australia-focused:
  - Change "AASW Code of Ethics" references to remain (already AU)
  - Remove references to SWE or UK practice standards
  - Add ACA (Australian Counselling Association) to the expertise areas
  - Keep NDIS content as-is

### 7. Client AI Assistant — `src/components/ClientAIAssistant.tsx`
- Keep AU/UK/Global country selector (for crisis resources — this is a safety feature, not a branding feature)
- No changes needed here — the country selector helps international visitors find crisis resources

### 8. Voice Counselling Session — `src/components/VoiceCounsellingSession.tsx`
- Same as above — keep AU/UK/Global for crisis resource safety. No changes.

### 9. Professional Profile Modal — `src/components/ProfessionalProfileModal.tsx`
- Keep the SWE section in the registration form (it's behind `registration_country === 'UK' || 'BOTH'`)
- No changes needed — practitioners can still set their country to UK/BOTH in their profile if admin enables it later

### 10. Dashboard — Admin toggle concept (future) — `src/components/Dashboard.tsx`
- Add a simple admin-only toggle in Settings: "Enable UK/International registrations" (boolean)
- For now, this is display-only / informational — it doesn't gate anything yet but establishes the pattern for later

### 11. Professional Resources — `src/components/dashboard/ProfessionalResources.tsx`
- Keep UK resources in the list (practitioners may still reference them)
- No changes — this is a practitioner-facing tool, not public

### 12. Add ACA registration number to profile — Database insert
- Use the Supabase insert tool to add an ACA registration entry for ptgh@mac.com's user_id in the `practitioner_registrations` table with `body_name: 'ACA'`, `registration_number: 'S89326'`

---

## What does NOT change
- No routing changes
- No auth logic changes
- No backend/database schema changes
- No scoring logic changes
- Voice counselling and client AI keep AU/UK/Global for crisis safety
- SWE modal, CountriesModal stay in codebase (just hidden from public nav)
- Professional resources for UK stay available to practitioners

## Files modified
- `src/components/Footer.tsx`
- `src/components/Hero.tsx`
- `src/components/HowGroundpathIsDifferent.tsx`
- `src/components/About.tsx`
- `src/components/Dashboard.tsx`
- `supabase/functions/ai-assistant/index.ts`
- Database: insert ACA registration for ptgh@mac.com

