ALTER TABLE public.cc_creators ADD COLUMN IF NOT EXISTS login_username text;
UPDATE public.cc_creators SET login_username = twitch_username WHERE login_username IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cc_creators_login_username_key ON public.cc_creators (lower(login_username));