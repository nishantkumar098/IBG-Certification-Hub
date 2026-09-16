import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "candidate" | "examiner" | "admin" | "office_admin" | "superadmin";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useRoles(user: User | null) {
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

// Which offices (cities) an office_admin manages. Global admins/superadmins
// see every office already, so this only needs to run for office_admin.
export function useAdminCities(user: User | null, roles: AppRole[] | undefined) {
  const isGlobalAdmin = (roles ?? []).some((r) => r === "admin" || r === "superadmin");
  return useQuery({
    queryKey: ["admin-cities", user?.id],
    enabled: !!user && !!roles && !isGlobalAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_admin_assignments")
        .select("city_id, cities(name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.city_id, name: r.cities?.name ?? "" }));
    },
  });
}

export function useProfile(user: User | null) {
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, cities(name)")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export async function signOutAndRedirect() {
  await supabase.auth.signOut();
  window.location.href = "/";
}
