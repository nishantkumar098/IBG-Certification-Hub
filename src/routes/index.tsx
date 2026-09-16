import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  GraduationCap,
  MapPin,
  QrCode,
  Award,
  Users,
  BookOpen,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import partnerCocktailWeek from "@/assets/partners/cocktail-week-delhi.png";
import partnerBacardi from "@/assets/partners/bacardi.jpg";
import partnerIndiaBarShow from "@/assets/partners/india-bar-show.jpg";
import partnerJagermeister from "@/assets/partners/jagermeister.webp";
import partnerMonin from "@/assets/partners/monin.png";
import hero from "@/assets/hero-bartender.jpg";
import cityDelhi from "@/assets/city-delhi.jpg";
import cityMumbai from "@/assets/city-mumbai.jpg";
import cityJaipur from "@/assets/city-jaipur.jpg";
import cityChennai from "@/assets/city-chennai.jpg";
import cityGoa from "@/assets/city-goa.jpg";
import cityDehradun from "@/assets/city-dehradun.jpg";
import { IbgSeal } from "@/components/ibg-logo";
import ibaLogo from "@/assets/iba-logo.png";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { Tilt3D } from "@/components/tilt-3d";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE = "IBG Academy — Certified Professional Bartender (CPB®)";
const DESCRIPTION =
  "Earn the CPB® credential from the India Bartenders' Guild. Study material, written exam, live practical assessment and a verifiable digital certificate. Now in Delhi, Mumbai, Jaipur, Chennai, Goa and Dehradun.";

const PARTNERS = [
  { name: "Cocktail Week Delhi", logo: partnerCocktailWeek },
  { name: "Bacardi", logo: partnerBacardi },
  { name: "India Bar Show", logo: partnerIndiaBarShow },
  { name: "Jägermeister", logo: partnerJagermeister },
  { name: "Monin", logo: partnerMonin },
];

const CITIES = [
  {
    city: "Delhi",
    image: cityDelhi,
    centre: "IBG Corporate Office",
    address: "H 12 B, Green Park Main, New Delhi 110016",
    note: "Flagship centre · written + practical",
    phone: " Phone - +91 72900 04824",
  },
  {
    city: "Dehradun",
    image: cityDehradun,
    centre: "IBG Dehradun Office",
    address: "Ground floor, 28, Subhash Rd, Karanpur, Dehradun, Uttarakhand 248001",
    note: "Foothills centre · monthly cohorts",
    phone: " Phone - +91 85859 04100",
  },
  {
    city: "Jaipur",
    image: cityJaipur,
    centre: "IBG Jaipur Office",
    address: "582A, Raja Park, Jaipur, Rajasthan 302004",
    note: "Heritage-hotel partner venues",
    phone: " Phone -  +91 96439 76060",
  },
  {
    city: "Mumbai",
    image: cityMumbai,
    centre: "IBG Mumbai Office",
    address: "Unit 707, Magic Square, Malad East, Mumbai 400097",
    note: "Highest slot frequency · weekly practicals",
    phone: "+91 72900 08245",
  },
  {
    city: "Chennai",
    image: cityChennai,
    centre: "IBG Chennai Office",
    address:
      "1, Basement, Srinivas Apartment, No 45, 1/22, Nathamuni St, Alankar, T. Nagar, Chennai, Tamil Nadu 600017",
    note: "South India examination hub",
    phone: "+91 8110003996",
  },
  {
    city: "Goa",
    image: cityGoa,
    centre: "IBG Goa Office",
    address: "526, Baga Arpora Road, s lane, Arpora, Goa 403516",
    note: "Season intakes · beach-club practicals",
    phone: "91 9130092106",
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [{ rel: "preload", as: "image", href: hero, fetchpriority: "high" }],
  }),
  component: Landing,
});

const SYLLABUS = [
  ["Social Responsibility", "Responsible service, legal duties and guest safety."],
  ["Alcohols & Non-Alcoholics", "Spirits, wines, beers, liqueurs, mixers and zero-proof."],
  ["IBA Official Cocktails", "The Unforgettables, Contemporary Classics, New Era Drinks."],
  ["Bar Operations", "Inventory, costing, par levels, hygiene and workflow."],
  ["History of Bartending", "From taverns to the modern craft cocktail renaissance."],
  ["Behind the Bars", "Tools, glassware, stations and mise en place."],
  ["Customer Experience", "Hospitality standards, guest reading, service recovery."],
  ["Cocktail Competition", "Judging criteria, presentation and competition formats."],
] as const;

