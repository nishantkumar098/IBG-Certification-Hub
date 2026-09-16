// Promote an existing user (already registered in the app) to a staff role.
//
// Usage:
//   bun run scripts/set-user-role.mjs --email someone@example.com --role office_admin --city Jaipur
//   bun run scripts/set-user-role.mjs --email someone@example.com --role superadmin
//   bun run scripts/set-user-role.mjs --email someone@example.com --role admin
//
// --city is required only for --role office_admin, and must match a name in
// the cities table exactly (Jaipur, Mumbai, Delhi, Goa, Chennai, Dehradun, ...).
// Safe to re-run.

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const email = argValue("--email");
const role = argValue("--role");
const cityName = argValue("--city");

const VALID_ROLES = ["candidate", "examiner", "admin", "office_admin", "superadmin"];
if (!email || !role) {
  throw new Error("Usage: --email <email> --role <" + VALID_ROLES.join("|") + "> [--city <name>]");
}
if (!VALID_ROLES.includes(role)) {
  throw new Error(`--role must be one of: ${VALID_ROLES.join(", ")}`);
}
if (role === "office_admin" && !cityName) {
  throw new Error("--city is required when --role office_admin (e.g. --city Jaipur)");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profile, error: profileErr } = await admin
  .from("profiles")
  .select("id, full_name")
  .eq("email", email)
  .maybeSingle();
if (profileErr) throw profileErr;
if (!profile) {
  throw new Error(`No existing user found with email ${email}. They need to sign up first.`);
}

const { error: roleErr } = await admin
  .from("user_roles")
  .upsert({ user_id: profile.id, role }, { onConflict: "user_id,role" });
if (roleErr) throw roleErr;
console.log(`Role '${role}' granted to ${email} (${profile.full_name ?? "no name on file"})`);

// Every admin (admin/superadmin/office_admin) also holds examiner.
if (["admin", "superadmin", "office_admin"].includes(role)) {
  const { error: examinerErr } = await admin
    .from("user_roles")
    .upsert({ user_id: profile.id, role: "examiner" }, { onConflict: "user_id,role" });
  if (examinerErr) throw examinerErr;
  console.log(`Role 'examiner' also granted to ${email} (admins hold examiner too)`);
}

if (role === "office_admin") {
  const { data: city, error: cityErr } = await admin
    .from("cities")
    .select("id")
    .eq("name", cityName)
    .maybeSingle();
  if (cityErr) throw cityErr;
  if (!city) throw new Error(`No city named "${cityName}" found in the cities table.`);

  const { error: assignErr } = await admin
    .from("office_admin_assignments")
    .upsert({ user_id: profile.id, city_id: city.id }, { onConflict: "user_id,city_id" });
  if (assignErr) throw assignErr;
  console.log(`Assigned to office: ${cityName}`);
}
