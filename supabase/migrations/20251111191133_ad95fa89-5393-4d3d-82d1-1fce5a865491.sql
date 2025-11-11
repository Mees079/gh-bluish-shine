-- Create home_config table for homepage settings
CREATE TABLE IF NOT EXISTS public.home_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_image_url TEXT,
  banner_title TEXT DEFAULT 'Welkom bij onze Shop',
  banner_subtitle TEXT,
  discord_link TEXT,
  rules_content TEXT,
  show_banner BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view home config
CREATE POLICY "Home config is viewable by everyone" 
ON public.home_config 
FOR SELECT 
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can update home config" 
ON public.home_config 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Insert default config
INSERT INTO public.home_config (banner_title, banner_subtitle, discord_link, rules_content)
VALUES (
  'Welkom bij onze Shop',
  'Ontdek onze exclusieve producten',
  'https://discord.gg/yourserver',
  '## Regels\n\n1. Respecteer anderen\n2. Geen spam\n3. Volg de Discord richtlijnen'
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_home_config_updated_at
BEFORE UPDATE ON public.home_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();