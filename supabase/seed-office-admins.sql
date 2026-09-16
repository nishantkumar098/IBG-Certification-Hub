-- Links the 7 placeholder accounts to their role/office. Run this in the
-- Supabase SQL Editor AFTER creating the users below under
-- Authentication → Users → Add user (with "Auto Confirm User" checked).
-- Safe to re-run — every insert is idempotent.
--
-- | Office    | Email                              | Sample password   |
-- |-----------|-------------------------------------|-------------------|
-- | Jaipur    | admin.jaipur@ibgacademy.sample      | Jaipur#Office2026!   |
-- | Mumbai    | admin.mumbai@ibgacademy.sample      | Mumbai#Office2026!   |
-- | Delhi     | admin.delhi@ibgacademy.sample       | Delhi#Office2026!    |
-- | Goa       | admin.goa@ibgacademy.sample         | Goa#Office2026!      |
-- | Chennai   | admin.chennai@ibgacademy.sample     | Chennai#Office2026!  |
-- | Dehradun  | admin.dehradun@ibgacademy.sample    | Dehradun#Office2026! |
-- | (all)     | superadmin@ibgacademy.sample        | Super#Admin2026!     |
--
-- Replace these with real emails whenever you're ready — swap the email in
-- Supabase Auth and this linkage (by user id) keeps working untouched.

-- Superadmin — full access, no city scoping.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin' FROM auth.users WHERE email = 'superadmin@ibgacademy.sample'
ON CONFLICT (user_id, role) DO NOTHING;

-- Office (city) admins — role first, then the city assignment.
WITH office_admins(email, city_name) AS (
  VALUES
    ('admin.jaipur@ibgacademy.sample',   'Jaipur'),
    ('admin.mumbai@ibgacademy.sample',   'Mumbai'),
    ('admin.delhi@ibgacademy.sample',    'Delhi'),
    ('admin.goa@ibgacademy.sample',      'Goa'),
    ('admin.chennai@ibgacademy.sample',  'Chennai'),
    ('admin.dehradun@ibgacademy.sample', 'Dehradun')
)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'office_admin'
FROM office_admins oa
JOIN auth.users u ON u.email = oa.email
ON CONFLICT (user_id, role) DO NOTHING;

WITH office_admins(email, city_name) AS (
  VALUES
    ('admin.jaipur@ibgacademy.sample',   'Jaipur'),
    ('admin.mumbai@ibgacademy.sample',   'Mumbai'),
    ('admin.delhi@ibgacademy.sample',    'Delhi'),
    ('admin.goa@ibgacademy.sample',      'Goa'),
    ('admin.chennai@ibgacademy.sample',  'Chennai'),
    ('admin.dehradun@ibgacademy.sample', 'Dehradun')
)
INSERT INTO public.office_admin_assignments (user_id, city_id)
SELECT u.id, c.id
FROM office_admins oa
JOIN auth.users u ON u.email = oa.email
JOIN public.cities c ON c.name = oa.city_name
ON CONFLICT (user_id, city_id) DO NOTHING;
