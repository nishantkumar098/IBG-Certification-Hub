import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookMarked, FileText, Lock, ShoppingCart } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { BookPurchaseDialog } from "@/components/book-purchase-dialog";
import type { BookSlug } from "@/lib/payments.functions";
import { ARCHIVE } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";

const TITLE = "Resources & guild library — IBG Academy";
const DESCRIPTION =
  "Guild books, the CPB® syllabus outline, reference reading and member documents. Full library access is inside the Study Centre for signed-in members.";

export const Route = createFileRoute("/resources")({
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
  component: ResourcesPage,
});

const BOOKS = [
  {
    slug: "ibg-ultimate-bartender-book" as BookSlug,
    src: ARCHIVE.bookUltimateBartender,
    title: "IBG Ultimate Bartender Book",
    author: "Archit Singhal · India Bartenders' Guild",
    body: "The guild's core text: bar fundamentals, classics, method and service standards. Readable inside the Study Centre; print copies can be purchased.",
    pdfUrl: "/books/IBG-Ultimate-Bartender-Book-31-MAY-1.pdf",
    price: 699,
  },
  {
    slug: "indias-fnb-on-ventilator" as BookSlug,
    src: ARCHIVE.bookFnbVentilator,
    title: "India's F&B on Ventilator",
    author: "Archit Singhal",
    body: "A hard look at the Indian hospitality industry and the strategies that make bars profitable and humane places to work.",
    price: 183,
  },
];

const DOC_GROUPS = [
  {
    title: "Certification documents",
    items: [
      ["CPB® syllabus outline", "What the written and practical assessments cover, module by module."],
      ["Assessment & retake rules", "Pass marks, timing, retake fees and appeal process."],
      ["Certificate validity", "CPB® certification is issued for one year and renewed on good standing."],
    ],
  },
  {
    title: "Conduct & governance",
    items: [
      ["Code of conduct", "The professional standard every member signs at enrolment."],
      ["Twelve Bartenders' Commandments", "The guild's practice charter for behind the bar."],
      ["Anti-harassment & privacy policy", "How we handle complaints and member data."],
    ],
  },
  {
    title: "Member forms",
    items: [
      ["Experience certificate upload", "One year of verified bar experience is required for CPB® entry."],
      ["Testing-centre application", "For bars and institutes applying to host guild assessments."],
      ["Misconduct report", "Confidential reporting on a member or a guild event."],
    ],
  },
];

function ResourcesPage() {
  const ref = useReveal();
  const [purchaseSlug, setPurchaseSlug] = useState<BookSlug | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Resources</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            The guild <span className="text-gradient-gold">library</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Everything the guild publishes for bartenders in India — books, the syllabus, conduct
            documents and member forms. Reading happens inside the Study Centre, so your progress
            stays with your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/study">Open the Study Centre</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/study-material">What's inside</Link>
            </Button>
          </div>
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Guild books</p>
            <h2 className="mt-3 text-4xl">Published by the guild</h2>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {BOOKS.map((b) => (
                <article
                  key={b.title}
                  className="reveal grid gap-6 rounded-lg border border-border bg-card/60 p-7 sm:grid-cols-[140px_1fr]"
                >
                  <img
                    src={b.src}
                    alt={`${b.title} cover`}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-md border border-border object-cover"
                  />

                  <div>
                    <BookMarked className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 font-display text-2xl">{b.title}</h3>

                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {b.author}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {b.body}
                    </p>

                    <p className="mt-1 font-display text-lg text-primary">
                       Price : ₹ {b.price.toLocaleString("en-IN")}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPurchaseSlug(b.slug)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase this book
                      </Button>

                      <Button asChild size="sm" variant="ghost">
                        <Link to="/study">Read in Study Centre</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Documents</p>
            <h2 className="mt-3 text-4xl">Index of guild documents</h2>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {DOC_GROUPS.map((g) => (
                <article
                  key={g.title}
                  className="reveal rounded-lg border border-border bg-card/60 p-7"
                >
                  <FileText className="h-5 w-5 text-primary" />

                  <h3 className="mt-4 font-display text-2xl">{g.title}</h3>

                  <ul className="mt-5 space-y-4">
                    {g.items.map(([name, body]) => (
                      <li key={name}>
                        <p className="text-sm text-foreground">{name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="reveal mt-10 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card/40 p-6">
              <Lock className="h-5 w-5 shrink-0 text-primary" />

              <p className="flex-1 text-sm text-muted-foreground">
                Full documents, downloadable copies and the video library are available to signed-in
                members inside the Study Centre.
              </p>

              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Sign up free
                  </Link>
                </Button>

                <Button asChild size="sm" variant="outline">
                  <Link to="/policies">Read policies</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-4xl">Missing something?</h2>

            <p className="mt-4 text-muted-foreground">
              If you need a guild document that is not listed here, email support@ibg.network and we
              will send it or publish it.
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />

      {purchaseSlug && (
        <BookPurchaseDialog
          open={!!purchaseSlug}
          onOpenChange={(o) => !o && setPurchaseSlug(null)}
          bookSlug={purchaseSlug}
        />
      )}
    </div>
  );
}