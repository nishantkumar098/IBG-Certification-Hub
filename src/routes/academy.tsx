import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardCheck, MapPin, Sparkles, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { ARCHIVE } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";

const TITLE = "IBG Academy — bartending training & skills centre";
const DESCRIPTION =
  "IBG Academy delivers bartending education in India: the CPB® syllabus, chapter workshops, residential skills programmes and examiner-led practical assessment.";

export const Route = createFileRoute("/academy")({
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
  component: AcademyPage,
});

const TRACKS = [
  {
    icon: BookOpen,
    title: "Foundation",
    body: "Bar set-up, hygiene, tools, glassware, measures, service standards and responsible alcohol service. The base every CPB® candidate is examined on.",
  },
  {
    icon: Sparkles,
    title: "Craft & classics",
    body: "IBA classics, build methods, balance, ice, garnish discipline and the Indian palate — taught from the IBG Ultimate Bartender Book.",
  },
  {
    icon: Users,
    title: "Bar leadership",
    body: "Costing, menu engineering, inventory, team training and guest recovery for bartenders moving into head-bartender roles.",
  },
  {
    icon: ClipboardCheck,
    title: "Assessment prep",
    body: "Practice quizzes, mock written papers and practical run-throughs with examiner feedback before the live assessment.",
  },
];

const FORMATS = [
  ["Chapter workshops", "Evening and off-day sessions run by your city chapter, usually at a partner bar or testing centre."],
  ["Residential skills programme", "Multi-day intensive training with accommodation, run in cohorts. Dates and fees are announced per cohort by the chapter."],
  ["In-house / corporate", "The academy trains and assesses your whole bar team on site, with guild-verified outcomes."],
  ["Self-paced Study Centre", "The full syllabus, guild books, reference library and video lessons inside your dashboard."],
];

function AcademyPage() {
  const ref = useReveal();

  const { data: centres } = useQuery({
    queryKey: ["public-testing-centres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testing_centers")
        .select("id, name, address, city_id, cities(name, state)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={ARCHIVE.goldenCupTeam}
          alt="Indian delegation on stage at an international cup"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow">The academy</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Learn the craft the way it is <span className="text-gradient-gold">examined</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            IBG Academy is the guild's teaching and assessment arm. Everything we teach maps to the
            CPB® syllabus, and everything we certify is examined by a guild examiner.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Enrol free
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/study-material">Preview the syllabus</Link>
            </Button>
          </div>
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Curriculum</p>
            <h2 className="mt-3 text-4xl">Four teaching tracks</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TRACKS.map((t) => {
                const Icon = t.icon;
                return (
                  <article key={t.title} className="reveal rounded-lg border border-border bg-card/60 p-7">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-display text-2xl">{t.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="reveal">
              <p className="eyebrow">How training runs</p>
              <h2 className="mt-3 text-4xl">Formats</h2>
              <dl className="mt-8 space-y-6">
                {FORMATS.map(([name, body]) => (
                  <div key={name}>
                    <dt className="font-display text-xl">{name}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="reveal grid gap-4 sm:grid-cols-2">
              <img
                src={ARCHIVE.judgingBriefing}
                alt="Chapter training session in progress"
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-lg border border-border object-cover"
              />
              <div className="grid gap-4">
                <img
                  src={ARCHIVE.judgingPanel}
                  alt="Examiners assessing a candidate's cocktail"
                  loading="lazy"
                  decoding="async"
                  className="rounded-lg border border-border object-cover"
                />
                <img
                  src={ARCHIVE.barVisit}
                  alt="Guild bar visit and industry outreach"
                  loading="lazy"
                  decoding="async"
                  className="rounded-lg border border-border object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Where you train and test</p>
            <h2 className="mt-3 text-4xl">Recognised testing centres</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(centres ?? []).map((c) => (
                <article key={c.id} className="reveal rounded-lg border border-border bg-card/60 p-6">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="mt-3 font-display text-xl">{c.name}</h3>
                  {c.cities && (
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-primary">
                      {c.cities.name}
                      {c.cities.state ? `, ${c.cities.state}` : ""}
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.address}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Only guild-verified centres are listed. Running a bar or institute that could host
              assessments?{" "}
              <Link to="/become-a-testing-centre" className="text-primary hover:underline">
                Apply to become a testing centre
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-4xl">Start with the free account</h2>
            <p className="mt-4 text-muted-foreground">
              Create your profile, work through the Study Centre, take the practice quizzes, then
              book a live written and practical slot when you are ready.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Enrol now
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">See fees</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}