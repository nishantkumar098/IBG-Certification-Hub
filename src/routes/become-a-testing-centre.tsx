import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/use-auth";

const TITLE = "Become an IBG testing centre — IBG Academy";
const DESCRIPTION =
  "Apply for your bar, hotel or bartending school to be accredited as an IBG testing centre and host CPB® written and practical examinations.";

const FACILITIES = [
  { name: "has_dedicated_room", label: "Dedicated examination room or private bar area" },
  { name: "has_cctv", label: "CCTV covering the examination area" },
  { name: "has_wifi", label: "Reliable Wi-Fi for the written paper" },
  { name: "has_backup_power", label: "Backup power" },
  { name: "has_fssai_licence", label: "Valid FSSAI licence" },
  { name: "has_liquor_licence", label: "Valid liquor licence" },
] as const;

const ORG_TYPES = ["Bar or restaurant", "Hotel", "Bartending school", "Training academy", "Other"];

export const Route = createFileRoute("/become-a-testing-centre")({
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
  component: TestingCentrePage,
});

function TestingCentrePage() {
  const { user, loading } = useSession();
  const [orgType, setOrgType] = useState(ORG_TYPES[0]!);
  const [facilities, setFacilities] = useState<Record<string, boolean>>({});
  const [intrastate, setIntrastate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    if (!intrastate) {
      toast.error("You must accept the intrastate coverage requirement.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = form.get(k);
      return v ? Number(v) : null;
    };
    setSaving(true);
    const { error } = await supabase.from("testing_center_applications").insert({
      applicant_user_id: user.id,
      organisation_name: String(form.get("organisation_name") ?? ""),
      contact_name: String(form.get("contact_name") ?? ""),
      contact_email: String(form.get("contact_email") ?? ""),
      contact_phone: String(form.get("contact_phone") ?? ""),
      address_line: String(form.get("address_line") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      pincode: String(form.get("pincode") ?? ""),
      organisation_type: orgType,
      years_operating: num("years_operating"),
      bar_stations: num("bar_stations"),
      seating_capacity: num("seating_capacity"),
      has_dedicated_room: !!facilities["has_dedicated_room"],
      has_cctv: !!facilities["has_cctv"],
      has_wifi: !!facilities["has_wifi"],
      has_backup_power: !!facilities["has_backup_power"],
      has_fssai_licence: !!facilities["has_fssai_licence"],
      has_liquor_licence: !!facilities["has_liquor_licence"],
      intrastate_coverage: String(form.get("intrastate_coverage") ?? ""),
      notes: (form.get("notes") as string) || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Application received.");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Accreditation</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Become an <span className="text-gradient-gold">IBG testing centre</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Accredited venues host CPB® written papers and practical assessments under an IBG
            examiner. Applications are reviewed by the guild and followed by a site inspection.
          </p>
          <div className="mt-8 max-w-2xl rounded-md border border-primary/40 bg-primary/5 p-5 text-sm text-muted-foreground">
            <strong className="text-foreground">Intrastate requirement.</strong> An accredited
            centre must be willing to serve candidates from across its entire state — not only its
            own city — and to schedule at least one open examination day each month.
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-5">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : !user ? (
            <div className="rounded-md border border-border bg-card/60 p-8">
              <h2 className="text-2xl">Sign in to apply</h2>
              <p className="mt-3 text-muted-foreground">
                Applications are tied to an IBG Academy account so we can track your review status
                and inspection date.
              </p>
              <Button asChild className="mt-6">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Sign in or create an account
                </Link>
              </Button>
            </div>
          ) : done ? (
            <div className="rounded-md border border-border bg-card/60 p-8">
              <h2 className="text-2xl">Application received</h2>
              <p className="mt-3 text-muted-foreground">
                The accreditation team will contact you within ten working days to arrange the site
                inspection. You can track the status from your dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Organisation name" name="organisation_name" required />
                <div className="space-y-2">
                  <Label htmlFor="organisation_type">Organisation type</Label>
                  <select
                    id="organisation_type"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Contact person" name="contact_name" required />
                <Field label="Contact email" name="contact_email" type="email" required />
                <Field label="Contact phone" name="contact_phone" required />
                <Field label="Years operating" name="years_operating" type="number" />
              </div>

              <Field label="Address" name="address_line" required />
              <div className="grid gap-6 md:grid-cols-3">
                <Field label="City" name="city" required />
                <Field label="State" name="state" required />
                <Field label="PIN code" name="pincode" required />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Bar stations available" name="bar_stations" type="number" />
                <Field label="Seating capacity" name="seating_capacity" type="number" />
              </div>

              <fieldset className="rounded-md border border-border bg-card/50 p-5">
                <legend className="px-2 text-sm text-muted-foreground">Facilities</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {FACILITIES.map((f) => (
                    <label key={f.name} className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={!!facilities[f.name]}
                        onCheckedChange={(v) =>
                          setFacilities((prev) => ({ ...prev, [f.name]: v === true }))
                        }
                        aria-label={f.label}
                      />
                      <span className="text-muted-foreground">{f.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="intrastate_coverage">
                  Which districts of your state will you serve?
                </Label>
                <Textarea id="intrastate_coverage" name="intrastate_coverage" rows={3} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anything else we should know?</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>

              <label className="flex items-start gap-3 rounded-md border border-border bg-card/50 p-4">
                <Checkbox
                  checked={intrastate}
                  onCheckedChange={(v) => setIntrastate(v === true)}
                  aria-label="Accept the intrastate requirement"
                />
                <span className="text-sm text-muted-foreground">
                  We accept candidates from anywhere in our state and will host at least one open
                  examination day each month.
                </span>
              </label>

              <div>
                <Button type="submit" disabled={saving}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {saving ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </form>
          )}
        </div>
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
