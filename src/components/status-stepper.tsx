import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const CANDIDATE_STAGES = [
  { key: "registered", label: "Registered", hint: "Account created" },
  { key: "paid", label: "Paid", hint: "Certification fee settled" },
  { key: "studying", label: "Studying", hint: "Manual & practice quizzes" },
  { key: "mcq_booked", label: "MCQ Booked", hint: "Written exam scheduled" },
  { key: "mcq_result", label: "MCQ Result", hint: "Written exam cleared" },
  { key: "practical_booked", label: "Practical Booked", hint: "Live assessment scheduled" },
  { key: "certified", label: "Certified", hint: "CPB® awarded" },
] as const;

export type CandidateStage = (typeof CANDIDATE_STAGES)[number]["key"];

export function StatusStepper({ current }: { current: CandidateStage }) {
  const currentIndex = CANDIDATE_STAGES.findIndex((s) => s.key === current);

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {CANDIDATE_STAGES.map((stage, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={stage.key} className="relative">
            <div
              className={cn(
                "flex h-full flex-col gap-2 rounded-md border p-4 transition-colors",
                done && "border-primary/40 bg-primary/5",
                active && "border-primary bg-primary/10 shadow-gold",
                !done && !active && "border-border bg-card/40",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "font-display text-base leading-tight",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{stage.hint}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
