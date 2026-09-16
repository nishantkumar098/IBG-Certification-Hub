import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BadgeCheck, CalendarClock, GraduationCap } from "lucide-react";

import { IbgAcademyLogo, IbgSeal } from "@/components/ibg-logo";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";

const TITLE = "The CPB® Charter — Certified Professional Bartender | IBG Academy";
const DESCRIPTION =
  "The Certified Professional Bartender (CPB®) charter from IBG Academy: how to earn it in seven steps, curriculum focus areas, benefits, fees and one-year charter validity with annual Professional Conduct review.";

const STEPS = [
  ["Register and receive the study material at your location", "₹5,000 registration includes the IBG Bartenders Manual delivered to you, plus digital access."],
  ["Study the Bartenders Manual and supporting materials", "50+ hours of self-paced study from any location, supported by free open-access IBG books."],
  ["Book an examination slot at an IBG designated centre", "Delhi, Dehradun, Jaipur, Mumbai, Chennai or Goa."],
  ["Achieve 75% in the CPB® written examination", "One hour of multiple-choice and subjective questions, taken in person with an examiner."],
  ["Complete the practical assessment", "A 30-minute live demonstration scored against the IBG rubric."],
  ["Submit a minimum of one year of relevant work experience", "With job references verified by the guild."],
  ["Earn your Professional Bartender Badge, Pin and Certification", "And use the CPB title after your name in official communication."],
] as const;

const CURRICULUM = [
  "Social Responsibility",
  "Types of Alcohols and Non-Alcoholics",
  "IBA Official Cocktail List and Recipes",
  "Bar Operations",
  "History of Bartending",
  "Behind the Bars",
  "Customer Experience",
  "Cocktail Competition",
] as const;

const BENEFITS = [
  ["Better job opportunities", "Most hotels and upscale bars require certified bartenders to evidence formal training and professionalism."],
  ["Higher earning potential", "Branded venues pay a premium for a recognised, examined credential."],
  ["Strong drinks knowledge", "The IBA Official Cocktail List plus modern mixing technique, examined to a national standard."],
  ["Responsible service", "A dedicated Social Responsibility module covering legal duties and guest safety."],
  ["Confidence under pressure", "Assessment builds the composure to face real service challenges."],
  ["Career advancement", "A documented path from bartender to bar manager and beyond."],
  ["Networking", "Access to the exclusive IBG community of certified professionals."],
  ["Global recognition", "An employers' choice credential, aligned with IBA standards."],
  ["Public profile listing", "Your profile is listed on the official IBG website so employers can find you."],
] as const;


export const Route = createFileRoute("/cpb")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CpbPage,
});

function CpbPage() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow animate-rise">IBG Academy · CPB® Charter</p>
            <h1 className="mt-4 text-5xl leading-[1.05] animate-rise md:text-6xl">
              Achieving excellence in{" "}
              <span className="text-gradient-gold">professional bartending</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-rise">
              The Certified Professional Bartender (CPB®) designation is a nationally recognised,
              rigorous professional credential offered by the IBG Academy for working bartenders,
              bar managers and hospitality professionals. It involves study of the IBG Bartenders
              Manual and an in-person assessment at an IBG designated centre — one hour of theory and
              30 minutes of practical demonstration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Register — ₹5,000
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/study-material">Free study material</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-card/50 p-10">
            <IbgSeal className="h-32 w-32" />
            <IbgAcademyLogo className="h-16" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              [CalendarClock, "One-year validity", "Your charter is valid for one year and is renewed through an annual Professional Conduct review and nominal dues."],
              [BadgeCheck, "Badge, pin & title", "Charter holders receive the IBG Bartender Badge and Pin, and may use the CPB title after their name."],
              [GraduationCap, "In-person assessment", "60 minutes of theory at a 75% pass mark, plus a 30-minute practical demonstration before an examiner."],
            ].map(([Icon, title, body]) => {
              const IconCmp = Icon as typeof Award;
              return (
                <div key={title as string} className="reveal rounded-md border border-border bg-card/60 p-6">
                  <IconCmp className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-xl">{title as string}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-ink py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Seven steps</p>
          <h2 className="mt-3 text-4xl">How to earn your CPB® charter</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="reveal bg-card p-6">
                <span className="font-display text-sm text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Curriculum</p>
            <h2 className="mt-3 text-3xl">Focus areas</h2>
            <ul className="mt-6 space-y-2">
              {CURRICULUM.map((c) => (
                <li key={c} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Why it matters</p>
            <h2 className="mt-3 text-3xl">Benefits of the CPB®</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(([title, body]) => (
                <div key={title} className="reveal rounded-md border border-border bg-card/60 p-5">
                  <h3 className="text-base">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-ink py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="eyebrow">Guild membership</p>
          <h2 className="mt-3 text-4xl">Connect · Learn · Grow · Lead</h2>
          <p className="mt-4 text-muted-foreground">
            Certification and guild membership are separate. Full membership terms, benefits and
            fees are published on the membership page.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/membership">View membership benefits</Link>
          </Button>
        </div>
      </section>


      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <Award className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-4xl">Recognised. Respected. Professional.</h2>
          <p className="mt-4 text-muted-foreground">
            Registration fee ₹5,000 · support@ibg.network · +91 99905 52299
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>
              Begin registration
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
