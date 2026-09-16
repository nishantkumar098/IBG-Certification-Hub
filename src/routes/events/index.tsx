import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Trophy, Globe2, Users } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { ARCHIVE } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";
import { Tilt3D } from "@/components/tilt-3d";

const TITLE = "Events & competitions — India Bartenders' Guild";
const DESCRIPTION =
  "IBG competitions, chapter meet-ups, masterclasses and international delegations. See what the guild runs through the year and how to enter.";

export const Route = createFileRoute("/events/")({
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
  component: EventsPage,
});

const STRANDS = [
  {
    icon: Trophy,
    title: "National cocktail competitions",
    body: "Guild-judged competitions where members compete on classics, signature builds and speed. Judging follows the guild's scoring protocol with calibrated examiners.",
    image: ARCHIVE.awardWinner,
    alt: "Competition winner receiving a trophy and certificate",
  },
  {
    icon: Globe2,
    title: "International representation",
    body: "As India's IBA-affiliated body, the guild sends delegations and competitors to international congresses and cups, and hosts visiting officials in India.",
    image: ARCHIVE.goldenCupTeam,
    alt: "Indian delegation on stage at an international cup",
  },
  {
    icon: Users,
    title: "Chapter meet-ups & masterclasses",
    body: "Delhi, Jaipur, Mumbai, Dehradun, Chennai and Goa chapters run brand masterclasses, tasting sessions and training evenings for members.",
    image: ARCHIVE.masterclassSpeaking,
    alt: "Trainer delivering a guild masterclass",
  },
  {
    icon: CalendarDays,
    title: "Examination days",
    body: "Written and practical CPB® assessment days at recognised testing centres. Slots are booked from your dashboard once your profile is complete.",
    image: ARCHIVE.judgingClose,
    alt: "Examiner assessing a candidate's cocktail",
  },
];

const HIGHLIGHTS = [
  {
    src: ARCHIVE.eemaAward,
    title: "Industry awards recognition",
    body: "The guild's work recognised on the national events-industry stage.",
  },
  {
    src: ARCHIVE.galaFlag,
    title: "Guild gala nights",
    body: "Annual dinners where members, chapters and partners come together.",
  },
  {
    src: ARCHIVE.judgingPanel,
    title: "Judging panels",
    body: "Examiner-led panels scoring competitors on technique, balance and hygiene.",
  },
  {
    src: ARCHIVE.ibaOfficials,
    title: "Congress delegations",
    body: "Meeting international bartenders association officials on behalf of India.",
  },
];

function EventsPage() {
  const ref = useReveal();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={ARCHIVE.awardsCollage}
          alt="Collage of guild award ceremony moments"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow">Events</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Compete, learn, <span className="text-gradient-gold">represent</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The guild's year runs on competitions, chapter training, examination days and
            international representation. Members get first access to every call for entries.
          </p>
          <Button asChild className="mt-8">
            <Link to="/membership">Join to get event access</Link>
          </Button>
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-5">
            <div>
              <p className="eyebrow">What we run</p>
              <h2 className="mt-3 text-4xl">Four event strands</h2>
            </div>
            {STRANDS.map((s, i) => {
              const Icon = s.icon;
              return (
                <article
                  key={s.title}
                  className="reveal grid gap-6 overflow-hidden rounded-lg border border-border bg-card/60 md:grid-cols-[0.9fr_1.1fr]"
                >
                  <img
                    src={s.image}
                    alt={s.alt}
                    loading="lazy"
                    decoding="async"
                    className={`h-64 w-full object-cover md:h-full ${i % 2 ? "md:order-2" : ""}`}
                  />
                  <div className="p-8">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-display text-3xl">{s.title}</h3>
                    <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">From the archive</p>
            <h2 className="mt-3 text-4xl">Past highlights</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((h) => (
                <Tilt3D key={h.title} className="reveal">
                  <figure className="overflow-hidden rounded-lg border border-border bg-card/60">
                    <img
                      src={h.src}
                      alt={h.title}
                      loading="lazy"
                      decoding="async"
                      className="h-48 w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                    />
                    <figcaption className="p-5">
                      <p className="font-display text-xl">{h.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{h.body}</p>
                    </figcaption>
                  </figure>
                </Tilt3D>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Upcoming dates are announced chapter by chapter. Once you are a member, calls for
              entries and event invitations reach you through your chapter and your dashboard.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-4xl">Want to host or sponsor an event?</h2>
            <p className="mt-4 text-muted-foreground">
              Bars, brands and institutes partner with the guild on competitions, masterclasses and
              assessment days. Write to support@ibg.network or apply as a testing centre.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild>
                <Link to="/become-a-testing-centre">Apply to host</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/gallery">See the gallery</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
