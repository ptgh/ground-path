
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
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'registration_body',
    NEW.raw_user_meta_data ->> 'registration_number',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user'),
    NEW.raw_user_meta_data ->> 'organisation',
    (NEW.raw_user_meta_data ->> 'years_experience')::integer,
    COALESCE((NEW.raw_user_meta_data ->> 'professional_verified')::boolean, false),
    NEW.raw_user_meta_data ->> 'verification_method',
    COALESCE(NEW.raw_user_meta_data ->> 'verification_status', 'unverified')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
