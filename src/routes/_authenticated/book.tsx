import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, MapPin, Clock3 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({
    meta: [
      { title: "Request an exam date — IBG Academy" },
      {
        name: "description",
        content:
          "Choose your city and preferred date for the CPB® written or practical examination. The guild office confirms your exact timing.",
      },
      { property: "og:title", content: "Request an exam date — IBG Academy" },
      { property: "og:description", content: "Pick a city and a date for your CPB® exam." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting confirmation",
  scheduled: "Scheduled",
  declined: "Not available",
  cancelled: "Cancelled",
};

function BookPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [cityId, setCityId] = useState("");
  // Every request books both the written and practical exam — no selection needed.
  const examTypes: Array<"mcq" | "practical"> = ["mcq", "practical"];
  const [preferredDate, setPreferredDate] = useState("");
  const [alternateDate, setAlternateDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: cities } = useQuery({
    queryKey: ["exam-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, state")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["slot-requests", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_slot_requests")
        .select("*, cities(name, state)")
        .eq("candidate_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Written + practical are submitted together in one insert (same
  // created_at) — group them so the candidate sees one combined card.
  const requestGroups = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof requests>>();
    for (const r of requests ?? []) {
      const key = `${r.candidate_id}|${r.created_at}`;
      const existing = groups.get(key);
      if (existing) existing.push(r);
      else groups.set(key, [r]);
    }
    return [...groups.entries()].map(([key, rows]) => ({ key, rows }));
  }, [requests]);

  const today = new Date().toISOString().slice(0, 10);

  async function submit() {
    if (!user) return;
    if (!cityId || !preferredDate) {
      toast.error("Choose a city and a preferred date.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("exam_slot_requests").insert(
      examTypes.map((exam_type) => ({
        candidate_id: user.id,
        city_id: cityId,
        exam_type,
        preferred_date: preferredDate,
        alternate_date: alternateDate || null,
        notes: notes.trim() || null,
      })),
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Requests received for both the written and practical exam. The guild office will send you the exact timing.",
    );
    setPreferredDate("");
    setAlternateDate("");
    setNotes("");
    void queryClient.invalidateQueries({ queryKey: ["slot-requests", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["progress", user.id] });
  }

  async function cancel(ids: string[]) {
    const { error } = await supabase
      .from("exam_slot_requests")
      .update({ status: "cancelled" })
      .in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request cancelled.");
    void queryClient.invalidateQueries({ queryKey: ["slot-requests", user?.id] });
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Scheduling"
        title="Request an exam date"
        description="Select your city and the date that suits you. The guild office schedules the session at the designated testing centre and sends you the exact reporting time."
      />

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-md border border-border bg-card/60 p-6">
          <div className="grid gap-5">
            <div className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Examination</span>
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground">
                Written examination + Practical assessment
              </div>
              <p className="text-xs text-muted-foreground">
                Every request books you in for both the written and practical exam together.
              </p>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">City</span>
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">Select your city…</option>
                {(cities ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.state ? `, ${c.state}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Preferred date</span>
                <input
                  type="date"
                  min={today}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Alternate date (optional)</span>
                <input
                  type="date"
                  min={today}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={alternateDate}
                  onChange={(e) => setAlternateDate(e.target.value)}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Anything we should know? (optional)</span>
              <textarea
                rows={3}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift timings, accessibility needs, travel constraints…"
              />
            </label>

            <Button disabled={saving} onClick={() => void submit()}>
              {saving ? "Sending…" : "Request this date"}
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Slot timings are allotted by the guild office and confirmed to you by email and
              phone. You do not need to pick a time here.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Your requests</h2>
          <div className="mt-4 grid gap-4">
            {requestGroups.map(({ key, rows }) => {
              const [first] = rows;
              if (!first) return null;
              const ids = rows.map((r) => r.id);
              const examLabel =
                rows.length > 1
                  ? "Written exam + Practical assessment"
                  : first.exam_type === "mcq"
                    ? "Written exam"
                    : "Practical assessment";
              const scheduledDetails = rows.find((r) => r.scheduled_details)?.scheduled_details;
              // If either half is still pending, show that as the overall status.
              const overallStatus =
                rows.find((r) => r.status === "pending")?.status ?? first.status;

              return (
                <div key={key} className="rounded-md border border-border bg-card/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">{examLabel}</p>
                    <span className="rounded-full border border-border px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                      {STATUS_LABEL[overallStatus] ?? overallStatus}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {first.preferred_date}
                    {first.alternate_date ? ` (or ${first.alternate_date})` : ""}
                  </p>
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {first.cities?.name ?? "City to be confirmed"}
                  </p>
                  {scheduledDetails && (
                    <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
                      {scheduledDetails}
                    </p>
                  )}
                  {overallStatus === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => void cancel(ids)}
                    >
                      Cancel request
                    </Button>
                  )}
                </div>
              );
            })}
            {requests && requests.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No requests yet. Choose a city and a date to get scheduled.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}