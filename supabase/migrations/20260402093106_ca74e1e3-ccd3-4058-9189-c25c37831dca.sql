update public.profiles
set profession = 'Social Worker',
    aasw_membership_number = '486997',
    swe_registration_number = 'SW134920',
    updated_at = now()
where user_id = (
  select id
  from auth.users
  where email = 'ptgh@mac.com'
);