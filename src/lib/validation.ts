import { z } from "zod";

// Product validation schema
export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional().nullable(),
  details: z.string().trim().max(5000, "Details must be less than 5000 characters").optional().nullable(),
  price: z.number().positive("Price must be positive").max(999999.99, "Price is too high"),
  category_id: z.string().uuid("Invalid category"),
  active: z.boolean(),
  coming_soon: z.boolean(),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  label: z.string().trim().min(1, "Label is required").max(100, "Label must be less than 100 characters"),
  icon: z.string().trim().min(1, "Icon is required").max(50, "Icon name must be less than 50 characters"),
});

// Discount validation schema
export const discountSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(50, "Code must be less than 50 characters"),
  percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100").optional().nullable(),
  fixed_amount: z.number().min(0, "Amount cannot be negative").max(999999.99, "Amount is too high").optional().nullable(),
  applies_to: z.enum(['shop', 'category', 'product']),
  category_id: z.string().uuid("Invalid category").optional().nullable(),
  product_id: z.string().uuid("Invalid product").optional().nullable(),
  active: z.boolean(),
  expires_at: z.string().optional().nullable(),
}).refine((data) => {
  // Must have either percentage or fixed_amount, not both
  const hasPercentage = data.percentage !== null && data.percentage !== undefined;
  const hasFixed = data.fixed_amount !== null && data.fixed_amount !== undefined;
  return hasPercentage !== hasFixed;
}, {
  message: "Must specify either percentage or fixed amount, not both",
});

// Account validation schema
export const accountSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
});

// Admin login validation schema
export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(50, "Username is too long"),
  password: z.string().min(1, "Password is required"),
});
