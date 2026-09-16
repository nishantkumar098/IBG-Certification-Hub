
-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('candidate','examiner','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SHARED --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CITIES / CENTERS ----------------------------------------------------
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  state text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities public read" ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cities admin write" ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.testing_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testing_centers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testing_centers TO authenticated;
GRANT ALL ON public.testing_centers TO service_role;
ALTER TABLE public.testing_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "centers public read" ON public.testing_centers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "centers admin write" ON public.testing_centers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CERTIFICATION TYPES (extensibility) ---------------------------------
CREATE TABLE public.certification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  fee_inr integer NOT NULL DEFAULT 5000,
  retake_fee_inr integer NOT NULL DEFAULT 1500,
  mcq_pass_percent integer NOT NULL DEFAULT 75,
  practical_pass_score integer NOT NULL DEFAULT 70,
  mcq_duration_minutes integer NOT NULL DEFAULT 60,
  mcq_question_count integer NOT NULL DEFAULT 40,
  retake_cooldown_days integer NOT NULL DEFAULT 14,
  validity_years integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certification_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certification_types TO authenticated;
GRANT ALL ON public.certification_types TO service_role;
ALTER TABLE public.certification_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certtypes public read" ON public.certification_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "certtypes admin write" ON public.certification_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFILES ------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  photo_url text,
  id_proof_url text,
  city_id uuid REFERENCES public.cities(id),
  years_experience integer,
  current_employer text,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'candidate')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EXAMINER ASSIGNMENTS ------------------------------------------------
