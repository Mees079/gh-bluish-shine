-- Public read access for website/shop content through the Data API
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.home_config TO anon;
GRANT SELECT ON public.home_stats TO anon;
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT ON public.rules_sections TO anon;

-- Authenticated users need Data API privileges; RLS still restricts management to admins.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO authenticated;

-- Service role access for functions/admin operations.
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_images TO service_role;
GRANT ALL ON public.home_config TO service_role;
GRANT ALL ON public.home_stats TO service_role;
GRANT ALL ON public.gallery_images TO service_role;
GRANT ALL ON public.rules_sections TO service_role;
GRANT ALL ON public.discounts TO service_role;

-- Admin-only policies must only run for authenticated users, otherwise public visitors
-- can hit permission errors when role-check functions are evaluated in public policies.
ALTER POLICY "Admins can manage categories" ON public.categories TO authenticated;
ALTER POLICY "Admins can manage products" ON public.products TO authenticated;
ALTER POLICY "Admins can manage product images" ON public.product_images TO authenticated;
ALTER POLICY "Admins can delete home config" ON public.home_config TO authenticated;
ALTER POLICY "Admins can insert home config" ON public.home_config TO authenticated;
ALTER POLICY "Admins can update home config" ON public.home_config TO authenticated;
ALTER POLICY "Admins can manage home stats" ON public.home_stats TO authenticated;
ALTER POLICY "Admins can manage gallery images" ON public.gallery_images TO authenticated;
ALTER POLICY "Admins can manage rules sections" ON public.rules_sections TO authenticated;
ALTER POLICY "Admins can manage discounts" ON public.discounts TO authenticated;
ALTER POLICY "Only admins can view discounts" ON public.discounts TO authenticated;

-- Public read policies should not call admin-check functions.
ALTER POLICY "Anyone can view categories" ON public.categories TO anon, authenticated USING (true);
ALTER POLICY "Anyone can view product images" ON public.product_images TO anon, authenticated USING (true);
ALTER POLICY "Anyone can view home config" ON public.home_config TO anon, authenticated USING (true);
ALTER POLICY "Public can view active products" ON public.products TO anon, authenticated USING (active = true);
ALTER POLICY "Anyone can view active home stats" ON public.home_stats TO anon, authenticated USING (active = true);
ALTER POLICY "Anyone can view active gallery images" ON public.gallery_images TO anon, authenticated USING (active = true);
ALTER POLICY "Anyone can view active rules sections" ON public.rules_sections TO anon, authenticated USING (active = true);