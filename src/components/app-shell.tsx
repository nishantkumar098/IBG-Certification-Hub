import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  UserRound,
  Award,
  Gavel,
  Settings,
  Library,
  ScrollText,
  FileCheck2,
} from "lucide-react";

import { IbgWordmark } from "@/components/ibg-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession, useRoles, signOutAndRedirect } from "@/hooks/use-auth";

const CANDIDATE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/study", label: "Study", icon: BookOpen },
  { to: "/library", label: "Library", icon: Library },
  { to: "/book", label: "Exam dates", icon: CalendarDays },
  { to: "/exam", label: "Written exam", icon: ClipboardCheck },
  { to: "/conduct", label: "Code of conduct", icon: ScrollText },
  { to: "/experience", label: "Experience", icon: FileCheck2 },
  { to: "/certificate", label: "Certificate", icon: Award },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const adminLabel = roles?.includes("superadmin")
    ? "Superadmin"
    : roles?.includes("office_admin")
      ? "Office Admin"
      : "Admin";

  const nav = [
    ...CANDIDATE_NAV,
    ...(roles?.includes("examiner")
      ? ([{ to: "/examiner", label: "Examiner", icon: Gavel }] as const)
      : []),
    ...(roles?.some((r) => r === "admin" || r === "superadmin" || r === "office_admin")
      ? ([{ to: "/admin", label: adminLabel, icon: Settings }] as const)
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" aria-label="IBG Academy home" className="group">
            <IbgWordmark />
          </Link>
          <Button variant="outline" size="sm" onClick={() => void signOutAndRedirect()}>
            Sign out
          </Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
    </div>
  );
}
