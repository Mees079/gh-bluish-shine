-- Create stats table for homepage statistics
CREATE TABLE IF NOT EXISTS public.home_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT 'Users',
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view active stats
CREATE POLICY "Anyone can view active home stats" 
ON public.home_stats 
FOR SELECT 
USING (active = true OR is_admin(auth.uid()));

-- Admins can manage stats
CREATE POLICY "Admins can manage home stats" 
ON public.home_stats 
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default stats
INSERT INTO public.home_stats (icon, label, value, display_order) VALUES
('Users', 'Actieve Community', '500+', 0),
('Server', 'Uptime', '99.9%', 1),
('Shield', 'Staff Online', '24/7', 2),
('Zap', 'Updates', 'Wekelijks', 3);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_home_stats_updated_at
BEFORE UPDATE ON public.home_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extend rules_sections to support rich content
ALTER TABLE public.rules_sections
ADD COLUMN IF NOT EXISTS subsections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS show_as_accordion BOOLEAN DEFAULT false;