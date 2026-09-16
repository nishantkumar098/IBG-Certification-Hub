import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { createPaymentOrder, verifyPaymentOrder } from "@/lib/payments.functions";
import { openRazorpayCheckout } from "@/lib/razorpay";

export function usePayment(onPaid?: () => void) {
  const create = useServerFn(createPaymentOrder);
  const verify = useServerFn(verifyPaymentOrder);
  const [pending, setPending] = useState<string | null>(null);

  async function pay(
    purpose: "certification" | "membership" | "associateMembership",
    prefill?: { name?: string | undefined; email?: string | undefined; contact?: string | undefined },
    discountCode?: string,
  ) {
    setPending(purpose);
    try {
      const order = await create({ data: { purpose, discountCode } });

      if (order.complementary) {
        toast.success("Registered — this fee has been waived, no payment needed.");
        onPaid?.();
        setPending(null);
        return;
      }

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        label: order.label,
        ...prefill,
        onDismiss: () => setPending(null),
        onSuccess: async (r) => {
          try {
            await verify({
              data: {
                orderId: r.razorpay_order_id,
                paymentId: r.razorpay_payment_id,
                signature: r.razorpay_signature,
              },
            });
            toast.success(
              purpose === "membership" || purpose === "associateMembership"
                ? "Membership activated — your card has been issued."
                : "Payment received. Your certification path is unlocked.",
            );
            onPaid?.();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Verification failed");
          } finally {
            setPending(null);
          }
        },
      });
    } catch (error) {
      setPending(null);
      toast.error(error instanceof Error ? error.message : "Could not start payment");
    }
  }

  return { pay, pending };
}