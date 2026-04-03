
-- Fix staff_profiles: bestuur needs to see all profiles
CREATE POLICY "Bestuur can view all staff profiles"
ON public.staff_profiles
FOR SELECT
USING (public.is_bestuur(auth.uid()));

-- Fix staff_tasks: bestuur needs full CRUD
CREATE POLICY "Bestuur manage tasks"
ON public.staff_tasks
FOR ALL
USING (public.is_bestuur(auth.uid()))
WITH CHECK (public.is_bestuur(auth.uid()));

-- Fix staff_task_updates: bestuur needs full management
CREATE POLICY "Bestuur manage updates"
ON public.staff_task_updates
FOR ALL
USING (public.is_bestuur(auth.uid()))
WITH CHECK (public.is_bestuur(auth.uid()));

-- Fix staff_hours: any staff member can insert hours for others (for the weekly task)
DROP POLICY IF EXISTS "Staff insert own hours" ON public.staff_hours;
CREATE POLICY "Staff insert hours"
ON public.staff_hours
FOR INSERT
WITH CHECK (public.is_staff_member(auth.uid()));

-- Staff can also update any hours (coordinatie fills in for everyone)
DROP POLICY IF EXISTS "Staff update own hours" ON public.staff_hours;
CREATE POLICY "Staff update hours"
ON public.staff_hours
FOR UPDATE
USING (public.is_staff_member(auth.uid()));

-- All staff can view all hours
DROP POLICY IF EXISTS "Staff view own hours" ON public.staff_hours;
CREATE POLICY "Staff view all hours"
ON public.staff_hours
FOR SELECT
USING (public.is_staff_member(auth.uid()));
