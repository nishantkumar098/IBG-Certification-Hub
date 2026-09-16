import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startSchema = z.object({
  mode: z.enum(["practice", "official"]),
  count: z.number().int().min(5).max(60).optional(),
});

export type QuizQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  topic_tag: string;
};

/** Official paper configuration — single source of truth. */
export const OFFICIAL_QUESTION_COUNT = 80;
export const OFFICIAL_DURATION_MINUTES = 90;
export const PASS_PERCENT = 75;
export const MARKS_PER_QUESTION = 1;


/** Serves questions WITHOUT the correct answer. */
export const startQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.mode === "official") {
      const { data: paid } = await context.supabase
        .from("payments")
        .select("id")
        .eq("candidate_id", context.userId)
        .eq("purpose", "certification")
        .eq("status", "paid")
        .limit(1);
      if (!paid || paid.length === 0) {
        throw new Error("Certification fee must be paid before the official exam.");
      }
      const { data: passed } = await context.supabase
        .from("mcq_attempts")
        .select("id")
        .eq("candidate_id", context.userId)
        .eq("mode", "official")
        .eq("passed", true)
        .limit(1);
      if (passed && passed.length > 0) {
        throw new Error("You have already passed the written examination.");
      }

      // Additive gates: signed oath, verified experience, invigilator unlock.
      const { data: conduct } = await context.supabase
        .from("conduct_acceptances")
        .select("id")
        .eq("user_id", context.userId)
        .limit(1);
      if (!conduct || conduct.length === 0) {
        throw new Error("Sign the code of conduct oath before sitting the official paper.");
      }

      const { data: experience } = await context.supabase
        .from("experience_documents")
        .select("id")
        .eq("candidate_id", context.userId)
        .eq("status", "approved")
        .limit(1);
      if (!experience || experience.length === 0) {
        throw new Error(
          "Your experience certificate must be verified by the guild office before the official paper.",
        );
      }

      const { data: authorized } = await context.supabase
        .from("exam_start_authorizations")
        .select("id")
        .eq("candidate_id", context.userId)
        .gte("authorized_at", new Date(Date.now() - 180 * 60_000).toISOString())
        .limit(1);
      if (!authorized || authorized.length === 0) {
        throw new Error(
          "The official paper is unlocked at the testing centre. Ask the invigilator to enter the centre PIN.",
        );
      }
    }

    const { data: rows, error } = await supabaseAdmin
      .from("question_bank")
      .select("id, question_text, option_a, option_b, option_c, option_d, topic_tag")
      .eq("is_active", true);
    if (error) throw error;

    const count =
      data.mode === "official" ? OFFICIAL_QUESTION_COUNT : Math.min(data.count ?? 30, 30);
    const shuffled = [...(rows ?? [])].sort(() => Math.random() - 0.5).slice(0, count);

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("mcq_attempts")
      .insert({
        candidate_id: context.userId,
        mode: data.mode,
        total_questions: shuffled.length,
        answers_json: {},
      })
      .select("id, started_at")
      .single();
    if (attemptError) throw attemptError;

    return {
      attemptId: attempt.id as string,
      startedAt: attempt.started_at as string,
      durationMinutes: data.mode === "official" ? OFFICIAL_DURATION_MINUTES : null,
      totalMarks: shuffled.length * MARKS_PER_QUESTION,
      passPercent: PASS_PERCENT,
      questions: shuffled as QuizQuestion[],
    };
  });

const submitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.enum(["A", "B", "C", "D"])),
  autoSubmitted: z.boolean().optional(),
});

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("mcq_attempts")
      .select("id, candidate_id, mode, submitted_at, total_questions, started_at")
      .eq("id", data.attemptId)
      .single();
    if (attemptError) throw attemptError;
    if (attempt.candidate_id !== context.userId) throw new Error("Forbidden");
    if (attempt.submitted_at) throw new Error("This attempt has already been submitted.");

    // Server-side time policing for the official paper.
    if (attempt.mode === "official") {
      const elapsedMin =
        (Date.now() - new Date(attempt.started_at as string).getTime()) / 60000;
      if (elapsedMin > OFFICIAL_DURATION_MINUTES + 2) {
        await supabaseAdmin
          .from("mcq_attempts")
          .update({
            answers_json: data.answers,
            score: 0,
            marks_obtained: 0,
            passed: false,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", attempt.id);
        throw new Error("Time expired — this attempt has been closed by the invigilation system.");
      }
    }

    const ids = Object.keys(data.answers);
    const { data: keys, error: keyError } = await supabaseAdmin
      .from("question_bank")
      .select("id, correct_option, question_text, option_a, option_b, option_c, option_d")
      .in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
    if (keyError) throw keyError;

    let correct = 0;
    const review = (keys ?? []).map((q) => {
      const given = data.answers[q.id];
      const correctLetter = String(q.correct_option).trim().toUpperCase() as "A" | "B" | "C" | "D";
      const isCorrect = given === correctLetter;
      if (isCorrect) correct += 1;
      const optionText = {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      } as Record<"A" | "B" | "C" | "D", string>;
      return {
        id: q.id,
        question_text: q.question_text,
        given: given ?? null,
        correct_option: correctLetter,
        correct_text: optionText[correctLetter],
        isCorrect,
      };
    });

    const total = attempt.total_questions ?? ids.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= PASS_PERCENT;

    const { error: updateError } = await supabaseAdmin
      .from("mcq_attempts")
      .update({
        answers_json: data.answers,
        score,
        marks_obtained: correct * MARKS_PER_QUESTION,
        passed,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    if (updateError) throw updateError;

    return {
      score,
      correct,
      total,
      marks: correct * MARKS_PER_QUESTION,
      totalMarks: total * MARKS_PER_QUESTION,
      passed,
      mode: attempt.mode as "practice" | "official",
      autoSubmitted: data.autoSubmitted ?? false,
      review,
    };
  });

/** Attempt history for the candidate — marks transcript. */
export const listAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mcq_attempts")
      .select("id, mode, score, marks_obtained, total_questions, passed, submitted_at, started_at")
      .eq("candidate_id", context.userId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  });