-- Allow admins/examiners to delete exam slot requests.
-- (RLS was enabled on this table with SELECT/INSERT/UPDATE policies only —
-- there was no DELETE policy, so DELETE calls silently affected 0 rows.)

CREATE POLICY "Staff delete slot requests" ON public.exam_slot_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'examiner'));