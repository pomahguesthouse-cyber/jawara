-- Drop overly-permissive policies on events
DROP POLICY IF EXISTS "events creator manage" ON public.events;
DROP POLICY IF EXISTS "events public read" ON public.events;
DROP POLICY IF EXISTS "events admin all" ON public.events;

-- Public read: anyone can view events
CREATE POLICY "events public read"
ON public.events
FOR SELECT
USING (true);

-- Only super_admin can insert/update/delete events
CREATE POLICY "events admin manage"
ON public.events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));