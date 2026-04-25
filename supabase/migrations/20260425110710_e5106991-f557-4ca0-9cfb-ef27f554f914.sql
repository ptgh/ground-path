-- Allow anon + authenticated to view registrations of directory-approved practitioners.
CREATE POLICY "Public can view registrations of approved practitioners"
ON public.practitioner_registrations
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = practitioner_registrations.user_id
      AND p.user_type = 'practitioner'
      AND COALESCE(p.directory_approved, false) = true
  )
);