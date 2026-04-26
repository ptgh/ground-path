-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Fixes: profiles PII leak, mailing_list token enumeration,
-- user_roles anon insert, storage update/delete policies,
-- contact_forms read access clarity.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES — lock down PII, expose safe fields via view
-- ------------------------------------------------------------

-- Drop the dangerous public-read policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Own profile readable
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can view profiles of users they have an active conversation
-- or booking with (so messaging/booking still works)
CREATE POLICY "Practitioners can view linked client profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.practitioner_id = auth.uid() AND c.user_id = profiles.user_id)
         OR (c.user_id = auth.uid() AND c.practitioner_id = profiles.user_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.booking_requests b
      WHERE (b.practitioner_id = auth.uid() AND b.client_user_id = profiles.user_id)
         OR (b.client_user_id = auth.uid() AND b.practitioner_id = profiles.user_id)
    )
  );

-- Public-safe view: ONLY directory-appropriate fields, only for approved practitioners
CREATE OR REPLACE VIEW public.profiles_public
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
  booking_integration,
  created_at
FROM public.profiles
WHERE user_type = 'practitioner'
  AND COALESCE(directory_approved, false) = true;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Helper RPC to fetch a single safe profile by user_id (used by messaging
-- popovers and conversation lists, returns only safe fields).
CREATE OR REPLACE FUNCTION public.get_messaging_profile(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  user_type text,
  profession text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return data if the caller has a conversation with this user
  -- (or is the user themselves, or is an admin)
  SELECT p.user_id, p.display_name, p.avatar_url, p.user_type, p.profession
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND (
      auth.uid() = _user_id
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE (c.practitioner_id = auth.uid() AND c.user_id = _user_id)
           OR (c.user_id = auth.uid() AND c.practitioner_id = _user_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.booking_requests b
        WHERE (b.practitioner_id = auth.uid() AND b.client_user_id = _user_id)
           OR (b.client_user_id = auth.uid() AND b.practitioner_id = _user_id)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_profile(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 2. MAILING_LIST — stop token enumeration
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Enable subscription confirmation reads" ON public.mailing_list;
DROP POLICY IF EXISTS "Enable subscription updates" ON public.mailing_list;

-- Admin SELECT for the admin mailing list dashboard
CREATE POLICY "Admins can view mailing list"
  ON public.mailing_list
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Token-based confirm/unsubscribe via SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.confirm_mailing_subscription(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.mailing_list;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  UPDATE public.mailing_list
  SET status = 'active', confirmation_token = NULL, updated_at = now()
  WHERE confirmation_token = _token
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'email', v_row.email);
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_mailing(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.mailing_list;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  UPDATE public.mailing_list
  SET status = 'unsubscribed', updated_at = now()
  WHERE unsubscribe_token = _token
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'email', v_row.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_mailing_subscription(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_mailing(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 3. USER_ROLES — close the anon insert hole
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "System can assign default roles" ON public.user_roles;
-- handle_new_user() trigger uses SECURITY DEFINER and bypasses RLS,
-- so no anon-facing insert policy is needed at all.

-- ------------------------------------------------------------
-- 4. STORAGE — add UPDATE/DELETE for documents bucket
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can update own documents'
  ) THEN
    CREATE POLICY "Users can update own documents"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can delete own documents'
  ) THEN
    CREATE POLICY "Users can delete own documents"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. CONTACT_FORMS — explicit admin-only SELECT
-- ------------------------------------------------------------

CREATE POLICY "Admins can view contact forms"
  ON public.contact_forms
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
