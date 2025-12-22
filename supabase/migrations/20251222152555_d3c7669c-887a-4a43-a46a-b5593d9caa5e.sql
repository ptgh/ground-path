-- Add new professional registration fields for UK and Australia
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS aasw_membership_number text,
ADD COLUMN IF NOT EXISTS swe_registration_number text,
ADD COLUMN IF NOT EXISTS registration_country text DEFAULT 'AU';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.aasw_membership_number IS 'Australian Association of Social Workers membership number';
COMMENT ON COLUMN public.profiles.swe_registration_number IS 'Social Work England registration number (format: SW followed by digits)';
COMMENT ON COLUMN public.profiles.registration_country IS 'Country of practice: AU (Australia), UK (United Kingdom), or BOTH';