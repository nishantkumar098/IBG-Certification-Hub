import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, HeartHandshake, Sparkles, Droplets } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";

const TITLE = "Bartenders' Values & Commandments — IBG Academy";
const DESCRIPTION =
  "The India Bartenders' Guild code of conduct: the twelve Bartenders' Commandments, guild values, food safety and health & safety standards behind the bar.";

const COMMANDMENTS = [
  [
    "Respect and honour those around you",
    "Every guest, every colleague, every supplier and every kitchen porter is part of the same service. Respect is shown in how you greet, how you hand over a shift and how you speak when nobody senior is listening.",
  ],
  [
    "Speak and act in a respectful manner",
    "Language behind the bar is part of the guest experience. Keep tone even under pressure, avoid profanity within earshot of guests, and never argue with a colleague on the floor — take it to the back of house.",
  ],
  [
    "Never gossip",
    "Gossip about guests, staff or management corrodes a team faster than any bad shift. What you hear across the bar stays across the bar; discretion is a professional duty, not a courtesy.",
  ],
  [
    "Learn the names and recipes of drinks",
    "A professional knows the IBA Official Cocktails by name, build, glass, garnish and specification — without a cheat sheet. Recipe accuracy is the difference between a bar and a bartender.",
  ],
  [
    "Never drink on the job",
    "Tasting for quality control is technique; drinking on shift is not. Your judgement, pour accuracy and duty of care to intoxicated guests all depend on being completely sober.",
  ],
  [
    "Never touch the rim of a glass",
    "Hold glassware at the base or stem, and carry on a tray where possible. The top half of the glass belongs to the guest — always.",
  ],
  [
    "Honour the guests; work to make them happy",
    "Read the table before you take the order. Anticipate, don't react. A recovered mistake handled with grace earns more loyalty than a flawless drink served indifferently.",
  ],
  [
    "Offer the cocktail menu",
    "Guiding a guest through the menu is hospitality and commerce at once. Suggest, describe and never assume what somebody can or cannot afford.",
  ],
  [
    "Use proper drink-making techniques",
    "Shake, stir, build, throw, blend and layer — each for a reason. Correct dilution, temperature and texture are measurable, examinable standards, not preferences.",
  ],
  [
    "Keep a clean workstation",
    "Wipe as you go. A clean bar top, dry rail, ordered speed rack and empty bin at all times signal competence before the first drink is poured.",
  ],
  [
    "Use fresh ingredients and efficient mise en place",
    "Fresh juice, fresh garnish, prepared syrups labelled and dated. Mise en place is what allows speed without shortcuts.",
  ],
  [
    "Learn a tactful way to cut someone off",
    "Refusing further service is a legal duty and a hospitality skill. Do it privately, calmly, without judgement, and arrange safe transport where you can.",
  ],
] as const;

const FOOD_SAFETY = [
  "Preparation of garnishes should be done with clean hands. In some jurisdictions the health department requires the bartender to wear latex or nitrile gloves.",
  "Always clean the cutting board, knife and other utensils prior to use — and again between different ingredients.",
  "Always wash fruit before cutting, including fruit that will only be used for zest or wheels.",
  "Always wash all containers before placing fruit in them. Store cherries, olives and onions in their own juice.",
  "Never store fruit cut on different days in the same storage container. Record the date the fruit was cut directly on the container so it is used in the order it was cut.",
  "Always record the date on juice and other containers holding perishable ingredients.",
  "Garnishes should be wrapped at the end of every shift. Some will not last more than a few hours after cutting — if lemons and limes do not look good, throw them away. Never use ingredients that are not fresh.",
  "Rotate stock on a first-in, first-out basis and discard anything past its recorded date without debate.",
] as const;

const HEALTH_SAFETY = [
  "Avoid direct contact between your hands and the ice used in drink preparation. Where a bar runs an \"ice programme\" handling large-format ice, use dedicated tongs and clean hands.",
  "Always use ice scoops that have handles. Never scoop ice with a glass or with your hands — a broken glass in the ice bin means the whole bin is condemned.",
  "Use a separate ice bin to chill glasses, wine bottles, juices and syrups, and never serve that ice in drinks.",
  "As damp bar towels dry, bacteria remain. Those towels should never touch pour spouts or anything that comes into direct or indirect contact with the guest.",
  "Launder bar towels with bleach and soap. When cleaning the bar or bar items, always use a disinfectant agent — not just water.",
  "Clean ice bins daily to prevent the growth of bacteria: remove the ice and wash the bin.",
  "Never put your fingers inside clean or dirty glasses. Hold them at the base or use a tray.",
  "When serving drinks, never touch the lip of the glass. The top half of the glass belongs to the guest.",
  "Keep floors dry and spills cleared immediately; report broken glass, faulty equipment and gas leaks before service continues.",
] as const;

const VALUES = [
  [
    ShieldCheck,
    "Responsibility",
    "Responsible alcohol service, legal compliance and the safety of every guest come before any sale.",
  ],
  [
    HeartHandshake,
    "Hospitality",
    "Bartending is hospitality first and craft second. The guest's experience is the product.",
  ],
  [
    Sparkles,
    "Craft",
    "Measurable technique, accurate specifications and continuous learning — examined, not assumed.",
  ],
  [
    Droplets,
    "Integrity",
    "Honest pours, honest costing, honest conduct. A charter holder's word is part of the credential.",
  ],
] as const;

export const Route = createFileRoute("/values")({
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
  component: ValuesPage,
});

function ValuesPage() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow animate-rise">The IBG code</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] animate-rise md:text-6xl">
            Values and the <span className="text-gradient-gold">Bartenders' Commandments</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground animate-rise">
            Every CPB® charter holder commits to the guild's professional code. It is examined in the
            written paper, observed in the practical assessment and reviewed annually as part of your
            Professional Conduct review.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl">Guild values</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(([Icon, title, body]) => {
              const IconCmp = Icon as typeof ShieldCheck;
              return (
                <div key={title} className="reveal rounded-md border border-border bg-card/60 p-6">
                  <IconCmp className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-xl">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-ink py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Conduct</p>
          <h2 className="mt-3 text-4xl">The twelve commandments</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {COMMANDMENTS.map(([title, body], i) => (
              <div key={title} className="reveal bg-card p-6">
                <span className="font-display text-sm text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Standards</p>
            <h2 className="mt-3 text-3xl">Food and safety</h2>
            <ul className="mt-6 space-y-3">
              {FOOD_SAFETY.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Standards</p>
            <h2 className="mt-3 text-3xl">Health and safety behind the bar</h2>
            <ul className="mt-6 space-y-3">
              {HEALTH_SAFETY.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 text-center">
          <h2 className="text-3xl">Study the full manual — free</h2>
          <p className="text-muted-foreground">
            The IBG study material is open to everyone, member or not. Read it online or download it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/study-material">Open study material</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/cpb">About the CPB® charter</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
