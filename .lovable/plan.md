

# Restructure Registration Tab — Saved State + Remove Redundant Fields

## What the user wants

The Registration tab currently has redundant and confusing fields. The user wants:

1. **Remove** License Number (redundant — registration numbers cover this)
2. **Remove** AHPRA Number and AHPRA Profession as separate fields (AHPRA is already a Registration Body option — selecting it means the registration number IS the AHPRA number)
3. **Keep** Practice Country selector (AU/UK/Both)
4. **AASW section** (Australia): membership number + registration expiry — with a "saved" look once entered
5. **SWE section** (UK): registration number + registration expiry — with a "saved" look once entered
6. **Registration Body + Registration Number + Expiry**: same saved/edit pattern
7. **Saved state UX**: once a value is entered and saved, show it as a read-only display with copy icon and a small "Edit" button — not a raw input that looks too editable

## How it will work

### Saved/Edit display pattern

For each registration section (AASW, SWE, General Registration):
- **Has saved value**: Show as a styled read-only card with the value displayed, a copy icon, and an "Edit" pencil button to switch to edit mode
- **No value or edit mode**: Show the normal input fields
- Saving happens via the main "Save Changes" button (no per-field save)

### Registration tab layout (top to bottom)

1. **Practice Country** — Select dropdown (AU / UK / Both)
2. **AASW Membership** (shown when AU or Both) — Card with:
   - Membership Number (saved/edit pattern)
   - Registration Expiry date
   - Copy icon when saved
3. **SWE Registration** (shown when UK or Both) — Card with:
   - Registration Number (saved/edit pattern)  
   - Registration Expiry date
   - Copy icon when saved
4. **General Registration** — Card with:
   - Registration Body dropdown (AASW, AHPRA, SWE, BASW, ACA, ACMHN, Other)
   - Registration Number (saved/edit pattern)
   - Registration Expiry date

### Fields removed
- `license_number` — removed from the Registration tab UI (field stays in formData/DB, just not shown)
- `ahpra_number` — removed from UI (if user selects AHPRA as registration body, that number IS the registration number)
- `ahpra_profession` — removed from UI (profession is already captured in Basic Info tab)

## Technical details

### File: `src/components/ProfessionalProfileModal.tsx`

- Add local edit-mode state for each section: `editingAASW`, `editingSWE`, `editingRegistration` (booleans)
- Create a small `SavedField` inline component that shows the value as text + copy icon when not editing, and an input when editing
- Remove the License Number row (lines 379-395)
- Remove the AHPRA Number + AHPRA Profession row (lines 483-502)
- Add expiry date fields to both the AASW and SWE sections (currently only on general registration)
- The AASW and SWE sections each get their own expiry — we can use `registration_expiry` for the general one, and store AASW/SWE expiry in the existing `registration_expiry` field or as part of the section display (since there's only one `registration_expiry` column, we'll use it for the primary registration body and add visual date inputs for AASW/SWE that map to the same field contextually)

Since the DB only has one `registration_expiry` column, the expiry dates for AASW and SWE will share the same field. If the user has both AU and UK, the expiry shown on each section will be the same value. This is acceptable for now — a future migration could add separate expiry columns if needed.

### Files to modify
- `src/components/ProfessionalProfileModal.tsx` — restructure Registration tab

