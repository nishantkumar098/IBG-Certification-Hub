-- Store sections (Hoodies, Sweatshirts, T-Shirts, …). Superadmins pick the
-- category when adding / editing a product; the Store page groups by it.
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_category_check;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_category_check CHECK (
  category IN ('hoodies', 'sweatshirts', 't-shirts', 'jackets', 'aprons', 'caps', 'other')
);

-- Sort the seeded catalogue into sections by name. Only touches products
-- still in 'other', so re-running never overrides a superadmin's choice.
UPDATE public.store_products SET category = 'hoodies'
  WHERE category = 'other' AND name ILIKE '%hoodie%';
UPDATE public.store_products SET category = 'sweatshirts'
  WHERE category = 'other' AND name ILIKE '%sweatshirt%';
UPDATE public.store_products SET category = 't-shirts'
  WHERE category = 'other' AND name ILIKE '% tee %';
UPDATE public.store_products SET category = 'jackets'
  WHERE category = 'other' AND name ILIKE '%jacket%';
UPDATE public.store_products SET category = 'aprons'
  WHERE category = 'other' AND name ILIKE '%apron%';
UPDATE public.store_products SET category = 'caps'
  WHERE category = 'other' AND name ILIKE '% cap %';
