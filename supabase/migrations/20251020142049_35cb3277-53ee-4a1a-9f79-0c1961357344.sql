-- Add coming_soon field to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS coming_soon boolean DEFAULT false;

-- Add discounted_price field to products for discount system
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discounted_price numeric;

-- Update discounts table to support shop-wide, category-wide, and product-specific discounts
ALTER TABLE public.discounts 
ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'product' CHECK (applies_to IN ('shop', 'category', 'product'));

-- Add index for better performance on coming_soon and discounted_price queries
CREATE INDEX IF NOT EXISTS idx_products_coming_soon ON public.products(coming_soon);
CREATE INDEX IF NOT EXISTS idx_products_discounted_price ON public.products(discounted_price) WHERE discounted_price IS NOT NULL;