const FAQS = [
  [
    "What is the CPB® certification?",
    "The Certified Professional Bartender (CPB®) is the India Bartenders' Guild credential recognising professional competence in mixology, bar operations and responsible service. It is assessed in two parts: a written examination and a live practical assessment before an IBG examiner.",
  ],
  [
    "What does it cost?",
    "The CPB® certification fee is ₹5,000. It includes the IBG Bartenders Manual, unlimited practice quizzes, one written exam attempt and one practical exam attempt. Retakes of a failed component are ₹1,500.",
  ],
  [
    "Which cities is it available in?",
    "CPB® examinations run in Delhi, Mumbai, Jaipur, Chennai, Goa and Dehradun, with additional cities accredited every quarter.",
  ],

  [
    "What if I fail a component?",
    "You may retake the failed component after a 14-day cooldown at the reduced retake fee. Your passed component stands.",
  ],
  [
    "How long is the certificate valid?",
    "CPB® certificates are valid for one year from the date of issue. Each charter holder completes an annual Professional Conduct review and pays nominal dues to renew charter status. Any employer can verify a certificate using the number or QR code.",
  ],
  [
    "Is the study material free?",
    "Yes. The IBG Ultimate Cocktail Book and the IBG CFB guide are open to everyone — no account, no membership, no fee. Read them online or download them from the study material page.",
  ],
] as const;

