-- Restore EXECUTE on has_role for authenticated/anon. It is used inside RLS
-- policies; revoking it caused those policies to error and queries to return
-- 0 rows. has_role is SECURITY DEFINER and only reads user_roles for the
-- given user_id, so exposing it via the Data API is safe.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;