-- Add limited functionality and photo display options to products
ALTER TABLE products
ADD COLUMN limited boolean DEFAULT false,
ADD COLUMN limited_start_date timestamp with time zone,
ADD COLUMN limited_end_date timestamp with time zone,
ADD COLUMN photo_display_count integer DEFAULT 1 CHECK (photo_display_count >= 1 AND photo_display_count <= 4);