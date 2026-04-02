
-- Rename staff enum value to coordinatie
ALTER TYPE public.app_role RENAME VALUE 'staff' TO 'coordinatie';

-- Update is_staff_member function to use coordinatie
CREATE OR REPLACE FUNCTION public.is_staff_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('coordinatie'::app_role, 'bestuur'::app_role, 'admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Staff Announcements (mededelingen)
CREATE TABLE public.staff_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  message text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view announcements" ON public.staff_announcements FOR SELECT USING (is_staff_member(auth.uid()));
CREATE POLICY "Bestuur can manage announcements" ON public.staff_announcements FOR ALL USING (is_bestuur(auth.uid()));

CREATE TRIGGER update_staff_announcements_updated_at
BEFORE UPDATE ON public.staff_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Staff Absences (afmeldingen)
CREATE TABLE public.staff_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text,
  end_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view absences" ON public.staff_absences FOR SELECT USING (is_staff_member(auth.uid()));
CREATE POLICY "Staff create own absence" ON public.staff_absences FOR INSERT WITH CHECK (is_staff_member(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Staff update own absence" ON public.staff_absences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Bestuur manage absences" ON public.staff_absences FOR ALL USING (is_bestuur(auth.uid()));

-- Staff Hours (urenregistratie)
CREATE TABLE public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view own hours" ON public.staff_hours FOR SELECT USING (auth.uid() = user_id OR is_bestuur(auth.uid()));
CREATE POLICY "Staff insert own hours" ON public.staff_hours FOR INSERT WITH CHECK (is_staff_member(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Staff update own hours" ON public.staff_hours FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Bestuur manage hours" ON public.staff_hours FOR ALL USING (is_bestuur(auth.uid()));

-- Staff Task Requests (overdrachtsverzoeken)
CREATE TABLE public.staff_task_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.staff_tasks(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  taken_by uuid,
  request_type text NOT NULL DEFAULT 'cannot_do',
  message text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_task_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view requests" ON public.staff_task_requests FOR SELECT USING (is_staff_member(auth.uid()));
CREATE POLICY "Staff create requests" ON public.staff_task_requests FOR INSERT WITH CHECK (is_staff_member(auth.uid()) AND auth.uid() = requested_by);
CREATE POLICY "Staff take requests" ON public.staff_task_requests FOR UPDATE USING (is_staff_member(auth.uid()));
CREATE POLICY "Bestuur manage requests" ON public.staff_task_requests FOR ALL USING (is_bestuur(auth.uid()));
