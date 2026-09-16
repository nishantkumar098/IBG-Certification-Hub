-- OFFICE ADMIN ASSIGNMENTS --------------------------------------------
-- Which city (office) each office_admin manages. superadmin/admin need no
-- row here — they already see every office via has_role() checks below.
CREATE TABLE public.office_admin_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, city_id)
);
GRANT SELECT ON public.office_admin_assignments TO authenticated;
GRANT ALL ON public.office_admin_assignments TO service_role;
ALTER TABLE public.office_admin_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office admin assignments read" ON public.office_admin_assignments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
  );
CREATE POLICY "office admin assignments admin write" ON public.office_admin_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- HELPER FUNCTIONS -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_office_admin_of(_user_id uuid, _city_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _city_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.office_admin_assignments
    WHERE user_id = _user_id AND city_id = _city_id
  );
$$;

-- A candidate's home city (profiles.city_id) — used to scope tables that
-- only carry a candidate_id, not their own city_id column.
CREATE OR REPLACE FUNCTION public.candidate_city_id(_candidate_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT city_id FROM public.profiles WHERE id = _candidate_id;
$$;

CREATE OR REPLACE FUNCTION public.testing_center_city_id(_testing_center_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT city_id FROM public.testing_centers WHERE id = _testing_center_id;
$$;

-- PROFILES ---------------------------------------------------------------
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), city_id)
  );

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- PAYMENTS -----------------------------------------------------------------
DROP POLICY IF EXISTS "payments read" ON public.payments;
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
  USING (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

DROP POLICY IF EXISTS "payments update" ON public.payments;
CREATE POLICY "payments update" ON public.payments FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- MCQ ATTEMPTS ---------------------------------------------------------
DROP POLICY IF EXISTS "attempts read" ON public.mcq_attempts;
CREATE POLICY "attempts read" ON public.mcq_attempts FOR SELECT TO authenticated
  USING (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

DROP POLICY IF EXISTS "attempts update" ON public.mcq_attempts;
CREATE POLICY "attempts update" ON public.mcq_attempts FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- PRACTICAL SCORES -------------------------------------------------------
DROP POLICY IF EXISTS "practical read" ON public.practical_scores;
CREATE POLICY "practical read" ON public.practical_scores FOR SELECT TO authenticated
  USING (
    candidate_id = auth.uid()
    OR examiner_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

DROP POLICY IF EXISTS "practical admin update" ON public.practical_scores;
CREATE POLICY "practical admin update" ON public.practical_scores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- CERTIFICATES -----------------------------------------------------------
DROP POLICY IF EXISTS "certs read" ON public.certificates;
CREATE POLICY "certs read" ON public.certificates FOR SELECT TO authenticated
  USING (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

DROP POLICY IF EXISTS "certs admin write" ON public.certificates;
CREATE POLICY "certs admin write" ON public.certificates FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

-- BOOKINGS -----------------------------------------------------------------
DROP POLICY IF EXISTS "bookings read" ON public.bookings;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated
  USING (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), public.candidate_city_id(candidate_id))
  );

DROP POLICY IF EXISTS "bookings update" ON public.bookings;
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated
  USING (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
  )
  WITH CHECK (
    candidate_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
  );

DROP POLICY IF EXISTS "bookings admin delete" ON public.bookings;
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

-- EXAM SLOTS (scoped via their testing centre's city) ---------------------
DROP POLICY IF EXISTS "slots admin write" ON public.exam_slots;
CREATE POLICY "slots admin write" ON public.exam_slots FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.testing_center_city_id(testing_center_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), public.testing_center_city_id(testing_center_id))
  );

-- TESTING CENTERS ----------------------------------------------------------
DROP POLICY IF EXISTS "centers admin write" ON public.testing_centers;
CREATE POLICY "centers admin write" ON public.testing_centers FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), city_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.is_office_admin_of(auth.uid(), city_id)
  );

-- EXAM SLOT REQUESTS (already carries its own city_id) ---------------------
DROP POLICY IF EXISTS "Candidates view own slot requests" ON public.exam_slot_requests;
CREATE POLICY "Candidates view own slot requests" ON public.exam_slot_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = candidate_id
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), city_id)
  );

DROP POLICY IF EXISTS "Staff manage slot requests" ON public.exam_slot_requests;
CREATE POLICY "Staff manage slot requests" ON public.exam_slot_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), city_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), city_id)
  );

DROP POLICY IF EXISTS "Staff delete slot requests" ON public.exam_slot_requests;
CREATE POLICY "Staff delete slot requests" ON public.exam_slot_requests FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'superadmin')
    OR public.has_role(auth.uid(),'examiner')
    OR public.is_office_admin_of(auth.uid(), city_id)
  );

-- EVERYTHING ELSE: superadmin gets the same reach 'admin' already has -----
-- (global config / staffing tables — not city-scoped, office_admin gets no
-- extra access here beyond what it already had as a plain authenticated user)
DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "cities admin write" ON public.cities;
CREATE POLICY "cities admin write" ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "certtypes admin write" ON public.certification_types;
CREATE POLICY "certtypes admin write" ON public.certification_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "assignments read" ON public.examiner_assignments;
CREATE POLICY "assignments read" ON public.examiner_assignments FOR SELECT TO authenticated
  USING (examiner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "assignments admin write" ON public.examiner_assignments;
CREATE POLICY "assignments admin write" ON public.examiner_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "questions staff read" ON public.question_bank;
CREATE POLICY "questions staff read" ON public.question_bank FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'examiner'));

DROP POLICY IF EXISTS "questions admin write" ON public.question_bank;
CREATE POLICY "questions admin write" ON public.question_bank FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "audit admin read" ON public.audit_log;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "syllabus admin write" ON public.syllabus_items;
CREATE POLICY "syllabus admin write" ON public.syllabus_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "materials admin write" ON public.study_materials;
CREATE POLICY "materials admin write" ON public.study_materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "faqs admin write" ON public.faqs;
CREATE POLICY "faqs admin write" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "settings admin write" ON public.app_settings;
CREATE POLICY "settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));
