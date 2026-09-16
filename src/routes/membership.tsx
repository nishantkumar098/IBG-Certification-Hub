import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, HeartHandshake, IdCard, Building2, GraduationCap, CreditCard } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";
import { useSession, useProfile } from "@/hooks/use-auth";
import { usePayment } from "@/hooks/use-payment";

const TITLE = "Guild membership — IBG Academy";
const DESCRIPTION =
  "Join the India Bartenders' Guild: professional membership with a digital member card, chapter access, competition entry, welfare support and corporate options.";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembershipPage,
});

const BENEFITS = [
  {
    icon: IdCard,
    title: "Digital member card",
    body: "Issued automatically the moment your membership payment clears, with your CPB ID and validity on it.",
  },
  {
    icon: GraduationCap,
    title: "Study Centre access",
    body: "The guild books, syllabus, reference library and training videos inside your dashboard.",
  },
  {
    icon: HeartHandshake,
    title: "Welfare & advocacy",
    body: "Foundation support programmes, and a guild that takes up workplace conduct and safety matters on your behalf.",
  },
  {
    icon: Building2,
    title: "Chapter network",
    body: "Your city chapter's training sessions, competitions, meet-ups and hiring network.",
  },
];

const MEMBER_TERMS = [
  "Physical membership card and IBG pin",
  "Access to the IBG community group",
  "Competition participation eligibility, free across Pan-India IBG competitions",
  "Events, workshops and newsletter updates",
  "Priority role in IBG events",
  "Complimentary or discounted access to select workshops",
  "15% discount on IBA training programmes in India and globally",
  "Access to the IBG Circle app, resources and job opportunities",
  "E-books, international publications, IBA training books and the IBA recipe book",
  "Discounted trade show tickets",
  "Access to India and global competitions with mentorship",
  "30-minute complimentary session under the IBG Mental Wellness Programme",
  "Access to expert legal representation and advice",
  "Discounts on IBG skill development and training programmes",
  "Free physical copy of The Ultimate Bartender Book",
] as const;

const CATEGORIES = [
  {
    name: "Standard member",
    who: "Students and newcomers to the bar",
    points: [
      "Digital Membership Card",
      "Access to IBG Community WhatsApp Group",
      "Competition Participation Eligibility",
      "Events & Workshops Updates",
      "Industry Exposure Opportunities",
      "Newsletter Announcements",
    ],
  },
  {
    name: "Professional member",
    who: "Working bartenders and F&B professionals",
    points: [
      "All Standard Membership Benefits",
      "IBG Pin",
      "Priority Role in IBG Events",
      "Complimentary or Discounted Access to Select Workshops",
      "15% Discount on IBA Training Programs in India and Globally",
      "Access to IBG Circle App and Resources/Job Opportunities",
      "Access to E-Books/International Publications/IBA Training Books/IBA Recipes Book",
      "Discounted Trade Show Tickets",
      "Free Access to IBG Competitions Pan India",
      "Access to India and Global Competitions with Mentorship",
      "Access to 30 mins free session for IBG Mental Wellness Program",
      "Access to expert legal representation and advice",
      "Discount on IBG Skill Development & IBG related Training Programs",
      "Free Physical Copy of The Ultimate Bartender Book",
    ],
    featured: true,
    price: "₹2,000 / year",
    purpose: "membership" as const,
  },
  {
    name: "Associate Member",
    who: "Bars, hotel groups, hospitality & academic institutes",
    points: [
      "Community Access & Industry Engagement",
      "Priority for IBG Competitions (Pan India)",
      "National Competition Exhibitions Benefit",
      "India Bar Show & Industry Exhibitions",
      "Logo Usage & Brand Association Rights",
      "In-House Competitions & IBG Certification Support",
      "Digital Presence & Publicity",
      "Skill Developments Program Integration",
      "Recruitment & Talent Support",
      "Structured Skill Development Opportunities",
      "Student Participation in National Competitions",
      "Industry Interaction & Expert Sessions",
      "Professional Certification Support – IBG & IBA Logo",
      "Institutional Recognition & Logo Association",
      "Digital Recognition & Academic Visibility",
      "Career & Recruitment Support",
      "Access to Industry Insights",
      "Strategic Value for Your Institution",
      "Get IBG Pin",
      "Get Associate Membership Memento",
    ],
    price: "₹40,000 / year",
    purpose: "associateMembership" as const,
  },
];

