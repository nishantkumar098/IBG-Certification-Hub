-- Adds Notebooks, Coasters and Pens sections and seeds those products.
-- Run after 20260926150000_store_product_categories.sql.
ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_category_check;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_category_check CHECK (
  category IN (
    'hoodies', 'sweatshirts', 't-shirts', 'jackets', 'aprons', 'caps',
    'notebooks', 'coasters', 'pens', 'other'
  )
);

-- Safe to re-run: a product is skipped if its image is already in the table.
INSERT INTO public.store_products (name, description, price_inr, image_url, category)
SELECT v.name, v.description, v.price_inr, v.image_url, v.category
FROM (VALUES
  ('IBG Signature Pen & Gift Box – Black & Gold', 'Lacquered ballpoint pen with gold trim and the IBG seal, engraved "Good Drinks Better People", in a matching embossed gift box.', 999, '/store/pen-people-pour-possibilities-black.jpg', 'pens'),
  ('IBG Signature Pen & Gift Box – Bottle Green & Gold', 'Lacquered ballpoint pen with gold trim and the IBG seal, engraved "Same People Bigger Pours", in a matching embossed gift box.', 999, '/store/pen-skills-spirits-green.jpg', 'pens'),
  ('Craft Conversations Community Notebook – Sand', 'Leather-finish hardcover notebook with gold-foil IBG seal, gilded page edges, elastic closure, pen loop and ribbon marker.', 699, '/store/notebook-craft-conversations-sand.jpg', 'notebooks'),
  ('Bartending Builds Better Conversations Notebook – Navy', 'Leather-finish hardcover notebook with gold-foil IBG seal, gilded page edges, elastic closure, pen loop and ribbon marker.', 699, '/store/notebook-bartending-builds-navy.jpg', 'notebooks'),
  ('Mixing People Cultures Opportunities Notebook – Olive', 'Leather-finish hardcover notebook with gold-foil IBG seal, gilded page edges, elastic closure, pen loop and ribbon marker.', 699, '/store/notebook-mixing-people-green.jpg', 'notebooks'),
  ('Good Drinks Build Great People Notebook – Brown', 'Leather-finish hardcover notebook with gold-foil IBG seal, gilded page edges, elastic closure, pen loop and ribbon marker.', 699, '/store/notebook-good-drinks-brown.jpg', 'notebooks'),
  ('People Spirits Stories Notebook – Black', 'Leather-finish hardcover notebook with gold-foil IBG seal, gilded page edges, elastic closure, pen loop and ribbon marker.', 699, '/store/notebook-people-spirits-stories-black.jpg', 'notebooks'),
  ('Raise Standards, Not Just Glasses Coaster – Cream', 'Stitched leather coaster with the gold-foil IBG seal and embossed slogan border.', 299, '/store/coaster-raise-standards-cream.jpg', 'coasters'),
  ('Pour People Together Coaster – Bottle Green', 'Stitched leather coaster with the gold-foil IBG seal and embossed slogan border.', 299, '/store/coaster-pour-people-together-green.jpg', 'coasters'),
  ('Same Spirits, Different Perspectives Coaster – Brown', 'Stitched leather coaster with the gold-foil IBG seal and embossed slogan border.', 299, '/store/coaster-same-spirits-brown.jpg', 'coasters'),
  ('IBG Seal Coaster – Black', 'Stitched leather coaster with the gold-foil IBG seal.', 299, '/store/coaster-ibg-seal-black.jpg', 'coasters'),
  ('Good Drinks, Better Conversations Coaster – Black', 'Stitched leather coaster with the gold-foil IBG seal and embossed slogan border.', 299, '/store/coaster-good-drinks-black.jpg', 'coasters')
) AS v(name, description, price_inr, image_url, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_products p WHERE p.image_url = v.image_url
);
