// One-off: creates the 6 city office-admin accounts + 1 superadmin account,
// then assigns their roles and (for office admins) their city.
//
// Requires supabase/migrations/20260910120000_*.sql and
// 20260910120100_*.sql to already be applied to the database — this script
// only creates rows, it can't run the schema/RLS changes those files carry.
//
// Usage: bun run scripts/create-sample-admins.mjs
// (Bun loads .env automatically; needs VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OFFICE_ADMINS = [
  { email: "admin.jaipur@ibgacademy.sample", password: "Jaipur#Office2026!", city: "Jaipur" },
  { email: "admin.mumbai@ibgacademy.sample", password: "Mumbai#Office2026!", city: "Mumbai" },
  { email: "admin.delhi@ibgacademy.sample", password: "Delhi#Office2026!", city: "Delhi" },
  { email: "admin.goa@ibgacademy.sample", password: "Goa#Office2026!", city: "Goa" },
  { email: "admin.chennai@ibgacademy.sample", password: "Chennai#Office2026!", city: "Chennai" },
  { email: "admin.dehradun@ibgacademy.sample", password: "Dehradun#Office2026!", city: "Dehradun" },
];
const SUPERADMIN = { email: "devnishant56@gmail.com", password: "Nishant@Call1234" };

async function getOrCreateUser(email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return data.user;
  if (!error.message?.toLowerCase().includes("already")) throw error;
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw error;
  return existing;
}

async function setRole(userId, role) {
  const { error } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (error) throw error;
}

async function cityIdByName(name) {
  const { data, error } = await admin.from("cities").select("id").eq("name", name).single();
  if (error) throw error;
  return data.id;
}

async function assignCity(userId, cityId) {
  const { error } = await admin
    .from("office_admin_assignments")
    .upsert({ user_id: userId, city_id: cityId }, { onConflict: "user_id,city_id" });
  if (error) throw error;
}

const superUser = await getOrCreateUser(SUPERADMIN.email, SUPERADMIN.password);
await setRole(superUser.id, "superadmin");
await setRole(superUser.id, "examiner"); // admins hold examiner too
console.log(`superadmin ready: ${SUPERADMIN.email}`);

for (const oa of OFFICE_ADMINS) {
  const user = await getOrCreateUser(oa.email, oa.password);
  await setRole(user.id, "office_admin");
  await setRole(user.id, "examiner"); // admins hold examiner too
  const cityId = await cityIdByName(oa.city);
  await assignCity(user.id, cityId);
  console.log(`${oa.city} office admin ready: ${oa.email}`);
}

console.log("Done.");
