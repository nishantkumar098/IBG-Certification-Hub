import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, FileUp, Pencil, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useRoles, useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Books listed under "Compulsory Readings" (Study centre) and "Optional
 * Reading" (Guild library). Superadmins add / edit / delete them in place. */

export type ReadingSection = "compulsory" | "optional";
export type ReadingBook = Database["public"]["Tables"]["reading_books"]["Row"];

const BUCKET = "reading-books";
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function useIsSuperadmin() {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  return (roles ?? []).includes("superadmin");
}

export function useReadingBooks(section: ReadingSection) {
  return useQuery({
    queryKey: ["reading-books", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_books")
        .select("*")
        .eq("section", section)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Key the PDF reader uses to remember the user's page. */
export function readingBookSlug(book: ReadingBook) {
  return book.slug ?? book.id;
}

/** Superadmin-only "Add book" button + dialog for one section. */
export function AddReadingBookButton({ section }: { section: ReadingSection }) {
  const isSuperadmin = useIsSuperadmin();
  const [open, setOpen] = useState(false);
  if (!isSuperadmin) return null;
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add book
      </Button>
      {open && <BookFormDialog section={section} book={null} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Renders one card per book (a fragment, so it can sit inside an existing
 * grid next to other cards). Superadmins get Edit / Delete on each card. */
export function ReadingBookCards({
  books,
  onRead,
}: {
  books: ReadingBook[];
  onRead: (book: ReadingBook) => void;
}) {
  const isSuperadmin = useIsSuperadmin();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ReadingBook | null>(null);

  async function remove(book: ReadingBook) {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("reading_books").delete().eq("id", book.id);
    if (error) return toast.error(error.message);
    if (book.file_path) await supabase.storage.from(BUCKET).remove([book.file_path]);
    toast.success("Book deleted.");
    void queryClient.invalidateQueries({ queryKey: ["reading-books"] });
  }

  return (
    <>
      {books.map((book) => (
        <article
          key={book.id}
          className="flex flex-col rounded-md border border-border bg-card/60 p-6"
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="mt-3 text-xl leading-tight">{book.title}</h3>
          {book.description && (
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {book.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {book.file_url && (
              <Button size="sm" onClick={() => onRead(book)}>
                Read
              </Button>
            )}
            {isSuperadmin && (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(book)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => void remove(book)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </article>
      ))}
      {editing && (
        <BookFormDialog
          section={editing.section as ReadingSection}
          book={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function BookFormDialog({
  section,
  book,
  onClose,
}: {
  section: ReadingSection;
  book: ReadingBook | null;
  onClose: () => void;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(book?.title ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function pickFile(f: File | null) {
    if (f && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (f && f.size > MAX_PDF_BYTES) {
      toast.error("PDF must be 50 MB or smaller.");
      return;
    }
    setFile(f);
  }

  async function save() {
    if (!title.trim()) return toast.error("Book name is required.");

    setSaving(true);
    try {
      let fileUrl = book?.file_url ?? null;
      let filePath = book?.file_path ?? null;

      if (file) {
        const path = `${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        fileUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        filePath = path;
      }

      const fields = {
        title: title.trim(),
        description: description.trim() || null,
        file_url: fileUrl,
        file_path: filePath,
      };

      if (book) {
        const { error } = await supabase
          .from("reading_books")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", book.id);
        if (error) throw error;
        if (file && book.file_path) await supabase.storage.from(BUCKET).remove([book.file_path]);
      } else {
        // New books go to the end of the section.
        const { data: last } = await supabase
          .from("reading_books")
          .select("sort_order")
          .eq("section", section)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const { error } = await supabase.from("reading_books").insert({
          ...fields,
          section,
          sort_order: (last?.sort_order ?? 0) + 10,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }

      toast.success(book ? "Book updated." : "Book added.");
      void queryClient.invalidateQueries({ queryKey: ["reading-books"] });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the book");
    } finally {
      setSaving(false);
    }
  }

  const sectionLabel = section === "compulsory" ? "Compulsory Readings" : "Optional Reading";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{book ? "Edit book" : `Add book to ${sectionLabel}`}</DialogTitle>
          <DialogDescription>
            Book name is required. Description and PDF are optional — with a PDF, readers get a Read
            button.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="book-title">Book name *</Label>
            <Input
              id="book-title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="book-description">Description</Label>
            <Textarea
              id="book-description"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="book-file">PDF (optional, max 50 MB)</Label>
            <label
              htmlFor="book-file"
              className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground hover:border-primary/60"
            >
              <FileUp className="h-5 w-5 shrink-0" />
              <span className="truncate">
                {file
                  ? file.name
                  : book?.file_url
                    ? "PDF attached — click to replace"
                    : "Click to upload a PDF"}
              </span>
            </label>
            <Input
              id="book-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <Button disabled={saving} onClick={() => void save()} className="w-full">
          {saving ? "Saving…" : book ? "Save changes" : "Add book"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
