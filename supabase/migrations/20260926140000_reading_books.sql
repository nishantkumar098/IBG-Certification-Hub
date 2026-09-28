-- Books shown under "Compulsory Readings" (Study centre) and "Optional
-- Reading" (Guild library). Superadmins add / edit / delete them from the
-- frontend; every signed-in user can read them. The PDF is optional — a book
-- without one is listed with its name and description only.

CREATE TABLE IF NOT EXISTS public.reading_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('compulsory', 'optional')),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  file_url text,
  file_path text,
  -- Stable key for reading_progress; seeded books keep the slugs the reader
  -- already used so nobody loses their saved page. New books use their id.
  slug text UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signed-in users read books" ON public.reading_books
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "superadmin manages books" ON public.reading_books
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_books TO authenticated;
GRANT ALL ON public.reading_books TO service_role;

-- PDFs uploaded from the frontend.
INSERT INTO storage.buckets (id, name, public)
VALUES ('reading-books', 'reading-books', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "anyone reads reading book files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'reading-books');
CREATE POLICY "superadmin uploads reading book files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reading-books' AND public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin updates reading book files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reading-books' AND public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (bucket_id = 'reading-books' AND public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "superadmin deletes reading book files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reading-books' AND public.has_role(auth.uid(), 'superadmin'));

-- Seed the books that were previously hard-coded in study.tsx / library.tsx.
INSERT INTO public.reading_books (section, title, description, file_url, slug, sort_order)
VALUES
  ('compulsory', 'IBG CFB Guide',
   'The guild''s core certification guide — 148 pages, examinable for the CPB® written paper.',
   '/books/IBG%20CFB%20Guide%20(1).pdf', 'local-ibg-cfb-guide', 10),
  ('optional', 'CWI Magazine',
   'Guild magazine covering the Cocktail World Invitational.',
   '/books/CWI%20Magazine.pdf', 'cwi-magazine', 10),
  ('optional', 'IBA Social Responsibility Guide',
   'IBA guidance on responsible service and social responsibility standards.',
   '/books/IBA%20SOCIAL%20RESPONSIBILITY%20GUIDE.pdf', 'iba-social-responsibility-guide', 20),
  ('optional', 'IBG CFB Guide',
   'The guild''s core certification guide — examinable for the CPB® written paper.',
   '/books/IBG%20CFB%20Guide%20(1).pdf', 'ibg-cfb-guide', 30),
  ('optional', 'IBG Ultimate Cocktail Book',
   'The guild''s flagship cocktail reference, cover to cover.',
   '/books/IBG-Ultimate-Bartender-Book-31-MAY-1.pdf', 'ibg-ultimate-cocktail-book', 40),
  ('optional', 'ICB Students Guide',
   'Student reference guide for ICB coursework.',
   '/books/ICB%20STUDENTS%20GUIDE.pdf', 'icb-students-guide', 50),
  ('optional', 'India''s F&B on Ventilator',
   'Dark secrets of the Indian hospitality industry and strategies for driving profitable success.',
   '/books/Indias-FB-on-Ventilator.pdf', 'indias-fb-on-ventilator', 60),
  ('optional', 'CWI 2026 (Updated)',
   'Updated rules and reference material for CWI 2026.',
   '/books/Updated-CWI-2026.pdf', 'updated-cwi-2026', 70),
  ('optional', 'WCC 2025 — Classic Category Rules',
   'Competition rules for the WCC 2025 Classic Category.',
   '/books/WCC2025%20-%20CLASSIC%20CATEGORY%20-%20RULES.pdf', 'wcc2025-classic-category-rules', 80)
ON CONFLICT (slug) DO NOTHING;
