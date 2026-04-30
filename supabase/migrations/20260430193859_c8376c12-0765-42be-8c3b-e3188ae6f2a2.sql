
-- Helper: is head developer
CREATE OR REPLACE FUNCTION public.is_head_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('head_developer'::app_role, 'admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Helper: is developer member (any developer or head dev or admin)
CREATE OR REPLACE FUNCTION public.is_developer_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('developer'::app_role, 'head_developer'::app_role, 'admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Tasks
CREATE TABLE public.dev_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  additions text,
  deadline date,
  attachment_path text,
  attachment_link text,
  payment_amount numeric,
  payment_currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'open',
  claimed_by uuid,
  claimed_at timestamptz,
  submission_path text,
  submission_link text,
  submission_payment_link text,
  submission_notes text,
  submitted_at timestamptz,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers view tasks"
ON public.dev_tasks FOR SELECT
USING (public.is_developer_member(auth.uid()));

CREATE POLICY "Head devs manage tasks"
ON public.dev_tasks FOR ALL
USING (public.is_head_developer(auth.uid()))
WITH CHECK (public.is_head_developer(auth.uid()));

CREATE POLICY "Developers update own tasks"
ON public.dev_tasks FOR UPDATE
USING (public.is_developer_member(auth.uid()) AND (claimed_by = auth.uid() OR claimed_by IS NULL))
WITH CHECK (public.is_developer_member(auth.uid()));

CREATE TRIGGER update_dev_tasks_updated_at
BEFORE UPDATE ON public.dev_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments / Q&A
CREATE TABLE public.dev_task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.dev_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_head_dev boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers view comments"
ON public.dev_task_comments FOR SELECT
USING (public.is_developer_member(auth.uid()));

CREATE POLICY "Developers add comments"
ON public.dev_task_comments FOR INSERT
WITH CHECK (public.is_developer_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Head devs manage comments"
ON public.dev_task_comments FOR ALL
USING (public.is_head_developer(auth.uid()))
WITH CHECK (public.is_head_developer(auth.uid()));

-- Unclaim requests
CREATE TABLE public.dev_task_unclaim_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.dev_tasks(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_task_unclaim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers view unclaim requests"
ON public.dev_task_unclaim_requests FOR SELECT
USING (public.is_developer_member(auth.uid()));

CREATE POLICY "Developers create unclaim request"
ON public.dev_task_unclaim_requests FOR INSERT
WITH CHECK (public.is_developer_member(auth.uid()) AND auth.uid() = requested_by);

CREATE POLICY "Head devs manage unclaim requests"
ON public.dev_task_unclaim_requests FOR ALL
USING (public.is_head_developer(auth.uid()))
WITH CHECK (public.is_head_developer(auth.uid()));

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dev-files', 'dev-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Devs read dev-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'dev-files' AND public.is_developer_member(auth.uid()));

CREATE POLICY "Devs upload dev-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dev-files' AND public.is_developer_member(auth.uid()));

CREATE POLICY "Head devs manage dev-files"
ON storage.objects FOR ALL
USING (bucket_id = 'dev-files' AND public.is_head_developer(auth.uid()))
WITH CHECK (bucket_id = 'dev-files' AND public.is_head_developer(auth.uid()));

CREATE POLICY "Devs delete own dev-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'dev-files' AND owner = auth.uid());
