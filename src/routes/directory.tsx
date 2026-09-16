import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BadgeCheck, MapPin } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TITLE = "Member directory — IBG Academy";
const DESCRIPTION =
  "Search the India Bartenders' Guild member directory by CPB ID, name or city to confirm a bartender's certification and membership standing.";

export const Route = createFileRoute("/directory")({
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
  component: DirectoryPage,
});

function DirectoryPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["directory", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_members", { _query: query });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Public register</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            The IBG <span className="text-gradient-gold">member directory</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Every listed IBG Member holds a live CPB® certificate or an active guild membership and
            has consented to appear here. Search by CPB ID, name or city.
          </p>

          <form
            className="mt-10 flex max-w-xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(input.trim());
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="CPB ID, name or city"
              aria-label="Search the member directory"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          {isFetching && <p className="text-muted-foreground">Searching the register…</p>}
          {!isFetching && data && data.length === 0 && (
            <p className="text-muted-foreground">
              No members matched that search. Check the CPB ID or try a city name.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((m) => (
              
  <article
    key={`${m.cpb_id}-${m.full_name}`}
    className="rounded-md border border-border bg-card/60 p-6"
  >
   <div className="flex items-center justify-between gap-4">
  <div>
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary">
      <BadgeCheck className="h-4 w-4" />
      {m.status === "active" ? "Certified CPB®" : "Guild member"}
    </div>
    <h2 className="mt-1 font-display text-2xl">{m.full_name}</h2>
  </div>
  {m.photo_url ? (
    <img
      src={m.photo_url}
      alt={m.full_name}
      className="h-14 w-14 shrink-0 rounded-full object-cover border border-border"
    />
  ) : (
    <div className="h-14 w-14 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
      {m.full_name?.charAt(0) ?? "?"}
    </div>
  )}
</div>
    <p className="mt-3 text-sm text-muted-foreground">CPB ID :  {m.cpb_id ?? "—"}</p>
    {m.email  && (
      <p className="mt-1 text-sm text-muted-foreground break-all">Email : {m.email}</p>
    )}
    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4" />
      {[m.city, m.state].filter(Boolean).join(", ") || "India"}
    </p>
    {m.employer && (
      <p className="mt-1 text-sm text-muted-foreground">Currently at {m.employer}</p>
    )}
    {m.certified_since && (
      <p className="mt-1 text-xs text-muted-foreground">
        Certified since {m.certified_since}
      </p>
    )}
    {m.specialties && m.specialties.length > 0 && (
      <ul className="mt-4 flex flex-wrap gap-2">
        {m.specialties.map((s) => (
          <li
            key={s}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {s}
          </li>
        ))}
      </ul>
    )}
  </article>
))}
           
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
