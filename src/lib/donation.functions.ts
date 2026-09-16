import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// No auth middleware here on purpose — donors don't need an IBG Academy
// account. The amount is whatever the donor chooses to give (min ₹50 to
// keep out accidental zero/negative submissions, capped at a sane
// ceiling so a typo doesn't create a five-lakh-rupee order by mistake).
const createSchema = z.object({
  amountInr: z.number().int().min(50).max(500000),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(500).optional(),
});

export const createDonationOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
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
        amount: data.amountInr * 100,
        currency: "INR",
        receipt: `donation-${Date.now()}`,
        notes: { purpose: "donation", donor_email: data.email },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[razorpay] donation order failed", text);
      throw new Error("Could not start the payment. Please try again.");
    }

    const order = (await response.json()) as { id: string; amount: number };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("donations").insert({
      donor_name: data.name,
      donor_email: data.email,
      donor_phone: data.phone || null,
      amount_inr: data.amountInr,
      message: data.message || null,
      status: "pending",
      gateway: "razorpay",
      order_id: order.id,
    });
    if (error) throw error;

    return {
      keyId,
      orderId: order.id,
      amount: order.amount,
      label: "Donation to the IBG Foundation",
    };
  });

const verifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const verifyDonationOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data }) => {
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
    const { error } = await supabaseAdmin
      .from("donations")
      .update({ status: "paid", payment_id: data.paymentId })
      .eq("order_id", data.orderId);
    if (error) throw error;

    return { ok: true };
  });