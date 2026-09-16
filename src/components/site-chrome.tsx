import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { IbgWordmark, IbgAcademyLogo } from "@/components/ibg-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, signOutAndRedirect } from "@/hooks/use-auth";
import { EVENTS } from "@/lib/events-data";

function navLinkClass(pathname: string, to: string) {
  const active = pathname === to || pathname.startsWith(`${to}/`);
  return cn("nav-link transition-colors hover:text-foreground", active && "is-active");
}

function mobileNavLinkClass(pathname: string, to: string) {
  const active = pathname === to || pathname.startsWith(`${to}/`);
  return cn(
    "animate-rise rounded-md px-2 py-2.5 transition-colors hover:bg-card",
    active ? "bg-card text-primary" : "text-foreground",
  );
}

export const IBG_OFFICES = [
  ["Corporate Office", "H 12 B, Green Park Main, New Delhi 110016"],
  ["Dehradun Office", "Ground floor, 28, Subhash Rd, Karanpur, Dehradun, Uttarakhand 248001"],
  ["Jaipur Office", "582A, Raja Park, Jaipur, Rajasthan 302004"],
  ["Mumbai Office", "Unit 707, Magic Square, Malad East, Mumbai 400097"],
  [
    "Chennai Office",
    "1, Basement, Srinivas Apartment, No 45, 1/22, Nathamuni St, Alankar, T. Nagar, Chennai, Tamil Nadu 600017",
  ],
  ["Goa Office", "526, Baga Arpora Road, s lane, Arpora, Goa 403516"],
] as const;

