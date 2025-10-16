-- Allow users to read their own role row to enable admin-gating on login
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);