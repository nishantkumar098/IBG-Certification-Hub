import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileCheck2, Upload, Clock3, CheckCircle2, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/use-auth";
import { submitExperienceDocument, getExperienceDocumentUrl } from "@/lib/candidate.functions";

export const Route = createFileRoute("/_authenticated/experience")({
  head: () => ({
    meta: [
      { title: "Experience certificate — IBG Academy" },
      {
        name: "description",
        content:
          "Upload your employer experience certificate — one year of verified bar experience is required for CPB® entry.",
      },
      { property: "og:title", content: "Experience certificate — IBG Academy" },
      { property: "og:description", content: "Upload your verified bar experience certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperiencePage,
});

const STATUS_META: Record<string, { label: string; icon: typeof Clock3; className: string }> = {
  pending: { label: "Awaiting guild review", icon: Clock3, className: "text-muted-foreground" },
  approved: { label: "Verified by the guild", icon: CheckCircle2, className: "text-primary" },
  rejected: { label: "Returned — please resubmit", icon: XCircle, className: "text-destructive" },
};

function ExperiencePage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const submit = useServerFn(submitExperienceDocument);
  const openDoc = useServerFn(getExperienceDocumentUrl);

  const [employer, setEmployer] = useState("");
  const [address, setAddress] = useState("");
  const [designation, setDesignation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [supervisor, setSupervisor] = useState("");
  const [supervisorContact, setSupervisorContact] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: documents } = useQuery({
    queryKey: ["experience-documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_documents")
        .select("*")
        .eq("candidate_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Attach your employer experience certificate.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${user.id}/experience/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("candidate-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      await submit({
        data: {
          employerName: employer.trim(),
          employerAddress: address.trim() || undefined,
          designation: designation.trim(),
          startDate,
          endDate: isCurrent ? undefined : endDate,
          isCurrent,
          supervisorName: supervisor.trim() || undefined,
          supervisorContact: supervisorContact.trim() || undefined,
          documentPath: path,
        },
      });

      toast.success("Submitted. The guild office reviews certificates within two working days.");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["experience-documents", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["readiness", user.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit the certificate");
    } finally {
      setBusy(false);
    }
  }

  async function view(id: string) {
    try {
      const { url } = await openDoc({ data: { id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the document");
    }
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Required step"
        title="Experience certificate"
        description="CPB® entry requires at least one year of verified bar experience. Upload an experience certificate or employment letter on your employer's letterhead."
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={save} className="space-y-5 rounded-md border border-border bg-card/60 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employer">Employer / venue name</Label>
              <Input
                id="employer"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Your designation</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Bartender, Head Bartender…"
                maxLength={120}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Employer address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              rows={2}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End date</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="current"
              checked={isCurrent}
              onCheckedChange={(v) => setIsCurrent(v === true)}
            />
            <Label htmlFor="current" className="text-sm text-muted-foreground">
              I still work here
            </Label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supervisor">Supervisor / manager name</Label>
              <Input
                id="supervisor"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor-contact">Supervisor contact</Label>
              <Input
                id="supervisor-contact"
                value={supervisorContact}
                onChange={(e) => setSupervisorContact(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc">Experience certificate (PDF, JPG or PNG)</Label>
            <Input
              id="doc"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              On employer letterhead, signed and dated, stating your role and dates of employment.
            </p>
          </div>

          <Button type="submit" disabled={busy}>
            <Upload className="mr-2 h-4 w-4" />
            {busy ? "Submitting…" : "Submit for verification"}
          </Button>
        </form>

        <section className="rounded-md border border-border bg-card/60 p-6">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-xl">Your submissions</h2>
          {(documents ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing submitted yet. Your certificate is reviewed by the guild office before the
              official written examination is unlocked.
            </p>
          ) : (
            <ul className="mt-5 space-y-5">
              {(documents ?? []).map((d) => {
                const meta = STATUS_META[d.status] ?? STATUS_META["pending"]!;
                const Icon = meta.icon;
                return (
                  <li key={d.id} className="border-t border-border/60 pt-4 first:border-0 first:pt-0">
                    <p className="text-foreground">{d.employer_name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {d.designation} · {d.start_date} →{" "}
                      {d.is_current ? "present" : (d.end_date ?? "—")}
                    </p>
                    <p className={`mt-2 flex items-center gap-2 text-sm ${meta.className}`}>
                      <Icon className="h-4 w-4" />
                      {meta.label}
                    </p>
                    {d.review_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{d.review_notes}</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 px-0"
                      onClick={() => void view(d.id)}
                    >
                      View uploaded document
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
