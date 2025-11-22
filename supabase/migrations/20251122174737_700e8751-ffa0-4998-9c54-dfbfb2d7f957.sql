-- Add sound_duration column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sound_duration integer DEFAULT NULL;