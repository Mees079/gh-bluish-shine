
-- Staff profiles table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Staff tasks table
CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  scheduled_date date NOT NULL,
  assigned_to uuid,
  created_by uuid,
  priority text DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

-- Task updates table
CREATE TABLE IF NOT EXISTS public.staff_task_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.staff_tasks(id) ON DELETE CASCADE,
  user_id uuid,
  message text,
  file_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff_task_updates ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_staff_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('staff'::app_role,'bestuur'::app_role,'admin'::app_role,'super_admin'::app_role)) $$;

CREATE OR REPLACE FUNCTION public.is_bestuur(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('bestuur'::app_role,'admin'::app_role,'super_admin'::app_role)) $$;

-- RLS: staff_profiles
CREATE POLICY "Staff view own profile" ON public.staff_profiles FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Staff update own profile" ON public.staff_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage staff profiles" ON public.staff_profiles FOR ALL USING (is_admin(auth.uid()));

-- RLS: staff_tasks
CREATE POLICY "Staff view tasks" ON public.staff_tasks FOR SELECT USING (is_staff_member(auth.uid()));
CREATE POLICY "Staff update own tasks" ON public.staff_tasks FOR UPDATE USING (assigned_to = auth.uid() AND is_staff_member(auth.uid()));
CREATE POLICY "Admins manage tasks" ON public.staff_tasks FOR ALL USING (is_admin(auth.uid()));

-- RLS: staff_task_updates
CREATE POLICY "Staff view updates" ON public.staff_task_updates FOR SELECT USING (is_staff_member(auth.uid()));
CREATE POLICY "Staff add updates" ON public.staff_task_updates FOR INSERT WITH CHECK (is_staff_member(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Admins manage updates" ON public.staff_task_updates FOR ALL USING (is_admin(auth.uid()));
