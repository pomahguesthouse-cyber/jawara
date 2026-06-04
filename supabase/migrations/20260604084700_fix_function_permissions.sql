-- Grant execute permissions on functions to authenticated and anon users
-- to ensure RLS policies and table triggers can execute successfully.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO authenticated, anon;
