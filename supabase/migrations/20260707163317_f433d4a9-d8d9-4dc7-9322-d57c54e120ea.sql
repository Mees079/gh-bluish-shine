
CREATE TABLE public.cc_boost_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.cc_creators(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES public.cc_rewards(id) ON DELETE SET NULL,
  label text NOT NULL DEFAULT '',
  multiplier numeric NOT NULL DEFAULT 1,
  duration_minutes integer NOT NULL DEFAULT 60,
  points_spent integer NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  boost_id uuid REFERENCES public.cc_boosts(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cc_boost_inventory TO authenticated;
GRANT ALL ON public.cc_boost_inventory TO service_role;

ALTER TABLE public.cc_boost_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator can view own inventory" ON public.cc_boost_inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cc_creators c WHERE c.id = cc_boost_inventory.creator_id AND c.user_id = auth.uid())
    OR public.is_head_content_creator(auth.uid())
  );

CREATE POLICY "head cc manage inventory" ON public.cc_boost_inventory
  FOR ALL TO authenticated
  USING (public.is_head_content_creator(auth.uid()))
  WITH CHECK (public.is_head_content_creator(auth.uid()));

CREATE INDEX idx_cc_boost_inventory_creator ON public.cc_boost_inventory(creator_id, activated_at);
