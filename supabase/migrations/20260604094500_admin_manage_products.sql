-- Allow super_admin to manage all products (read, insert, update, delete)
CREATE POLICY "admin manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
