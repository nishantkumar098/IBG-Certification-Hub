import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession, useProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — IBG Academy" },
      { name: "description", content: "Manage your IBG candidate profile and certificate photo." },
      { property: "og:title", content: "Your profile — IBG Academy" },
      { property: "og:description", content: "Manage your IBG candidate profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const PROFESSIONS = [
  "Bartender",
  "Head Bartender / Bar Manager",
  "Bar Owner",
  "Chef",
  "Server / Steward",
  "Hospitality Student",
  "Trainer / Educator",
  "Brand Ambassador",
  "Other hospitality professional",
] as const;

const MIN_AGE = 16;
const MAX_AGE = 100;

/** Today's calendar date in the browser's own local timezone, as
 * Y/M/D integers — never converted through UTC, so it can't shift by a
 * day depending on the user's timezone offset or time of day. */
function localToday() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

/** Parses a "yyyy-mm-dd" string (already regex-validated by the schema)
 * into [year, month0, day] as plain numbers — avoids repeating the
 * possibly-undefined array-destructure everywhere under strict TS. */
function parseIsoDate(v: string): [number, number, number] {
  const parts = v.split("-").map(Number);
  return [parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1];
}

/** Whole years between a birth date and today, using real calendar
 * arithmetic (not a millisecond/365.2425 approximation, which drifts by
 * a few days around leap years and can mis-validate someone right at the
 * age boundary). `m` is 0-indexed (Jan = 0), matching Date's convention. */
function ageInYears(y: number, m: number, d: number) {
  const today = localToday();
  let age = today.y - y;
  const birthdayPassedThisYear = today.m > m || (today.m === m && today.d >= d);
  if (!birthdayPassedThisYear) age -= 1;
  return age;
}

/** yyyy-mm-dd for "N years ago, today" in the browser's local calendar —
 * used for the <input type="date"> min/max bounds. Building the UTC
 * timestamp from local y/m/d (rather than from Date.now() minus a
 * duration) means the date string always matches the user's own local
 * "today", not whatever day that duration lands on in UTC. */
function yearsAgoIso(years: number) {
  const { y, m, d } = localToday();
  return new Date(Date.UTC(y - years, m, d)).toISOString().slice(0, 10);
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  city_id: z.string().uuid("Select your city"),
  profession: z.string().trim().min(2, "Tell us what best describes you"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth")
    .refine((v) => {
      const [y, m, d] = parseIsoDate(v);
      const date = new Date(Date.UTC(y, m, d));
      return date.getUTCFullYear() === y && date.getUTCMonth() === m && date.getUTCDate() === d;
    }, "That date does not exist — please check the day and month")
    .refine((v) => {
      const [y, m, d] = parseIsoDate(v);
      return Date.UTC(y, m, d) <= Date.now();
    }, "Date of birth cannot be in the future")
    .refine((v) => {
      const [y, m, d] = parseIsoDate(v);
      return ageInYears(y, m, d) >= MIN_AGE;
    }, `You must be at least ${MIN_AGE} years old`)
    .refine((v) => {
      const [y, m, d] = parseIsoDate(v);
      return ageInYears(y, m, d) <= MAX_AGE;
    }, "Please enter a valid date of birth"),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  address_line: z.string().trim().max(300).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a 6-digit pincode")
    .optional()
    .or(z.literal("")),
  emergency_contact: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  instagram: z.string().trim().max(120).optional().or(z.literal("")),
  linkedin: z.string().trim().max(200).optional().or(z.literal("")),
  current_employer: z.string().trim().max(160).optional().or(z.literal("")),
  employer_designation: z.string().trim().max(120).optional().or(z.literal("")),
  employer_city: z.string().trim().max(80).optional().or(z.literal("")),
  employer_contact: z.string().trim().max(80).optional().or(z.literal("")),
  employment_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  years_experience: z.number().int().min(0).max(60),
});

