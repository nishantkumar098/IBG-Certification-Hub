import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSession, useRoles, useAdminCities } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { listExperienceReviewQueue, reviewExperienceDocument } from "@/lib/candidate.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin back-office — IBG Academy" },
      {
        name: "description",
        content: "Monitor CPB® candidates, exams, payments and certificates.",
      },
      { property: "og:title", content: "Admin back-office — IBG Academy" },
      { property: "og:description", content: "Monitor CPB® candidates and certifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function exportToExcel(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Placeholder id for ".in()" filters when the real id list is empty — an
// empty array there would otherwise match everything on some clients.
const NONE_ID = ["00000000-0000-0000-0000-000000000000"];
function safeIn(ids: string[]) {
  return ids.length ? ids : NONE_ID;
}

function AdminPage() {
  const { user, loading: sessionLoading } = useSession();
  const { data: roles } = useRoles(user);
  const { data: myCities } = useAdminCities(user, roles);
  const rolesLoading = sessionLoading || (!!user && roles === undefined);

  const isStaff = (roles ?? []).some(
    (r) => r === "admin" || r === "superadmin" || r === "office_admin",
  );
  const isGlobalAdmin = (roles ?? []).some((r) => r === "admin" || r === "superadmin");

  // Superadmin/admin start on a picker of every office (plus an "All
  // cities" card); picking a card scopes the whole dashboard below. An
  // office_admin has no picker — they're always scoped to whichever city
  // (or cities) they're assigned.
  // null = still on the picker screen, "all" = combined dashboard, a city
  // id = that one office's dashboard.
  const [selectedCityId, setSelectedCityId] = useState<string | "all" | null>(null);

  const { data: officeCities } = useQuery({
    enabled: isGlobalAdmin,
    queryKey: ["admin-office-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const effectiveCityIds: string[] | null = isGlobalAdmin
    ? selectedCityId && selectedCityId !== "all"
      ? [selectedCityId]
      : null
    : (myCities ?? []).map((c) => c.id);

  const officeLabel = isGlobalAdmin
    ? selectedCityId === "all" || !selectedCityId
      ? "All offices"
      : ((officeCities ?? []).find((c) => c.id === selectedCityId)?.name ?? "…")
    : (myCities ?? []).map((c) => c.name).join(", ") || "No office assigned";

  // Pre-resolve which candidates / testing centres fall in scope, since most
  // tables below only carry a candidate_id or testing_center_id, not city_id
  // directly.
  const { data: cityScope } = useQuery({
    enabled: isStaff,
    queryKey: ["admin-city-scope", effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      if (!effectiveCityIds) return { candidateIds: null, testingCenterIds: null } as const;
      const ids = safeIn(effectiveCityIds);
      const [profilesRes, centersRes] = await Promise.all([
        supabase.from("profiles").select("id").in("city_id", ids),
        supabase.from("testing_centers").select("id").in("city_id", ids),
      ]);
      return {
        candidateIds: (profilesRes.data ?? []).map((p) => p.id),
        testingCenterIds: (centersRes.data ?? []).map((c) => c.id),
      };
    },
  });
  const cityReady = cityScope !== undefined;
  const candidateIds = cityScope?.candidateIds ?? null;
  const testingCenterIds = cityScope?.testingCenterIds ?? null;

  const { data } = useQuery({
    enabled: isStaff && cityReady,
    queryKey: ["admin-overview", effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      let candidatesQ = supabase.from("profiles").select("id", { count: "exact", head: true });
      if (effectiveCityIds) candidatesQ = candidatesQ.in("city_id", safeIn(effectiveCityIds));

      let paymentsQ = supabase.from("payments").select("amount_inr").eq("status", "paid");
      if (candidateIds) paymentsQ = paymentsQ.in("candidate_id", safeIn(candidateIds));

      let attemptsQ = supabase
        .from("mcq_attempts")
        .select("id", { count: "exact", head: true })
        .eq("mode", "official");
      if (candidateIds) attemptsQ = attemptsQ.in("candidate_id", safeIn(candidateIds));

      let certificatesQ = supabase
        .from("certificates")
        .select("id", { count: "exact", head: true });
      if (candidateIds) certificatesQ = certificatesQ.in("candidate_id", safeIn(candidateIds));

      let slotsQ = supabase
        .from("exam_slots")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
      if (testingCenterIds) slotsQ = slotsQ.in("testing_center_id", safeIn(testingCenterIds));

      const [candidates, payments, attempts, certificates, slots] = await Promise.all([
        candidatesQ,
        paymentsQ,
        attemptsQ,
        certificatesQ,
        slotsQ,
      ]);
      return {
        candidates: candidates.count ?? 0,
        revenue: (payments.data ?? []).reduce((sum, p) => sum + p.amount_inr, 0),
        attempts: attempts.count ?? 0,
        certificates: certificates.count ?? 0,
        openSlots: slots.count ?? 0,
      };
    },
  });

  // All candidates who have paid the certification fee — full price or discounted,
  // with the discount code (if any) they used. Server-side paginated.
  const CERT_PAYMENTS_PAGE_SIZE = 10;
  const [certPaymentsPage, setCertPaymentsPage] = useState(0);
  const [exportingPayments, setExportingPayments] = useState(false);

  const { data: certPaymentsData } = useQuery({
    enabled: cityReady,
    queryKey: ["admin-cert-payments", certPaymentsPage, effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      const from = certPaymentsPage * CERT_PAYMENTS_PAGE_SIZE;
      const to = from + CERT_PAYMENTS_PAGE_SIZE - 1;
      let query = supabase
        .from("payments")
        .select("id, candidate_id, amount_inr, created_at, discount_code", { count: "exact" })
        .eq("purpose", "certification")
        .eq("status", "paid");
      if (candidateIds) query = query.in("candidate_id", safeIn(candidateIds));
      const {
        data: pays,
        error,
        count,
      } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;
      const ids = [...new Set((pays ?? []).map((p) => p.candidate_id))];
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, cpb_id").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return {
        rows: (pays ?? []).map((p) => ({ ...p, candidate: byId.get(p.candidate_id) ?? null })),
        total: count ?? 0,
      };
    },
  });
  const certPayments = certPaymentsData?.rows ?? [];
  const certPaymentsTotalPages = Math.max(
    1,
    Math.ceil((certPaymentsData?.total ?? 0) / CERT_PAYMENTS_PAGE_SIZE),
  );

  async function exportPayments() {
    setExportingPayments(true);
    try {
      let query = supabase
        .from("payments")
        .select("id, candidate_id, amount_inr, created_at, discount_code")
        .eq("purpose", "certification")
        .eq("status", "paid");
      if (candidateIds) query = query.in("candidate_id", safeIn(candidateIds));
      const { data: pays, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((pays ?? []).map((p) => p.candidate_id))];
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, cpb_id").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      const rows = (pays ?? []).map((p) => ({
        Name: byId.get(p.candidate_id)?.full_name ?? "—",
        "CPB ID": byId.get(p.candidate_id)?.cpb_id ?? "—",
        Email: byId.get(p.candidate_id)?.email ?? "—",
        "Amount (₹)": p.amount_inr,
        "Discount code": p.discount_code ?? "—",
        "Paid on": new Date(p.created_at).toLocaleDateString("en-IN"),
      }));
      exportToExcel("certification-payments", rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export");
    } finally {
      setExportingPayments(false);
    }
  }

  const RECENT_PAGE_SIZE = 10;
  const [recentPage, setRecentPage] = useState(0);
  const [exportingRecent, setExportingRecent] = useState(false);

  const { data: recentData } = useQuery({
    enabled: cityReady,
    queryKey: ["admin-recent", recentPage, effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      const from = recentPage * RECENT_PAGE_SIZE;
      const to = from + RECENT_PAGE_SIZE - 1;
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, status, created_at, cities(name)", { count: "exact" });
      if (effectiveCityIds) query = query.in("city_id", safeIn(effectiveCityIds));
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const recent = recentData?.rows ?? [];
  const recentTotalPages = Math.max(1, Math.ceil((recentData?.total ?? 0) / RECENT_PAGE_SIZE));

  async function exportRecent() {
    setExportingRecent(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, status, created_at, cities(name)");
      if (effectiveCityIds) query = query.in("city_id", safeIn(effectiveCityIds));
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []).map((r) => ({
        Name: r.full_name ?? "—",
        Email: r.email ?? "—",
        City: r.cities?.name ?? "—",
        Status: r.status,
      }));
      exportToExcel("recent-registrations", rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export");
    } finally {
      setExportingRecent(false);
    }
  }

  const fetchQueue = useServerFn(listExperienceReviewQueue);
  const review = useServerFn(reviewExperienceDocument);
  const { data: rawQueue, refetch: refetchQueue } = useQuery({
    queryKey: ["experience-queue"],
    queryFn: () => fetchQueue(),
  });
  // The server already scopes this to an office_admin's own city; when a
  // superadmin has drilled into one city's card, narrow the shared list too.
  const queue = useMemo(() => {
    if (!candidateIds) return rawQueue ?? [];
    const ids = new Set(candidateIds);
    return (rawQueue ?? []).filter((q) => ids.has(q.candidateId));
  }, [rawQueue, candidateIds]);

  async function decide(id: string, decision: "approved" | "rejected") {
    try {
      await review({ data: { id, decision } });
      toast.success(decision === "approved" ? "Experience verified" : "Submission returned");
      await refetchQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this submission");
    }
  }

  const [details, setDetails] = useState<Record<string, string>>({});
  const { data: slotRequests, refetch: refetchRequests } = useQuery({
    enabled: cityReady,
    queryKey: ["admin-slot-requests", effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("exam_slot_requests")
        .select("*, cities(name)")
        .in("status", ["pending", "scheduled", "declined"]);
      if (effectiveCityIds) query = query.in("city_id", safeIn(effectiveCityIds));
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((r) => r.candidate_id))];
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, cpb_id").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => ({ ...r, candidate: byId.get(r.candidate_id) ?? null }));
    },
  });

  // Written + practical requests are submitted together (book.tsx inserts
  // both rows in one statement, so they share candidate_id + created_at) —
  // group them so admin sees/actions them as a single request.
  const requestGroups = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof slotRequests>>();
    for (const r of slotRequests ?? []) {
      const key = `${r.candidate_id}|${r.created_at}`;
      const existing = groups.get(key);
      if (existing) existing.push(r);
      else groups.set(key, [r]);
    }
    return [...groups.entries()].map(([key, rows]) => ({ key, rows }));
  }, [slotRequests]);

  const AUTO_TEXTS = ["accepted by admin", "req declined by admin"];

  async function schedule(groupKey: string, ids: string[], status: "scheduled" | "declined") {
    const typed = details[groupKey]?.trim();
    const isLeftoverAutoText = typed !== undefined && AUTO_TEXTS.includes(typed);
    const scheduledDetails =
      status === "scheduled"
        ? typed && !isLeftoverAutoText
          ? typed
          : "accepted by admin"
        : "req declined by admin";

    const { error } = await supabase
      .from("exam_slot_requests")
      .update({ status, scheduled_details: scheduledDetails })
      .in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDetails((d) => ({ ...d, [groupKey]: scheduledDetails }));
    toast.success(status === "scheduled" ? "Candidate notified in-app" : "Request declined");
    await refetchRequests();
  }

  async function deleteRequest(groupKey: string, ids: string[]) {
    const { error } = await supabase.from("exam_slot_requests").delete().in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDetails((d) => {
      const next = { ...d };
      delete next[groupKey];
      return next;
    });
    toast.success("Request deleted");
    await refetchRequests();
  }

  const { data: certEligible, refetch: refetchCertEligible } = useQuery({
    enabled: cityReady,
    queryKey: ["admin-cert-eligible", effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      let scoresQ = supabase
        .from("practical_scores")
        .select("candidate_id, total_score")
        .eq("passed", true);
      if (candidateIds) scoresQ = scoresQ.in("candidate_id", safeIn(candidateIds));

      const [scores, certs, certType] = await Promise.all([
        scoresQ,
        supabase.from("certificates").select("candidate_id"),
        supabase
          .from("certification_types")
          .select("id")
          .eq("is_active", true)
          .order("created_at")
          .limit(1)
          .maybeSingle(),
      ]);
      const alreadyCertified = new Set((certs.data ?? []).map((c) => c.candidate_id));
      const eligibleIds = [
        ...new Set(
          (scores.data ?? []).map((s) => s.candidate_id).filter((id) => !alreadyCertified.has(id)),
        ),
      ];
      if (eligibleIds.length === 0) return { people: [], certTypeId: certType.data?.id ?? null };
      const { data: people } = await supabase
        .from("profiles")
        .select("id, full_name, email, cpb_id")
        .in("id", eligibleIds);
      return { people: people ?? [], certTypeId: certType.data?.id ?? null };
    },
  });

  // Everyone who's been issued a certificate — server-side paginated.
  const CERTIFIED_PAGE_SIZE = 10;
  const [certifiedPage, setCertifiedPage] = useState(0);
  const [exportingCertified, setExportingCertified] = useState(false);

  const { data: issuedCertData, refetch: refetchIssuedCertificates } = useQuery({
    enabled: cityReady,
    queryKey: ["admin-issued-certificates", certifiedPage, effectiveCityIds?.join(",") ?? "all"],
    queryFn: async () => {
      const from = certifiedPage * CERTIFIED_PAGE_SIZE;
      const to = from + CERTIFIED_PAGE_SIZE - 1;
      let query = supabase
        .from("certificates")
        .select("id, candidate_id, certificate_number, issued_date, expires_on, status", {
          count: "exact",
        });
      if (candidateIds) query = query.in("candidate_id", safeIn(candidateIds));
      const {
        data: certs,
        error,
        count,
      } = await query.order("issued_date", { ascending: false }).range(from, to);
      if (error) throw error;
      const ids = [...new Set((certs ?? []).map((c) => c.candidate_id))];
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, cpb_id").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return {
        rows: (certs ?? []).map((c) => ({ ...c, candidate: byId.get(c.candidate_id) ?? null })),
        total: count ?? 0,
      };
    },
  });
  const issuedCertificates = issuedCertData?.rows ?? [];
  const certifiedTotalPages = Math.max(
    1,
    Math.ceil((issuedCertData?.total ?? 0) / CERTIFIED_PAGE_SIZE),
  );

  async function exportCertified() {
    setExportingCertified(true);
    try {
      let query = supabase
        .from("certificates")
        .select("id, candidate_id, certificate_number, issued_date, expires_on, status");
      if (candidateIds) query = query.in("candidate_id", safeIn(candidateIds));
      const { data: certs, error } = await query.order("issued_date", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((certs ?? []).map((c) => c.candidate_id))];
      const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, cpb_id").in("id", ids)
        : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      const rows = (certs ?? []).map((c) => ({
        Name: byId.get(c.candidate_id)?.full_name ?? "—",
        "CPB ID": byId.get(c.candidate_id)?.cpb_id ?? "—",
        "Certificate No.": c.certificate_number,
        Issued: c.issued_date,
        Expires: c.expires_on ?? "—",
        Status: c.status,
      }));
      exportToExcel("certified-candidates", rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export");
    } finally {
      setExportingCertified(false);
    }
  }

  const [issuing, setIssuing] = useState<string | null>(null);

  async function issueCertificate(candidateId: string) {
    setIssuing(candidateId);
    try {
      const certificateNumber = `CPB-${new Date().getFullYear()}-${crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;
      const { error } = await supabase.from("certificates").insert({
        candidate_id: candidateId,
        certification_type_id: certEligible?.certTypeId ?? null,
        certificate_number: certificateNumber,
        status: "valid",
      });
      if (error) throw error;
      toast.success(`Certificate ${certificateNumber} issued.`);
      await refetchCertEligible();
      await refetchIssuedCertificates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not issue the certificate");
    } finally {
      setIssuing(null);
    }
  }

  const stats = [
    ["Candidates", data?.candidates ?? 0],
    ["Certificates issued", data?.certificates ?? 0],
    ["Official exam attempts", data?.attempts ?? 0],
    ["Open exam slots", data?.openSlots ?? 0],
    ["Fees collected", `₹${(data?.revenue ?? 0).toLocaleString("en-IN")}`],
  ] as const;

  if (rolesLoading) return null;

  if (!isStaff) {
    return (
      <AppShell>
        <PageHeading
          eyebrow="Back-office"
          title="Administration"
          description="This area is restricted to office admins and superadmins."
        />
        <p className="mt-6 text-sm text-muted-foreground">
          You don't have access to any office dashboard. Ask a superadmin to assign you one.
        </p>
      </AppShell>
    );
  }

  if (isGlobalAdmin && !selectedCityId) {
    return (
      <AppShell>
        <PageHeading
          eyebrow="Back-office"
          title="Administration"
          description="Pick an office to view its dashboard."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setSelectedCityId("all")}
            className="rounded-md border border-border bg-card/60 p-6 text-left transition-colors hover:border-primary/60 hover:bg-card"
          >
            <p className="font-display text-xl text-gradient-gold">All cities</p>
            <p className="mt-1 text-sm text-muted-foreground">View combined dashboard →</p>
          </button>
          {(officeCities ?? []).map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelectedCityId(city.id)}
              className="rounded-md border border-border bg-card/60 p-6 text-left transition-colors hover:border-primary/60 hover:bg-card"
            >
              <p className="font-display text-xl text-gradient-gold">{city.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">View office dashboard →</p>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {isGlobalAdmin && (
        <button
          type="button"
          onClick={() => setSelectedCityId(null)}
          className="mb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to offices
        </button>
      )}
      <PageHeading
        eyebrow="Back-office"
        title="Administration"
        description={`Scope: ${officeLabel}. Programme health across candidates, exams, payments and issued credentials.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-card/60 p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-gradient-gold">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Experience certificates awaiting verification</h2>
        {(queue ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing pending review.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(queue ?? []).map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card/60 p-5"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {q.candidate}
                    {q.cpbId ? ` · ${q.cpbId}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {q.designation} at {q.employer} · since {q.since}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void decide(q.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void decide(q.id, "rejected")}>
                    Return
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Exam date requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Candidates pick a city and a date; you confirm the reporting time here.
        </p>
        {requestGroups.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {requestGroups.map(({ key, rows }) => {
              const [first] = rows;
              if (!first) return null;
              const ids = rows.map((r) => r.id);
              const examLabel =
                rows.length > 1
                  ? "Written exam & Practical assessment"
                  : first.exam_type === "mcq"
                    ? "Written exam"
                    : "Practical assessment";
              const scheduledDetails = rows.find((r) => r.scheduled_details)?.scheduled_details;
              const isNew = rows.some((r) => r.status === "pending");

              return (
                <li key={key} className="rounded-md border border-border bg-card/60 p-5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">
                      {first.candidate?.full_name ?? "Candidate"}
                      {first.candidate?.cpb_id ? ` · ${first.candidate.cpb_id}` : ""}
                    </p>
                    {isNew && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary">
                        New req
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {examLabel} · {first.cities?.name ?? "City TBC"} · {first.preferred_date}
                    {first.alternate_date ? ` (or ${first.alternate_date})` : ""}
                  </p>
                  {first.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">“{first.notes}”</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className="min-w-[16rem] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Confirmed centre, date and reporting time"
                      value={details[key] ?? scheduledDetails ?? ""}
                      onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => void schedule(key, ids, "scheduled")}>
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void schedule(key, ids, "declined")}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void deleteRequest(key, ids)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Ready to certify</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Candidates who passed their practical assessment and don't have a certificate yet.
        </p>
        {(certEligible?.people ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No one is waiting on a certificate.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(certEligible?.people ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card/60 p-5"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {p.full_name ?? "Candidate"}
                    {p.cpb_id ? ` · ${p.cpb_id}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.email}</p>
                </div>
                <Button
                  size="sm"
                  disabled={issuing === p.id}
                  onClick={() => void issueCertificate(p.id)}
                >
                  {issuing === p.id ? "Issuing…" : "Issue certificate"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Certified candidates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone who has been issued a CPB® certificate.
        </p>
        {(issuedCertificates ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No certificates issued yet.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-card/80 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">CPB ID</th>
                    <th className="px-4 py-3">Certificate No.</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(issuedCertificates ?? []).map((c) => (
                    <tr key={c.id} className="border-t border-border/60">
                      <td className="px-4 py-3">{c.candidate?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.candidate?.cpb_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.certificate_number}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.issued_date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.expires_on ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {certifiedPage + 1} of {certifiedTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exportingCertified}
                  onClick={() => void exportCertified()}
                >
                  {exportingCertified ? "Preparing…" : "Download Excel"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={certifiedPage === 0}
                  onClick={() => setCertifiedPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={certifiedPage + 1 >= certifiedTotalPages}
                  onClick={() => setCertifiedPage((p) => Math.min(certifiedTotalPages - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Certification fee payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every candidate who has paid the certification fee — full price or with a discount code.
        </p>
        {certPayments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-card/80 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">CPB ID</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Discount code</th>
                    <th className="px-4 py-3">Paid on</th>
                  </tr>
                </thead>
                <tbody>
                  {certPayments.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-4 py-3">{p.candidate?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.candidate?.cpb_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.candidate?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{p.amount_inr.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.discount_code ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {certPaymentsPage + 1} of {certPaymentsTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exportingPayments}
                  onClick={() => void exportPayments()}
                >
                  {exportingPayments ? "Preparing…" : "Download Excel"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={certPaymentsPage === 0}
                  onClick={() => setCertPaymentsPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={certPaymentsPage + 1 >= certPaymentsTotalPages}
                  onClick={() =>
                    setCertPaymentsPage((p) => Math.min(certPaymentsTotalPages - 1, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Recent registrations</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-card/80 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{r.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.cities?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {recentPage + 1} of {recentTotalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={exportingRecent}
              onClick={() => void exportRecent()}
            >
              {exportingRecent ? "Preparing…" : "Download Excel"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={recentPage === 0}
              onClick={() => setRecentPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={recentPage + 1 >= recentTotalPages}
              onClick={() => setRecentPage((p) => Math.min(recentTotalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
