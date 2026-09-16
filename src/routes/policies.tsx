import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";

const TITLE = "Privacy & anti-harassment policy — IBG Academy";
const DESCRIPTION =
  "How IBG Academy collects, stores and protects candidate data, and the guild's zero-tolerance anti-harassment policy for members, examiners and testing centres.";

const PRIVACY = [
  {
    heading: "What we collect",
    body: "Your name, contact details, date of birth, city and state, employment history, emergency contact, certificate portrait, experience certificate and examination records. Payment card details are never seen or stored by IBG — they are handled entirely by our payment gateway.",
  },
  {
    heading: "Why we hold it",
    body: "To verify identity at a testing centre, to grade and audit examinations, to issue and revoke certificates, to maintain the public register, and to comply with the guild's obligations to employers who rely on the CPB® mark.",
  },
  {
    heading: "What is public",
    body: "Only a certificate number, name, city, issue date and status are published on the verification page. Your directory listing is optional and can be withdrawn from your profile at any time. Your photograph, documents and contact details are never public.",
  },
  {
    heading: "Who can see your file",
    body: "You, the examiners assigned to your assessment, and IBG administrative staff. Access is enforced at the database level, not merely in the interface, and every staff action on a candidate record is written to an audit log.",
  },
  {
    heading: "How long we keep it",
    body: "Examination records and certificates are kept for the life of the register so employers can verify historic credentials. Uploaded documents and photographs are deleted on request once certification lapses.",
  },
  {
    heading: "Your rights",
    body: "You may request a copy of your data, correct it, or ask for deletion of anything not required for the integrity of the register, by writing to the guild office.",
  },
] as const;

const HARASSMENT = [
  {
    heading: "Zero tolerance",
    body: "Sexual harassment, discrimination on grounds of gender, caste, religion, disability, sexual orientation or region, bullying, stalking, and retaliation against a complainant are all prohibited — in bars, at guild events, on testing-centre premises and in online guild spaces.",
  },
  {
    heading: "What counts as harassment",
    body: "Unwelcome physical contact, demands or requests for sexual favours, sexually coloured remarks, showing pornography, and any other unwelcome physical, verbal or non-verbal conduct of a sexual nature, consistent with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.",
  },
  {
    heading: "Duty of the certified bartender",
    body: "A CPB® holder is expected to intervene where a guest or colleague is at risk, to refuse service where continuing would cause harm, to protect intoxicated guests from predatory behaviour, and to escalate incidents to management.",
  },
  {
    heading: "How complaints are handled",
    body: "Reports go to the conduct committee and are acknowledged with a reference number. The committee investigates within seven working days, hears the member concerned, and may issue a warning, mandate retraining, suspend the certificate, or revoke it permanently and remove the member from the register.",
  },
  {
    heading: "Confidentiality and anonymity",
    body: "The identity of a complainant is disclosed only to the committee. Anonymous reports are investigated on the evidence available. Retaliation against anyone who reports in good faith is itself a revocable offence.",
  },
] as const;

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Governance</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Privacy and <span className="text-gradient-gold">anti-harassment</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Two commitments underwrite the CPB® mark: we handle your data carefully, and we hold
            every member to a standard of conduct behind the bar and beyond it.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-3 font-display text-3xl">
              <Lock className="h-6 w-6 text-primary" /> Privacy policy
            </h2>
            <div className="mt-8 space-y-8">
              {PRIVACY.map((s) => (
                <article key={s.heading}>
                  <h3 className="text-xl">{s.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-3 font-display text-3xl">
              <ShieldCheck className="h-6 w-6 text-primary" /> Anti-harassment policy
            </h2>
            <div className="mt-8 space-y-8">
              {HARASSMENT.map((s) => (
                <article key={s.heading}>
                  <h3 className="text-xl">{s.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              To raise a concern, use the{" "}
              <Link to="/report" className="text-primary underline-offset-4 hover:underline">
                report a member
              </Link>{" "}
              form. In an emergency, call 112 first.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