CREATE TABLE public.examiner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examiner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  testing_center_id uuid NOT NULL REFERENCES public.testing_centers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (examiner_id, testing_center_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.examiner_assignments TO authenticated;
GRANT ALL ON public.examiner_assignments TO service_role;
ALTER TABLE public.examiner_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments read" ON public.examiner_assignments FOR SELECT TO authenticated
  USING (examiner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "assignments admin write" ON public.examiner_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- EXAM SLOTS ----------------------------------------------------------
CREATE TABLE public.exam_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testing_center_id uuid NOT NULL REFERENCES public.testing_centers(id) ON DELETE CASCADE,
  certification_type_id uuid REFERENCES public.certification_types(id),
  type text NOT NULL CHECK (type IN ('mcq','practical')),
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 20,
  seats_booked integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_slots TO authenticated;
GRANT ALL ON public.exam_slots TO service_role;
ALTER TABLE public.exam_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots read" ON public.exam_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "slots admin write" ON public.exam_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BOOKINGS ------------------------------------------------------------
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_slot_id uuid NOT NULL REFERENCES public.exam_slots(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','attended','no-show','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, exam_slot_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));
CREATE POLICY "bookings own insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'))
  WITH CHECK (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- QUESTION BANK -------------------------------------------------------
CREATE TABLE public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  topic_tag text NOT NULL DEFAULT 'General',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bank TO authenticated;
GRANT ALL ON public.question_bank TO service_role;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions staff read" ON public.question_bank FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));
CREATE POLICY "questions admin write" ON public.question_bank FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MCQ ATTEMPTS --------------------------------------------------------
CREATE TABLE public.mcq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_slot_id uuid REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice','official')),
  score numeric,
  total_questions integer,
  passed boolean,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.mcq_attempts TO authenticated;
GRANT ALL ON public.mcq_attempts TO service_role;
ALTER TABLE public.mcq_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts read" ON public.mcq_attempts FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));
CREATE POLICY "attempts own insert" ON public.mcq_attempts FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "attempts update" ON public.mcq_attempts FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PRACTICAL SCORES ----------------------------------------------------
CREATE TABLE public.practical_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  examiner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  exam_slot_id uuid REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  rubric_scores_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.practical_scores TO authenticated;
GRANT ALL ON public.practical_scores TO service_role;
ALTER TABLE public.practical_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practical read" ON public.practical_scores FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR examiner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "practical examiner insert" ON public.practical_scores FOR INSERT TO authenticated
  WITH CHECK (examiner_id = auth.uid() AND public.has_role(auth.uid(),'examiner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "practical admin update" ON public.practical_scores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CERTIFICATES --------------------------------------------------------
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_type_id uuid REFERENCES public.certification_types(id),
  certificate_number text NOT NULL UNIQUE,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  expires_on date,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','expired','revoked')),
  pdf_url text,
  qr_code_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs read" ON public.certificates FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "certs admin write" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.verify_certificate(_certificate_number text)
RETURNS TABLE (
  certificate_number text, full_name text, photo_url text,
  certification_name text, city text, issued_date date,
  expires_on date, status text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, p.full_name, p.photo_url,
         COALESCE(ct.name,'Certified Professional Bartender (CPB)'),
         ci.name, c.issued_date, c.expires_on,
         CASE WHEN c.status = 'valid' AND c.expires_on IS NOT NULL AND c.expires_on < CURRENT_DATE
              THEN 'expired' ELSE c.status END
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.candidate_id
  LEFT JOIN public.certification_types ct ON ct.id = c.certification_type_id
  LEFT JOIN public.cities ci ON ci.id = p.city_id
  WHERE upper(c.certificate_number) = upper(trim(_certificate_number));
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- PAYMENTS ------------------------------------------------------------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_inr integer NOT NULL,
  purpose text NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration','retake-mcq','retake-practical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  gateway_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments own insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "payments update" ON public.payments FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUDIT LOG -----------------------------------------------------------
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_entity text NOT NULL,
  target_id text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- CONTENT -------------------------------------------------------------
CREATE TABLE public.syllabus_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.syllabus_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.syllabus_items TO authenticated;
GRANT ALL ON public.syllabus_items TO service_role;
ALTER TABLE public.syllabus_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syllabus public read" ON public.syllabus_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "syllabus admin write" ON public.syllabus_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials auth read" ON public.study_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials admin write" ON public.study_materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faqs admin write" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SETTINGS ------------------------------------------------------------
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SEED ----------------------------------------------------------------
INSERT INTO public.cities (name, state) VALUES
  ('Delhi','Delhi'), ('Jaipur','Rajasthan'), ('Dehradun','Uttarakhand');

INSERT INTO public.testing_centers (city_id, name, address)
SELECT id, 'IBG Testing Centre — ' || name,
  CASE name
    WHEN 'Delhi' THEN 'Connaught Place, New Delhi 110001'
    WHEN 'Jaipur' THEN 'C-Scheme, Jaipur 302001'
    ELSE 'Rajpur Road, Dehradun 248001' END
FROM public.cities;

INSERT INTO public.certification_types (code, name, description)
VALUES ('CPB','Certified Professional Bartender (CPB®)','The India Bartenders Guild flagship professional bartending credential, affiliated with the International Bartenders Association.');

INSERT INTO public.syllabus_items (title, description, sort_order) VALUES
  ('Social Responsibility','Responsible service of alcohol, legal duties and guest safety.',1),
  ('Types of Alcohols and Non-Alcoholics','Spirits, wines, beers, liqueurs, mixers and zero-proof options.',2),
  ('IBA Official Cocktail List & Recipes','The Unforgettables, Contemporary Classics and New Era Drinks.',3),
  ('Bar Operations','Inventory, costing, par levels, hygiene and workflow.',4),
  ('History of Bartending','From taverns to the modern craft cocktail renaissance.',5),
  ('Behind the Bars','Tools, glassware, stations and mise en place.',6),
  ('Customer Experience','Hospitality standards, guest reading and service recovery.',7),
  ('Cocktail Competition Basics','Judging criteria, presentation and competition formats.',8);

INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('What is the CPB® certification?','The Certified Professional Bartender (CPB®) is the India Bartenders Guild credential recognising professional competence in mixology, bar operations and responsible service.',1),
  ('What does it cost?','The CPB® certification fee is Rs 5,000, which includes study material, one written exam attempt and one practical exam attempt.',2),
  ('Which cities is it available in?','The pilot runs in Delhi, Jaipur and Dehradun, with more cities added through 2026.',3),
  ('What if I fail a component?','You may retake the failed component after a 14 day cooldown for a reduced retake fee of Rs 1,500.',4),
  ('How long is the certificate valid?','CPB® certificates are valid for 3 years from the date of issue.',5);

INSERT INTO public.app_settings (key, value) VALUES
  ('practical_rubric', '[{"key":"glassware","label":"Glassware & Equipment Handling","max":10},{"key":"technique","label":"Cocktail Preparation Technique","max":20},{"key":"recipe","label":"Recipe Accuracy (IBA official recipes)","max":20},{"key":"speed","label":"Speed & Efficiency","max":10},{"key":"presentation","label":"Presentation & Garnish","max":10},{"key":"interaction","label":"Customer Interaction & Social Responsibility","max":15},{"key":"cleanliness","label":"Cleanliness & Bar Setup","max":15}]'::jsonb);
