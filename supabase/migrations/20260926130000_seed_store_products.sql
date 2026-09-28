-- Seeds the initial IBG merchandise catalogue. Images are served from
-- public/store/ (image_path stays null, so deleting a product never tries to
-- remove a static file). Prices are starting values — superadmins can edit
-- name, description and price from the Store page.
-- Safe to re-run: a product is skipped if its image is already in the table.
INSERT INTO public.store_products (name, description, price_inr, image_url)
SELECT v.name, v.description, v.price_inr, v.image_url
FROM (VALUES
  ('Good Drinks Better People Hoodie – Bottle Green', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-good-drinks-better-people-green.jpg'),
  ('Bar Band Hai, Bartender Nahi Hoodie – Black', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-bar-band-hai-black.jpg'),
  ('Ek Last Drink? Jhooth Mat Bol Hoodie – Off-White', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-ek-last-drink-off-white.jpg'),
  ('Peg Chhota Ho Ya Bada Hoodie – Black', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-peg-chhota-ho-ya-bada-black.jpg'),
  ('Ice Pe Control Rakh Hoodie – Off-White', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-ice-pe-control-rakh-off-white.jpg'),
  ('IBG Good People Great Drinks Hoodie – Black', 'Heavyweight fleece hoodie with I.B.G. chest branding, sleeve print and a full back graphic. Unisex fit.', 1499, '/store/hoodie-good-people-great-drinks-black.jpg'),
  ('Dil Se Pour, Dimaag Se Measure Tee – Off-White', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-dil-se-pour-off-white.jpg'),
  ('Ek Last Drink? Jhooth Mat Bol Tee – Off-White', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-ek-last-drink-off-white.jpg'),
  ('Kaam Bhi Karenge, Koktail Bhi Banayenge Tee – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-kaam-bhi-karenge-black.jpg'),
  ('Ice Pe Control Rakh, Life Pe Nahi Tee – Bottle Green', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-ice-pe-control-rakh-green.jpg'),
  ('Peg Chhota Ho Ya Bada Tee – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-peg-chhota-ho-ya-bada-black.jpg'),
  ('Bar Band Hai, Bartender Nahi Tee – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-bar-band-hai-black.jpg'),
  ('Good Drinks Better People Tee – Off-White', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-good-drinks-better-people-off-white.jpg'),
  ('Shake Stir Pour Repeat Tee – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-shake-stir-pour-repeat-black.jpg'),
  ('Service Is a Skill Tee (Strainer Pour) – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-service-is-a-skill-strainer-black.jpg'),
  ('Service Is a Skill Tee (Coupe Pour) – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-service-is-a-skill-coupe-black.jpg'),
  ('IBG Golden Pour Tee – Black', 'Oversized heavyweight cotton tee with I.B.G. chest branding and a premium print. Unisex fit.', 799, '/store/tee-golden-pour-black.jpg'),
  ('Shake Stir Pour Repeat Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-shake-stir-pour-repeat.jpg'),
  ('Bar Pe Mil Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-bar-pe-mil.jpg'),
  ('Pehle Peg, Phir Lecture Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-pehle-peg-phir-lecture.jpg'),
  ('Good Drinks Better People Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-good-drinks-better-people.jpg'),
  ('Dil Se Pour, Dimaag Se Measure Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-dil-se-pour.jpg'),
  ('Jugaad Nahi, Technique Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-jugaad-nahi-technique.jpg'),
  ('Shaken, Not Confused Graphic Tee – Black & Red', 'Oversized black tee with a bold front graphic, the India Bartenders Guild seal and a "Service is a skill" sleeve print. Unisex fit.', 899, '/store/graphic-tee-shaken-not-confused.jpg'),
  ('Mix People, Not Just Drinks Bartender Apron – Black', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-mix-people-black.jpg'),
  ('Same Spirit, Different Stories Bartender Apron – Sand', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-same-spirit-sand.jpg'),
  ('Pour Stories Bartender Apron – Burgundy', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-pour-stories-burgundy.jpg'),
  ('Good Drinks Better People Bartender Apron – Sand', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-good-drinks-sand.jpg'),
  ('Good Drinks Better People Bartender Apron – Olive', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-good-drinks-olive.jpg'),
  ('Shake Pour Stir Repeat Script Apron – Black', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 2199, '/store/apron-shake-pour-stir-repeat-black.jpg'),
  ('Pour Better People Bartender Apron – Olive', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-pour-better-people-olive.jpg'),
  ('IBG Classic Bartender Apron – Black', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 1999, '/store/apron-ibg-classic-black.jpg'),
  ('IBG Cross-Back Pro Bartender Apron – Black', 'Heavy canvas bartender apron with leather straps, brass hardware, tool loops, pen pocket and I.B.G. signature branding.', 2299, '/store/apron-ibg-cross-back-black.jpg'),
  ('The Art of the Pour Bomber Jacket – Chocolate Brown', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-art-of-the-pour-brown.jpg'),
  ('Crafted for the Culture Bomber Jacket – Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-crafted-for-the-culture-ivory.jpg'),
  ('The Art of the Pour Bomber Jacket – Olive', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-art-of-the-pour-olive.jpg'),
  ('Crafted for the Culture Bomber Jacket – Black', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-crafted-for-the-culture-black.jpg'),
  ('Crafted for the Culture Bomber Jacket – Bottle Green', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-crafted-for-the-culture-green.jpg'),
  ('Crafted for the Culture Varsity Jacket – Green & Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 3499, '/store/varsity-crafted-for-the-culture-green.jpg'),
  ('The Art of the Pour Varsity Jacket – Navy & Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 3499, '/store/varsity-art-of-the-pour-navy.jpg'),
  ('Where Craft Meets Culture Harrington Jacket – Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/harrington-where-craft-meets-culture-ivory.jpg'),
  ('The Art of the Pour Varsity Jacket – Brown & Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 3499, '/store/varsity-art-of-the-pour-brown.jpg'),
  ('The Art of the Pour Work Jacket – Black', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/work-jacket-art-of-the-pour-black.jpg'),
  ('IBG Minimal Work Jacket – Black', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/work-jacket-ibg-minimal-black.jpg'),
  ('The Art of the Pour Work Jacket – Washed Brown', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/work-jacket-art-of-the-pour-brown.jpg'),
  ('IBG Letterman Varsity Jacket – Black & Ivory', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 3499, '/store/varsity-ibg-letterman-black.jpg'),
  ('Craft Culture Cocktails Bomber Jacket – Black', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/bomber-craft-culture-cocktails-black.jpg'),
  ('Pour People, Great Stories Coach Jacket – Black', 'I.B.G. outerwear with embroidered chest and back branding and signature cocktail-glass detailing. Unisex fit.', 2999, '/store/coach-jacket-pour-people-black.jpg'),
  ('IBG Craft Culture Cocktails Sweatshirt – Black', 'Heavyweight crewneck sweatshirt with embroidered I.B.G. branding front and back. Unisex fit.', 1299, '/store/sweatshirt-craft-culture-cocktails-black.jpg'),
  ('Pour Shake Repeat Cap – Olive', 'Washed cotton six-panel cap with embroidered cocktail-glass logo, side slogan and adjustable brass buckle strap.', 599, '/store/cap-pour-shake-repeat-olive.jpg'),
  ('Pour Stories Cap – Ivory', 'Washed cotton six-panel cap with embroidered cocktail-glass logo, side slogan and adjustable brass buckle strap.', 599, '/store/cap-pour-stories-ivory.jpg'),
  ('Good People Great Drinks Cap – Burgundy', 'Washed cotton six-panel cap with embroidered cocktail-glass logo, side slogan and adjustable brass buckle strap.', 599, '/store/cap-good-people-great-drinks-burgundy.jpg'),
  ('Craft Culture Cocktails Cap – Black', 'Washed cotton six-panel cap with embroidered cocktail-glass logo, side slogan and adjustable brass buckle strap.', 599, '/store/cap-craft-culture-cocktails-black.jpg')
) AS v(name, description, price_inr, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_products p WHERE p.image_url = v.image_url
);
