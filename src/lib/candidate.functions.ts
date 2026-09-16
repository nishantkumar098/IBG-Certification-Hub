import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CONDUCT_VERSION = "2026.1";

const conductSchema = z.object({
  fullNameSigned: z.string().trim().min(3).max(120),
});

/** Records the candidate's signed code-of-conduct oath. Additive gate step. */
export const acceptConduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => conductSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("conduct_acceptances").insert({
      user_id: context.userId,
      version: CONDUCT_VERSION,
      full_name_signed: data.fullNameSigned,
    });
    if (error) throw error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ conduct_accepted_at: new Date().toISOString() })
      .eq("id", context.userId);

    return { ok: true, version: CONDUCT_VERSION };
  });

const experienceSchema = z.object({
  employerName: z.string().trim().min(2).max(160),
  employerAddress: z.string().trim().max(300).optional(),
  designation: z.string().trim().min(2).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isCurrent: z.boolean(),
  supervisorName: z.string().trim().max(120).optional(),
  supervisorContact: z.string().trim().max(60).optional(),
  documentPath: z.string().trim().min(3).max(300),
});

/** Submits an experience certificate for admin review. */
export const submitExperienceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => experienceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const months =
      (new Date(
        data.isCurrent ? new Date().toISOString().slice(0, 10) : (data.endDate ?? ""),
      ).getTime() -
        new Date(data.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);
    if (!Number.isFinite(months) || months < 11.5) {
      throw new Error(
        "CPB® entry requires at least one year of verified bar experience in this role.",
      );
    }

    const { data: row, error } = await context.supabase
      .from("experience_documents")
      .insert({
        candidate_id: context.userId,
        employer_name: data.employerName,
        employer_address: data.employerAddress ?? null,
        designation: data.designation,
        start_date: data.startDate,
        end_date: data.isCurrent ? null : (data.endDate ?? null),
        is_current: data.isCurrent,
        supervisor_name: data.supervisorName ?? null,
        supervisor_contact: data.supervisorContact ?? null,
        document_url: data.documentPath,
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error) throw error;
    return { id: row.id as string, status: row.status as string };
  });

const reviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Global admin/superadmin always qualify; an office_admin qualifies only for
 * a candidate who belongs to their own assigned city.
 */
async function canManageCandidate(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  candidateId: string,
): Promise<boolean> {
  const [{ data: isAdmin }, { data: isSuperadmin }, { data: isOfficeAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "superadmin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "office_admin" }),
  ]);
  if (isAdmin || isSuperadmin) return true;
  if (!isOfficeAdmin) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", candidateId)
    .maybeSingle();
  if (!profile?.city_id) return false;

  const { data: managesCity } = await supabase.rpc("is_office_admin_of", {
    _user_id: userId,
    _city_id: profile.city_id,
  });
  return !!managesCity;
}

/** Admin review of an experience certificate. */
export const reviewExperienceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error: docError } = await supabaseAdmin
      .from("experience_documents")
      .select("candidate_id")
      .eq("id", data.id)
      .single();
    if (docError) throw docError;
    if (!(await canManageCandidate(context.supabase, context.userId, doc.candidate_id)))
      throw new Error("Forbidden");

    const { error } = await supabaseAdmin
      .from("experience_documents")
      .update({
        status: data.decision,
        review_notes: data.notes ?? null,
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Staff queue of experience certificates awaiting verification. */
export const listExperienceReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isSuperadmin }, { data: isOfficeAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "superadmin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "office_admin" }),
    ]);
    const isGlobalAdmin = !!isAdmin || !!isSuperadmin;
    if (!isGlobalAdmin && !isOfficeAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // An office_admin only reviews candidates from their own assigned city/cities.
    let restrictToCandidateIds: string[] | null = null;
    if (!isGlobalAdmin) {
      const { data: assignments } = await context.supabase
        .from("office_admin_assignments")
        .select("city_id")
        .eq("user_id", context.userId);
      const cityIds = (assignments ?? []).map((a) => a.city_id);
      const { data: profilesInCities } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .in("city_id", cityIds.length > 0 ? cityIds : ["00000000-0000-0000-0000-000000000000"]);
      restrictToCandidateIds = (profilesInCities ?? []).map((p) => p.id);
    }

    // NOTE: experience_documents.candidate_id references auth.users, not
    // public.profiles, so there is no direct FK PostgREST can embed
    // ("profiles!experience_documents_candidate_id_fkey" doesn't exist —
    // that was silently failing this whole query and making the queue
    // look empty). Fetch profiles separately and merge instead.
    let query = supabaseAdmin
      .from("experience_documents")
      .select(
        "id, employer_name, designation, start_date, end_date, is_current, status, created_at, candidate_id",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    if (restrictToCandidateIds) query = query.in("candidate_id", restrictToCandidateIds);
    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const candidateIds = Array.from(new Set(rows.map((r) => r.candidate_id)));
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, cpb_id")
      .in("id", candidateIds.length > 0 ? candidateIds : ["00000000-0000-0000-0000-000000000000"]);
    if (profilesError) throw profilesError;

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((d) => ({
      id: d.id as string,
      candidateId: d.candidate_id as string,
      employer: d.employer_name as string,
      designation: d.designation as string,
      since: d.start_date as string,
      candidate: profileById.get(d.candidate_id)?.full_name ?? "Candidate",
      cpbId: profileById.get(d.candidate_id)?.cpb_id ?? null,
    }));
  });

/** Signed URL for an experience certificate — owner or admin only. */
export const getExperienceDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error } = await supabaseAdmin
      .from("experience_documents")
      .select("candidate_id, document_url")
      .eq("id", data.id)
      .single();
    if (error) throw error;

    if (doc.candidate_id !== context.userId) {
      if (!(await canManageCandidate(context.supabase, context.userId, doc.candidate_id)))
        throw new Error("Forbidden");
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("candidate-photos")
      .createSignedUrl(doc.document_url as string, 60 * 30);
    if (signError) throw signError;
    return { url: signed.signedUrl };
  });
