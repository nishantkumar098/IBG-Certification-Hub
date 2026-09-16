import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bookSlotSchema = z.object({
  examSlotId: z.string().uuid(),
});

/**
 * Books a candidate onto a pre-generated exam slot.
 * Runs the capacity check + seat increment + booking insert with the
 * service-role client so it is atomic and not subject to the read-only
 * RLS policy on exam_slots for regular candidates.
 */
export const bookExamSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bookSlotSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: slot, error: slotError } = await supabaseAdmin
      .from("exam_slots")
      .select("id, type, exam_date, start_time, capacity, seats_booked, status")
      .eq("id", data.examSlotId)
      .single();
    if (slotError) throw slotError;
    if (!slot) throw new Error("This slot no longer exists.");
    if (slot.status !== "open") throw new Error("This slot is no longer open for booking.");
    if ((slot.seats_booked ?? 0) >= (slot.capacity ?? 0)) {
      throw new Error("This slot is fully booked. Please pick another.");
    }

    // One active booking per exam type at a time (mirrors the dashboard's
    // stage logic, which only looks at the latest booked slot per type).
    const { data: existing } = await context.supabase
      .from("bookings")
      .select("id, exam_slots(type)")
      .eq("candidate_id", context.userId)
      .eq("status", "booked");
    const alreadyBooked = (existing ?? []).some(
      (b) => (b.exam_slots as { type?: string } | null)?.type === slot.type,
    );
    if (alreadyBooked) {
      throw new Error(
        `You already have a booked ${slot.type === "mcq" ? "written" : "practical"} exam slot. Cancel it first to book a different one.`,
      );
    }

    const { error: insertError } = await supabaseAdmin.from("bookings").insert({
      candidate_id: context.userId,
      exam_slot_id: slot.id,
      status: "booked",
    });
    if (insertError) throw insertError;

    const newSeatsBooked = (slot.seats_booked ?? 0) + 1;
    const { error: updateError } = await supabaseAdmin
      .from("exam_slots")
      .update({
        seats_booked: newSeatsBooked,
        status: newSeatsBooked >= (slot.capacity ?? 0) ? "closed" : "open",
      })
      .eq("id", slot.id);
    if (updateError) throw updateError;

    return { ok: true };
  });

const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const cancelExamBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cancelBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, candidate_id, exam_slot_id, status")
      .eq("id", data.bookingId)
      .single();
    if (bookingError) throw bookingError;
    if (booking.candidate_id !== context.userId) throw new Error("Forbidden");
    if (booking.status !== "booked") throw new Error("This booking is not active.");

    const { error: cancelError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    if (cancelError) throw cancelError;

    const { data: slot } = await supabaseAdmin
      .from("exam_slots")
      .select("id, seats_booked, capacity")
      .eq("id", booking.exam_slot_id)
      .single();
    if (slot) {
      const newSeatsBooked = Math.max((slot.seats_booked ?? 1) - 1, 0);
      await supabaseAdmin
        .from("exam_slots")
        .update({ seats_booked: newSeatsBooked, status: "open" })
        .eq("id", slot.id);
    }

    return { ok: true };
  });

/** Open slots with at least one free seat, for the slot picker. */
export const listAvailableSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("exam_slots")
      .select(
        "id, type, exam_date, start_time, end_time, capacity, seats_booked, testing_centers(name, address, cities(name))",
      )
      .eq("status", "open")
      .gte("exam_date", new Date().toISOString().slice(0, 10))
      .order("exam_date");
    if (error) throw error;

    return (data ?? [])
      .filter((s) => (s.seats_booked ?? 0) < (s.capacity ?? 0))
      .map((s) => ({
        id: s.id as string,
        type: s.type as "mcq" | "practical",
        examDate: s.exam_date as string,
        startTime: s.start_time as string,
        endTime: s.end_time as string,
        seatsLeft: (s.capacity ?? 0) - (s.seats_booked ?? 0),
        centreName: (s.testing_centers as { name?: string } | null)?.name ?? "Testing centre",
        centreAddress: (s.testing_centers as { address?: string } | null)?.address ?? "",
        city:
          (s.testing_centers as { cities?: { name?: string } } | null)?.cities?.name ?? null,
      }));
  });