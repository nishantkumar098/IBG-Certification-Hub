import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Loaded from a public CDN (matching the installed pdfjs-dist version) so
// the worker script always gets a correct MIME type and never depends on
// how our own host/CDN serves static assets.
pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs";

/** How long to wait after the page stops changing before writing it to the
 * database — avoids a network write on every single page turn. */
const SAVE_DEBOUNCE_MS = 1200;

/** In-app PDF reader — no downloads, no external viewer.
 *
 * Reading position ("resume where you left off") is remembered two ways:
 * - Instantly in localStorage, keyed by title, so it works even for a
 *   signed-out visitor or before the network round-trip finishes.
 * - Against the signed-in user's account in Supabase (`reading_progress`,
 *   keyed by `userId` + `bookSlug`), so it follows them across devices.
 *   Pass both `userId` and `bookSlug` to enable this; omit either and the
 *   reader falls back to the local-only behaviour it always had.
 *
 * IMPORTANT: this component is NOT remounted when the user switches from
 * one book to another (same JSX position, just new props) — so every
 * "which page am I on" value must be explicitly reset when `title` /
 * `bookSlug` changes, never left to carry over from the previous book.
 *
 * We also fetch the whole PDF ourselves up front (instead of letting
 * pdf.js stream it page-by-page via HTTP range requests). Range requests
 * are what caused "Failed to fetch" mid-document on mobile networks —
 * one flaky chunk killed the whole reader. Fetching once into memory is
 * slightly slower on first open for a big file, but far more reliable on
 * a weak connection, and a failed fetch can simply be retried. */
export default function PdfReader({
  url,
  title,
  userId,
  bookSlug,
}: {
  url: string;
  title: string;
  userId?: string | undefined;
  bookSlug?: string | undefined;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(760);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // True once we've established the *real* starting page for the book
  // currently open — the save effect below refuses to write anything
  // until this is true, so a book switch never persists a stale page
  // number (left over from whichever book was open before it) under the
  // new book's key.
  const [ready, setReady] = useState(false);

  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [fetching, setFetching] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setWidth(Math.min(el.clientWidth - 24, 1000));
    });
    observer.observe(el);
    setWidth(Math.min(el.clientWidth - 24, 1000));
    return () => observer.disconnect();
  }, []);

  // Fetch the whole file once, ourselves — see the note above.
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setFileData(null);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load the file (${res.status})`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        setFileData(new Uint8Array(buf));
        setFetching(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? `${err.message}. Check your connection and try again.`
            : "Could not load the file. Check your connection and try again.",
        );
        setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, retryCount]);

  // Reset + (re)establish the starting page every time the book changes.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setPages(0);

    // Instant, local-only starting point.
    const key = `ibg-reader-page:${title}`;
    const localSaved = Number(window.localStorage.getItem(key) ?? "1");
    setPage(Number.isFinite(localSaved) && localSaved > 1 ? localSaved : 1);

    // Then prefer the account's saved page, if we have one to check.
    if (userId && bookSlug) {
      (supabase.from("reading_progress" as never) as any)
        .select("page")
        .eq("user_id", userId)
        .eq("book_slug", bookSlug)
        .maybeSingle()
        .then(({ data }: { data: { page?: number } | null }) => {
          if (cancelled) return;
          if (data?.page && data.page > 1) setPage(data.page);
          setReady(true);
        });
    } else {
      setReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, [title, userId, bookSlug]);

  // Persist the current page — only once `ready`, so we never overwrite a
  // book's saved progress with a transient/stale value while switching.
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(`ibg-reader-page:${title}`, String(page));

    if (!userId || !bookSlug) return;
    const handle = setTimeout(() => {
      void (supabase.from("reading_progress" as never) as any).upsert(
        { user_id: userId, book_slug: bookSlug, page },
        { onConflict: "user_id,book_slug" },
      );
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [page, ready, title, userId, bookSlug]);

  const file = useMemo(() => (fileData ? { data: fileData } : null), [fileData]);

  return (
    <div ref={container} className="rounded-md border border-border bg-card/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            className="h-9 w-16 text-center"
            value={page}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) setPage(Math.min(Math.max(1, next), pages || 1));
            }}
            aria-label="Page number"
          />
          <span className="text-sm text-muted-foreground">of {pages || "…"}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages || p, p + 1))}
            disabled={!!pages && page >= pages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRetryCount((n) => n + 1)}
          >
            <RotateCw className="mr-2 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : fetching || !file ? (
        <p className="p-10 text-center text-sm text-muted-foreground">Opening {title}…</p>
      ) : (
        <div className="flex justify-center overflow-auto rounded bg-ink/60 p-3">
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setPages(numPages)}
            onLoadError={(e) => setError(e.message)}
            loading={<p className="p-10 text-sm text-muted-foreground">Opening {title}…</p>}
          >
            <Page pageNumber={page} width={Math.round(width * zoom)} />
          </Document>
        </div>
      )}
    </div>
  );
}