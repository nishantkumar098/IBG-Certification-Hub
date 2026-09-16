CREATE TABLE public.exam_slot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id uuid REFERENCES public.cities(id),
  testing_center_id uuid REFERENCES public.testing_centers(id),
  exam_type text NOT NULL DEFAULT 'mcq' CHECK (exam_type IN ('mcq','practical')),
  preferred_date date NOT NULL,
  alternate_date date,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','declined','cancelled')),
  scheduled_details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_slot_requests TO authenticated;
GRANT ALL ON public.exam_slot_requests TO service_role;

ALTER TABLE public.exam_slot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own slot requests" ON public.exam_slot_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = candidate_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));

CREATE POLICY "Candidates create own slot requests" ON public.exam_slot_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates cancel own pending requests" ON public.exam_slot_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_id AND status = 'pending')
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Staff manage slot requests" ON public.exam_slot_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));

CREATE TRIGGER exam_slot_requests_updated_at
  BEFORE UPDATE ON public.exam_slot_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();