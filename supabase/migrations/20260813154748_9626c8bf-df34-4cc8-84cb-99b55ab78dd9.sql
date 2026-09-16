
-- 1. PROFILES EXTENSION
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpb_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS employer_designation text,
  ADD COLUMN IF NOT EXISTS employer_city text,
  ADD COLUMN IF NOT EXISTS employer_contact text,
  ADD COLUMN IF NOT EXISTS employment_start_date date,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS specialties text[],
  ADD COLUMN IF NOT EXISTS directory_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS conduct_accepted_at timestamptz;

CREATE OR REPLACE FUNCTION public.generate_cpb_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := 'CPB-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE cpb_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_cpb_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.cpb_id IS NULL THEN NEW.cpb_id := public.generate_cpb_id(); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_cpb_id ON public.profiles;
CREATE TRIGGER profiles_set_cpb_id BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_cpb_id();

UPDATE public.profiles SET cpb_id = public.generate_cpb_id() WHERE cpb_id IS NULL;

-- 2. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_inr integer NOT NULL,
  period text NOT NULL DEFAULT 'year',
  tagline text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_plans TO anon, authenticated;
GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.membership_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'professional',
  member_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  started_on date NOT NULL DEFAULT current_date,
  expires_on date NOT NULL DEFAULT (current_date + interval '1 year'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own membership" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members create own membership" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update memberships" ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. EXPERIENCE DOCUMENTS
CREATE TABLE IF NOT EXISTS public.experience_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  employer_address text,
  designation text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_current boolean NOT NULL DEFAULT true,
  supervisor_name text,
  supervisor_contact text,
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.experience_documents TO authenticated;
GRANT ALL ON public.experience_documents TO service_role;
ALTER TABLE public.experience_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates read own experience" ON public.experience_documents FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'examiner'));
CREATE POLICY "Candidates add own experience" ON public.experience_documents FOR INSERT TO authenticated
  WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Owner or staff update experience" ON public.experience_documents FOR UPDATE TO authenticated
  USING ((candidate_id = auth.uid() AND status = 'pending') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK ((candidate_id = auth.uid() AND status = 'pending') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER experience_documents_updated_at BEFORE UPDATE ON public.experience_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CONDUCT ACCEPTANCES
CREATE TABLE IF NOT EXISTS public.conduct_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL DEFAULT '2026.1',
  full_name_signed text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.conduct_acceptances TO authenticated;
GRANT ALL ON public.conduct_acceptances TO service_role;
ALTER TABLE public.conduct_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own acceptance" ON public.conduct_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sign own acceptance" ON public.conduct_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 6. MEMBER REPORTS (misconduct)
CREATE TABLE IF NOT EXISTS public.member_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE DEFAULT ('RPT-' || to_char(now(), 'YYYYMM') || '-' || lpad((floor(random()*900000)+100000)::int::text, 6, '0')),
  member_cpb_id text,
  member_name text NOT NULL,
  incident_date date,
  venue text,
  category text NOT NULL,
  description text NOT NULL,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  reporter_relationship text,
  is_anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'received',
  staff_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.member_reports TO anon, authenticated;
GRANT SELECT, UPDATE ON public.member_reports TO authenticated;
GRANT ALL ON public.member_reports TO service_role;
ALTER TABLE public.member_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone may file a report" ON public.member_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Only staff read reports" ON public.member_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only staff update reports" ON public.member_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER member_reports_updated_at BEFORE UPDATE ON public.member_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. TESTING CENTER APPLICATIONS
CREATE TABLE IF NOT EXISTS public.testing_center_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  organisation_type text NOT NULL,
  years_operating integer,
  bar_stations integer,
  seating_capacity integer,
  has_dedicated_room boolean NOT NULL DEFAULT false,
  has_cctv boolean NOT NULL DEFAULT false,
  has_wifi boolean NOT NULL DEFAULT false,
  has_backup_power boolean NOT NULL DEFAULT false,
  has_fssai_licence boolean NOT NULL DEFAULT false,
  has_liquor_licence boolean NOT NULL DEFAULT false,
  intrastate_coverage text,
  notes text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT ON public.testing_center_applications TO authenticated;
GRANT ALL ON public.testing_center_applications TO service_role;
ALTER TABLE public.testing_center_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants read own application" ON public.testing_center_applications FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Signed-in users apply" ON public.testing_center_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_user_id = auth.uid());
CREATE POLICY "Admins update applications" ON public.testing_center_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tca_updated_at BEFORE UPDATE ON public.testing_center_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TRAINING VIDEOS
CREATE TABLE IF NOT EXISTS public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_label text,
  module text NOT NULL DEFAULT 'General',
  access_level text NOT NULL DEFAULT 'candidate',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_videos TO authenticated;
GRANT ALL ON public.training_videos TO service_role;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read videos" ON public.training_videos FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "Admins manage videos" ON public.training_videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. STUDY LINKS
CREATE TABLE IF NOT EXISTS public.study_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'compulsory',
  kind text NOT NULL DEFAULT 'read',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_links TO authenticated;
GRANT ALL ON public.study_links TO service_role;
ALTER TABLE public.study_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read study links" ON public.study_links FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "Admins manage study links" ON public.study_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. PUBLIC MEMBER DIRECTORY SEARCH
CREATE OR REPLACE FUNCTION public.search_members(_query text)
RETURNS TABLE (cpb_id text, full_name text, city text, state text, specialties text[], employer text, certified_since date, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.cpb_id, p.full_name, c.name, p.state, p.specialties, p.current_employer,
         cert.issued_date, COALESCE(cert.status, 'member')
  FROM public.profiles p
  LEFT JOIN public.cities c ON c.id = p.city_id
  LEFT JOIN LATERAL (
    SELECT ce.issued_date, ce.status FROM public.certificates ce
    WHERE ce.candidate_id = p.id ORDER BY ce.issued_date DESC LIMIT 1
  ) cert ON true
  WHERE p.directory_opt_in
    AND (cert.status = 'active' OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = p.id AND m.status = 'active'))
    AND (_query IS NULL OR length(trim(_query)) = 0
         OR p.cpb_id ILIKE '%' || _query || '%'
         OR p.full_name ILIKE '%' || _query || '%'
         OR c.name ILIKE '%' || _query || '%')
  ORDER BY p.full_name
  LIMIT 100;
$$;

-- 11. SEED PLANS
INSERT INTO public.membership_plans (code, name, price_inr, tagline, features, sort_order) VALUES
('Standard', 'Standard', 0, 'Free access to open study material', '["IBG open study library","Community updates","Event announcements"]'::jsonb, 1),
('professional', 'Professional Member', 2000, 'The working bartender''s membership', '["Digital membership card","Listing in the IBG member directory","Full training video library","Member-only masterclasses","Discounted CPB retakes","Competition entry priority","Annual conduct review"]'::jsonb, 2),
('cpb_certification', 'CPB Certification', 5000, 'Examination and charter', '["IBG Bartenders Manual","Unlimited practice quizzes","One written exam attempt","One practical exam attempt","Verifiable digital certificate","CPB ID for employer verification"]'::jsonb, 3)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, price_inr = EXCLUDED.price_inr, features = EXCLUDED.features, tagline = EXCLUDED.tagline;

-- 12. SEED STUDY LINKS
INSERT INTO public.study_links (title, description, url, category, kind, sort_order) VALUES
('IBG Ultimate Cocktail Book', 'The core IBG reference for recipes, methods and service standards. Read online inside the dashboard.', 'https://ibg.network/ibg-ultimate-cocktail-book/', 'compulsory', 'read', 1),
('IBG CFB Guide', 'The official IBG and IBA companion covering the IBA official cocktail list and competition standards.', 'https://ibg.network/ibg-and-iba-book/', 'compulsory', 'read', 2),
('IBA Official Cocktails List', 'The Unforgettables, Contemporary Classics and New Era Drinks — examinable recipes.', 'https://iba-world.com/iba-cocktails/', 'compulsory', 'read', 3),
('Responsible Service of Alcohol', 'Guest safety, refusal of service and legal duties behind the bar.', 'https://iba-world.com/', 'compulsory', 'read', 4),
('Purchase: IBG Ultimate Cocktail Book (print)', 'Order the printed edition of the IBG Ultimate Cocktail Book.', 'https://ibg.network/ibg-ultimate-cocktail-book/', 'optional', 'purchase', 5),
('Cigar & Spirits Appreciation', 'Optional deep dive into cigar curing, humidity and pairing.', 'https://ibg.network/', 'optional', 'read', 6),
('Bar Costing & Inventory Templates', 'Optional operational tools for par levels, FIFO and pour cost.', 'https://ibg.network/', 'optional', 'read', 7)
ON CONFLICT DO NOTHING;

-- 13. SEED TRAINING VIDEOS
INSERT INTO public.training_videos (title, description, video_url, module, duration_label, access_level, sort_order) VALUES
('Bar Setup & the Two-Step Rule', 'Station layout, speed rail organisation and mise en place.', 'https://www.youtube.com/embed/gGP6Vy3nHUE', 'Bar Operations', '12 min', 'candidate', 1),
('Shake, Stir, Build, Blend', 'The four core methods and when each is correct.', 'https://www.youtube.com/embed/6kzZ1uFCLmM', 'Technique', '15 min', 'candidate', 2),
('Glassware & Garnish Standards', 'Selecting, polishing and garnishing to IBA standard.', 'https://www.youtube.com/embed/BOOr7iCLc9c', 'Technique', '10 min', 'candidate', 3),
('Responsible Service in Practice', 'Refusing service, the Q-to-Q method and guest safety.', 'https://www.youtube.com/embed/Q9nQ0Qq1nGk', 'Social Responsibility', '9 min', 'candidate', 4),
('IBA Official Cocktails Masterclass', 'Member-only walkthrough of the examinable IBA list.', 'https://www.youtube.com/embed/3XZ1TDQjLQE', 'Masterclass', '32 min', 'member', 5),
('Competition Craft & Judging Criteria', 'Member-only session on presentation and scoring.', 'https://www.youtube.com/embed/l0U2rUZ0Uao', 'Masterclass', '24 min', 'member', 6)
ON CONFLICT DO NOTHING;

-- 14. SEED LIVE EXAM SLOTS (next 12 weeks, every centre)
INSERT INTO public.exam_slots (testing_center_id, certification_type_id, type, exam_date, start_time, end_time, capacity, seats_booked, status)
SELECT tc.id,
       (SELECT id FROM public.certification_types WHERE is_active ORDER BY created_at LIMIT 1),
       t.kind,
       d::date,
       t.start_time,
       t.end_time,
       t.capacity,
       0,
       'open'
FROM public.testing_centers tc
CROSS JOIN generate_series(current_date + 7, current_date + 90, interval '7 day') d
CROSS JOIN (VALUES ('mcq', time '10:00', time '11:30', 20), ('practical', time '14:00', time '17:00', 8)) AS t(kind, start_time, end_time, capacity)
WHERE tc.is_active
  AND NOT EXISTS (
    SELECT 1 FROM public.exam_slots es
    WHERE es.testing_center_id = tc.id AND es.exam_date = d::date AND es.type = t.kind
  );
