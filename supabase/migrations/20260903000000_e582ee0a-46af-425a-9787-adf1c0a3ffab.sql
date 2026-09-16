-- The homepage has always advertised six testing centres (Delhi, Mumbai,
-- Jaipur, Chennai, Goa, Dehradun), but the original seed only ever created
-- three of them (Delhi, Jaipur, Dehradun). Candidates in the other three
-- cities had no centre to pick from on the written-exam invigilator unlock
-- panel. Add the missing cities/centres, mirroring the names and addresses
-- already shown on the homepage.

INSERT INTO public.cities (name, state) VALUES
  ('Mumbai','Maharashtra'),
  ('Chennai','Tamil Nadu'),
  ('Goa','Goa')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.testing_centers (city_id, name, address)
SELECT c.id, v.centre_name, v.centre_address
FROM (VALUES
  ('Mumbai', 'IBG Mumbai Office', 'Unit 707, Magic Square, Malad East, Mumbai 400097'),
  ('Chennai', 'IBG Chennai Office', '1, Basement, Srinivas Apartment, No 45, 1/22, Nathamuni St, Alankar, T. Nagar, Chennai, Tamil Nadu 600017'),
  ('Goa', 'IBG Goa Office', '526, Baga Arpora Road, s lane, Arpora, Goa 403516')
) AS v(city_name, centre_name, centre_address)
JOIN public.cities c ON c.name = v.city_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.testing_centers tc WHERE tc.city_id = c.id
);

-- Same auto-generated PIN convention used for the original three centres:
-- IBG-<CITYNAME>-2026 (see 20260827061206_9859aea1-...sql).
UPDATE public.testing_centers tc
   SET admin_pin_hash = extensions.crypt(
     'IBG-' || upper(regexp_replace(coalesce(c.name, 'CENTRE'), '\s', '', 'g')) || '-2026',
     extensions.gen_salt('bf'))
  FROM public.cities c
 WHERE c.id = tc.city_id AND tc.admin_pin_hash IS NULL;