function MembershipPage() {
  const ref = useReveal();
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { pay, pending } = usePayment();

  const prefill = {
    name: profile?.full_name ?? undefined,
    email: user?.email ?? undefined,
    contact: profile?.phone ?? undefined,
  };

  const { data: plans } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow">Membership</p>
            <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">
              Belong to something <span className="text-gradient-gold">professional</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Guild membership is the front door to IBG. It gives you a verified identity in the
              industry, the guild's full study library, entry to competitions, and a body that
              represents you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your account
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">See all prices</Link>
              </Button>
            </div>
          </div>
          <img
            src="/events/asia-pacific-cocktail-competition/apcc-05.jpeg"
            alt="IBG representative at the Asia-Pacific Cocktail Competition"
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg border border-border object-cover"
          />
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">What you get</p>
            <h2 className="mt-3 text-4xl">Member benefits</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <article key={b.title} className="reveal rounded-lg border border-border bg-card/60 p-7">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-display text-2xl">{b.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Categories</p>
            <h2 className="mt-3 text-4xl">Choose how you join</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {CATEGORIES.map((c) => (
                <article
                  key={c.name}
                  className={cn(
                    "reveal flex flex-col rounded-lg border bg-card/60 p-8",
                    c.featured
                      ? "border-primary/60 shadow-[0_0_60px_-30px_hsl(var(--primary))]"
                      : "border-border",
                  )}
                >
                  {c.featured && <p className="eyebrow text-primary">Most members</p>}
                  <h3 className="mt-2 font-display text-3xl">{c.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.who}</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                    {c.points.map((p) => (
                      <li key={p} className="flex gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {"price" in c && c.price && (
                    <div className="mt-6 border-t border-border/60 pt-6">
                      <p className="font-display text-2xl">{c.price}</p>
                      {user ? (
                        <Button
                          className="mt-4 w-full"
                          disabled={!!pending}
                          onClick={() => void pay(c.purpose, prefill)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {pending === c.purpose ? "Opening checkout…" : "Pay & join now"}
                        </Button>
                      ) : (
                        <Button asChild className="mt-4 w-full">
                          <Link to="/auth" search={{ mode: "signup" }}>
                            Sign in to pay
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-ink py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Membership terms</p>
            <h2 className="mt-3 text-4xl">What professional membership includes</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              These benefits apply to guild membership only. Certification fees, exams and the
              CPB® charter are separate.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBER_TERMS.map((m) => (
                <li
                  key={m}
                  className="reveal rounded-md border border-border bg-card/60 p-4 text-sm text-muted-foreground"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>



        {(plans ?? []).length > 0 && (
          <section className="border-b border-border/60 py-20">
            <div className="mx-auto max-w-6xl px-5">
              <p className="eyebrow">Current fees</p>
              <h2 className="mt-3 text-4xl">Live plan pricing</h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(plans ?? []).map((p) => {
                  const purpose = p.code === "cpb_certification" ? "certification" : "membership";
                  const isFree = p.price_inr === 0;
                  return (
                    <div key={p.code} className="reveal rounded-lg border border-border bg-card/60 p-7">
                      <h3 className="font-display text-2xl">{p.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                      <p className="mt-5 font-display text-3xl">
                        {isFree ? "Free" : `₹${p.price_inr.toLocaleString("en-IN")}`}
                        {p.price_inr > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">/ {p.period}</span>
                        )}
                      </p>
                      <div className="mt-6">
                        {isFree ? (
                          <Button asChild variant="outline" className="w-full">
                            <Link to="/auth" search={{ mode: "signup" }}>
                              Create free account
                            </Link>
                          </Button>
                        ) : user ? (
                          <Button
                            className="w-full"
                            disabled={!!pending}
                            onClick={() => void pay(purpose, prefill)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            {pending === purpose ? "Opening checkout…" : `Pay ₹${p.price_inr.toLocaleString("en-IN")}`}
                          </Button>
                        ) : (
                          <Button asChild className="w-full">
                            <Link to="/auth" search={{ mode: "signup" }}>
                              Sign in to pay
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                Pay right here if you're signed in, or create a free account first. Payment is
                handled securely by Razorpay — UPI, cards, netbanking and wallets.
              </p>
            </div>
          </section>
        )}

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-3xl px-5">
            <div className="reveal">
              <p className="eyebrow">Member protection</p>
              <h2 className="mt-3 text-4xl">Support when the shift goes wrong</h2>
              <p className="mt-5 text-muted-foreground">
                Bar work carries real risk — late hours, difficult guests, and workplaces that do
                not always protect their staff. The Foundation runs welfare support for members
                facing medical emergencies, loss of livelihood or workplace harassment, and the
                guild's anti-harassment policy applies to every guild event and member.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Group insurance cover for members is in progress with the guild's partners. We will
                publish the exact cover, insurer and eligibility here once the policy is signed —
                nothing is promised before then.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/policies">Read our policies</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/report">Report misconduct</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-4xl">Ready to join the guild?</h2>
            <p className="mt-4 text-muted-foreground">
              Create a free account, complete your profile, and upgrade to professional membership
              from your dashboard. Your card is issued instantly.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}