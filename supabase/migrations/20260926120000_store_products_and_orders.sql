-- Online store: superadmins manage the catalogue; anyone can browse active
-- products; signed-in users buy through the existing Razorpay flow (a row in
-- public.payments with purpose 'store-purchase' plus a store_orders row).

CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text,
  price_inr integer NOT NULL CHECK (price_inr > 0),
  image_url text NOT NULL CHECK (length(trim(image_url)) > 0),
  image_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- has_role() isn't executable by anon, so visitors get their own policy.
CREATE POLICY "visitors read active store products" ON public.store_products
  FOR SELECT TO anon
  USING (is_active);
CREATE POLICY "users read active store products" ON public.store_products
  FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin manages store products" ON public.store_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

GRANT SELECT ON public.store_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_products TO authenticated;
GRANT ALL ON public.store_products TO service_role;

CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price_inr integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  total_inr integer NOT NULL,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Orders are only ever written server-side (service role); users can read
-- their own, superadmins read and update all (e.g. mark shipped).
CREATE POLICY "users read own store orders" ON public.store_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin updates store orders" ON public.store_orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

GRANT SELECT, UPDATE ON public.store_orders TO authenticated;
GRANT ALL ON public.store_orders TO service_role;

-- Allow the new payment purpose. NOT VALID so existing rows with any legacy
-- purpose value don't block the migration.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_purpose_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_purpose_check CHECK (
  purpose = ANY (ARRAY[
    'registration', 'certification', 'membership', 'associateMembership',
    'retake-mcq', 'retake-practical', 'book-purchase', 'store-purchase'
  ])
) NOT VALID;

-- Public bucket for product images; only superadmins can write to it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-products', 'store-products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "anyone reads store product images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-products');
CREATE POLICY "superadmin uploads store product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-products' AND public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin updates store product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'store-products' AND public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (bucket_id = 'store-products' AND public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin deletes store product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'store-products' AND public.has_role(auth.uid(), 'superadmin'));
