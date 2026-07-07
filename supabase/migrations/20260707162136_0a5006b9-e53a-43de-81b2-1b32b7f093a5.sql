
CREATE TABLE IF NOT EXISTS public.cc_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.cc_creators(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  multiplier numeric NOT NULL DEFAULT 1,
  interval_seconds integer,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'admin',
  points_spent integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_boosts TO authenticated;
GRANT ALL ON public.cc_boosts TO service_role;

ALTER TABLE public.cc_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cc read boosts" ON public.cc_boosts;
CREATE POLICY "cc read boosts" ON public.cc_boosts
  FOR SELECT TO authenticated
  USING (public.is_content_creator(auth.uid()));

DROP POLICY IF EXISTS "head cc manage boosts" ON public.cc_boosts;
CREATE POLICY "head cc manage boosts" ON public.cc_boosts
  FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid()))
  WITH CHECK (public.is_head_content_creator(auth.uid()));

ALTER TABLE public.cc_rewards
  ADD COLUMN IF NOT EXISTS boost_multiplier numeric,
  ADD COLUMN IF NOT EXISTS boost_duration_minutes integer;

CREATE INDEX IF NOT EXISTS cc_boosts_ends_idx ON public.cc_boosts(ends_at);
CREATE INDEX IF NOT EXISTS cc_boosts_creator_idx ON public.cc_boosts(creator_id);
