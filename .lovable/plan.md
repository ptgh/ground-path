

## Problem Analysis

I explored the routing, Header, Dashboard, and ClientDashboard files. Here is what is happening and what needs to change.

### Issue 1: Dashboard link goes to wrong page for practitioners/admins

The Header navigation on public pages (home, resources, etc.) has a "Dashboard" link that always routes to `/dashboard` — which renders the **ClientDashboard** (a simple client view with just messages, voice support, resources, and book session). Meanwhile, tapping the mobile auth indicator (the Admin icon) correctly routes practitioners to `/practitioner/dashboard` (the full practitioner dashboard with tabs, forms, notes, settings, etc.).

**Root cause**: Lines 303-309 and 403-408 in Header.tsx hardcode `/dashboard` for logged-in users on public pages, regardless of their role.

**Fix**: Update all "Dashboard" nav links in Header.tsx to check `profile?.user_type === 'practitioner'` and route to `/practitioner/dashboard` for practitioners/admins, `/dashboard` for clients. This matches what MobileAuthIndicator already does.

### Issue 2: Remove separate "Verify Halaxy Profile" button

The Settings tab in Dashboard.tsx (line 769-783) shows two buttons: "Update Professional Profile" and "Verify Halaxy Profile". Both open the same ProfessionalProfileModal. The Halaxy verification is already inside the Professional Profile modal, so the separate button is redundant.

Similarly, the Overview tab (lines 525-556) has a standalone Halaxy section.

**Fix**:
- Settings tab: Remove the "Verify Halaxy Profile" / "Halaxy Profile" button entirely. Keep only "Update Professional Profile".
- Overview tab: Remove the separate Halaxy link/verify prompt. Keep the "Update Professional Info" button which already opens ProfessionalProfileModal where Halaxy management lives.

### Files to change

1. **`src/components/Header.tsx`**
   - Desktop public nav "Dashboard" link (line ~305): route based on user type
   - Mobile public nav "Dashboard" link (line ~404): route based on user type

2. **`src/components/Dashboard.tsx`**
   - Settings tab (lines 765-783): Remove the Halaxy button row, keep only "Update Professional Profile"
   - Overview Professional Summary (lines 519-557): Remove standalone Halaxy section, keep "Update Professional Info"
   - Welcome header (lines 328-344): Remove Halaxy logo link (desktop top-right)

### What stays the same
- ClientDashboard stays for actual client users (user_type !== 'practitioner')
- ProfessionalProfileModal continues to handle Halaxy verification internally
- Session Mode card in Settings (admin-only) stays unchanged
- All tab structure, forms, notes, and approvals remain as-is

