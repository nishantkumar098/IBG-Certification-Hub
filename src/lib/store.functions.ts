import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Store checkout — products live in public.store_products (managed by
// superadmins on /store). The price is always read from the database here,
// never trusted from the client. Payment is verified with the shared
// verifyPaymentOrder in payments.functions.ts.

const storeOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  recipientName: z.string().trim().min(2, "Enter the recipient's name"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  addressLine1: z.string().trim().min(4, "Enter the address"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Enter the city"),
  state: z.string().trim().min(2, "Enter the state"),
  pincode: z.string().trim().min(4, "Enter a valid pincode"),
});

export const createStoreOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => storeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: productError } = await supabaseAdmin
      .from("store_products")
      .select("id, name, price_inr, is_active")
      .eq("id", data.productId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product || !product.is_active) throw new Error("This product is no longer available.");

    const totalInr = product.price_inr * data.quantity;
    const label = data.quantity > 1 ? `${product.name} × ${data.quantity}` : product.name;

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
        amount: totalInr * 100,
        currency: "INR",
        receipt: `store-${Date.now()}`,
        notes: {
          purpose: "store-purchase",
          product_id: product.id,
          quantity: String(data.quantity),
          user_id: context.userId,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[razorpay] store order failed", text);
      throw new Error("Could not start the payment. Please try again.");
    }

    const order = (await response.json()) as { id: string; amount: number };

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        candidate_id: context.userId,
        amount_inr: totalInr,
        purpose: "store-purchase",
        status: "pending",
        gateway: "razorpay",
        order_id: order.id,
      })
      .select("id")
      .single();
    if (paymentError) throw paymentError;

    const { error: orderError } = await supabaseAdmin.from("store_orders").insert({
      payment_id: payment.id,
      user_id: context.userId,
      product_id: product.id,
      product_name: product.name,
      unit_price_inr: product.price_inr,
      quantity: data.quantity,
      total_inr: totalInr,
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
      label,
    };
  });
