import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { BookOpen, ExternalLink, FileText, Library as LibraryIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

const PdfReader = lazy(() => import("@/components/pdf-reader"));

/** Core study texts, served directly from /public/books — no Supabase
 * Storage bucket involved, so there's no per-file size ceiling to worry
 * about. Add a new book here any time a new PDF lands in that folder. */
const LOCAL_CORE_BOOKS = [
  {
    slug: "cwi-magazine",
    title: "CWI Magazine",
    description: "Guild magazine covering the Cocktail World Invitational.",
    file: "CWI Magazine.pdf",
  },
  {
    slug: "iba-social-responsibility-guide",
    title: "IBA Social Responsibility Guide",
    description: "IBA guidance on responsible service and social responsibility standards.",
    file: "IBA SOCIAL RESPONSIBILITY GUIDE.pdf",
  },
  {
    slug: "ibg-cfb-guide",
    title: "IBG CFB Guide",
    description: "The guild's core certification guide — examinable for the CPB® written paper.",
    file: "IBG CFB Guide (1).pdf",
  },
  {
    slug: "ibg-ultimate-cocktail-book",
    title: "IBG Ultimate Cocktail Book",
    description: "The guild's flagship cocktail reference, cover to cover.",
    file: "IBG-Ultimate-Bartender-Book-31-MAY-1.pdf",
  },
  {
    slug: "icb-students-guide",
    title: "ICB Students Guide",
    description: "Student reference guide for ICB coursework.",
    file: "ICB STUDENTS GUIDE.pdf",
  },
  {
    slug: "indias-fb-on-ventilator",
    title: "India's F&B on Ventilator",
    description: "Dark secrets of the Indian hospitality industry and strategies for driving profitable success.",
    file: "Indias-FB-on-Ventilator.pdf",
  },
  {
    slug: "updated-cwi-2026",
    title: "CWI 2026 (Updated)",
    description: "Updated rules and reference material for CWI 2026.",
    file: "Updated-CWI-2026.pdf",
  },
  {
    slug: "wcc2025-classic-category-rules",
    title: "WCC 2025 — Classic Category Rules",
    description: "Competition rules for the WCC 2025 Classic Category.",
    file: "WCC2025 - CLASSIC CATEGORY - RULES.pdf",
  },
] as const;

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Guild library — IBG Academy" },
      {
        name: "description",
        content:
          "Read the IBG CFB Guide and every guild publication inside the app — no downloads, no external viewers.",
      },
      { property: "og:title", content: "Guild library — IBG Academy" },
      { property: "og:description", content: "Read the IBG CFB Guide inside the app." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useSession();
  const [open, setOpen] = useState<{ slug: string; title: string; url: string } | null>(null);

  const { data: docs } = useQuery({
    queryKey: ["library-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_documents")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  function readLocal(book: (typeof LOCAL_CORE_BOOKS)[number]) {
    setOpen({
      slug: book.slug,
      title: book.title,
      url: "/books/" + encodeURIComponent(book.file),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const reading = (docs ?? []).filter((d) => d.category === "reading");
  const external = (docs ?? []).filter((d) => d.category === "external");

  return (
    <AppShell>
      <PageHeading
        eyebrow="Library"
        title="Guild library"
        description="The IBG CFB Guide and the guild's publications, readable page by page inside your account. Your place is remembered automatically."
      />

      {open && (
        <section className="mb-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Now reading</p>
              <h2 className="mt-1 text-2xl">{open.title}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(null)}>
              Close reader
            </Button>
          </div>
          <ClientOnly fallback={<p className="text-sm text-muted-foreground">Loading reader…</p>}>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading reader…</p>}>
              <PdfReader url={open.url} title={open.title} userId={user?.id} bookSlug={open.slug} />
            </Suspense>
          </ClientOnly>
        </section>
      )}

      <section>
        <h2 className="text-2xl">Optional Reading </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {LOCAL_CORE_BOOKS.map((book) => (
            <article key={book.slug} className="flex flex-col rounded-md border border-border bg-card/60 p-6">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-xl leading-tight">{book.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {book.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => readLocal(book)}>
                  Read
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {reading.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">Guild publications</h2>
          <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {reading.map((d) => (
              <div key={d.id} className="flex flex-col bg-card p-5">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="mt-2 text-lg leading-tight">{d.title}</h3>
                {d.subtitle && (
                  <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {d.subtitle}
                  </p>
                )}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {d.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {external.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">IBA & competition documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Published by the International Bartenders Association and the guild's competition
            committee.
          </p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
            {external.map((d) => (
              <div key={d.id} className="flex flex-col bg-card p-5">
                <LibraryIcon className="h-4 w-4 text-primary" />
                <h3 className="mt-2 text-lg leading-tight">{d.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {d.description}
                </p>
                {d.external_url && (
                  <Button asChild size="sm" variant="outline" className="mt-4 self-start">
                    <a href={d.external_url} target="_blank" rel="noreferrer">
                      Open <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}