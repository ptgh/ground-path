-- Add responded_at column to contact_forms for admin intake tracking
ALTER TABLE public.contact_forms
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Allow admins to update contact_forms rows (mark responded, etc.)
DROP POLICY IF EXISTS "Admins can update contact forms" ON public.contact_forms;
CREATE POLICY "Admins can update contact forms"
  ON public.contact_forms
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index to speed admin queries that filter by status + age
CREATE INDEX IF NOT EXISTS idx_contact_forms_status_created
  ON public.contact_forms (status, created_at DESC);