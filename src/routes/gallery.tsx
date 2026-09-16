import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { GALLERY } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";
import { Tilt3D } from "@/components/tilt-3d";

const TITLE = "Gallery — India Bartenders' Guild";
const DESCRIPTION =
  "Photographs from IBG competitions, chapter training, international delegations and award nights across India.";

export const Route = createFileRoute("/gallery")({
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
  component: GalleryPage,
});

function GalleryPage() {
  const ref = useReveal();
  const groups = useMemo(() => ["All", ...new Set(GALLERY.map((g) => g.group))], []);
  const [active, setActive] = useState("All");

  const items = active === "All" ? GALLERY : GALLERY.filter((g) => g.group === active);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Gallery</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            The guild <span className="text-gradient-gold">at work</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Competitions, examiner calibration, chapter training, international delegations and the
            nights where Indian bartending gets its due.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {groups.map((g) => (
              <Button
                key={g}
                size="sm"
                variant={active === g ? "default" : "outline"}
                onClick={() => setActive(g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section ref={ref} className="py-16">
        <div className="mx-auto max-w-6xl columns-1 gap-5 px-5 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <Tilt3D key={item.src} className={cn("reveal mb-5 break-inside-avoid")}>
              <figure className="overflow-hidden rounded-lg border border-border bg-card/60">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
                <figcaption className="px-5 py-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-primary">
                    {item.group}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.caption}</p>
                </figcaption>
              </figure>
            </Tilt3D>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-6xl px-5 text-xs text-muted-foreground">
          Photographs from the guild's own archive. Captions describe the activity shown; if any
          image needs a specific event name, competitor credit or date, send it to
          support@ibg.network and we will label it.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
