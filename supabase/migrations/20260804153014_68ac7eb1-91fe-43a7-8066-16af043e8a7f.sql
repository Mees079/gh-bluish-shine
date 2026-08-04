CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team text NOT NULL DEFAULT 'staff',
  name text NOT NULL,
  discord_name text NOT NULL,
  discord_id text,
  roblox_name text NOT NULL,
  age text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_by_name text,
  reviewed_at timestamp with time zone,
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an application"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Staff can view applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_staff_member(auth.uid()));

CREATE POLICY "Staff can update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.is_staff_member(auth.uid()))
  WITH CHECK (public.is_staff_member(auth.uid()));

CREATE POLICY "Staff can delete applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (public.is_staff_member(auth.uid()));

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();