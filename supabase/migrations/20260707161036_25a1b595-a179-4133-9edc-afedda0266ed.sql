
ALTER TABLE public.cc_creators
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_point_awarded_at timestamptz;

ALTER TABLE public.cc_rewards
  ADD COLUMN IF NOT EXISTS points_required integer NOT NULL DEFAULT 4;

ALTER TABLE public.cc_reward_claims
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS points_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS cc_reward_claims_code_key ON public.cc_reward_claims(code) WHERE code IS NOT NULL;
