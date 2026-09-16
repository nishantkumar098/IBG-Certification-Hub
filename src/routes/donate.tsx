import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { HandHeart, GraduationCap, LifeBuoy, Mail } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ARCHIVE } from "@/lib/archive-images";
import { useReveal } from "@/hooks/use-reveal";
import { createDonationOrder, verifyDonationOrder } from "@/lib/donation.functions";
import { openRazorpayCheckout } from "@/lib/razorpay";

const TITLE = "Support the IBG Foundation — donate";
const DESCRIPTION =
  "Support the India Bartenders' Guild Foundation: scholarships for young bartenders, emergency welfare for members, and training in underserved cities.";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DonatePage,
});

const CAUSES = [
  {
    icon: GraduationCap,
    title: "Scholarships",
    body: "Fully funded CPB® certification for bartenders who cannot afford the fee — training, examination and certificate included.",
  },
  {
    icon: LifeBuoy,
    title: "Emergency welfare",
    body: "Direct support to members facing medical emergencies, injury or sudden loss of livelihood.",
  },
  {
    icon: HandHeart,
    title: "Training in new cities",
    body: "Taking chapter workshops and assessment days to cities that have no formal bartending education at all.",
  },
];

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

function DonateWidget() {
  const create = useServerFn(createDonationOrder);
  const verify = useServerFn(verifyDonationOrder);

  const [amount, setAmount] = useState<number | "">(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  async function donate() {
    if (!effectiveAmount || effectiveAmount < 50) {
      toast.error("Please enter an amount of at least ₹50.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setBusy(true);
    try {
      const order = await create({
        data: { amountInr: Math.round(effectiveAmount), name, email, phone: phone || undefined },
      });
      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        label: order.label,
        name,
        email,
        contact: phone || undefined,
        onDismiss: () => setBusy(false),
        onSuccess: async (r) => {
          try {
            await verify({
              data: {
                orderId: r.razorpay_order_id,
                paymentId: r.razorpay_payment_id,
                signature: r.razorpay_signature,
              },
            });
            toast.success("Thank you — your donation was received!");
            setCustomAmount("");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Verification failed");
          } finally {
            setBusy(false);
          }
        },
      });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not start the donation");
    }
  }

  return (
    <div className="reveal rounded-lg border border-primary/40 bg-card/60 p-7">
      <p className="eyebrow">Give online</p>
      <h3 className="mt-2 font-display text-2xl">Donate any amount</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Instant, secure, via Razorpay — a receipt is emailed to you automatically.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {PRESET_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAmount(a);
              setCustomAmount("");
            }}
            className={`rounded-md border px-2 py-2 text-sm transition-colors ${
              amount === a && !customAmount
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            ₹{a.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="donate-custom" className="text-xs text-muted-foreground">
          Or enter a custom amount (₹)
        </Label>
        <Input
          id="donate-custom"
          type="number"
          min={50}
          placeholder="e.g. 1500"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setAmount("");
          }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="donate-name" className="text-xs text-muted-foreground">
            Full name
          </Label>
          <Input id="donate-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="donate-email" className="text-xs text-muted-foreground">
            Email
          </Label>
          <Input
            id="donate-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="donate-phone" className="text-xs text-muted-foreground">
          Phone (optional)
        </Label>
        <Input id="donate-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <Button className="mt-5 w-full" disabled={busy} onClick={() => void donate()}>
        {busy
          ? "Opening checkout…"
          : `Donate ₹${(effectiveAmount || 0).toLocaleString("en-IN")}`}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Need a CSR receipt, 80G documentation, or want to fund a named scholarship batch instead?
        Email the Foundation using the details alongside.
      </p>
    </div>
  );
}

function DonatePage() {
  const ref = useReveal();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={ARCHIVE.galaFlag}
          alt="Guild members at a foundation gathering"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow">The Foundation</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            Back the people <span className="text-gradient-gold">behind the bar</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The India Bartenders' Guild Foundation is a non-profit body. Donations fund
            scholarships, emergency welfare for members, and training in cities where none exists.
          </p>
        </div>
      </section>

      <div ref={ref}>
        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow">Where it goes</p>
            <h2 className="mt-3 text-4xl">Three funds</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {CAUSES.map((c) => {
                const Icon = c.icon;
                return (
                  <article key={c.title} className="reveal rounded-lg border border-border bg-card/60 p-7">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-display text-2xl">{c.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="reveal">
              <p className="eyebrow">How to give</p>
              <h2 className="mt-3 text-4xl">Talk to the Foundation directly</h2>
              <p className="mt-5 text-muted-foreground">
                For donations, CSR partnerships and scholarship sponsorship, write to the Foundation
                and we will share the account details, receipt process and any tax documentation
                that applies to your contribution.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>Individual donations, one-time or recurring</li>
                <li>Corporate CSR and brand-funded scholarship batches</li>
                <li>In-kind support: venues, spirits, glassware and bar equipment for training</li>
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                Bank details are shared on request rather than published, so that every donation is
                receipted correctly and no one is misled by a copied account number.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="mailto:support@ibg.network?subject=Donation%20to%20the%20IBG%20Foundation">
                    <Mail className="mr-2 h-4 w-4" />
                    Email the Foundation
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:+919990552299">+91 99905 52299</a>
                </Button>
              </div>
            </div>
            <DonateWidget />
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-4xl">Not able to donate? Join instead.</h2>
            <p className="mt-4 text-muted-foreground">
              Membership fees keep the guild running too — and they give you the card, the library
              and the chapter network.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/membership">Become a member</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">About the guild</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}