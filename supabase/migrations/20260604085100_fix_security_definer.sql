-- Fix: Make has_role run as SECURITY DEFINER so it always executes under
-- the function owner's privileges (postgres), bypassing caller permission checks.
-- This is the correct Supabase pattern for RLS helper functions.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Also ensure the trigger function is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

-- Grant execute to service_role explicitly
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO service_role, authenticated, anon;
