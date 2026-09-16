-- Two new roles on top of the existing candidate/examiner/admin set:
--   office_admin  — manages one city's office (scoped via office_admin_assignments)
--   superadmin    — sees and manages every office, same reach as 'admin'
--
-- Enum values must be committed before any policy in this migration set can
-- reference them, so this file only adds the values; scoping tables and RLS
-- policies that use them live in the next migration.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
