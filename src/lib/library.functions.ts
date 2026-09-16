import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z.object({ slug: z.string().min(1).max(120) });

/** Returns a short-lived signed URL for a stored library PDF. Auth required. */
export const getLibraryDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc, error } = await supabaseAdmin
      .from("library_documents")
      .select("slug, title, storage_bucket, storage_path, page_count, kind, is_active")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!doc || !doc.is_active) throw new Error("That document is not available.");
    if (doc.kind !== "pdf" || !doc.storage_bucket || !doc.storage_path) {
      throw new Error("That document is not a readable PDF.");
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 60 * 60);
    if (signError) throw signError;

    return {
      slug: doc.slug as string,
      title: doc.title as string,
      pageCount: (doc.page_count as number | null) ?? null,
      url: signed.signedUrl,
    };
  });
