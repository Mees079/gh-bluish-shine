
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_content_creator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id
    AND role IN ('content_creator'::app_role,'head_content_creator'::app_role,'admin'::app_role,'super_admin'::app_role))
$$;

CREATE OR REPLACE FUNCTION public.is_head_content_creator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id
    AND role IN ('head_content_creator'::app_role,'admin'::app_role,'super_admin'::app_role))
$$;

REVOKE EXECUTE ON FUNCTION public.is_content_creator(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_head_content_creator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_content_creator(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_head_content_creator(uuid) TO authenticated, service_role;

-- Creators
CREATE TABLE public.cc_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  twitch_username text NOT NULL UNIQUE,
  display_name text,
  twitch_user_id text,
  is_active boolean NOT NULL DEFAULT true,
  total_seconds bigint NOT NULL DEFAULT 0,
  is_currently_live boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_creators TO authenticated;
GRANT ALL ON public.cc_creators TO service_role;
ALTER TABLE public.cc_creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc read" ON public.cc_creators FOR SELECT TO authenticated
  USING (public.is_content_creator(auth.uid()));
CREATE POLICY "cc head manage" ON public.cc_creators FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid())) WITH CHECK (public.is_head_content_creator(auth.uid()));

CREATE TRIGGER trg_cc_creators_updated BEFORE UPDATE ON public.cc_creators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Live sessions
CREATE TABLE public.cc_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.cc_creators(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  stream_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_live_sessions TO authenticated;
GRANT ALL ON public.cc_live_sessions TO service_role;
ALTER TABLE public.cc_live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ls read" ON public.cc_live_sessions FOR SELECT TO authenticated
  USING (public.is_content_creator(auth.uid()));
CREATE POLICY "ls head manage" ON public.cc_live_sessions FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid())) WITH CHECK (public.is_head_content_creator(auth.uid()));

-- Rewards config (shared)
CREATE TABLE public.cc_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hours_required integer NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_rewards TO authenticated;
GRANT ALL ON public.cc_rewards TO service_role;
ALTER TABLE public.cc_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rw read" ON public.cc_rewards FOR SELECT TO authenticated
  USING (public.is_content_creator(auth.uid()));
CREATE POLICY "rw head manage" ON public.cc_rewards FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid())) WITH CHECK (public.is_head_content_creator(auth.uid()));

CREATE TRIGGER trg_cc_rewards_updated BEFORE UPDATE ON public.cc_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reward claims
CREATE TABLE public.cc_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.cc_creators(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.cc_rewards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'claimed',
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id, reward_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_reward_claims TO authenticated;
GRANT ALL ON public.cc_reward_claims TO service_role;
ALTER TABLE public.cc_reward_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rc read" ON public.cc_reward_claims FOR SELECT TO authenticated
  USING (public.is_content_creator(auth.uid()));
CREATE POLICY "rc creator claim" ON public.cc_reward_claims FOR INSERT TO authenticated
  WITH CHECK (
    public.is_content_creator(auth.uid())
    AND EXISTS (SELECT 1 FROM public.cc_creators c WHERE c.id = creator_id AND (c.user_id = auth.uid() OR public.is_head_content_creator(auth.uid())))
  );
CREATE POLICY "rc head manage" ON public.cc_reward_claims FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid())) WITH CHECK (public.is_head_content_creator(auth.uid()));
