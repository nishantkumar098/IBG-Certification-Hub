import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import seal from "@/assets/ibg-seal.png";
import ibaLogo from "@/assets/iba-logo.png";
import { useSession, useProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/certificate")({
  head: () => ({
    meta: [
      { title: "Your CPB® certificate — IBG Academy" },
      { name: "description", content: "View and share your India Bartenders' Guild CPB® certificate." },
      { property: "og:title", content: "Your CPB® certificate — IBG Academy" },
      { property: "og:description", content: "View and share your CPB® certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificatePage,
});

/** Small red-diamond IBA emblem, recreated in SVG (no source asset available). */
function IbaEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect
        x="18"
        y="18"
        width="84"
        height="84"
        transform="rotate(45 60 60)"
        fill="none"
        stroke="#c1272d"
        strokeWidth="3"
      />
      <circle cx="60" cy="52" r="20" fill="none" stroke="#c1272d" strokeWidth="1.5" />
      <path
        d="M40 52h40M60 32v40M46 40c8 8 8 16 0 24M74 40c-8 8-8 16 0 24"
        stroke="#c1272d"
        strokeWidth="1"
        fill="none"
      />
      <text
        x="60"
        y="90"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#c1272d"
        fontFamily="Georgia, serif"
        letterSpacing="2"
      >
        IBA
      </text>
    </svg>
  );
}

function CornerMarks() {
  const base = "absolute h-6 w-6 border-black";
  return (
    <>
      <span className={`${base} left-2 top-2 border-t-2 border-l-2`} />
      <span className={`${base} right-2 top-2 border-t-2 border-r-2`} />
      <span className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <span className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

/** Fixed design width for the printable certificate, in px — this is what
 * keeps it a landscape "document" shape (wide, not tall) at every screen
 * size. On a narrow phone we don't let the content reflow into a tall
 * stacked column; instead the whole fixed-width design is scaled down to
 * fit, exactly like shrinking a photo of a physical certificate.
 *
 * Printing is handled the same way, just against a landscape page's
 * printable area instead of the screen's width — see PRINT_MAX_HEIGHT
 * below — so the certificate always comes out on a single page instead
 * of being split across two. */
const CERT_DESIGN_WIDTH = 896; // matches the old max-w-4xl

/** Safe usable size (in CSS px) for a landscape Letter/A4 page after
 * default margins — comfortably under both page sizes. Used to scale the
 * certificate UP to fill the page (not just down to avoid overflow). */
const PRINT_MAX_WIDTH = 980;
const PRINT_MAX_HEIGHT = 700;

function useFitScale(designWidth: number, active: boolean) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    const update = () => {
      const nextScale = Math.min(1, wrapper.clientWidth / designWidth);
      setScale(nextScale);
      setInnerHeight(inner.scrollHeight);
    };

    const wrapperObserver = new ResizeObserver(update);
    const innerObserver = new ResizeObserver(update);
    wrapperObserver.observe(wrapper);
    innerObserver.observe(inner);
    update();

    return () => {
      wrapperObserver.disconnect();
      innerObserver.disconnect();
    };
  }, [designWidth, active]);

  // Print at whatever scale fits the whole certificate onto one landscape
  // page — never the on-screen scale (which is sized for the phone/monitor
  // width, not the printable area) and never a flat 1 (which is what was
  // causing the certificate to spill onto a second sheet).
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const printScale =
    innerHeight > 0
      ? Math.min(PRINT_MAX_WIDTH / designWidth, PRINT_MAX_HEIGHT / innerHeight)
      : 1;

  return {
    wrapperRef,
    innerRef,
    scale: printing ? printScale : scale,
    innerHeight,
    printing,
  };
}

function CertificatePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: cert, isLoading } = useQuery({
    queryKey: ["certificate", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*, certification_types(name)")
        .eq("candidate_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { wrapperRef, innerRef, scale, innerHeight, printing } = useFitScale(CERT_DESIGN_WIDTH, !!cert);

  const { data: practical } = useQuery({
    queryKey: ["certificate-practical", user?.id],
    enabled: !!user && !!cert,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practical_scores")
        .select("total_score, exam_slots(exam_date, testing_centers(name))")
        .eq("candidate_id", user!.id)
        .eq("passed", true)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const testDate = practical?.exam_slots?.exam_date ?? cert?.issued_date ?? "—";
  const testCenter = practical?.exam_slots?.testing_centers?.name ?? "—";
  const marks = practical?.total_score != null ? `${practical.total_score}%` : "—";

  // "Valid until" — use the stored expiry if the office has set one,
  // otherwise default to exactly one year after the issue date.
  const validUntil = (() => {
    if (cert?.expires_on) return cert.expires_on;
    if (!cert?.issued_date) return "—";
    const [y, m, d] = cert.issued_date.split("-").map(Number);
    if (!y || !m || !d) return "—";
    const next = new Date(Date.UTC(y + 1, m - 1, d));
    return next.toISOString().slice(0, 10);
  })();

  return (
    <AppShell>
      <PageHeading
        eyebrow="Credential"
        title="Your certificate"
        description="Issued once you have passed both the written examination and the practical assessment."
      />

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && !cert && (
        <div className="rounded-md border border-border bg-card/60 p-8">
          <Award className="h-7 w-7 text-primary" />
          <h2 className="mt-4 text-2xl">Not certified yet</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Complete the written examination and the live practical assessment to be awarded the
            CPB®. Your certificate will appear here the moment it is issued.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      )}

      {cert && (
        <div className="space-y-5">
          {/* Force a landscape page with sane margins when this gets printed,
              and hide every other element on the page (nav, heading, metadata
              card) so only the certificate itself is printed/exported — this
              is what previously caused a second page with the score table
              and signatures being duplicated in the printout. */}
          <style>{`
            @media print {
              @page { size: landscape; margin: 10mm; }

              body * {
                visibility: hidden;
              }

              #cert-print-area,
              #cert-print-area * {
                visibility: visible;
              }

              /* Override the inline width/height React sets for on-screen
                 sizing, then turn this into a full-page flex container so
                 the (now up-scaled) certificate is centered on the sheet
                 instead of pinned to the top-left corner. */
              #cert-print-area {
                position: fixed !important;
                inset: 0 !important;
                width: auto !important;
                height: auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
            }
          `}</style>

          {/* The certificate itself — white/print-style card, independent of the site's dark theme.
              Fixed-width + scaled-to-fit so it stays a landscape document shape on any screen,
              and scaled to fit a single printed page when printing. */}
          <div
            ref={wrapperRef}
            id="cert-print-area"
            className="mx-auto w-full max-w-[360px] overflow-hidden sm:max-w-4xl sm:overflow-visible print:!max-w-none print:!overflow-visible"
            style={{ height: innerHeight * scale || undefined }}
          >
            <div
              ref={innerRef}
              className="relative border-[3px] border-black bg-white p-3 text-black"
              style={{
                width: CERT_DESIGN_WIDTH,
                transform: `scale(${scale})`,
                transformOrigin: printing ? "center" : "top left",
              }}
            >
              <div className="relative border border-black p-8 sm:p-10">
                <CornerMarks />

                <div className="text-center">
                  <p className="font-display text-lg font-semibold tracking-wide">
                    India Bartender's Guild
                  </p>

                  <div className="mt-2 flex items-center justify-center gap-4 sm:gap-8">
                    <img
                      src={seal}
                      alt="India Bartenders' Guild official seal"
                      className="h-20 w-20 shrink-0 object-contain [filter:invert(1)]"
                    />
                    <div>
                      <h1 className="font-display text-5xl font-bold leading-none sm:text-6xl">
                        Certificate
                      </h1>
                    </div>
                    <img
                      src={ibaLogo}
                      alt="IBA logo"
                      className="h-20 w-20 shrink-0 object-contain"
                    />
                  </div>

                  <p className="mt-4 font-display text-2xl uppercase tracking-[0.06em] sm:text-3xl">
                    {(cert.certification_types?.name ?? "Chartered Professional Bartender").replace(
                      /\s*\([^)]*\)\s*/g,
                      "",
                    )}
                    <br />
                    (CPB)
                  </p>

                  <p className="mt-8 text-sm">This certificate awarded to</p>
                  <p
                    className="mx-auto mt-2 inline-block border-b border-black px-10 pb-1 text-4xl"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  >
                    {profile?.full_name ?? "—"}
                  </p>

                  <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed">
                    Has successfully completed
                    <br />
                    The certification examination administered by India Bartender's Guild.
                  </p>
                </div>

                <table className="mt-8 w-full border-collapse border border-black text-center text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-2 font-semibold">Test Date</th>
                      <th className="border border-black px-2 py-2 font-semibold">Test Center</th>
                      <th className="border border-black px-2 py-2 font-semibold">Language</th>
                      <th className="border border-black px-2 py-2 font-semibold">Marks</th>
                      <th className="border border-black px-2 py-2 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-3">{testDate}</td>
                      <td className="border border-black px-2 py-3">{testCenter}</td>
                      <td className="border border-black px-2 py-3">English</td>
                      <td className="border border-black px-2 py-3">{marks}</td>
                      <td className="border border-black px-2 py-3">Pass</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-10 grid grid-cols-3 items-end gap-4 text-center text-xs">
                  <div>
                    <p
                      className="text-xl"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      Archit Singhal
                    </p>
                    <p className="border-t border-black pt-1 font-semibold">Archit Singhal</p>
                    <p>President</p>
                    <p>Bartenders Guild Foundation</p>
                  </div>
                  <div className="self-center">
                    <p className="border-y border-dotted border-black py-2 font-display text-lg font-bold tracking-wide">
                      IBG ACADEMY
                    </p>
                  </div>
                  {/* <div>
                    <p
                      className="text-xl"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      Chetan Choramule
                    </p>
                    <p className="border-t border-black pt-1 font-semibold">Chetan Choramule</p>
                    <p>IBG Trainer / Administrator</p>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata + actions — outside the printable certificate, and
              hidden during print (see the @media print rules above). */}
          <div className="mx-auto max-w-4xl rounded-md border border-border bg-card/60 px-6 py-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Certificate number
                </dt>
                <dd className="mt-1">{cert.certificate_number}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Issued
                </dt>
                <dd className="mt-1">{cert.issued_date}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Valid until
                </dt>
                <dd className="mt-1">{validUntil}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="sm" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Download / print certificate
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/verify">Open public verification page</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}