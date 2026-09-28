import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PURPOSES = {
  certification: { amount: 5000, label: "CPB® certification fee", planCode: "cpb_certification" },
  membership: { amount: 2000, label: "IBG professional membership", planCode: "professional" },
  associateMembership: {
    amount: 40000,
    label: "IBG Associate Membership (Academic/Institutional)",
    planCode: "associate_institutional",
  },
} as const;

export type PaymentPurpose = keyof typeof PURPOSES;

/** Discount codes, currently only honoured for the certification fee.
 * - IBGCOMP: fully complementary — no payment gateway involved at all.
 * - IBG20: 20% off, but only for candidates who already hold an active
 *   IBG membership (checked server-side, never trust the client). */
const DISCOUNT_CODES = {
  IBGCOMP: { type: "complementary" as const },
  IBG20: { type: "percent" as const, value: 20, requiresMembership: true },
};

const createSchema = z.object({
  purpose: z.enum(["certification", "membership", "associateMembership"]),
  discountCode: z.string().trim().max(40).optional(),
});

export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const cfg = PURPOSES[data.purpose];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rawCode = data.discountCode?.trim().toUpperCase();
    const discount = rawCode ? DISCOUNT_CODES[rawCode as keyof typeof DISCOUNT_CODES] : undefined;

    if (rawCode) {
      if (data.purpose !== "certification") {
        throw new Error("Discount codes only apply to the certification fee.");
      }
      if (!discount) {
        throw new Error("That discount code isn't valid.");
      }
      if ("requiresMembership" in discount && discount.requiresMembership) {
        const { data: membership } = await supabaseAdmin
          .from("memberships")
          .select("id")
          .eq("user_id", context.userId)
          .eq("status", "active")
          .maybeSingle();
        if (!membership) {
          throw new Error("IBG20 is only valid for active IBG members.");
        }
      }
    }

    // Fully complementary registrations skip Razorpay entirely.
    if (discount?.type === "complementary") {
      const { error } = await supabaseAdmin.from("payments").insert({
        candidate_id: context.userId,
        amount_inr: 0,
        purpose: data.purpose,
        status: "paid",
        gateway: "complementary",
        order_id: `comp-${context.userId}-${Date.now()}`,
        plan_code: cfg.planCode,
        discount_code: rawCode ?? null,
      });
      if (error) throw error;

      return { complementary: true as const, purpose: data.purpose };
    }

    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Payment gateway is not configured.");

    const amount =
      discount?.type === "percent" ? Math.round(cfg.amount * (1 - discount.value / 100)) : cfg.amount;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: `${data.purpose}-${Date.now()}`,
        notes: { purpose: data.purpose, user_id: context.userId, discount_code: rawCode ?? "" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[razorpay] order failed", text);
      throw new Error("Could not start the payment. Please try again.");
    }

    const order = (await response.json()) as { id: string; amount: number };

    const { error } = await supabaseAdmin.from("payments").insert({
      candidate_id: context.userId,
      amount_inr: amount,
      purpose: data.purpose,
      status: "pending",
      gateway: "razorpay",
      order_id: order.id,
      plan_code: cfg.planCode,
      discount_code: rawCode ?? null,
    });
    if (error) throw error;

    return {
      complementary: false as const,
      keyId,
      orderId: order.id,
      amount: order.amount,
      label: discount ? `${cfg.label} (${rawCode})` : cfg.label,
      purpose: data.purpose,
    };
  });

const verifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const verifyPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Payment gateway is not configured.");

    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Payment signature verification failed.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment, error: readError } = await supabaseAdmin
      .from("payments")
      .select("id, candidate_id, purpose, plan_code, status")
      .eq("order_id", data.orderId)
      .single();
    if (readError) throw readError;
    if (payment.candidate_id !== context.userId) throw new Error("Forbidden");

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        payment_id: data.paymentId,
        gateway_reference: data.paymentId,
      })
      .eq("id", payment.id);
    if (updateError) throw updateError;

    if (payment.purpose === "store-purchase") {
      const { error: storeError } = await supabaseAdmin
        .from("store_orders")
        .update({ status: "paid" })
        .eq("payment_id", payment.id);
      if (storeError) throw storeError;
    }

    // Membership fee auto-issues the membership card.
    if (payment.purpose === "membership") {
      const { data: existing } = await supabaseAdmin
        .from("memberships")
        .select("id")
        .eq("user_id", context.userId)
        .eq("status", "active")
        .maybeSingle();

      if (!existing) {
        const memberNumber = `IBG-${new Date().getFullYear()}-${Math.floor(
          100000 + Math.random() * 900000,
        )}`;
        const today = new Date();
        const expires = new Date(today);
        expires.setFullYear(expires.getFullYear() + 1);
        const { error: memberError } = await supabaseAdmin.from("memberships").insert({
          user_id: context.userId,
          plan_code: payment.plan_code ?? "professional",
          member_number: memberNumber,
          status: "active",
          started_on: today.toISOString().slice(0, 10),
          expires_on: expires.toISOString().slice(0, 10),
        });
        if (memberError) throw memberError;
      }
    }

    return { ok: true, purpose: payment.purpose as PaymentPurpose };
  });

// ---------------------------------------------------------------------
// BOOK PURCHASE — in-app printed-book orders + delivery address, replacing
// the external ibg.network purchase links.
// ---------------------------------------------------------------------

// TODO: confirm real prices with the guild office and update these figures
// (in INR, whole rupees — converted to paise below). Prices are looked up
// here server-side rather than trusted from the client.
const BOOK_CATALOG = {
  "ibg-ultimate-bartender-book": {
    label: "IBG Ultimate Bartender Book (print edition)",
    priceInr: 699,
  },
  "indias-fnb-on-ventilator": {
    label: "India's F&B on Ventilator (print edition)",
    priceInr: 183,
  },
} as const;

export type BookSlug = keyof typeof BOOK_CATALOG;
export const BOOK_CATALOG_PUBLIC = Object.fromEntries(
  Object.entries(BOOK_CATALOG).map(([slug, b]) => [slug, { label: b.label, priceInr: b.priceInr }]),
) as Record<BookSlug, { label: string; priceInr: number }>;

const bookOrderSchema = z.object({
  bookSlug: z.enum(Object.keys(BOOK_CATALOG) as [BookSlug, ...BookSlug[]]),
  recipientName: z.string().trim().min(2, "Enter the recipient's name"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  addressLine1: z.string().trim().min(4, "Enter the address"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Enter the city"),
  state: z.string().trim().min(2, "Enter the state"),
  pincode: z.string().trim().min(4, "Enter a valid pincode"),
});

export const createBookOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bookOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const book = BOOK_CATALOG[data.bookSlug];
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Payment gateway is not configured.");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: book.priceInr * 100,
        currency: "INR",
        receipt: `book-${Date.now()}`,
        notes: { purpose: "book-purchase", book: data.bookSlug, user_id: context.userId },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[razorpay] book order failed", text);
      throw new Error("Could not start the payment. Please try again.");
    }

    const order = (await response.json()) as { id: string; amount: number };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        candidate_id: context.userId,
        amount_inr: book.priceInr,
        purpose: "book-purchase",
        status: "pending",
        gateway: "razorpay",
        order_id: order.id,
      })
      .select("id")
      .single();
    if (paymentError) throw paymentError;

    const { error: orderError } = await supabaseAdmin.from("book_orders").insert({
      payment_id: payment.id,
      user_id: context.userId,
      book_title: book.label,
      recipient_name: data.recipientName,
      phone: data.phone,
      address_line1: data.addressLine1,
      address_line2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    });
    if (orderError) throw orderError;

    return {
      keyId,
      orderId: order.id,
      amount: order.amount,
      label: book.label,
    };
  });