-- User reported no discounts active but products still have discounted_price set
-- Clear all discounted prices so storefront shows normal prices
UPDATE public.products
SET discounted_price = NULL;