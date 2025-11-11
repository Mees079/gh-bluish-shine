-- Add roblox_link field to home_config
ALTER TABLE home_config 
ADD COLUMN IF NOT EXISTS roblox_link text;