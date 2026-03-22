

# Fix Registration Tab — Stay on Tab After Save, Fix General Registration Body Logic

## Issues identified

1. **Modal closes on save** — `setOpen(false)` on line 190 closes the dialog after save. User wants to stay in the Registration tab after saving.
2. **General Registration body saves on 1 character** — The `SavedRegistrationCard` component treats any non-empty `numberValue.trim()` as "saved" and switches to read-only mode immediately as the user types. The "saved" state should only activate after the user clicks "Save Changes", not on every keystroke.
3. **Registration body dropdown includes AASW and SWE** — these should be removed since they have dedicated sections. Need to expand the list with more recognised bodies, separated by country context.
4. **"Other" option** — when selected, should show a free-text input so the user can type their custom body name, and that text is what gets saved.

## Plan

### File: `src/components/ProfessionalProfileModal.tsx`

**Fix 1: Stay on tab after save**
- Remove `setOpen(false)` from the success path in `handleSubmit` (line 190)
- Instead, show the success toast only — modal stays open on the current tab
- User closes manually via the X or Cancel button

**Fix 2: SavedRegistrationCard — only show "saved" state for values that came from the database**
- Add a `savedValue` prop to `SavedRegistrationCard` representing the last-persisted value
- The card shows read-only mode only when `savedValue` matches current `numberValue` and is non-empty (i.e., the value was loaded from DB or just saved)
- While typing new/changed values, it stays in edit mode
- After a successful save, re-sync saved values from the refreshed profile so cards flip to read-only

Implementation: add state `lastSavedFormData` that captures formData snapshot on load and after each successful save. Pass `savedValue={lastSavedFormData.registration_number}` etc. to each card. The card compares `numberValue === savedValue && savedValue !== ''` to decide display mode.

**Fix 3: Remove AASW/SWE from general dropdown, expand with country-appropriate bodies**
- Remove `AASW` and `SWE` SelectItems (they have dedicated sections)
- Split remaining options by country context:
  - **AU bodies**: AHPRA, ACA, ACMHN, PACFA (Psychotherapy & Counselling Federation), APS (Australian Psychological Society)
  - **UK bodies**: BASW, BACP (British Association for Counselling and Psychotherapy), HCPC (Health and Care Professions Council), NMC (Nursing and Midwifery Council)
  - **Both**: show all of the above
- Show the appropriate list based on `formData.registration_country`
- Keep "Other" at the bottom

**Fix 4: "Other" free-text input**
- When `registration_body === 'other'`, show a text Input below the dropdown for the user to type the custom body name
- Store the custom name in `registration_body` (replace 'other' with the actual text on save)
- Add a local state `customRegistrationBody` for the text input
- On save, if `registration_body === 'other'`, use `customRegistrationBody` as the value; otherwise use the dropdown value

### Files to modify
- `src/components/ProfessionalProfileModal.tsx` — all four fixes above

