-- Add is_new and sound_url columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sound_url text;