-- Set user roles: Make ical.smg@gmail.com a super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'ical.smg@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
