-- The original admin policy only allowed users that had the super_admin
-- role row in public.user_roles. ical.smg@gmail.com is recognised as an
-- admin by the app via the email check, so align the DB policy with the
-- same fallback used by hero_slides / hero_media_library.

DROP POLICY IF EXISTS "admin manage categories" ON public.categories;

CREATE POLICY "admin manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
  );

-- Re-ensure the admin email actually owns the super_admin role, in case
-- the earlier 20260604095100 migration was skipped in some environment.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'ical.smg@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
