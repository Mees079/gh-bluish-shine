-- Create redemption_codes table for storing generated codes
CREATE TABLE public.redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by_username TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create junction table for code products (many-to-many)
CREATE TABLE public.code_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.redemption_codes(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(code_id, product_id)
);

-- Enable RLS
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for redemption_codes
CREATE POLICY "Admins can manage codes"
  ON public.redemption_codes
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for code_products
CREATE POLICY "Admins can manage code products"
  ON public.code_products
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_redemption_codes_active ON public.redemption_codes(active);
CREATE INDEX idx_redemption_codes_claimed_at ON public.redemption_codes(claimed_at);
CREATE INDEX idx_code_products_code_id ON public.code_products(code_id);