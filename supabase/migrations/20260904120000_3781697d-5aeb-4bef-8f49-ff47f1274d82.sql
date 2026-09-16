-- Enable realtime change events for exam_slot_requests, so a candidate's
-- "Exam dates" page updates the instant the guild office confirms or
-- declines their request — no manual refresh needed.
ALTER TABLE public.exam_slot_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_slot_requests;