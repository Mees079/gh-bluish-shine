-- Fix infinite recursion in user_roles RLS policies
-- Replace function-based policies with direct EXISTS queries

DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Admins can view all user roles" ON user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admins can manage user roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Fix discount codes exposure
-- Remove public access to prevent enumeration attacks
DROP POLICY IF EXISTS "Anyone can view active discounts" ON discounts;

CREATE POLICY "Only admins can view discounts" ON discounts
FOR SELECT USING (is_admin(auth.uid()));