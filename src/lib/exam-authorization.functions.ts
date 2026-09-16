import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** How long an invigilator's unlock stays valid. */
export const AUTHORIZATION_VALID_MINUTES = 180;

const authSchema = z.object({
  centerId: z.string().uuid(),
  pin: z.string().trim().min(4).max(40),
});

/**
 * On-site invigilator unlock: the centre admin enters the centre PIN on the
 * candidate's screen. Valid for AUTHORIZATION_VALID_MINUTES.
 */
export const authorizeExamStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => authSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ok, error } = await supabaseAdmin.rpc("verify_centre_admin_pin", {
      _center_id: data.centerId,
      _pin: data.pin,
    });
    if (error) throw error;
    if (!ok) throw new Error("That centre PIN is not correct. Ask the invigilator to re-enter it.");

    const { data: booking } = await context.supabase
      .from("bookings")
      .select("id, exam_slot_id, exam_slots(testing_center_id, type)")
      .eq("candidate_id", context.userId)
      .eq("status", "booked")
      .limit(20);

    const match = (booking ?? []).find(
      (b) =>
        (b.exam_slots as { testing_center_id?: string } | null)?.testing_center_id ===
        data.centerId,
    );

    const { error: insertError } = await supabaseAdmin.from("exam_start_authorizations").insert({
      candidate_id: context.userId,
      testing_center_id: data.centerId,
      exam_slot_id: match?.exam_slot_id ?? null,
    });
    if (insertError) throw insertError;

    return { ok: true, validMinutes: AUTHORIZATION_VALID_MINUTES };
  });

/** Centres a candidate can be unlocked at — their booked centres, else all active centres. */
export const listExamCentres = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("testing_centers")
      .select("id, name, address, cities(name)")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      address: c.address as string,
      city: (c.cities as { name?: string } | null)?.name ?? null,
    }));
  });

/** Candidate-side readiness for the official paper. */
export const getOfficialExamReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [paid, conduct, experience, authorization, passed] = await Promise.all([
      context.supabase
        .from("payments")
        .select("id")
        .eq("candidate_id", uid)
        .eq("purpose", "certification")
        .eq("status", "paid")
        .limit(1),
      context.supabase.from("conduct_acceptances").select("id").eq("user_id", uid).limit(1),
      context.supabase
        .from("experience_documents")
        .select("id, status")
        .eq("candidate_id", uid)
        .eq("status", "approved")
        .limit(1),
      context.supabase
        .from("exam_start_authorizations")
        .select("id, authorized_at")
        .eq("candidate_id", uid)
        .gte(
          "authorized_at",
          new Date(Date.now() - AUTHORIZATION_VALID_MINUTES * 60_000).toISOString(),
        )
        .order("authorized_at", { ascending: false })
        .limit(1),
      context.supabase
        .from("mcq_attempts")
        .select("id")
        .eq("candidate_id", uid)
        .eq("mode", "official")
        .eq("passed", true)
        .limit(1),
    ]);

    return {
      paid: (paid.data ?? []).length > 0,
      conductSigned: (conduct.data ?? []).length > 0,
      experienceApproved: (experience.data ?? []).length > 0,
      authorized: (authorization.data ?? []).length > 0,
      alreadyPassed: (passed.data ?? []).length > 0,
    };
  });
