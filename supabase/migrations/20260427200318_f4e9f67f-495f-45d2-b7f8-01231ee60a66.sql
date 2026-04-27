INSERT INTO public.m365_authorised_emails (email, note)
VALUES ('ptgh@mac.com', 'Human admin login (separate from connect@groundpath.com.au service identity)')
ON CONFLICT DO NOTHING;