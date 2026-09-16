import { lazy, Suspense, useState } from "react";
import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, ExternalLink, Lock, PlayCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { BookPurchaseDialog } from "@/components/book-purchase-dialog";

const PdfReader = lazy(() => import("@/components/pdf-reader"));

/** Known guild books we ship locally in /public/books. We override whatever
 * URL is stored in the database with the local file, so the reader never
 * depends on ibg.network or on the DB row being edited. Match is by title,
 * case-insensitive and trimmed. */
const LOCAL_BOOK_OVERRIDES: Record<string, string> = {
  "ibg ultimate cocktail book": "/books/IBG-Ultimate-Bartender-Book-31-MAY-1.pdf",
};

function resolveReadUrl(title: string, url: string) {
  const local = LOCAL_BOOK_OVERRIDES[title.trim().toLowerCase()];
  return local ?? url;
}

/** Extra guild books that live only as local files (not in the database
 * yet). Rendered alongside the DB-backed compulsory reading list, all under
 * one "Compulsory Readings" heading. */
const LOCAL_EXTRA_BOOKS = [
  {
    id: "local-ibg-cfb-guide",
    title: "IBG CFB Guide",
    description: "The guild's core certification guide — 148 pages, examinable for the CPB® written paper.",
    url: "/books/" + encodeURIComponent("IBG CFB Guide (1).pdf"),
  },
];

/** True only for documents we actually serve locally (a resolved /public
 * path). We deliberately do NOT treat every ibg.network URL as in-app
 * readable — most of those are HTML landing pages, not PDFs, and fetching
 * them client-side fails with a CORS error since ibg.network doesn't send
 * Access-Control-Allow-Origin for this domain. Only known local overrides
 * (see LOCAL_BOOK_OVERRIDES / LOCAL_EXTRA_BOOKS) open in-app; everything
 * else opens externally as before. */
