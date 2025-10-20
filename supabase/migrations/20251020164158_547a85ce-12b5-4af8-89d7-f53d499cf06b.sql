-- Add scheduled_start field to redemption_codes
ALTER TABLE public.redemption_codes
ADD COLUMN scheduled_start TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add index for scheduled queries
CREATE INDEX idx_redemption_codes_scheduled_start ON public.redemption_codes(scheduled_start);

-- Update existing codes to have scheduled_start set to created_at
UPDATE public.redemption_codes
SET scheduled_start = created_at
WHERE scheduled_start IS NULL;