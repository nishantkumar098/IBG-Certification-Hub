import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ScrollText, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession, useProfile } from "@/hooks/use-auth";
import { acceptConduct, CONDUCT_VERSION } from "@/lib/candidate.functions";

export const Route = createFileRoute("/_authenticated/conduct")({
  head: () => ({
    meta: [
      { title: "Code of conduct oath — IBG Academy" },
      {
        name: "description",
        content:
          "Sign the IBG code of conduct and the Twelve Bartenders' Commandments before sitting the CPB® examination.",
      },
      { property: "og:title", content: "Code of conduct oath — IBG Academy" },
      { property: "og:description", content: "Sign the IBG professional code of conduct." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConductPage,
});

const OATH_CLAUSES = [
  [
    "Responsible service",
    "I will never serve alcohol to a minor or to a guest who is intoxicated, and I will offer food, water and safe transport when a guest needs them.",
  ],
  [
    "Guest safety",
    "I will keep my bar, my ice, my glassware and my products clean and safe, and I will never leave a drink unattended or unaccounted for.",
  ],
  [
    "Honesty in trade",
    "I will pour to specification, ring in every sale, record wastage honestly and never misrepresent a product or its origin.",
  ],
  [
    "Respect",
    "I will treat guests, colleagues, suppliers and competitors with respect, free of harassment, discrimination or intimidation of any kind.",
  ],
  [
    "Craft",
    "I will keep learning — technique, product, service and hospitality — and I will represent the India Bartenders' Guild with dignity in every bar and on every stage.",
  ],
  [
    "Accountability",
    "I accept that a breach of this code may lead to suspension or withdrawal of my CPB® certification and guild membership after due process.",
  ],
] as const;

function ConductPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sign = useServerFn(acceptConduct);

  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["conduct", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("conduct_acceptances")
        .select("version, full_name_signed, accepted_at")
        .eq("user_id", user!.id)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please confirm that you accept the code of conduct.");
      return;
    }
    setBusy(true);
    try {
      await sign({ data: { fullNameSigned: name.trim() } });
      toast.success("Oath recorded. Thank you.");
      void queryClient.invalidateQueries({ queryKey: ["conduct", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["readiness", user?.id] });
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the oath");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Required step"
        title="Code of conduct & oath"
        description="Every CPB® candidate signs the guild's professional code before sitting the examination. It is a standing commitment, not a formality."
      />

      {existing ? (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-primary/40 bg-primary/5 p-6">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <p className="text-foreground">Oath signed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed as {existing.full_name_signed} on{" "}
              {new Date(existing.accepted_at).toLocaleDateString("en-IN")} · version{" "}
              {existing.version}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-border bg-card/60 p-6">
          <ScrollText className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-2xl">The oath</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Version {CONDUCT_VERSION} · read alongside the{" "}
            <Link to="/values" className="text-primary hover:underline">
              Twelve Bartenders' Commandments
            </Link>{" "}
            and the{" "}
            <Link to="/policies" className="text-primary hover:underline">
              anti-harassment policy
            </Link>
            .
          </p>
          <ol className="mt-6 space-y-5">
            {OATH_CLAUSES.map(([heading, body], i) => (
              <li key={heading}>
                <p className="font-display text-sm text-primary">
                  {String(i + 1).padStart(2, "0")} · {heading}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <form onSubmit={submit} className="space-y-5 rounded-md border border-border bg-card/60 p-6">
          <h2 className="text-xl">Sign the oath</h2>
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              disabled={!!existing}
            />
            <Label htmlFor="agree" className="text-sm leading-relaxed text-muted-foreground">
              I have read and accept the IBG code of conduct in full, and I understand that my
              certification depends on upholding it.
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signature">Type your full legal name</Label>
            <Input
              id="signature"
              value={name}
              placeholder={profile?.full_name ?? "Your full name"}
              onChange={(e) => setName(e.target.value)}
              disabled={!!existing}
              maxLength={120}
            />
          </div>
          <Button type="submit" disabled={busy || !!existing || name.trim().length < 3}>
            {existing ? "Already signed" : busy ? "Recording…" : "Sign the oath"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your signature, name, the version and the timestamp are recorded permanently.
          </p>
        </form>
      </div>
    </AppShell>
  );
}
