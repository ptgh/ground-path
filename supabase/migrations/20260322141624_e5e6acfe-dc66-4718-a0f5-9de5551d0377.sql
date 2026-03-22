
-- Create practitioner_registrations table for multiple registration bodies
CREATE TABLE public.practitioner_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_name text NOT NULL,
  registration_number text,
  registration_date date,
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

CREATE TRIGGER update_practitioner_registrations_updated_at
  BEFORE UPDATE ON public.practitioner_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing general registration data to the new table
INSERT INTO public.practitioner_registrations (user_id, body_name, registration_number, registration_date)
SELECT p.user_id, p.registration_body, p.registration_number, p.registration_expiry
FROM public.profiles p
WHERE p.registration_body IS NOT NULL
  AND p.registration_body != ''
ON CONFLICT (user_id, body_name) DO NOTHING;
