import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // Use the locally cached session (no network round-trip on every navigation).
  // supabase-js refreshes the token itself when it is close to expiry.
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
