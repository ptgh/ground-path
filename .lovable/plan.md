

# Restructure Registration — Multiple Bodies via `practitioner_registrations` Table

## Summary

Add a dedicated `practitioner_registrations` table so practitioners can hold multiple registration bodies simultaneously. The General Registration Body section becomes a list of saved registrations with an "Add Another" flow. AASW and SWE keep their dedicated sections (they map to profile columns as-is).

## Database Changes

### New migration: create `practitioner_registrations` table

```sql
CREATE TABLE public.practitioner_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_name text NOT NULL,          -- e.g. 'AHPRA', 'ACA', 'BACP', or custom text
  registration_number text,
  registration_date date,           -- when they registered (replaces "expiry")
  years_as_practitioner integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, body_name)
);

ALTER TABLE public.practitioner_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations"
  ON public.practitioner_registrations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations"
  ON public.practitioner_registrations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
  ON public.practitioner_registrations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registrations"
  ON public.practitioner_registrations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_practitioner_registrations_updated_at
  BEFORE UPDATE ON public.practitioner_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Frontend Changes

### File: `src/components/ProfessionalProfileModal.tsx`

**General Registration Body section (lines 545-603) — replace with multi-registration list:**

1. On mount, fetch `practitioner_registrations` for the current user
2. Display each saved registration as a `SavedRegistrationCard` showing:
   - Title: body name (e.g. "AHPRA Registration")
   - Number label: dynamic (e.g. "AHPRA Registration Number")
   - Registration date (not expiry)
   - Years as practitioner
   - Copy / Edit / Delete icons
3. Below the list, show an "Add Registration" button that reveals:
   - Registration Body dropdown (country-filtered, with "Other" free-text)
   - Registration Number input
   - Registration Date input
   - Years as Practitioner input
   - Save button (inserts/upserts to `practitioner_registrations`)
4. Delete removes the row from the table
5. Edit switches the card to input mode, save updates the row

**SavedRegistrationCard updates:**
- Change "Registration Expiry" label to "Registration Date"
- Add optional `yearsValue` display for years as practitioner
- Dynamic title/label based on body name

**Data flow:**
- General registrations read/write directly to `practitioner_registrations` table (not profile columns)
- AASW and SWE sections remain on the `profiles` table as-is (dedicated fields)
- The old `registration_body` / `registration_number` / `registration_expiry` profile columns are left in the DB but no longer shown in the UI for new entries — existing data migrated via a one-time insert

**One-time data migration** (in the same migration):
```sql
-- Migrate existing general registration data to the new table
INSERT INTO public.practitioner_registrations (user_id, body_name, registration_number, registration_date)
SELECT p.user_id, p.registration_body, p.registration_number, p.registration_expiry
FROM public.profiles p
WHERE p.registration_body IS NOT NULL
  AND p.registration_body != ''
ON CONFLICT (user_id, body_name) DO NOTHING;
```

### Files to modify
- `src/components/ProfessionalProfileModal.tsx` — multi-registration UI
- New migration — create table, RLS, migrate existing data

