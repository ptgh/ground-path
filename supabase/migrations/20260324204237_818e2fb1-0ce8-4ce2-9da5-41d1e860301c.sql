-- Approve Paul's practitioner account for directory listing
UPDATE public.profiles SET directory_approved = true WHERE user_id = 'a05946fe-b6d0-4d62-a9e5-794085e528fd';

-- Bypass role validation to assign admin role
SELECT set_config('app.bypass_role_validation', 'true', true);
INSERT INTO public.user_roles (user_id, role) VALUES ('a05946fe-b6d0-4d62-a9e5-794085e528fd', 'admin') ON CONFLICT (user_id, role) DO NOTHING;