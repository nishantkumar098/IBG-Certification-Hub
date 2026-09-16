import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusStepper, type CandidateStage } from "@/components/status-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, useProfile } from "@/hooks/use-auth";
import { usePayment } from "@/hooks/use-payment";
import {
  OFFICIAL_QUESTION_COUNT,
  OFFICIAL_DURATION_MINUTES,
  PASS_PERCENT,
} from "@/lib/exam.functions";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Candidate dashboard — IBG Academy" },
      {
        name: "description",
        content: "Track your CPB® certification progress, payments, exams and certificate.",
      },
      { property: "og:title", content: "Candidate dashboard — IBG Academy" },
      { property: "og:description", content: "Track your CPB® certification progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const queryClient = useQueryClient();
  const [discountCode, setDiscountCode] = useState("");
  const { pay, pending } = usePayment(() => {
    void queryClient.invalidateQueries({ queryKey: ["progress", user?.id] });
    void queryClient.invalidateQueries({ queryKey: ["membership", user?.id] });
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: steps } = useQuery({
    queryKey: ["journey-steps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [conduct, experience] = await Promise.all([
        supabase.from("conduct_acceptances").select("id").eq("user_id", uid).limit(1),
        supabase
          .from("experience_documents")
          .select("status")
          .eq("candidate_id", uid)
          .order("created_at", { ascending: false }),
      ]);
      const rows = experience.data ?? [];
      const status = rows.some((r) => r.status === "approved")
        ? "approved"
        : rows.some((r) => r.status === "pending")
          ? "pending"
          : rows.length > 0
            ? "rejected"
            : "none";
      return { conductSigned: (conduct.data ?? []).length > 0, experienceStatus: status };
    },
  });

  const conductSigned = steps?.conductSigned ?? false;
  const experienceStatus = steps?.experienceStatus ?? "none";




  const { data: progress } = useQuery({
    queryKey: ["progress", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const uid = user!.id;
      const [payments, attempts, bookings, requests, practical, certificate] = await Promise.all([
        supabase.from("payments").select("*").eq("candidate_id", uid).eq("status", "paid"),
        supabase.from("mcq_attempts").select("*").eq("candidate_id", uid).eq("mode", "official"),
        supabase
          .from("bookings")
          .select("*, exam_slots(*, testing_centers(name, address))")
          .eq("candidate_id", uid)
          .eq("status", "booked"),
        // Candidate slot *requests* that the guild office has scheduled/approved.
        // These live in a separate table from confirmed `bookings` — without
        // this, an approved practical request never advanced the stepper.
        supabase
          .from("exam_slot_requests")
          .select("*, testing_centers(name, address)")
          .eq("candidate_id", uid)
          .eq("status", "scheduled"),
        supabase.from("practical_scores").select("*").eq("candidate_id", uid),
        supabase.from("certificates").select("*").eq("candidate_id", uid).maybeSingle(),
      ]);
      return {
        paid: (payments.data ?? []).length > 0,
        mcqPassed: (attempts.data ?? []).some((a) => a.passed),
        mcqAttempted: (attempts.data ?? []).length > 0,
        bookings: bookings.data ?? [],
        requests: requests.data ?? [],
        practical: practical.data ?? [],
        certificate: certificate.data,
      };
    },
  });

  const stage: CandidateStage = (() => {
    if (!progress) return "registered";
    if (progress.certificate) return "certified";
    if (progress.practical.length > 0) return "certified";
    if (
      progress.bookings.some((b) => b.exam_slots?.type === "practical") ||
      progress.requests.some((r) => r.exam_type === "practical")
    )
      return "practical_booked";
    if (progress.mcqPassed) return "mcq_result";
    if (
      progress.bookings.some((b) => b.exam_slots?.type === "mcq") ||
      progress.requests.some((r) => r.exam_type === "mcq")
    )
      return "mcq_booked";
    if (progress.paid) return "studying";
    return "registered";
  })();

  const prefill = {
    name: profile?.full_name ?? undefined,
    email: user?.email ?? undefined,
    contact: profile?.phone ?? undefined,
  };



  return (
    <AppShell>
      <PageHeading
        eyebrow="Candidate"
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Your CPB® certification progress at a glance."
      />

      <StatusStepper current={stage} />

      {membership && (
        <section className="mt-10 overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <p className="eyebrow">Digital membership card</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl">{profile?.full_name ?? "IBG Member"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Member no. <span className="text-foreground">{membership.member_number}</span>
                {profile?.cpb_id ? ` · CPB ID ${profile.cpb_id}` : ""}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Plan: {membership.plan_code}</p>
              <p>Valid until {membership.expires_on}</p>
            </div>
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {!progress?.paid && (
          <Card
            title="Pay your certification fee"
            body="₹5,000 covers the IBG Bartenders Manual, practice quizzes, one written exam and one practical assessment."
          >
            <div className="mb-3">
              <label htmlFor="discount-code" className="mb-1 block text-xs text-muted-foreground">
                Discount code (optional)
              </label>
              <Input
                id="discount-code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Any Code"
                className="max-w-[200px]"
              />
            </div>
            <Button
              onClick={() => void pay("certification", prefill, discountCode)}
              disabled={!!pending}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {pending === "certification" ? "Opening checkout…" : "Pay ₹5,000"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Secure Razorpay checkout — UPI, cards, netbanking and wallets.
            </p>
          </Card>
        )}

        {!membership && (
          <Card
            title="IBG professional membership"
            body="₹2,000 a year for a digital membership card, member directory listing, guild events and continuing education."
          >
            <Button
              variant={progress?.paid ? "default" : "outline"}
              onClick={() => void pay("membership", prefill)}
              disabled={!!pending}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {pending === "membership" ? "Opening checkout…" : "Buy membership ₹2,000"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Your card is issued automatically the moment payment clears.
            </p>
          </Card>
        )}


        {progress?.paid && !progress.mcqPassed && (
          <Card
            title="Written examination"
            body={`${OFFICIAL_QUESTION_COUNT} questions, ${OFFICIAL_DURATION_MINUTES} minutes, ${PASS_PERCENT}% to pass. Unlimited practice first; the official paper is unlocked by the invigilator at your centre.`}
          >
            <Button asChild>
              <Link to="/exam">
                Go to exam <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        )}

        {progress?.mcqPassed && !progress.certificate && (
          <Card
            title="Practical assessment"
            body="Request a date at an IBG testing centre in your city — the guild office confirms your reporting time."
          >
            <Button asChild>
              <Link to="/book">
                Request a date <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

          </Card>
        )}

        {progress?.certificate && (
          <Card
            title="You're certified"
            body={`Certificate ${progress.certificate.certificate_number} is live on the public register.`}
          >
            <Button asChild>
              <Link to="/certificate">
                View certificate <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        )}

        <Card
          title="Study material"
          body="The IBG Bartenders Manual and eight examinable modules, plus unlimited practice quizzes."
        >
          <Button asChild variant="outline">
            <Link to="/study">Open study centre</Link>
          </Button>
        </Card>

        <Card
          title="Guild library"
          body="Read the 148-page IBG CFB Guide and every guild publication page by page inside the app."
        >
          <Button asChild variant="outline">
            <Link to="/library">Open the library</Link>
          </Button>
        </Card>

        {!conductSigned && (
          <Card
            title="Sign the code of conduct"
            body="Every candidate signs the guild's professional oath before sitting the official written paper."
          >
            <Button asChild>
              <Link to="/conduct">
                Sign the oath <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        )}

        {experienceStatus !== "approved" && (
          <Card
            title="Experience certificate"
            body={
              experienceStatus === "pending"
                ? "Your experience certificate is with the guild office for verification."
                : experienceStatus === "rejected"
                  ? "Your last submission was returned. Please upload a corrected certificate."
                  : "One year of verified bar experience is required for CPB® entry. Upload your employer certificate."
            }
          >
            <Button asChild variant={experienceStatus === "pending" ? "outline" : "default"}>
              <Link to="/experience">
                {experienceStatus === "pending" ? "View submission" : "Upload certificate"}
              </Link>
            </Button>
          </Card>
        )}

        {!profile?.city_id && (
          <Card
            title="Complete your profile"
            body="Add your city, experience and photo — your photo appears on your certificate."
          >
            <Button asChild variant="outline">
              <Link to="/profile">Complete profile</Link>
            </Button>
          </Card>
        )}
      </div>

      {progress && (progress.bookings.length > 0 || progress.requests.length > 0) && (
        <section className="mt-12">
          <h2 className="text-2xl">Upcoming exams</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {progress.bookings.map((b) => (
              <div key={b.id} className="rounded-md border border-border bg-card/60 p-5">
                <p className="eyebrow">{b.exam_slots?.type === "mcq" ? "Written" : "Practical"}</p>
                <p className="mt-2 font-display text-xl">
                  {b.exam_slots?.exam_date} · {b.exam_slots?.start_time?.slice(0, 5)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {b.exam_slots?.testing_centers?.name} — {b.exam_slots?.testing_centers?.address}
                </p>
              </div>
            ))}
            {progress.requests.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-card/60 p-5">
                <p className="eyebrow">{r.exam_type === "mcq" ? "Written" : "Practical"}</p>
                <p className="mt-2 font-display text-xl">
                  {r.scheduled_details || r.preferred_date}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.testing_centers?.name}
                  {r.testing_centers?.address ? ` — ${r.testing_centers.address}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Card({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card/60 p-6">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}