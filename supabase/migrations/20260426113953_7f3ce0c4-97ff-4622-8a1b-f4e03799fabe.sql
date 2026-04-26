-- Add public credential fields to the directory view.
-- These are credentials practitioners publicly display for verification.
-- Sensitive fields (insurance, contact info, emergency contact, license_number) stay restricted.
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id,
  display_name,
  avatar_url,
  bio,
  profession,
  specializations,
  practice_location,
  professional_verified,
  user_type,
  qualifications,
  years_experience,
  registration_country,
  ahpra_profession,
  ahpra_number,
  aasw_membership_number,
  swe_registration_number,
  registration_body,
  registration_number,
  booking_integration,
  created_at
FROM public.profiles
WHERE user_type = 'practitioner'
  AND COALESCE(directory_approved, false) = true;

GRANT SELECT ON public.profiles_public TO anon, authenticated;