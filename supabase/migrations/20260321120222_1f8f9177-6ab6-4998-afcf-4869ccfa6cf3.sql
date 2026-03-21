-- =============================================================
-- Migration: Add SECURITY DEFINER functions for practitioner verification
-- These functions bypass RLS to allow legitimate verification operations
-- =============================================================

-- 1. Modify validate_role_changes trigger to support system-level bypass
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Allow bypass from trusted SECURITY DEFINER functions
  IF current_setting('app.bypass_role_validation', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Prevent users from modifying their own roles through direct access
  IF auth.uid() = COALESCE(NEW.user_id, OLD.user_id) THEN
    RAISE EXCEPTION 'Users cannot modify their own roles';
  END IF;

  -- Ensure only admins can create admin roles
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.role = 'admin'::app_role THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;


-- 2. Function: verify_practitioner_linkedin
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
    linkedin_profile = p_linkedin_profile,
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


-- 3. Function: upgrade_practitioner_role
CREATE OR REPLACE FUNCTION public.upgrade_practitioner_role(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_type TEXT;
  v_verification_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Can only upgrade own role';
  END IF;

  SELECT user_type, verification_status
  INTO v_user_type, v_verification_status
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_user_type != 'practitioner' THEN
    RAISE EXCEPTION 'User is not a practitioner';
  END IF;

  IF v_verification_status NOT IN ('pending_review', 'verified') THEN
    RAISE EXCEPTION 'Practitioner verification not in progress';
  END IF;

  PERFORM set_config('app.bypass_role_validation', 'true', true);

  INSERT INTO public.user_roles (user_id, role)
  SELECT p_user_id, 'mental_health_professional'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mental_health_professional'
  );
END;
$$;