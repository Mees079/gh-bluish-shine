
-- 1) Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
