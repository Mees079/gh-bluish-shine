
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'meos_politie';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'meos_dsi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'meos_commandant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'meos_hulpdiensten';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'meos_bestuur';
