import { z } from "zod";

/** Lowercase, hyphen-separated — matches what a typical `/store` slug uniqueness check expects. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Mirrors the backend's `StoreCreate` — only `name` + `slug` exist server-side. */
export const storeBasicsSchema = z.object({
  name: z.string().min(1, "Store name is required").max(255, "Store name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64, "Slug is too long")
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens only"),
});

export type StoreBasicsFormValues = z.infer<typeof storeBasicsSchema>;

export const BRAND_CATEGORIES = [
  "womenswear",
  "menswear",
  "unisex",
  "footwear",
  "accessories",
  "activewear",
] as const;

/** Business info form — saved with `PATCH /store/me` (see types/brand.ts `StoreBusinessInfo`). */
export const storeBusinessInfoSchema = z.object({
  category: z.enum(BRAND_CATEGORIES).optional().or(z.literal("")),
  description: z.string().max(2000, "Keep it under 2000 characters").optional().or(z.literal("")),
  website: z
    .string()
    .url("Enter a full URL, e.g. https://example.com")
    .optional()
    .or(z.literal("")),
  instagram: z.string().max(100).optional().or(z.literal("")),
  tiktok: z.string().max(100).optional().or(z.literal("")),
});

export type StoreBusinessInfoFormValues = z.infer<typeof storeBusinessInfoSchema>;

export const PRODUCT_CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "footwear",
  "accessories",
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;

/** Who a product is cut for — girls'/boys' items are sized by height (see backend sizing). */
export const PRODUCT_AUDIENCES = ["unisex", "women", "men", "girls", "boys"] as const;

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Mirrors the backend's `ProductCreate` — `is_active`/`variants` aren't create-time fields (see api/brand/products.ts). */
export const productSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(2000, "Keep it under 2000 characters").optional().or(z.literal("")),
  category: z.enum(PRODUCT_CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  audience: z.enum(PRODUCT_AUDIENCES).default("unisex"),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(PRICE_PATTERN, "Enter a valid price, e.g. 49.99"),
  currency: z.enum(CURRENCIES),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Mirrors the backend `ProductVariantCreate` limits (see api/brand/products.ts). */
export const variantSchema = z.object({
  size_label: z.string().min(1, "Size is required").max(20, "Size is too long"),
  color: z.string().max(50, "Color is too long").optional().or(z.literal("")),
  sku: z.string().min(1, "SKU is required").max(100, "SKU is too long"),
  stock_quantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z
      .number()
      .int("Whole numbers only")
      .min(0, "Stock can't be negative")
      .max(100_000, "That's a lot of stock — double-check this number"),
  ),
});

export type VariantFormValues = z.infer<typeof variantSchema>;
