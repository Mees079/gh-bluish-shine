-- Fix infinite recursion in home_config RLS policies
DROP POLICY IF EXISTS "Admins can update home config" ON public.home_config;
DROP POLICY IF EXISTS "Home config is viewable by everyone" ON public.home_config;

-- Create new, simpler policies
CREATE POLICY "Anyone can view home config" 
ON public.home_config 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert home config" 
ON public.home_config 
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update home config" 
ON public.home_config 
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete home config" 
ON public.home_config 
FOR DELETE
USING (is_admin(auth.uid()));