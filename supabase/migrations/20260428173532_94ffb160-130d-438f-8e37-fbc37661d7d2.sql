
-- 1. Add start_date to staff_absences
ALTER TABLE public.staff_absences 
  ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT CURRENT_DATE;

-- 2. Allow all staff members to see all staff profiles (fix "Onbekend" names for coordinatie)
DROP POLICY IF EXISTS "Staff view own profile" ON public.staff_profiles;
DROP POLICY IF EXISTS "Bestuur can view all staff profiles" ON public.staff_profiles;

CREATE POLICY "Staff can view all staff profiles"
ON public.staff_profiles
FOR SELECT
USING (public.is_staff_member(auth.uid()) OR public.is_admin(auth.uid()));

-- 3. Allow any staff member to claim/take over tasks (so they can take over a colleague's task)
DROP POLICY IF EXISTS "Staff update own tasks" ON public.staff_tasks;

CREATE POLICY "Staff can update tasks"
ON public.staff_tasks
FOR UPDATE
USING (public.is_staff_member(auth.uid()));

-- 4. Allow any staff member to update task_requests (so they can accept overname)
DROP POLICY IF EXISTS "Staff take requests" ON public.staff_task_requests;
CREATE POLICY "Staff update requests"
ON public.staff_task_requests
FOR UPDATE
USING (public.is_staff_member(auth.uid()));

-- 5. Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 6. Function to schedule the next 5 weeks of "Week uren" tasks
CREATE OR REPLACE FUNCTION public.schedule_weekly_uren_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_offset int;
  target_sunday date;
  target_week_start date;
  random_coordinator uuid;
  task_exists boolean;
BEGIN
  FOR week_offset IN 0..4 LOOP
    -- Compute the Sunday for week (current+offset)
    target_week_start := date_trunc('week', CURRENT_DATE + (week_offset * 7))::date;
    target_sunday := target_week_start + 6;

    -- Skip if a "Week uren" task already exists for that Sunday
    SELECT EXISTS(
      SELECT 1 FROM public.staff_tasks 
      WHERE scheduled_date = target_sunday 
        AND lower(title) LIKE 'week uren%'
    ) INTO task_exists;

    IF NOT task_exists THEN
      -- Pick a random coordinator (or any staff member if no coordinatie role)
      SELECT ur.user_id INTO random_coordinator
      FROM public.user_roles ur
      WHERE ur.role = 'coordinatie'
      ORDER BY random()
      LIMIT 1;

      INSERT INTO public.staff_tasks (title, description, scheduled_date, assigned_to, priority, status)
      VALUES (
        'Week uren',
        'Vul de uren in van alle medewerkers voor deze week. Vergeet niet om in Discord de promoties en inactiviteit waarschuwingen door te voeren!',
        target_sunday,
        random_coordinator,
        'normal',
        'open'
      );
    END IF;
  END LOOP;
END;
$$;

-- 7. Schedule cron job: every Sunday at 00:05 UTC
SELECT cron.unschedule('schedule-weekly-uren-tasks') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'schedule-weekly-uren-tasks');

SELECT cron.schedule(
  'schedule-weekly-uren-tasks',
  '5 0 * * 0',
  $$ SELECT public.schedule_weekly_uren_tasks(); $$
);

-- Run once now to seed the next 5 weeks
SELECT public.schedule_weekly_uren_tasks();
