-- Fix: Update verify_practitioner_linkedin to preserve manually-entered linkedin_profile
CREATE OR REPLACE FUNCTION public.verify_practitioner_linkedin(
  p_user_id UUID,
  p_professional_verified BOOLEAN,
  p_verification_status TEXT,
  p_linkedin_verified_data JSONB,
  p_linkedin_profile TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_type INTO v_user_type FROM public.profiles WHERE user_id = p_user_id;
  IF v_user_type IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF v_user_type != 'practitioner' THEN
    RAISE EXCEPTION 'User is not a practitioner';
  END IF;

  UPDATE public.profiles
  SET
    professional_verified = p_professional_verified,
    verification_method = 'linkedin',
    verification_status = p_verification_status,
    linkedin_verified_data = p_linkedin_verified_data,
    linkedin_profile = CASE
      WHEN p_linkedin_profile IS NOT NULL THEN p_linkedin_profile
      ELSE linkedin_profile
    END,
    display_name = CASE
      WHEN p_display_name IS NOT NULL AND (display_name IS NULL OR display_name = '')
      THEN p_display_name
      ELSE display_name
    END
  WHERE user_id = p_user_id;

  IF p_professional_verified THEN
    PERFORM set_config('app.bypass_role_validation', 'true', true);

    INSERT INTO public.user_roles (user_id, role)
    SELECT p_user_id, 'mental_health_professional'::app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_user_id AND role = 'mental_health_professional'
    );
  END IF;
END;
$$;

-- Cleanup: clear avatar URLs mistakenly stored as linkedin_profile
UPDATE public.profiles
SET linkedin_profile = NULL
WHERE linkedin_profile LIKE '%media.licdn.com%'
   OR linkedin_profile LIKE '%profile-displayphoto%';

-- Cleanup: rename profile_url to avatar_url in linkedin_verified_data JSONB
UPDATE public.profiles
SET linkedin_verified_data = (
  linkedin_verified_data - 'profile_url'
) || jsonb_build_object('avatar_url',
  CASE
    WHEN linkedin_verified_data->>'profile_url' LIKE '%media.licdn.com%'
    THEN linkedin_verified_data->>'profile_url'
    WHEN linkedin_verified_data->>'profile_url' LIKE '%licdn.com%'
    THEN linkedin_verified_data->>'profile_url'
    ELSE NULL
  END
)
WHERE linkedin_verified_data IS NOT NULL
  AND linkedin_verified_data->>'profile_url' IS NOT NULL;