function splitList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city_id: "",
    profession: "",
    date_of_birth: "",
    gender: "",
    address_line: "",
    state: "",
    pincode: "",
    emergency_contact: "",
    bio: "",
    instagram: "",
    linkedin: "",
    current_employer: "",
    employer_designation: "",
    employer_city: "",
    employer_contact: "",
    employment_start_date: "",
    years_experience: "0",
    languages: "",
    specialties: "",
  });
  const [directoryOptIn, setDirectoryOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const { data: cities } = useQuery({
    queryKey: ["cities-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, state")
        .order("name")
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const states = useMemo(
    () =>
      Array.from(new Set((cities ?? []).map((c) => c.state).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b),
      ),
    [cities],
  );

  const citiesInState = useMemo(
    () => (cities ?? []).filter((c) => (form.state ? c.state === form.state : true)),
    [cities, form.state],
  );

  /** Selecting a city keeps the state field in sync. */
  function selectCity(id: string) {
    const city = (cities ?? []).find((c) => c.id === id);
    setForm((f) => ({ ...f, city_id: id, state: city?.state ?? f.state }));
  }

  function selectState(value: string) {
    setForm((f) => {
      const current = (cities ?? []).find((c) => c.id === f.city_id);
      return { ...f, state: value, city_id: current?.state === value ? f.city_id : "" };
    });
  }


  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      city_id: profile.city_id ?? "",
      profession: profile.profession ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      gender: profile.gender ?? "",
      address_line: profile.address_line ?? "",
      state: profile.state ?? "",
      pincode: profile.pincode ?? "",
      emergency_contact: profile.emergency_contact ?? "",
      bio: profile.bio ?? "",
      instagram: profile.instagram ?? "",
      linkedin: profile.linkedin ?? "",
      current_employer: profile.current_employer ?? "",
      employer_designation: profile.employer_designation ?? "",
      employer_city: profile.employer_city ?? "",
      employer_contact: profile.employer_contact ?? "",
      employment_start_date: profile.employment_start_date ?? "",
      years_experience: String(profile.years_experience ?? 0),
      languages: (profile.languages ?? []).join(", "),
      specialties: (profile.specialties ?? []).join(", "),
    });
    setDirectoryOptIn(profile.directory_opt_in ?? false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function loadPhoto() {
      if (!profile?.photo_url) {
        setPhotoUrl(null);
        return;
      }
      const { data } = await supabase.storage
        .from("candidate-photos")
        .createSignedUrl(profile.photo_url, 3600);
      if (!cancelled) setPhotoUrl(data?.signedUrl ?? null);
    }
    void loadPhoto();
    return () => {
      cancelled = true;
    };
  }, [profile?.photo_url]);

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5 MB");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/portrait.${ext}`;
    const { error } = await supabase.storage
      .from("candidate-photos")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("profiles").update({ photo_url: path }).eq("id", user.id);
    toast.success("Photo updated");
    void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      ...form,
      years_experience: Number(form.years_experience),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    const d = parsed.data;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: d.full_name,
        phone: d.phone,
        city_id: d.city_id,
        profession: d.profession,
        date_of_birth: d.date_of_birth,
        gender: d.gender || null,
        address_line: d.address_line || null,
        state: d.state || null,
        pincode: d.pincode || null,
        emergency_contact: d.emergency_contact || null,
        bio: d.bio || null,
        instagram: d.instagram || null,
        linkedin: d.linkedin || null,
        current_employer: d.current_employer || null,
        employer_designation: d.employer_designation || null,
        employer_city: d.employer_city || null,
        employer_contact: d.employer_contact || null,
        employment_start_date: d.employment_start_date || null,
        years_experience: d.years_experience,
        languages: splitList(form.languages),
        specialties: splitList(form.specialties),
        directory_opt_in: directoryOptIn,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Candidate"
        title="Your profile"
        description="These details appear on your CPB® certificate and the public register, so make sure they are accurate."
      />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={save} className="space-y-8">
          <section className="space-y-5 rounded-md border border-border bg-card/60 p-6">
            <h2 className="text-xl">Personal details</h2>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name (as it should appear on the certificate)</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  min="1925-01-01"
                  max={yearsAgoIso(MIN_AGE)}
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You must be at least {MIN_AGE} years old to hold a guild record.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profession">What best describes you?</Label>
                <Select value={form.profession} onValueChange={(v) => set("profession", v)}>
                  <SelectTrigger id="profession">
                    <SelectValue placeholder="Select your profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Prefer not to say" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                value={form.address_line}
                onChange={(e) => set("address_line", e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="state">State / union territory</Label>
                <Select value={form.state} onValueChange={selectState}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={form.city_id} onValueChange={selectCity}>
                  <SelectTrigger id="city">
                    <SelectValue
                      placeholder={form.state ? "Select your city" : "Select a state first"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {citiesInState.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {form.state ? "" : c.state ? `, ${c.state}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency contact (name & number)</Label>
              <Input
                id="emergency"
                value={form.emergency_contact}
                onChange={(e) => set("emergency_contact", e.target.value)}
                maxLength={80}
              />
            </div>
          </section>

          <section className="space-y-5 rounded-md border border-border bg-card/60 p-6">
            <h2 className="text-xl">Professional details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employer">Current employer</Label>
                <Input
                  id="employer"
                  value={form.current_employer}
                  onChange={(e) => set("current_employer", e.target.value)}
                  maxLength={160}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={form.employer_designation}
                  onChange={(e) => set("employer_designation", e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="employer_city">Employer city</Label>
                <Input
                  id="employer_city"
                  value={form.employer_city}
                  onChange={(e) => set("employer_city", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer_contact">Employer contact</Label>
                <Input
                  id="employer_contact"
                  value={form.employer_contact}
                  onChange={(e) => set("employer_contact", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_start">Employed since</Label>
                <Input
                  id="employment_start"
                  type="date"
                  value={form.employment_start_date}
                  onChange={(e) => set("employment_start_date", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="years">Years of experience</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={60}
                  value={form.years_experience}
                  onChange={(e) => set("years_experience", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialities (comma separated)</Label>
                <Input
                  id="specialties"
                  value={form.specialties}
                  onChange={(e) => set("specialties", e.target.value)}
                  placeholder="Classics, flair, agave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma separated)</Label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => set("languages", e.target.value)}
                  placeholder="Hindi, English"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                maxLength={600}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="@handle"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={form.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="directory"
                checked={directoryOptIn}
                onCheckedChange={(v) => setDirectoryOptIn(v === true)}
              />
              <Label htmlFor="directory" className="text-sm leading-relaxed text-muted-foreground">
                List me in the public member directory (name, CPB ID, city, specialities and
                employer).
              </Label>
            </div>
          </section>

          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </form>

        <div className="rounded-md border border-border bg-card/60 p-6">
          <h2 className="text-xl">Certificate photo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A clear, front-facing portrait. Stored privately and shown only on your certificate.
          </p>
          <div className="mt-5 flex h-44 w-44 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Your certificate portrait"
                width={176}
                height={176}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No photo yet</span>
            )}
          </div>
          <Label htmlFor="photo" className="mt-5 block">
            Upload photo
          </Label>
          <Input
            id="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadPhoto(file);
            }}
          />
          {profile?.cpb_id && (
            <p className="mt-5 text-sm text-muted-foreground">
              Your CPB ID: <span className="text-foreground">{profile.cpb_id}</span>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}