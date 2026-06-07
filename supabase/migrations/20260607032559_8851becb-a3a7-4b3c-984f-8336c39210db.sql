-- Switch has_role to SECURITY INVOKER. The existing user_roles RLS policy
-- ("users read own roles") already grants each authenticated user SELECT
-- access to their own rows, so the function still returns correct results
-- when called with auth.uid(), which is the only way it is used in policies.
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;