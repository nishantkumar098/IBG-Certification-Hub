import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/examiner")({
  head: () => ({
    meta: [
      { title: "Examiner scoring — IBG Academy" },
      { name: "description", content: "Score CPB® practical assessments against the IBG rubric." },
      { property: "og:title", content: "Examiner scoring — IBG Academy" },
      { property: "og:description", content: "Score CPB® practical assessments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExaminerPage,
});

const RUBRIC = [
  { key: "technique", label: "Technique & accuracy", max: 30 },
  { key: "speed", label: "Speed & efficiency", max: 20 },
  { key: "hygiene", label: "Hygiene & station control", max: 20 },
  { key: "presentation", label: "Presentation & garnish", max: 15 },
  { key: "hospitality", label: "Hospitality & guest interaction", max: 15 },
] as const;

function ExaminerPage() {
  const { user } = useSession();
  const [candidateId, setCandidateId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(RUBRIC.map((r) => [r.key, 0])),
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: candidates } = useQuery({
    queryKey: ["examiner-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, cpb_id, photo_url, cities(name)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedCandidate = candidates?.find((c) => c.id === candidateId);

  const total = RUBRIC.reduce((sum, r) => sum + (scores[r.key] ?? 0), 0);
  const passed = total >= 70;

  async function submit() {
    if (!user || !candidateId) {
      toast.error("Select a candidate first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("practical_scores").insert({
      candidate_id: candidateId,
      examiner_id: user.id,
      rubric_scores_json: scores,
      total_score: total,
      passed,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Score submitted — ${total}/100 (${passed ? "pass" : "fail"})`);
    setNotes("");
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Examiner"
        title="Practical scoring"
        description="Score the live assessment against the IBG rubric. 70 of 100 is required to pass."
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-md border border-border bg-card/60 p-6">
          <div className="space-y-2">
            <Label htmlFor="candidate">Candidate</Label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger id="candidate">
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent>
                {(candidates ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name ?? c.email ?? c.id}
                    {c.cpb_id ? ` · ${c.cpb_id}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCandidate && (
            <div className="flex items-center gap-4 rounded-md border border-primary/40 bg-primary/5 p-4">
              {selectedCandidate.photo_url ? (
                <img
                  src={selectedCandidate.photo_url}
                  alt={selectedCandidate.full_name ?? "Candidate photo"}
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-card text-xs text-muted-foreground">
                  No photo
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight">
                  {selectedCandidate.full_name ?? "—"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selectedCandidate.cpb_id ?? "No CPB ID yet"}
                  {selectedCandidate.cities?.name ? ` · ${selectedCandidate.cities.name}` : ""}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {selectedCandidate.email ?? "—"}
                  {selectedCandidate.phone ? ` · ${selectedCandidate.phone}` : ""}
                </p>
              </div>
            </div>
          )}

          {RUBRIC.map((r) => (
            <div key={r.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{r.label}</Label>
                <span className="font-display text-lg text-primary">
                  {scores[r.key]} / {r.max}
                </span>
              </div>
              <Slider
                value={[scores[r.key] ?? 0]}
                max={r.max}
                step={1}
                onValueChange={([v]) => setScores((s) => ({ ...s, [r.key]: v ?? 0 }))}
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="notes">Examiner notes</Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, feedback and areas to improve."
            />
          </div>
        </div>

        <div className="h-fit rounded-md border border-primary/40 bg-primary/5 p-6">
          <p className="eyebrow">Scoring</p>
          <p className="mt-1 truncate text-sm text-foreground">
            {selectedCandidate
              ? (selectedCandidate.full_name ?? selectedCandidate.email)
              : "No candidate selected"}
          </p>
          {selectedCandidate?.cpb_id && (
            <p className="text-xs text-muted-foreground">{selectedCandidate.cpb_id}</p>
          )}
          <p className="mt-4 eyebrow">Total score</p>
          <p className="mt-2 font-display text-6xl text-gradient-gold">{total}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {passed ? "Meets the CPB® practical standard." : "Below the 70-point pass mark."}
          </p>
          <Button className="mt-6 w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? "Submitting…" : "Submit score"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