export function SiteHeader() {
  const { user, loading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const eventsActive = pathname.startsWith("/events");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur transition-all duration-300",
        scrolled
          ? "border-border/70 bg-background/95 shadow-elevated"
          : "border-transparent bg-background/85",
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-5 py-3">
        <Link to="/" aria-label="IBG Academy home" className="group">
          <IbgWordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          <Link to="/about" className={navLinkClass(pathname, "/about")}>
            About
          </Link>
          <Link to="/cpb" className={navLinkClass(pathname, "/cpb")}>
            The CPB®
          </Link>
          <Link to="/academy" className={navLinkClass(pathname, "/academy")}>
            Academy
          </Link>
          <Link to="/membership" className={navLinkClass(pathname, "/membership")}>
            Membership
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "nav-link group flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none",
                eventsActive && "is-active",
              )}
            >
              Events
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link to="/events">All events</Link>
              </DropdownMenuItem>
              {EVENTS.map((e) => (
                <DropdownMenuItem key={e.slug} asChild>
                  <Link to="/events/$slug" params={{ slug: e.slug }}>
                    {e.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/gallery" className={navLinkClass(pathname, "/gallery")}>
            Gallery
          </Link>
          <Link to="/resources" className={navLinkClass(pathname, "/resources")}>
            Resources
          </Link>
          <Link to="/directory" className={navLinkClass(pathname, "/directory")}>
            Directory
          </Link>
          <Link to="/verify" className={navLinkClass(pathname, "/verify")}>
            Verify
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {!loading && user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => void signOutAndRedirect()}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth" search={{ mode: "signin" }}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Register
                  </Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <IbgWordmark />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-base">
                <SheetClose asChild>
                  <Link
                    to="/about"
                    style={{ animationDelay: "20ms" }}
                    className={mobileNavLinkClass(pathname, "/about")}
                  >
                    About
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/cpb"
                    style={{ animationDelay: "40ms" }}
                    className={mobileNavLinkClass(pathname, "/cpb")}
                  >
                    The CPB®
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/academy"
                    style={{ animationDelay: "60ms" }}
                    className={mobileNavLinkClass(pathname, "/academy")}
                  >
                    Academy
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/membership"
                    style={{ animationDelay: "80ms" }}
                    className={mobileNavLinkClass(pathname, "/membership")}
                  >
                    Membership
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/events"
                    style={{ animationDelay: "100ms" }}
                    className={mobileNavLinkClass(pathname, "/events")}
                  >
                    Events
                  </Link>
                </SheetClose>
                <div className="ml-2 flex flex-col gap-1 border-l border-border pl-3">
                  {EVENTS.map((e, i) => (
                    <SheetClose asChild key={e.slug}>
                      <Link
                        to="/events/$slug"
                        params={{ slug: e.slug }}
                        style={{ animationDelay: `${120 + i * 20}ms` }}
                        className="animate-rise rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
                      >
                        {e.name}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                <SheetClose asChild>
                  <Link
                    to="/gallery"
                    style={{ animationDelay: "140ms" }}
                    className={mobileNavLinkClass(pathname, "/gallery")}
                  >
                    Gallery
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/resources"
                    style={{ animationDelay: "160ms" }}
                    className={mobileNavLinkClass(pathname, "/resources")}
                  >
                    Resources
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/directory"
                    style={{ animationDelay: "180ms" }}
                    className={mobileNavLinkClass(pathname, "/directory")}
                  >
                    Directory
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/verify"
                    style={{ animationDelay: "200ms" }}
                    className={mobileNavLinkClass(pathname, "/verify")}
                  >
                    Verify
                  </Link>
                </SheetClose>
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                {!loading && user ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    </SheetClose>
                    <Button variant="ghost" onClick={() => void signOutAndRedirect()}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link to="/auth" search={{ mode: "signin" }}>
                          Sign in
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
                        <Link to="/auth" search={{ mode: "signup" }}>
                          Register
                        </Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <IbgWordmark />
          <p className="text-sm leading-relaxed text-muted-foreground">
            The India Bartenders' Guild Foundation, established 26 January 2016, is India's
            professional body for bartenders and is affiliated with the International Bartenders
            Association. The CPB® charter is awarded by IBG Academy.
          </p>

          <p className="text-sm text-muted-foreground">support@ibg.network · +91 99905 52299</p>
          <p className="text-xs text-muted-foreground">CSR Registration No. CSR0009724</p>
        </div>
        <div className="flex flex-wrap gap-12 text-sm">
          <div className="space-y-2">
            <p className="eyebrow">Certification</p>
            <Link to="/academy" className="block text-muted-foreground hover:text-foreground">
              IBG Academy
            </Link>
            <Link to="/resources" className="block text-muted-foreground hover:text-foreground">
              Resources & library
            </Link>
            <Link to="/cpb" className="block text-muted-foreground hover:text-foreground">
              About CPB®
            </Link>
            <Link
              to="/study-material"
              className="block text-muted-foreground hover:text-foreground"
            >
              Free study material
            </Link>
            <Link to="/values" className="block text-muted-foreground hover:text-foreground">
              Values & commandments
            </Link>
            <Link to="/verify" className="block text-muted-foreground hover:text-foreground">
              Verify certificate
            </Link>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">Guild</p>
            <Link to="/about" className="block text-muted-foreground hover:text-foreground">
              About us
            </Link>
            <Link to="/membership" className="block text-muted-foreground hover:text-foreground">
              Membership
            </Link>
            <Link to="/events" className="block text-muted-foreground hover:text-foreground">
              Events & competitions
            </Link>
            <Link to="/gallery" className="block text-muted-foreground hover:text-foreground">
              Gallery
            </Link>
            <Link to="/donate" className="block text-muted-foreground hover:text-foreground">
              Support the Foundation
            </Link>
            <Link to="/pricing" className="block text-muted-foreground hover:text-foreground">
              Pricing & plans
            </Link>
            <Link to="/directory" className="block text-muted-foreground hover:text-foreground">
              Member directory
            </Link>
            <Link
              to="/become-a-testing-centre"
              className="block text-muted-foreground hover:text-foreground"
            >
              Become a testing centre
            </Link>
            <Link to="/report" className="block text-muted-foreground hover:text-foreground">
              Report a member
            </Link>
            <Link to="/policies" className="block text-muted-foreground hover:text-foreground">
              Privacy & anti-harassment
            </Link>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">Account</p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="block text-muted-foreground hover:text-foreground"
            >
              Register
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="block text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {IBG_OFFICES.map(([label, address]) => (
            <div key={label}>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary">{label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{address}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} India Bartenders' Guild Foundation. CPB® is a registered
        credential of the IBG.
      </div>
    </footer>
  );
}
