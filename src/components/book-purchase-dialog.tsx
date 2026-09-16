import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { createBookOrder, verifyPaymentOrder, BOOK_CATALOG_PUBLIC, type BookSlug } from "@/lib/payments.functions";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useSession } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which book from BOOK_CATALOG_PUBLIC this dialog is ordering. */
  bookSlug: BookSlug;
}

const emptyForm = {
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

export function BookPurchaseDialog({ open, onOpenChange, bookSlug }: BookPurchaseDialogProps) {
  const { user, loading } = useSession();
  const book = BOOK_CATALOG_PUBLIC[bookSlug];
  const create = useServerFn(createBookOrder);
  const verify = useServerFn(verifyPaymentOrder);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function field(key: keyof typeof emptyForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function submit() {
    if (
      !form.recipientName.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      toast.error("Please fill in all required delivery details.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await create({ data: { ...form, bookSlug } });
      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        label: order.label,
        name: form.recipientName,
        email: user?.email ?? undefined,
        contact: form.phone,
        onDismiss: () => setSubmitting(false),
        onSuccess: async (r) => {
          try {
            await verify({
              data: {
                orderId: r.razorpay_order_id,
                paymentId: r.razorpay_payment_id,
                signature: r.razorpay_signature,
              },
            });
            toast.success("Order placed — your copy will be shipped to the address you gave.");
            setForm(emptyForm);
            onOpenChange(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Verification failed");
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : "Could not start payment");
    }
  }

  // Orders are tied to a signed-in account (delivery history, order status),
  // so ask people to sign in first rather than silently failing at checkout.
  if (!loading && !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to order</DialogTitle>
            <DialogDescription>
              Create a free IBG Academy account to order {book.label} — you'll be able to track
              your order from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <Button asChild className="w-full">
            <Link to="/auth" search={{ mode: "signup" }}>
              Sign up free
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order {book.label}</DialogTitle>
          <DialogDescription>
            ₹{book.priceInr} — tell us where to ship it. Payment is handled securely by Razorpay.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="recipientName">Full name</Label>
            <Input id="recipientName" {...field("recipientName")} placeholder="Recipient's name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" {...field("phone")} placeholder="10-digit mobile number" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" {...field("addressLine1")} placeholder="House no., street" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
            <Input id="addressLine2" {...field("addressLine2")} placeholder="Landmark, area" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...field("city")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...field("state")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...field("pincode")} />
            </div>
          </div>
        </div>

        <Button disabled={submitting} onClick={() => void submit()} className="w-full">
          {submitting ? "Processing…" : "Pay & place order"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}