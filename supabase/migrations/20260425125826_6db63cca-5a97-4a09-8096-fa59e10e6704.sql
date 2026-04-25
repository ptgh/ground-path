-- Remove Halaxy integration: rename column to a vendor-neutral name and drop unused link.
ALTER TABLE public.profiles RENAME COLUMN halaxy_integration TO booking_integration;

ALTER TABLE public.conversations DROP COLUMN IF EXISTS linked_halaxy_client_id;

-- Recreate the bookable practitioners function to return the renamed column
DROP FUNCTION IF EXISTS public.list_bookable_practitioners();

CREATE OR REPLACE FUNCTION public.list_bookable_practitioners()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, profession text, bio text, specializations text[], practice_location text, professional_verified boolean, booking_integration jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.profession,
    p.bio,
    p.specializations,
    p.practice_location,
    p.professional_verified,
    p.booking_integration
  from public.profiles p
  where p.user_type = 'practitioner'
    and coalesce(p.directory_approved, false) = true
    and p.verification_status in ('verified', 'pending_review')
    and public.has_active_practitioner_subscription(p.user_id) = true
$function$;