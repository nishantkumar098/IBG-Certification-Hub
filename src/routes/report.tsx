import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const TITLE = "Report a member — IBG Academy";
const DESCRIPTION =
  "Confidentially report professional misconduct, harassment or unsafe practice by an IBG member or CPB® certified bartender.";

const CATEGORIES = [
  "Harassment or discrimination",
  "Unsafe or unhygienic practice",
  "Over-service or underage service",
  "Theft, fraud or misrepresentation",
  "Misuse of the CPB® mark",
  "Other professional misconduct",
] as const;

export const Route = createFileRoute("/report")({
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
  component: ReportPage,
});

function ReportPage() {
  const [anonymous, setAnonymous] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    const { data, error } = await supabase
      .from("member_reports")
      .insert({
        member_name: String(form.get("member_name") ?? ""),
        member_cpb_id: (form.get("member_cpb_id") as string) || null,
        incident_date: (form.get("incident_date") as string) || null,
        venue: (form.get("venue") as string) || null,
        category,
        description: String(form.get("description") ?? ""),
        is_anonymous: anonymous,
        reporter_name: anonymous ? null : (form.get("reporter_name") as string) || null,
        reporter_email: anonymous ? null : (form.get("reporter_email") as string) || null,
        reporter_phone: anonymous ? null : (form.get("reporter_phone") as string) || null,
        reporter_relationship: (form.get("reporter_relationship") as string) || null,
      })
      .select("reference_code")
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReference(data?.reference_code ?? "received");
    toast.success("Report received by the IBG conduct committee.");
  }

  if (reference) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="py-28">
          <div className="mx-auto max-w-2xl px-5 text-center">
            <p className="eyebrow">Report filed</p>
            <h1 className="mt-4 text-4xl">Thank you — we have your report</h1>
            <p className="mt-6 text-muted-foreground">
              Your reference number is{" "}
              <span className="font-display text-2xl text-primary">{reference}</span>. Keep it safe.
              The conduct committee reviews every report within seven working days and will contact
              you if you left your details.
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Conduct committee</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Report a <span className="text-gradient-gold">member</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The CPB® mark carries obligations. If a member has breached the code of conduct, tell
            us. Reports may be filed anonymously and are read only by the conduct committee.
          </p>
        </div>
      </section>

      <section className="py-16">
        <form onSubmit={submit} className="mx-auto grid max-w-3xl gap-6 px-5">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Member's name" name="member_name" required />
            <Field label="CPB ID (if known)" name="member_cpb_id" />
            <Field label="Date of incident" name="incident_date" type="date" />
            <Field label="Venue or employer" name="venue" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What happened?</Label>
            <Textarea id="description" name="description" rows={7} required />
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-card/50 p-4">
            <Checkbox
              checked={anonymous}
              onCheckedChange={(v) => setAnonymous(v === true)}
              aria-label="File anonymously"
            />
            <span className="text-sm text-muted-foreground">
              File this report anonymously. We will still investigate, but we cannot update you on
              the outcome or ask follow-up questions.
            </span>
          </label>

          {!anonymous && (
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Your name" name="reporter_name" />
              <Field label="Your email" name="reporter_email" type="email" />
              <Field label="Your phone" name="reporter_phone" />
              <Field label="Your relationship to the member" name="reporter_relationship" />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              {saving ? "Submitting…" : "Submit report"}
            </Button>
            <p className="text-xs text-muted-foreground">
              For emergencies or crimes, contact the police first on 112.
            </p>
          </div>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
