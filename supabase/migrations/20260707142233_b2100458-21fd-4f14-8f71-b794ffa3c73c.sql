ALTER TABLE public.cc_creators
  ADD COLUMN IF NOT EXISTS roblox_username text,
  ADD COLUMN IF NOT EXISTS is_in_game boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_ingame_ping_at timestamptz;

CREATE INDEX IF NOT EXISTS cc_creators_roblox_username_idx ON public.cc_creators (lower(roblox_username));