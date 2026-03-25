CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, display_name, registration_body, registration_number,
    user_type, organisation, years_experience,
    professional_verified, verification_method, verification_status
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'registration_body',
    NEW.raw_user_meta_data ->> 'registration_number',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user'),
    NEW.raw_user_meta_data ->> 'organisation',
    (NEW.raw_user_meta_data ->> 'years_experience')::integer,
    COALESCE((NEW.raw_user_meta_data ->> 'professional_verified')::boolean, false),
    NEW.raw_user_meta_data ->> 'verification_method',
    COALESCE(NEW.raw_user_meta_data ->> 'verification_status', 'unverified')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(
      EXCLUDED.display_name,
      profiles.display_name
    );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;