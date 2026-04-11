
-- Add person_name for free-text name entry
ALTER TABLE public.staff_hours ADD COLUMN person_name text;

-- Add submitted_by to track who entered the hours
ALTER TABLE public.staff_hours ADD COLUMN submitted_by uuid;
