CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  resolved_display_name text;
BEGIN
  resolved_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NULLIF(
      trim(concat_ws(' ',
        NEW.raw_user_meta_data ->> 'given_name',
        NEW.raw_user_meta_data ->> 'family_name'
      )), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, display_name, registration_body, registration_number, user_type)
  VALUES (
    NEW.id,
    resolved_display_name,
    NEW.raw_user_meta_data ->> 'registration_body',
    NEW.raw_user_meta_data ->> 'registration_number',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;