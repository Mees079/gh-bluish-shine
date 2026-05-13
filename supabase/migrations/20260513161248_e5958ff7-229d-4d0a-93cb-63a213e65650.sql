
-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.is_meos_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('meos_politie'::app_role,'meos_dsi'::app_role,'meos_commandant'::app_role,'meos_hulpdiensten'::app_role,'meos_bestuur'::app_role))
$$;

CREATE OR REPLACE FUNCTION public.is_meos_high(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('meos_dsi'::app_role,'meos_commandant'::app_role,'meos_hulpdiensten'::app_role,'meos_bestuur'::app_role))
$$;

REVOKE EXECUTE ON FUNCTION public.is_meos_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_meos_high(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_meos_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_meos_high(uuid) TO authenticated;

-- ============ TABLES ============
CREATE TABLE public.meos_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  roblox_username text NOT NULL UNIQUE,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view profiles" ON public.meos_profiles FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos high manage profiles" ON public.meos_profiles FOR ALL USING (is_meos_high(auth.uid())) WITH CHECK (is_meos_high(auth.uid()));
CREATE POLICY "self update profile" ON public.meos_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.meos_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  roblox_username text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_login_codes ENABLE ROW LEVEL SECURITY;
-- service role only

CREATE TABLE public.meos_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_username text NOT NULL UNIQUE,
  roblox_user_id text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view persons" ON public.meos_persons FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos insert persons" ON public.meos_persons FOR INSERT WITH CHECK (is_meos_member(auth.uid()));
CREATE POLICY "meos update persons" ON public.meos_persons FOR UPDATE USING (is_meos_member(auth.uid()));

CREATE TABLE public.meos_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.meos_persons(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_username text,
  content text NOT NULL,
  photo_path text NOT NULL,
  photo_hash text NOT NULL,
  ai_verified boolean NOT NULL DEFAULT false,
  ai_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meos_notes_person ON public.meos_notes(person_id);
CREATE INDEX idx_meos_notes_hash ON public.meos_notes(photo_hash);
ALTER TABLE public.meos_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view notes" ON public.meos_notes FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos insert notes" ON public.meos_notes FOR INSERT WITH CHECK (is_meos_member(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "meos high delete notes" ON public.meos_notes FOR DELETE USING (is_meos_high(auth.uid()));
CREATE POLICY "police self delete with log" ON public.meos_notes FOR DELETE USING (is_meos_member(auth.uid()));

CREATE TABLE public.meos_arrests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.meos_persons(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_username text,
  reason text NOT NULL,
  charges text,
  photo_path text NOT NULL,
  photo_hash text NOT NULL,
  ai_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meos_arrests_person ON public.meos_arrests(person_id);
ALTER TABLE public.meos_arrests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view arrests" ON public.meos_arrests FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos insert arrests" ON public.meos_arrests FOR INSERT WITH CHECK (is_meos_member(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "meos high delete arrests" ON public.meos_arrests FOR DELETE USING (is_meos_high(auth.uid()));

CREATE TABLE public.meos_warrants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.meos_persons(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_username text,
  reason text NOT NULL,
  photo_path text NOT NULL,
  photo_hash text NOT NULL,
  ai_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_warrants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view warrants" ON public.meos_warrants FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos insert warrants" ON public.meos_warrants FOR INSERT WITH CHECK (is_meos_member(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "meos high update warrants" ON public.meos_warrants FOR UPDATE USING (is_meos_high(auth.uid()));
CREATE POLICY "meos high delete warrants" ON public.meos_warrants FOR DELETE USING (is_meos_high(auth.uid()));

CREATE TABLE public.meos_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text NOT NULL,
  photo_path text,
  user_id uuid NOT NULL,
  username text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view logs" ON public.meos_action_logs FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos insert logs" ON public.meos_action_logs FOR INSERT WITH CHECK (is_meos_member(auth.uid()) AND user_id = auth.uid());

CREATE TABLE public.meos_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'intact',
  last_signal_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view locations" ON public.meos_locations FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos high manage locations" ON public.meos_locations FOR ALL USING (is_meos_high(auth.uid())) WITH CHECK (is_meos_high(auth.uid()));

INSERT INTO public.meos_locations (name) VALUES ('Bank'), ('Juwelier'), ('Museum');

CREATE TABLE public.meos_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.meos_locations(id) ON DELETE SET NULL,
  location_name text NOT NULL,
  type text NOT NULL DEFAULT 'overval',
  status text NOT NULL DEFAULT 'active',
  details text,
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.meos_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view incidents" ON public.meos_incidents FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "meos update incidents" ON public.meos_incidents FOR UPDATE USING (is_meos_member(auth.uid()));

CREATE TABLE public.meos_scenario_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.meos_locations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meos_scenario_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meos view briefings" ON public.meos_scenario_briefings FOR SELECT USING (is_meos_member(auth.uid()));
CREATE POLICY "dsi manage briefings" ON public.meos_scenario_briefings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('meos_dsi'::app_role,'meos_commandant'::app_role,'meos_hulpdiensten'::app_role,'meos_bestuur'::app_role))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('meos_dsi'::app_role,'meos_commandant'::app_role,'meos_hulpdiensten'::app_role,'meos_bestuur'::app_role))
);

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('meos-photos', 'meos-photos', false) ON CONFLICT DO NOTHING;

CREATE POLICY "meos high view photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'meos-photos' AND is_meos_high(auth.uid())
);
CREATE POLICY "meos upload photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'meos-photos' AND is_meos_member(auth.uid())
);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.meos_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meos_locations;
