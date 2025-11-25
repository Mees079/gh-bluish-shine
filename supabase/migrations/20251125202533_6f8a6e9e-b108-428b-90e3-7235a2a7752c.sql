-- Add stock_quantity column to products table
ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT NULL;

COMMENT ON COLUMN products.stock_quantity IS 'Number of items in stock. NULL means unlimited stock.';