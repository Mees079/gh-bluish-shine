
-- Add new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_content_creator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_creator';
