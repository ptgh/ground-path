REVOKE ALL ON FUNCTION public.is_m365_authorised(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_m365_authorised(uuid) TO authenticated, service_role;