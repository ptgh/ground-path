

# Plan: Fix Build Errors + Dual Session Pathway Architecture

## Part 1 — Fix Build Errors (immediate)

The build errors are caused by Deno not resolving `npm:@react-email/components@0.0.22` during type-checking of `send-email/index.ts` and `weekly-newsletter/index.ts`. These functions already use `npm:` specifiers correctly for Deno Deploy, but the local Deno checker needs a `deno.json` with `nodeModulesDir: "auto"` or explicit imports listed.

**Fix**: Add a root-level `supabase/functions/deno.json` that enables auto node_modules resolution, matching what `auth-email-hook/deno.json` already does but at the shared level.

**File**: `supabase/functions/deno.json`
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "npm:react@18.3.1",
    "types": ["npm:@types/react@18.3.1"]
  },
  "nodeModulesDir": "auto"
}
```

---

## Part 2 — Dual Session Pathway Architecture

### Concept

Introduce a `session_mode` concept on practitioner profiles:
- **`halaxy`** (default) — current production path: Halaxy booking + Halaxy Telehealth
- **`native_beta`** — internal test path: Teams-based sessions, admin-only visibility

No database migration needed — store session mode in the existing `halaxy_integration` JSONB field as `session_mode: "halaxy" | "native_beta"`.

### Changes by file

#### 1. `src/components/HowSessionsWork.tsx`
- Update step descriptions to be pathway-aware
- Remove hardcoded "Microsoft Teams" references from the Halaxy pathway
- Change step 3 to say "Join via Halaxy Telehealth" (production-facing text)
- Keep step descriptions generic and professional

#### 2. `src/components/Dashboard.tsx` — Settings tab
- Add a "Session Mode" card in the Settings tab (visible only to admin users)
- Two radio-style options:
  - **Halaxy (Production)** — "Halaxy booking & Halaxy Telehealth. Live production pathway."
  - **Groundpath Native Beta** — "Teams-based sessions. Internal testing only." with a `Beta` badge
- Save selection to `halaxy_integration.session_mode` via existing `updateProfile`
- Non-admin practitioners see only the Halaxy pathway (no toggle)

#### 3. `src/components/Dashboard.tsx` — Overview tab
- Show a small "Session Mode" indicator in the Professional Summary card
- Display "Halaxy Booking + Telehealth" or "Native Beta (Teams)" based on mode

#### 4. `src/components/ProfessionalProfileModal.tsx`
- In the Halaxy integration section, add a read-only label showing current session mode
- Keep Halaxy URL verification unchanged

#### 5. `src/components/booking/HalaxyEmbed.tsx`
- No changes — this remains the production booking widget

#### 6. `src/components/PractitionerCard.tsx`
- No changes for now — "Book Session" continues to link to Halaxy for all public-facing cards
- Native Beta booking UI will be added in a future iteration

#### 7. `src/components/Contact.tsx`
- No changes — Halaxy embed stays as the public booking interface

### What this does NOT change
- No new database tables or migrations
- No routing changes
- No auth logic changes
- No billing, subscription, or payout logic
- No changes to the Halaxy embed or booking flow
- No public exposure of Native Beta to clients

### Technical details

- Session mode stored as: `profile.halaxy_integration.session_mode` (`"halaxy"` | `"native_beta"`)
- Default value: `"halaxy"` (fallback when field is missing)
- Admin-only toggle prevents accidental mode switches
- The `HowSessionsWork` section on the landing page will reference "Halaxy Telehealth" instead of "Microsoft Teams" since this is the live production pathway clients see

