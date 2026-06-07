
-- 1. Remove overly permissive INSERT policy on categories (privilege escalation)
DROP POLICY IF EXISTS "authenticated_insert_categories" ON public.categories;

-- 2. Lock down SECURITY DEFINER functions: not callable via the Data API.
-- has_role is only used inside RLS policies (where the policy owner privileges apply).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

-- 3. Stop public bucket listing via storage API. Direct public URLs still work
-- because the buckets remain marked public; only the broad SELECT-listing policy is removed.
DROP POLICY IF EXISTS "hero-media public read" ON storage.objects;
DROP POLICY IF EXISTS "umkm_assets public read" ON storage.objects;
