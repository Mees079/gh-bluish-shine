-- Create rules sections table for structured rules
CREATE TABLE IF NOT EXISTS public.rules_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rules_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view active rules sections
CREATE POLICY "Anyone can view active rules sections" 
ON public.rules_sections 
FOR SELECT 
USING (active = true OR is_admin(auth.uid()));

-- Admins can manage rules sections
CREATE POLICY "Admins can manage rules sections" 
ON public.rules_sections 
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default rules sections
INSERT INTO public.rules_sections (title, content, icon, display_order) VALUES
('Algemene Regels', E'1. Respecteer alle spelers en staff leden\n2. Geen FailRP - Speel je rol realistisch\n3. Geen RDM (Random Deathmatch)\n4. Geen VDM (Vehicle Deathmatch)\n5. Blijf altijd in character tijdens roleplay\n6. Gebruik geen cheats, hacks of exploits', '⚖️', 0),
('Voice Chat Regels', E'1. Microfoon kwaliteit moet acceptabel zijn\n2. Geen schreeuwen of gillen zonder roleplay reden\n3. Geen achtergrondgeluid (muziek, TV, etc.)\n4. Respecteer anderen en geen geluids spam\n5. Spreek Nederlands in de stad', '🎤', 1),
('Politie & Overheid Regels', E'1. Volg het politie protocol\n2. Geen corruptie zonder toestemming staff\n3. Gebruik wapens alleen wanneer noodzakelijk\n4. Documenteer alles correct\n5. Werk samen met collega''s', '👮', 2),
('Criminele Regels', E'1. Minimaal 4 agenten online voor bank/juwelier\n2. Geen overvallen vlak na restart\n3. Maximaal 6 personen per overval\n4. Hostages moeten realistisch behandeld worden\n5. Geen shoot on sight', '🔫', 3),
('Voertuig Regels', E'1. Rij realistisch - geen stunts zonder reden\n2. Respecteer verkeerslichten en borden\n3. Parkeer netjes en blokkeer geen spawns\n4. Geen combat logging tijdens achtervolging\n5. Schade aan voertuig moet realistisch gespeeld worden', '🚗', 4),
('Economie & Handel', E'1. Geen scammen van andere spelers\n2. Prijzen moeten realistisch zijn\n3. Handel alleen via toegestane locaties\n4. Witwassen moet realistisch verlopen\n5. Gebruik geen exploits voor geld', '💰', 5);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rules_sections_updated_at
BEFORE UPDATE ON public.rules_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();