function isInAppReadable(url: string) {
  return url.startsWith("/");
}

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({
    meta: [
      { title: "Study centre — IBG Academy" },
      {
        name: "description",
        content:
          "Books, reference links, training videos and the examinable syllabus for the CPB® certification — all in one place.",
      },
      { property: "og:title", content: "Study centre — IBG Academy" },
      { property: "og:description", content: "Prepare for the CPB® written examination." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudyPage,
});

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

function StudyPage() {
  const { user } = useSession();
  const [open, setOpen] = useState<{ slug: string; title: string; url: string } | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["study-centre"],
    queryFn: async () => {
      const [materials, syllabus, links, videos] = await Promise.all([
        supabase.from("study_materials").select("*").order("sort_order"),
        supabase.from("syllabus_items").select("*").order("sort_order"),
        supabase.from("study_links").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("training_videos").select("*").eq("is_active", true).order("sort_order"),
      ]);
      return {
        materials: materials.data ?? [],
        syllabus: syllabus.data ?? [],
        links: links.data ?? [],
        videos: videos.data ?? [],
      };
    },
  });

  const { data: isMember } = useQuery({
    queryKey: ["membership-active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const compulsory = (data?.links ?? []).filter((l) => l.category === "compulsory");

  const allVideos = data?.videos ?? [];
  const videosByModule = allVideos.reduce<Record<string, typeof allVideos>>(
    (acc, v) => {
      (acc[v.module] ??= []).push(v);
      return acc;
    },
    {},
  );

  const hasCompulsoryReadings =
    LOCAL_EXTRA_BOOKS.length > 0 || (data?.materials.length ?? 0) > 0 || compulsory.length > 0;

  return (
    <AppShell>
      <PageHeading
        eyebrow="Preparation"
        title="Study centre"
        description="Every book, reference link, training video and examinable module in one place — free with your IBG Academy account."
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

      {hasCompulsoryReadings && (
        <section>
          <SectionHeading title="Compulsory Readings" note="Examinable for the CPB® written paper." />
          <div className="grid gap-4 md:grid-cols-2">
            {LOCAL_EXTRA_BOOKS.map((b) => (
              <div key={b.id} className="rounded-md border border-border bg-card/60 p-6">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-xl">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setOpen({ slug: b.id, title: b.title, url: b.url })}
                >
                  Read
                </Button>
              </div>
            ))}

            {(data?.materials ?? []).map((m) => (
              <div key={m.id} className="rounded-md border border-border bg-card/60 p-6">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-xl">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {m.description}
                </p>
                {m.file_url && (
                  isInAppReadable(resolveReadUrl(m.title, m.file_url)) ? (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        setOpen({
                          slug: m.id,
                          title: m.title,
                          url: resolveReadUrl(m.title, m.file_url!),
                        })
                      }
                    >
                      Read
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <a href={m.file_url} target="_blank" rel="noreferrer">
                        Open <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )
                )}
              </div>
            ))}

            {compulsory.map((l) => (
              <div key={l.id} className="rounded-md border border-border bg-card/60 p-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-xl">{l.title}</h3>
                {l.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {l.description}
                  </p>
                )}
                {l.kind === "read" && isInAppReadable(resolveReadUrl(l.title, l.url)) ? (
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() =>
                      setOpen({ slug: l.id, title: l.title, url: resolveReadUrl(l.title, l.url) })
                    }
                  >
                    Read
                  </Button>
                ) : l.kind === "purchase" ? (
                  <Button size="sm" className="mt-4" onClick={() => setPurchaseOpen(true)}>
                    Purchase
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a href={l.url} target="_blank" rel="noreferrer">
                      Open <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(videosByModule).length > 0 && (
        <section className="mt-12">
          <SectionHeading
            title="Video library"
            note="Technique and service masterclasses, grouped by module."
          />
          {Object.entries(videosByModule).map(([module, list]) => (
            <div key={module} className="mt-8">
              <p className="eyebrow">{module}</p>
              <div className="mt-3 grid gap-5 md:grid-cols-2">
                {(list ?? []).map((v) => {
                  const locked = v.access_level === "member" && !isMember;
                  return (
                    <article
                      key={v.id}
                      className="overflow-hidden rounded-md border border-border bg-card/60"
                    >
                      <div className="relative aspect-video bg-ink">
                        {locked ? (
                          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                            <Lock className="h-6 w-6 text-primary" />
                            <p className="text-sm text-muted-foreground">
                              Members-only masterclass
                            </p>
                            <Button asChild size="sm">
                              <Link to="/dashboard">Become a member</Link>
                            </Button>
                          </div>
                        ) : playingVideo === v.id ? (
                          <iframe
                            src={v.video_url}
                            title={v.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPlayingVideo(v.id)}
                            className="group relative h-full w-full"
                            aria-label={`Play ${v.title}`}
                          >
                            {v.thumbnail_url ? (
                              <img
                                src={v.thumbnail_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-card/60">
                                <PlayCircle className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/50">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                                <PlayCircle className="h-8 w-8" />
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                          <PlayCircle className="h-3.5 w-3.5 text-primary" />
                          {v.duration_label ?? "Video"}
                          {v.access_level === "member" && <span>· Members</span>}
                        </div>
                        <h4 className="mt-2 text-lg leading-tight">{v.title}</h4>
                        {v.description && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {v.description}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-12">
        <SectionHeading title="Examinable syllabus" />
        <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
          {(data?.syllabus ?? []).map((s, i) => (
            <div key={s.id} className="bg-card p-5">
              <span className="font-display text-sm text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-lg leading-tight">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-md border border-primary/40 bg-primary/5 p-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl">Ready to practise?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice quizzes are unlimited and never affect your official result.
          </p>
        </div>
        <Button asChild>
          <Link to="/exam">Start a practice quiz</Link>
        </Button>
      </div>

      <BookPurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        bookSlug="ibg-ultimate-bartender-book"
      />
    </AppShell>
  );
}