import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert, Search, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TITLE = "Verify a CPB® certificate — IBG Academy";
const DESCRIPTION =
  "Employers can confirm the authenticity of any India Bartenders' Guild Certified Professional Bartender certificate using its certificate number.";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: VerifyPage,
});

type Result = {
  certificate_number: string;
  full_name: string | null;
  photo_url: string | null;
  certification_name: string | null;
  city: string | null;
  issued_date: string;
  expires_on: string | null;
  status: string;
};

function VerifyPage() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const number = value.trim();
    if (!number) return;
    setBusy(true);
    setNotFound(false);
    setResult(null);
    const { data, error } = await supabase.rpc("verify_certificate", {
      _certificate_number: number,
    });
    setBusy(false);
    if (error || !data || data.length === 0) {
      setNotFound(true);
      return;
    }
    setResult(data[0] as Result);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <p className="eyebrow">Public register</p>
        <h1 className="mt-3 text-4xl">Verify a certificate</h1>
        <p className="mt-4 text-muted-foreground">
          Enter the certificate number printed on the CPB® certificate (for example
          IBG-CPB-2026-000123), or scan its QR code.
        </p>

        <form onSubmit={lookup} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="IBG-CPB-2026-000123"
            maxLength={64}
            aria-label="Certificate number"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={busy}>
            <Search className="mr-2 h-4 w-4" />
            {busy ? "Checking…" : "Verify"}
          </Button>
        </form>

        {notFound && (
          <div className="mt-8 flex items-start gap-4 rounded-md border border-destructive/50 bg-destructive/10 p-6">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
            <div>
              <h2 className="text-xl">No matching certificate</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No certificate with that number exists on the IBG register. Check the number and
                try again.
              </p>
            </div>
          </div>
        )}

        {result && <ResultCard result={result} />}
      </main>
      <SiteFooter />
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const valid = result.status === "valid";
  const revoked = result.status === "revoked";
  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
      <div
        className={
          valid
            ? "flex items-center gap-3 bg-success/15 px-6 py-4"
            : revoked
              ? "flex items-center gap-3 bg-destructive/15 px-6 py-4"
              : "flex items-center gap-3 bg-warning/15 px-6 py-4"
        }
      >
        {valid ? (
          <BadgeCheck className="h-6 w-6 text-success" />
        ) : revoked ? (
          <ShieldAlert className="h-6 w-6 text-destructive" />
        ) : (
          <Clock className="h-6 w-6 text-warning" />
        )}
        <span className="font-display text-xl">
          {valid ? "Valid certificate" : revoked ? "Revoked certificate" : "Expired certificate"}
        </span>
      </div>
      <div className="flex flex-col gap-6 p-6 sm:flex-row">
        {result.photo_url && (
          <img
            src={result.photo_url}
            alt={result.full_name ?? "Certificate holder"}
            loading="lazy"
            width={128}
            height={128}
            className="h-32 w-32 rounded-md border border-border object-cover"
          />
        )}
        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="Name" value={result.full_name} />
          <Field label="Certification" value={result.certification_name} />
          <Field label="City" value={result.city} />
          <Field label="Certificate number" value={result.certificate_number} />
          <Field label="Issued" value={result.issued_date} />
          <Field label="Valid until" value={result.expires_on ?? "—"} />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
