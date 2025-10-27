-- Add is_test_code column to redemption_codes
ALTER TABLE public.redemption_codes 
ADD COLUMN is_test_code boolean NOT NULL DEFAULT false;

-- Create code_claims table to track all claims with amounts
CREATE TABLE public.code_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id uuid NOT NULL REFERENCES public.redemption_codes(id) ON DELETE CASCADE,
  code text NOT NULL,
  claimed_by_username text NOT NULL,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  total_amount numeric NOT NULL,
  total_discount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL,
  products_data jsonb NOT NULL,
  is_test_claim boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_claims ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins
CREATE POLICY "Admins can manage code claims"
ON public.code_claims
FOR ALL
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_code_claims_claimed_at ON public.code_claims(claimed_at);
CREATE INDEX idx_code_claims_is_test ON public.code_claims(is_test_claim);

COMMENT ON TABLE public.code_claims IS 'Tracks all code claims with financial data for statistics';