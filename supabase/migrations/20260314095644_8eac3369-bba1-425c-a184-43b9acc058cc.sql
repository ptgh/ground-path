
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_method text DEFAULT null,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS organisation text DEFAULT null,
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS linkedin_verified_data jsonb DEFAULT null;
