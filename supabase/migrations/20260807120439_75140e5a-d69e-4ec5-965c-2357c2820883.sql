
CREATE POLICY "candidate uploads own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candidate reads own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner')));
CREATE POLICY "candidate updates own files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candidate deletes own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
