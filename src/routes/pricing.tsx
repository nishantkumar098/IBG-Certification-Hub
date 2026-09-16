import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TITLE = "Pricing & plans — IBG Academy";
const DESCRIPTION =
  "IBG Academy plans: free Standard access, ₹2,000 professional membership with a digital card, and the ₹5,000 CPB® certification programme.";

export const Route = createFileRoute("/pricing")({
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
  component: PricingPage,
});

function PricingPage() {
  const { data: plans } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Plans</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            One guild, <span className="text-gradient-gold">three ways in</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Study material is free for everyone, forever. Membership and certification are annual
            and paid securely through Razorpay — UPI, cards, netbanking and wallets.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-3">
          {(plans ?? []).map((p, i) => (
            <article
              key={p.code}
              className={cn(
                "flex flex-col rounded-lg border bg-card/60 p-8",
                i === 1 ? "border-primary/60 shadow-[0_0_60px_-30px_hsl(var(--primary))]" : "border-border",
              )}
            >
              {i === 1 && <p className="eyebrow text-primary">Most popular</p>}
              <h2 className="mt-2 font-display text-3xl">{p.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-6 font-display text-4xl">
                {p.price_inr === 0 ? "Free" : `₹${p.price_inr.toLocaleString("en-IN")}`}
                {p.price_inr > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">/ {p.period}</span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {((p.features as string[]) ?? []).map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8" variant={i === 1 ? "default" : "outline"}>
                <Link to="/auth" search={{ mode: "signup" }}>
                  {p.price_inr === 0 ? "Create a free account" : "Get started"}
                </Link>
              </Button>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-5 text-sm text-muted-foreground">
          Membership and certification are purchased from your dashboard once you are signed in.
          Retake fees apply for repeat written or practical attempts.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
