import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, ShieldCheck, KeyRound, CheckCircle2, Circle } from "lucide-react";

import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  startQuiz,
  submitQuiz,
  type QuizQuestion,
  OFFICIAL_QUESTION_COUNT,
  OFFICIAL_DURATION_MINUTES,
  PASS_PERCENT,
} from "@/lib/exam.functions";
import {
  authorizeExamStart,
  getOfficialExamReadiness,
  listExamCentres,
} from "@/lib/exam-authorization.functions";
import { useSession } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function ReadyRow({ ok, label, to }: { ok: boolean; label: string; to?: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-primary" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      {!ok && to && (
        <Link to={to} className="text-xs text-primary hover:underline">
          Not done — complete this →
        </Link>
      )}
    </li>
  );
}

export const Route = createFileRoute("/_authenticated/exam")({
  head: () => ({
    meta: [
      { title: "Written examination — IBG Academy" },
      {
        name: "description",
        content: "Take a practice quiz or sit the invigilated CPB® written examination.",
      },
      { property: "og:title", content: "Written examination — IBG Academy" },
      { property: "og:description", content: "Practice quizzes and the official CPB® written exam." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamPage,
});

type Result = Awaited<ReturnType<typeof submitQuiz>>;
type Letter = "A" | "B" | "C" | "D";

function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function ExamPage() {
  const start = useServerFn(startQuiz);
  const submit = useServerFn(submitQuiz);
  const { user } = useSession();
  const fetchReadiness = useServerFn(getOfficialExamReadiness);
  const fetchCentres = useServerFn(listExamCentres);
  const authorize = useServerFn(authorizeExamStart);

  const { data: readiness, refetch: refetchReadiness } = useQuery({
    queryKey: ["readiness", user?.id],
    enabled: !!user,
    queryFn: () => fetchReadiness(),
  });
  const { data: centres } = useQuery({
    queryKey: ["exam-centres"],
    enabled: !!user,
    queryFn: () => fetchCentres(),
  });

  const [centreId, setCentreId] = useState("");
  const [pin, setPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  async function unlock() {
    setUnlocking(true);
    try {
      await authorize({ data: { centerId: centreId, pin: pin.trim() } });
      setPin("");
      toast.success("Candidate unlocked. The official paper can now be started.");
      await refetchReadiness();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify the centre PIN");
    } finally {
      setUnlocking(false);
    }
  }

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [mode, setMode] = useState<"practice" | "official">("practice");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Letter>>({});
  const [current, setCurrent] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalMarks, setTotalMarks] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const answeredCount = Object.keys(answers).length;
  const question = questions[current];

  const finish = useCallback(
    async (auto = false) => {
      if (!attemptId || submitting.current) return;
      if (!auto && answeredCount < questions.length) {
        toast.error("Answer every question before submitting.");
        return;
      }
      submitting.current = true;
      setBusy(true);
      try {
        const data = await submit({ data: { attemptId, answers, autoSubmitted: auto } });
        setResult(data);
        setQuestions([]);
        setAttemptId(null);
        setDeadline(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not submit");
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    },
    [attemptId, answers, answeredCount, questions.length, submit],
  );

  useEffect(() => {
    if (!deadline) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const left = (deadline - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 0) {
        toast.error("Time is up — your paper has been submitted automatically.");
        void finish(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, finish]);

  async function begin(next: "practice" | "official") {
    setBusy(true);
    try {
      const data = await start({ data: { mode: next, count: 30 } });
      setMode(next);
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setTotalMarks(data.totalMarks);
      setAnswers({});
      setCurrent(0);
      setResult(null);
      setDeadline(
        data.durationMinutes
          ? new Date(data.startedAt).getTime() + data.durationMinutes * 60_000
          : null,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the exam");
    } finally {
      setBusy(false);
    }
  }

  const urgent = useMemo(() => remaining !== null && remaining <= 300, [remaining]);

  return (
    <AppShell>
      {questions.length === 0 && (
        <PageHeading
          eyebrow="Assessment"
          title="Written examination"
          description={`Practice quizzes are unlimited. The official paper is ${OFFICIAL_QUESTION_COUNT} questions in ${OFFICIAL_DURATION_MINUTES} minutes, invigilated by the system, with ${PASS_PERCENT}% required to pass.`}
        />
      )}

      {!attemptId && !result && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-md border border-border bg-card/60 p-6">
            <h2 className="text-xl">Practice quiz</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thirty random questions from the live guild question bank, untimed, with a full answer
              review afterwards. Does not affect your result.
            </p>
            <Button className="mt-5" disabled={busy} onClick={() => void begin("practice")}>
              Start practice
            </Button>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-6">
            <h2 className="text-xl">Official examination</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>{OFFICIAL_QUESTION_COUNT} questions · 1 mark each</li>
              <li>{OFFICIAL_DURATION_MINUTES} minutes, timed and auto-submitted</li>
              <li>{PASS_PERCENT}% to pass · certification fee must be paid</li>
              <li>Unlocked on the day by the invigilator at your testing centre</li>
            </ul>

            <ul className="mt-4 space-y-1.5 text-sm">
              <ReadyRow ok={!!readiness?.paid} label="Certification fee paid" to="/dashboard" />
              <ReadyRow
                ok={!!readiness?.conductSigned}
                label="Code of conduct oath signed"
                to="/conduct"
              />
              <ReadyRow
                ok={!!readiness?.experienceApproved}
                label="Experience certificate verified"
                to="/experience"
              />
              <ReadyRow ok={!!readiness?.authorized} label="Invigilator unlock (centre PIN)" />
            </ul>

            {!readiness?.authorized && (
              <div className="mt-5 space-y-3 rounded-md border border-border bg-card/70 p-4">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <KeyRound className="h-4 w-4 text-primary" /> Invigilator unlock
                </p>
                <p className="text-xs text-muted-foreground">
                  Hand the device to the centre administrator. This panel is for staff only.
                </p>
                <select
                  aria-label="Testing centre"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={centreId}
                  onChange={(e) => setCentreId(e.target.value)}
                >
                  <option value="">Select the testing centre…</option>
                  {(centres ?? []).map((c) => {
                    const showCity = c.city && !c.name.toLowerCase().includes(c.city.toLowerCase());
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {showCity ? ` — ${c.city}` : ""}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="password"
                  aria-label="Centre PIN"
                  placeholder="Centre PIN"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unlocking || !centreId || pin.trim().length < 4}
                  onClick={() => void unlock()}
                >
                  {unlocking ? "Verifying…" : "Unlock this candidate"}
                </Button>
              </div>
            )}

            <Button
              className="mt-5"
              disabled={busy || !readiness?.authorized}
              onClick={() => void begin("official")}
            >
              Sit the official exam
            </Button>
          </div>
        </div>
      )}

      {question && (
        <div className="space-y-6">
          <div className="sticky top-[7.5rem] z-30 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card/95 px-5 py-4 backdrop-blur">
            <div>
              <p className="eyebrow">
                {mode === "official" ? "Official paper — invigilated" : "Practice quiz"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {answeredCount} of {questions.length} answered · {totalMarks} marks total
              </p>
            </div>
            {remaining !== null ? (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-4 py-2 font-display text-2xl tabular-nums",
                  urgent
                    ? "animate-pulse border-destructive/60 bg-destructive/10 text-destructive"
                    : "border-primary/40 bg-primary/5 text-primary",
                )}
              >
                <Clock className="h-5 w-5" />
                {formatClock(remaining)}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Untimed
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="rounded-md border border-border bg-card/60 p-6">
              <p className="eyebrow">
                Question {current + 1} of {questions.length} · {question.topic_tag} · 1 mark
              </p>
              <h2 className="mt-3 font-display text-2xl leading-snug">{question.question_text}</h2>
              <div className="mt-5 grid gap-2">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const text = question[
                    `option_${letter.toLowerCase()}` as keyof QuizQuestion
                  ] as string;
                  const selected = answers[question.id] === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [question.id]: letter }))}
                      className={cn(
                        "flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="font-display text-primary">{letter}</span>
                      {text}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  Previous
                </Button>
                {current < questions.length - 1 ? (
                  <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
                    Next question
                  </Button>
                ) : (
                  <Button disabled={busy} onClick={() => void finish(false)}>
                    {busy ? "Submitting…" : "Submit paper"}
                  </Button>
                )}
              </div>
            </div>

            <aside className="rounded-md border border-border bg-card/60 p-5 lg:w-64">
              <p className="eyebrow">Question navigator</p>
              <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-5">
                {questions.map((q, i) => {
                  const done = !!answers[q.id];
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrent(i)}
                      aria-label={`Go to question ${i + 1}`}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-md border text-xs transition-colors",
                        i === current
                          ? "border-primary bg-primary text-primary-foreground"
                          : done
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Answered questions are highlighted. You may revisit any question before submitting.
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                disabled={busy}
                onClick={() => void finish(false)}
              >
                Submit paper
              </Button>
            </aside>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-md border border-border bg-card/60 p-8">
          <p className="eyebrow">
            {result.mode === "official" ? "Official result" : "Practice result"}
            {result.autoSubmitted ? " · auto-submitted on time expiry" : ""}
          </p>
          <h2 className="mt-2 font-display text-5xl text-gradient-gold">{result.score}%</h2>
          <p className="mt-2 text-muted-foreground">
            {result.marks} of {result.totalMarks} marks ({result.correct}/{result.total} correct) —{" "}
            {result.passed ? "you passed." : `${PASS_PERCENT}% is required to pass.`}
          </p>
          <div className="mt-6 space-y-2">
            {result.review.map((r) => (
              <div key={r.id} className="rounded-md border border-border px-4 py-3 text-sm">
                <span className={r.isCorrect ? "text-success" : "text-destructive"}>
                  {r.isCorrect
                    ? "Correct"
                    : `Incorrect — answer ${r.correct_option}: ${r.correct_text}`}
                </span>
                <p className="mt-1 text-muted-foreground">{r.question_text}</p>
              </div>
            ))}
          </div>
          <Button className="mt-6" variant="outline" onClick={() => setResult(null)}>
            Back to exams
          </Button>
        </div>
      )}
    </AppShell>
  );
}