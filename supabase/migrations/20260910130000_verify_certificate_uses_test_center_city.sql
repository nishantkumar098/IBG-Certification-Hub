-- The public certificate verification page showed the candidate's home
-- profile city as "City", not the testing centre where they actually sat
-- (and passed) their practical exam. Source it from there instead, same
-- candidate → practical_scores → exam_slots → testing_centers path the
-- candidate's own printable certificate already uses for "Test Center".
-- Falls back to the profile city only if no linked practical exam exists.
CREATE OR REPLACE FUNCTION public.verify_certificate(_certificate_number text)
RETURNS TABLE (
  certificate_number text, full_name text, photo_url text,
  certification_name text, city text, issued_date date,
  expires_on date, status text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, p.full_name, p.photo_url,
         COALESCE(ct.name,'Certified Professional Bartender (CPB)'),
         COALESCE(centre_city.name, home_city.name),
         c.issued_date, c.expires_on,
         CASE WHEN c.status = 'valid' AND c.expires_on IS NOT NULL AND c.expires_on < CURRENT_DATE
              THEN 'expired' ELSE c.status END
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.candidate_id
  LEFT JOIN public.certification_types ct ON ct.id = c.certification_type_id
  LEFT JOIN LATERAL (
    SELECT tc.city_id
    FROM public.practical_scores ps
    JOIN public.exam_slots es ON es.id = ps.exam_slot_id
    JOIN public.testing_centers tc ON tc.id = es.testing_center_id
    WHERE ps.candidate_id = c.candidate_id AND ps.passed = true
    ORDER BY ps.submitted_at DESC
    LIMIT 1
  ) AS centre ON true
  LEFT JOIN public.cities centre_city ON centre_city.id = centre.city_id
  LEFT JOIN public.cities home_city ON home_city.id = p.city_id
  WHERE upper(c.certificate_number) = upper(trim(_certificate_number));
$$;
