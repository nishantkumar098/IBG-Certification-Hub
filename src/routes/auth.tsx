import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Check, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { IbgSeal } from "@/components/ibg-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TITLE = "Sign in or register — IBG Academy";
const DESCRIPTION =
  "Create your India Bartenders' Guild candidate account to begin the CPB® certification, or sign in to your dashboard.";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120).optional(),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number")
    .optional(),
  profession: z.string().trim().min(2, "Tell us what best describes you").max(120).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});


const RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  { label: "One symbol (!@#$…)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

const COMMON = [
  "password",
  "12345678",
  "qwerty",
  "bartender",
  "letmein",
  "welcome",
  "iloveyou",
  "admin123",
];

function passwordProblems(pw: string) {
  const failed: string[] = RULES.filter((r) => !r.test(pw)).map((r) => r.label);

  if (COMMON.some((c) => pw.toLowerCase().includes(c))) {
    failed.push("Avoid common words like “password” or “qwerty”");
  }
  return failed;
}

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  label = "Password",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={72}
          autoComplete={autoComplete}
          className="pr-11"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent — check your inbox.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse(
      isSignup
        ? { fullName, email, phone, password, profession: profession || undefined }
        : { email, password },
    );
    if (isSignup && !profession) {
      toast.error("Tell us what best describes you");
      return;
    }

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    if (isSignup) {
      const problems = passwordProblems(password);
      if (problems.length > 0) {
        toast.error(`Choose a stronger password — ${problems[0]!.toLowerCase()}.`);
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone, profession },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Confirmation email sent — click the link to activate your account.");
          return;
        }
        await supabase.from("profiles").update({ profession }).eq("id", data.user!.id);
        toast.success("Welcome to IBG Academy.");

        void navigate({ to: "/profile" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(
        /weak|easy to guess|pwned/i.test(message)
          ? "That password appears in known breach lists. Try a longer passphrase with numbers and a symbol."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex flex-col items-center gap-3 text-center">
          <IbgSeal className="h-16 w-16" />
          <span className="eyebrow">India Bartenders' Guild</span>
        </Link>

        <div className="rounded-lg border border-border bg-card p-8 shadow-elevated">
          <h1 className="text-3xl">
            {isForgot
              ? "Reset your password"
              : isSignup
                ? "Create your account"
                : "Candidate sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isForgot
              ? "We'll email you a secure link to choose a new password."
              : isSignup
                ? "Begin your CPB® certification journey."
                : "Access your dashboard, study material and exams."}
          </p>

          {sent ? (
            <div className="mt-7 rounded-md border border-primary/40 bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground">Check your email</p>
              <p className="mt-2">
                We've sent a message to <span className="text-primary">{email}</span>. Open it and
                follow the link to {isForgot ? "set a new password" : "confirm your account"}. The
                link expires in 60 minutes.
              </p>
              <Button variant="outline" className="mt-5 w-full" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : isForgot ? (
            <form onSubmit={handleForgot} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  autoComplete="email"
                  required
                />
              </div>
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="profession">What best describes you?</Label>
                  <Input
                    id="profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Bartender, Chef, Student…"
                    maxLength={120}
                  />
                </div>
              )}
              {isSignup && (

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={15}
                    autoComplete="tel"
                    required
                  />
                </div>
              )}
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              {isSignup && password.length > 0 && (
                <ul className="grid gap-1.5 rounded-md border border-border bg-background/60 p-4">
                  {RULES.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li
                        key={r.label}
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          ok ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              )}
              {!isSignup && (
                <div className="text-right">
                  <Link
                    to="/auth"
                    search={{ mode: "forgot" }}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup || isForgot ? "Already registered?" : "New to IBG Academy?"}{" "}
            <Link
              to="/auth"
              search={{ mode: isSignup || isForgot ? "signin" : "signup" }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isSignup || isForgot ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}