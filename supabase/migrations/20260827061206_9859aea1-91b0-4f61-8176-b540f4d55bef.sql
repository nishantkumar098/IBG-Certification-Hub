CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blacklisted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_until date;

ALTER TABLE public.testing_centers
  ADD COLUMN IF NOT EXISTS admin_pin_hash text;

CREATE TABLE IF NOT EXISTS public.library_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  category text NOT NULL DEFAULT 'guild',
  kind text NOT NULL DEFAULT 'pdf',
  storage_bucket text,
  storage_path text,
  external_url text,
  internal_path text,
  access_level text NOT NULL DEFAULT 'authenticated',
  page_count integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.library_documents TO anon;
GRANT SELECT ON public.library_documents TO authenticated;
GRANT ALL ON public.library_documents TO service_role;
ALTER TABLE public.library_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active library documents"
  ON public.library_documents FOR SELECT USING (is_active);
CREATE POLICY "Admins manage library documents"
  ON public.library_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER library_documents_updated_at
  BEFORE UPDATE ON public.library_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.exam_start_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  testing_center_id uuid NOT NULL REFERENCES public.testing_centers(id) ON DELETE CASCADE,
  exam_slot_id uuid REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  attempt_id uuid REFERENCES public.mcq_attempts(id) ON DELETE SET NULL,
  authorized_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exam_start_authorizations TO authenticated;
GRANT ALL ON public.exam_start_authorizations TO service_role;
ALTER TABLE public.exam_start_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own exam authorizations"
  ON public.exam_start_authorizations FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'examiner'));

CREATE OR REPLACE FUNCTION public.set_centre_admin_pin(_center_id uuid, _pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can set a testing centre PIN';
  END IF;
  IF length(trim(_pin)) < 6 THEN
    RAISE EXCEPTION 'PIN must be at least 6 characters';
  END IF;
  UPDATE public.testing_centers
     SET admin_pin_hash = extensions.crypt(trim(_pin), extensions.gen_salt('bf'))
   WHERE id = _center_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_centre_admin_pin(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_centre_admin_pin(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_centre_admin_pin(_center_id uuid, _pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE h text;
BEGIN
  SELECT admin_pin_hash INTO h FROM public.testing_centers WHERE id = _center_id;
  IF h IS NULL THEN RETURN false; END IF;
  RETURN h = extensions.crypt(trim(_pin), h);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_centre_admin_pin(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.verify_centre_admin_pin(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_centre_admin_pin(uuid, text) TO service_role;

UPDATE public.testing_centers tc
   SET admin_pin_hash = extensions.crypt(
     'IBG-' || upper(regexp_replace(coalesce(c.name, 'CENTRE'), '\s', '', 'g')) || '-2026',
     extensions.gen_salt('bf'))
  FROM public.cities c
 WHERE c.id = tc.city_id AND tc.admin_pin_hash IS NULL;