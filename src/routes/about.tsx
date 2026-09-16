import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Globe2, ShieldCheck, Users } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { ARCHIVE, PARTNER_LOGOS } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";

const TITLE = "About the India Bartenders' Guild — IBG Academy";
const DESCRIPTION =
  "The India Bartenders' Guild Foundation, founded 26 January 2016 and affiliated with the IBA, is India's professional body for bartenders. Our story, mandate and leadership.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Professional standards",
    body: "The CPB® charter, a published code of conduct and a misconduct process that applies to every member equally.",
  },
  {
    icon: Users,
    title: "Chapters across India",
    body: "Delhi, Jaipur, Mumbai, Dehradun, Chennai and Goa chapters run training, meet-ups and examinations locally.",
  },
  {
    icon: Globe2,
    title: "International representation",
    body: "Affiliated with the International Bartenders Association — Indian bartenders compete and are recognised abroad.",
  },
  {
    icon: Award,
    title: "Competitions & recognition",
    body: "National competitions, judging panels calibrated to guild protocol, and industry awards that put Indian bar talent on record.",
  },
];

const TIMELINE = [
  ["26 Jan 2016", "The India Bartenders' Guild Foundation is established as a non-profit professional body for bartenders."],
  ["Chapters", "City chapters open across Delhi, Jaipur, Mumbai, Dehradun, Chennai and Goa."],
  ["IBA affiliation", "The guild becomes India's affiliate of the International Bartenders Association."],
  ["Publishing", "The IBG Ultimate Bartender Book and industry titles are published for Indian bartenders."],
  ["IBG Academy", "The CPB® certification programme moves onto a single examined, verifiable platform."],
];

function AboutPage() {
  const ref = useReveal();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={ARCHIVE.guildHero}
          alt="Bartenders at work during a guild event"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow">About us</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            India's professional body for <span className="text-gradient-gold">bartenders</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The India Bartenders' Guild Foundation was established on 26 January 2016 to give
            bartending in India what every other profession already had: a standard, a code, a
            community and a credential that can be verified.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/membership">Become a member</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cpb">About the CPB®</Link>
            </Button>
          </div>
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <article key={p.title} className="reveal rounded-lg border border-border bg-card/60 p-7">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="mt-4 font-display text-2xl">{p.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="reveal">
              <p className="eyebrow">Our mandate</p>
              <h2 className="mt-3 text-4xl">Raise the craft, protect the people behind it</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  The guild exists for the person behind the bar. That means teaching the craft
                  properly, examining it honestly, and standing behind members when the industry
                  does not.
                </p>
                <p>
                  Our work runs on four tracks: education through IBG Academy, certification through
                  the CPB® charter, representation through our IBA affiliation, and welfare through
                  the Foundation's community programmes.
                </p>
                <p>
                  Membership is open to bartenders, chefs, service professionals, students and
                  industry supporters. Certification is examined and earned.
                </p>
              </div>
            </div>
            <div className="reveal">
              <img
                src={ARCHIVE.awardscollage2}
                alt="Guild award ceremony highlights"
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-lg border border-border object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Milestones</p>
            <h2 className="mt-3 text-4xl">How the guild grew</h2>
            <ol className="mt-10 space-y-6 border-l border-border/70 pl-6">
              {TIMELINE.map(([when, what]) => (
                <li key={when} className="reveal relative">
                  <span className="absolute -left-[1.72rem] top-2 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary">{when}</p>
                  <p className="mt-1.5 max-w-2xl text-muted-foreground">{what}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <img
              src={ARCHIVE.ibgIbaEmblem}
              alt="India Bartenders' Guild and IBA emblem"
              loading="lazy"
              decoding="async"
              className="reveal mx-auto h-56 w-56 rounded-full border border-border bg-ink object-contain p-6"
            />
            <div className="reveal">
              <p className="eyebrow">The IBG Circle app</p>
              <h2 className="mt-3 text-4xl">Your chapter, in your pocket</h2>
              <p className="mt-5 text-muted-foreground">
                IBG Circle is the guild's member community — chapter announcements, competition
                calls, job leads, and direct access to the people who run your city's bar scene.
                Members get access as part of their membership.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                App store listings are being finalised. Until then, members are added to their
                chapter group by the chapter lead after joining.
              </p>
              <Button asChild className="mt-7">
                <a
                  href="https://play.google.com/store/apps/details?id=com.nirvaan.ibgcircle"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download IBG Circle App
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Industry & partner brands</p>
            <h2 className="mt-3 text-4xl">Who we work with</h2>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {PARTNER_LOGOS.map((src, i) => (
                <div
                  key={i}
                  className="reveal flex h-24 items-center justify-center rounded-lg border border-border bg-card/60 p-4"
                >
                  <img
                    src={src}
                    alt="Partner brand Standardd with the India Bartenders' Guild"
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}