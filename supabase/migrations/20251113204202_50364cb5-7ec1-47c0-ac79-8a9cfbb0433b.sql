-- Add footer configuration fields to home_config
ALTER TABLE home_config 
ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT 'De beste Nederlandse Roblox roleplay server met realisme en kwaliteit.';

-- Update existing footer description to remove FiveM reference
UPDATE home_config 
SET footer_description = 'De beste Nederlandse Roblox roleplay server met realisme en kwaliteit.'
WHERE footer_description IS NULL OR footer_description LIKE '%FiveM%';