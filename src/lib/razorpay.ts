/** Loads the Razorpay Checkout script once and opens a checkout window. */

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Checkout failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Checkout failed to load"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  label: string;
  name?: string | undefined;
  email?: string | undefined;
  contact?: string | undefined;
  onSuccess: (r: RazorpayResponse) => void;
  onDismiss?: (() => void) | undefined;
}) {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Checkout is unavailable right now.");

  const rzp = new window.Razorpay({
    key: opts.keyId,
    order_id: opts.orderId,
    amount: opts.amount,
    currency: "INR",
    name: "IBG Academy",
    description: opts.label,
    theme: { color: "#c9a227" },
    prefill: {
      name: opts.name ?? "",
      email: opts.email ?? "",
      contact: opts.contact ?? "",
    },
    modal: { ondismiss: () => opts.onDismiss?.() },
    handler: (response: RazorpayResponse) => opts.onSuccess(response),
  });
  rzp.open();
}
