-- Add rules page configuration fields to home_config
ALTER TABLE home_config
ADD COLUMN IF NOT EXISTS rules_page_title TEXT DEFAULT 'Server Regels',
ADD COLUMN IF NOT EXISTS rules_page_subtitle TEXT DEFAULT 'Selecteer een categorie om de regels te bekijken',
ADD COLUMN IF NOT EXISTS rules_warning_title TEXT DEFAULT 'Belangrijke Waarschuwing',
ADD COLUMN IF NOT EXISTS rules_warning_text TEXT DEFAULT 'Het overtreden van deze regels kan leiden tot een waarschuwing, kick, tijdelijke ban of permanente ban, afhankelijk van de ernst van de overtreding. Bij twijfel, vraag het aan een staff lid!',
ADD COLUMN IF NOT EXISTS rules_footer_text TEXT DEFAULT 'Heb je vragen over de regels? Neem contact op via Discord!';

COMMENT ON COLUMN home_config.rules_page_title IS 'Hoofd titel voor de regels pagina';
COMMENT ON COLUMN home_config.rules_page_subtitle IS 'Subtitel/omschrijving voor de regels pagina';
COMMENT ON COLUMN home_config.rules_warning_title IS 'Titel voor waarschuwing sectie';
COMMENT ON COLUMN home_config.rules_warning_text IS 'Tekst voor waarschuwing sectie';
COMMENT ON COLUMN home_config.rules_footer_text IS 'Footer tekst onderaan regels pagina';