function Landing() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={hero}
          alt="Professional bartender straining a cocktail behind a polished bar"
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 animate-rise"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="pointer-events-none absolute -right-24 top-1/4 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float lg:block" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-36">
          <p className="eyebrow animate-rise">Est. 2016 · Affiliated with the IBA</p>
          <h1
            className="mt-5 max-w-3xl text-5xl leading-[1.05] animate-rise md:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            The national standard for{" "}
            <span className="text-gradient-gold">professional bartending</span> in India.
          </h1>
          <p
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground animate-rise"
            style={{ animationDelay: "160ms" }}
          >
            The Certified Professional Bartender (CPB®) is the India Bartenders' Guild credential
            that proves your craft — examined, scored and independently verifiable. Now examining in
            Delhi, Mumbai, Jaipur, Chennai, Goa and Dehradun.
          </p>
          <div
            className="mt-9 flex flex-wrap items-center gap-3 animate-rise"
            style={{ animationDelay: "240ms" }}
          >
            <Button asChild size="lg" className="transition-transform hover:scale-[1.03]">
              <Link to="/auth" search={{ mode: "signup" }}>
                Register for CPB® — ₹5,000
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/verify">Verify a certificate</Link>
            </Button>
          </div>
          <dl
            className="mt-14 grid max-w-2xl grid-cols-2 gap-6 animate-rise sm:grid-cols-4"
            style={{ animationDelay: "320ms" }}
          >
            {[
              ["6", "Certification cities"],
              ["2", "Exam components"],
              ["1 yr", "Charter validity"],
              ["63", "IBA member nations"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-3xl text-gradient-gold">{value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Who works with us */}
      <section className="border-t border-border/60 py-12">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow text-center">Who works with us</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-6">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="flex h-20 w-32 items-center justify-center rounded-md bg-white/95 p-3 shadow-sm sm:h-24 sm:w-40"
              >
                <img src={p.logo} alt={p.name} className="h-full w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What it is */}
      <section id="certification" className="border-t border-border/60 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-5">
              <IbgSeal className="h-24 w-24" />
              <img
                src={ibaLogo}
                alt="International Bartenders Association logo"
                className="h-26 w-26 object-contain"
              />
            </div>
            <p className="eyebrow mt-8">The credential</p>
            <h2 className="mt-3 text-4xl">Certified Professional Bartender</h2>
            <p className="mt-5 text-muted-foreground">
              India has one of the world's great hospitality industries but has never had a
              professional certifying body for bartenders. The CPB® changes that — a single,
              consistent, examined standard recognised across the country.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              [
                GraduationCap,
                "Structured curriculum",
                "Eight examinable modules built on IBA course content and the IBG Bartenders Manual.",
              ],
              [
                ShieldCheck,
                "Two-part examination",
                "A 60-minute written paper at 75% pass, then a live practical scored out of 100 by an IBG examiner.",
              ],
              [
                QrCode,
                "Independently verifiable",
                "Every certificate carries a unique number and QR code any employer can check in seconds.",
              ],
              [
                Users,
                "Guild membership",
                "Certified bartenders unlock IBG Hospitality Membership benefits, events and opportunities.",
              ],
            ].map(([Icon, title, body]) => {
              const IconCmp = Icon as typeof ShieldCheck;
              return (
                <Tilt3D key={title as string}>
                  <div className="h-full rounded-md border border-border bg-card/60 p-6">
                    <IconCmp className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 text-xl">{title as string}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {body as string}
                    </p>
                  </div>
                </Tilt3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certification + membership */}
      <section id="membership" className="border-t border-border/60 bg-ink py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Certification & membership</p>
          <h2 className="mt-3 max-w-2xl text-4xl">Get certified, then stay in the guild</h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            The CPB® charter proves your craft. Guild membership keeps it current — a digital
            membership card, a listing in the public member directory, training videos and
            continuing education, renewed each year.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="flex flex-col rounded-lg border border-primary/50 bg-card/70 p-8">
              <p className="eyebrow text-primary">CPB® Certification</p>
              <h3 className="mt-2 font-display text-3xl">₹5,000 / year</h3>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                <li>IBG Bartenders Manual and eight examinable modules</li>
                <li>Unlimited practice quizzes, then a 30-question written paper</li>
                <li>Live practical assessment at an IBG testing centre</li>
                <li>Verifiable digital certificate and CPB ID for employers</li>
              </ul>
              <Button asChild className="mt-8">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Register to certify <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </article>

            <article className="flex flex-col rounded-lg border border-border bg-card/70 p-8">
              <p className="eyebrow">Professional Membership</p>
              <h3 className="mt-2 font-display text-3xl">₹2,000 / year</h3>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                <li>Digital membership card issued automatically on payment</li>
                <li>Listing in the searchable IBG member directory</li>
                <li>Full training video library and member masterclasses</li>
                <li>Competition priority and discounted retakes</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/pricing">Compare plans</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/directory">Search the directory</Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Syllabus */}
      <section id="syllabus" className="border-t border-border/60 bg-ink py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Examinable syllabus</p>
          <h2 className="mt-3 text-4xl">Eight modules. One standard.</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {SYLLABUS.map(([title, body], i) => (
              <div key={title} className="bg-card p-6">
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

      {/* Cities */}
      <section id="cities" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow reveal">Testing centres</p>
          <h2 className="reveal mt-3 text-4xl">
            Six cities. <span className="text-gradient-gold">One standard.</span>
          </h2>
          <p className="reveal mt-4 max-w-2xl text-muted-foreground">
            Sit the written paper and the live practical at an IBG-accredited centre in Delhi,
            Mumbai, Jaipur, Chennai, Goa or Dehradun — identical syllabus, identical rubric,
            identical credential.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CITIES.map((c, i) => (
              <Tilt3D
                key={c.city}
                className="reveal"
                style={{ transitionDelay: `${(i % 3) * 90}ms` }}
              >
                <article className="group relative overflow-hidden rounded-lg border border-border bg-card/60 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-gold">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={c.image}
                      alt={`Cocktail bar interior representing the IBG testing centre in ${c.city}`}
                      width={900}
                      height={675}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                      <h3 className="font-display text-3xl leading-none">{c.city}</h3>
                      <MapPin className="h-5 w-5 text-primary transition-transform duration-500 group-hover:-translate-y-1" />
                    </div>
                  </div>
                  <div className="p-5 pt-4">
                    <p className="text-sm">{c.centre}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.phone}</p>
                  </div>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-gold transition-transform duration-500 group-hover:scale-x-100" />
                </article>
              </Tilt3D>
            ))}
          </div>
          <div className="reveal mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Book a centre near you
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              More cities are accredited every quarter.
            </p>
          </div>
        </div>
      </section>

      {/* Free study material */}
      <section id="study" className="border-t border-border/60 bg-ink py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow reveal">Open access</p>
            <h2 className="reveal mt-3 text-4xl">
              The study material is <span className="text-gradient-gold">free for everyone</span>.
            </h2>
            <p className="reveal mt-5 text-muted-foreground">
              The IBG Ultimate Cocktail Book and the IBG CFB guide are published openly — no
              account, no membership and no fee. Read them online or download them, whether you are
              sitting the CPB® or simply learning the craft.
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/study-material">Open the free library</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/cpb">Read the CPB® charter</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                "IBG Ultimate Cocktail Book",
                "Recipes, specifications, technique, glassware and garnish.",
              ],
              [
                "IBG CFB guide",
                "IBA Official Cocktail List, guild standards and responsible service.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="reveal rounded-lg border border-border bg-card/60 p-6">
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-xl leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow reveal">The IBG code</p>
          <h2 className="reveal mt-3 text-4xl">Values and the Bartenders' Commandments</h2>
          <p className="reveal mt-4 max-w-2xl text-muted-foreground">
            Every charter holder commits to the guild's professional code — conduct, food safety and
            health & safety behind the bar. It is examined, observed and reviewed annually.
          </p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Respect and honour those around you", "Guests, colleagues and suppliers alike."],
              ["Never drink on the job", "Judgement and duty of care depend on it."],
              ["Never touch the rim of a glass", "The top half of the glass belongs to the guest."],
              ["Keep a clean workstation", "Wipe as you go; mise en place before speed."],
            ].map(([title, body]) => (
              <div key={title} className="reveal bg-card p-6">
                <ScrollText className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-lg leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/values">Read all twelve commandments & safety standards</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-ink py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-3 text-4xl">Before you register</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left font-display text-lg">{q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <Award className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-4xl">Make your craft official.</h2>
          <p className="mt-4 text-muted-foreground">
            Register today, get instant access to the IBG Bartenders Manual and practice quizzes,
            then book your exam at a centre near you.
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