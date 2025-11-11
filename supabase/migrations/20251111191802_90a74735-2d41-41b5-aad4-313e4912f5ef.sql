-- Extend home_config for multiple sections and professional layout
ALTER TABLE public.home_config
ADD COLUMN hero_image_url TEXT,
ADD COLUMN hero_title TEXT DEFAULT 'HDRP Hoofddorp Roleplay',
ADD COLUMN hero_subtitle TEXT DEFAULT 'De ultieme roleplay ervaring',
ADD COLUMN hero_cta_text TEXT DEFAULT 'Start Nu',
ADD COLUMN hero_cta_link TEXT,
ADD COLUMN about_title TEXT DEFAULT 'Over HDRP',
ADD COLUMN about_content TEXT,
ADD COLUMN about_image_url TEXT,
ADD COLUMN features_title TEXT DEFAULT 'Wat Bieden Wij',
ADD COLUMN feature_1_title TEXT DEFAULT 'Actieve Community',
ADD COLUMN feature_1_description TEXT DEFAULT 'Doe mee met onze levendige community',
ADD COLUMN feature_1_icon TEXT DEFAULT '🎮',
ADD COLUMN feature_2_title TEXT DEFAULT 'Realistische Roleplay',
ADD COLUMN feature_2_description TEXT DEFAULT 'Ervaar echte roleplay',
ADD COLUMN feature_2_icon TEXT DEFAULT '🎭',
ADD COLUMN feature_3_title TEXT DEFAULT 'Unieke Scripts',
ADD COLUMN feature_3_description TEXT DEFAULT 'Custom features en systemen',
ADD COLUMN feature_3_icon TEXT DEFAULT '⚡',
ADD COLUMN gallery_title TEXT DEFAULT 'Galerij',
ADD COLUMN show_gallery BOOLEAN DEFAULT true,
ADD COLUMN cta_section_title TEXT DEFAULT 'Klaar Om Te Starten?',
ADD COLUMN cta_section_description TEXT DEFAULT 'Join onze Discord en begin met spelen!',
ADD COLUMN cta_button_text TEXT DEFAULT 'Join Discord',
ADD COLUMN show_about_section BOOLEAN DEFAULT true,
ADD COLUMN show_features_section BOOLEAN DEFAULT true,
ADD COLUMN show_cta_section BOOLEAN DEFAULT true;

-- Create gallery images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gallery
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Gallery policies
CREATE POLICY "Anyone can view active gallery images" 
ON public.gallery_images 
FOR SELECT 
USING (active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage gallery images" 
ON public.gallery_images 
FOR ALL
USING (is_admin(auth.uid()));

-- Update default home_config
UPDATE public.home_config
SET 
  hero_title = 'HDRP Hoofddorp Roleplay',
  hero_subtitle = 'De ultieme roleplay ervaring in FiveM',
  about_title = 'Over HDRP',
  about_content = 'HDRP is een Nederlandse FiveM roleplay server waar realisme en kwaliteit centraal staan. Met een toegewijde community en unieke features bieden wij de beste roleplay ervaring.',
  features_title = 'Wat Bieden Wij',
  cta_section_title = 'Klaar Om Te Beginnen?',
  cta_section_description = 'Join onze Discord community en ontdek de beste roleplay server van Nederland!'
WHERE id IS NOT NULL;