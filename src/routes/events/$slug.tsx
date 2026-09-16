import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events-data";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/events/$slug")({
  loader: ({ params }) => {
    const event = EVENTS.find((e) => e.slug === params.slug);
    if (!event) throw notFound();
    return event;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — India Bartenders' Guild` : "Event — IBG";
    const description = loaderData
      ? `Photos from ${loaderData.name}, part of the guild's ${loaderData.category.toLowerCase()} events.`
      : "Event photos from the India Bartenders' Guild.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  component: EventPhotosPage,
});

function EventPhotosPage() {
  const event = Route.useLoaderData();
  const ref = useReveal();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">{event.category}</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] md:text-5xl">{event.name}</h1>
          <p className="mt-4 text-sm text-muted-foreground">{event.photos.length} photographs</p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link to="/events">Back to all events</Link>
          </Button>
        </div>
      </section>

      <section ref={ref} className="py-16">
        <div className="mx-auto max-w-6xl columns-1 gap-5 px-5 sm:columns-2 lg:columns-3">
          {event.photos.map((src) => (
            <figure
              key={src}
              className="reveal mb-5 break-inside-avoid overflow-hidden rounded-lg border border-border bg-card/60"
            >
              <img
                src={src}
                alt={event.name}
                loading="lazy"
                decoding="async"
                className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </figure>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
