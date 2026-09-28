import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useRoles, useSession } from "@/hooks/use-auth";
import { createStoreOrder } from "@/lib/store.functions";
import { verifyPaymentOrder } from "@/lib/payments.functions";
import { openRazorpayCheckout } from "@/lib/razorpay";

const TITLE = "IBG Store — official guild merchandise";
const DESCRIPTION =
  "Official India Bartenders' Guild merchandise, bar tools and publications — shipped across India.";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StorePage,
});

type Product = Database["public"]["Tables"]["store_products"]["Row"];

/** Store sections, in display order. Keep in sync with the category check
 * constraint on public.store_products. */
const CATEGORIES = [
  { value: "hoodies", label: "Hoodies" },
  { value: "sweatshirts", label: "Sweatshirts" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "jackets", label: "Jackets" },
  { value: "aprons", label: "Aprons" },
  { value: "caps", label: "Caps" },
  { value: "notebooks", label: "Notebooks" },
  { value: "coasters", label: "Coasters" },
  { value: "pens", label: "Pens" },
  { value: "other", label: "More from IBG" },
] as const;

const BUCKET = "store-products";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function useProducts(includeHidden: boolean) {
  return useQuery({
    queryKey: ["store-products", includeHidden],
    queryFn: async () => {
      let q = supabase
        .from("store_products")
        .select("*")
        .order("created_at", { ascending: false })
        .order("name");
      if (!includeHidden) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

function StorePage() {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const isSuperadmin = (roles ?? []).includes("superadmin");
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useProducts(isSuperadmin);

  const [buying, setBuying] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["store-products"] });

  // Unknown categories fall into "other" so nothing ever disappears.
  const sections = CATEGORIES.map((c) => ({
    ...c,
    items: (products ?? []).filter(
      (p) =>
        p.category === c.value ||
        (c.value === "other" && !CATEGORIES.some((k) => k.value === p.category)),
    ),
  })).filter((s) => s.items.length > 0);

  async function toggleActive(p: Product) {
    const { error } = await supabase
      .from("store_products")
      .update({ is_active: !p.is_active, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_active ? "Product hidden from the store." : "Product is live again.");
    void refresh();
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("store_products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    if (p.image_path) await supabase.storage.from(BUCKET).remove([p.image_path]);
    toast.success("Product deleted.");
    void refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 py-20">
          <div>
            <p className="eyebrow">IBG Store</p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
              Official <span className="text-gradient-gold">guild merchandise</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Bar tools, apparel and publications from the India Bartenders' Guild — shipped across
              India. Payment is handled securely by Razorpay.
            </p>
          </div>
          {isSuperadmin && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : (products ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <ShoppingBag className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-4 text-muted-foreground">
                {isSuperadmin
                  ? "No products yet — add the first one."
                  : "New merchandise is on its way. Check back soon."}
              </p>
            </div>
          ) : (
            <>
              {sections.length > 1 && (
                <nav aria-label="Store sections" className="mb-10 flex flex-wrap gap-2">
                  {sections.map((s) => (
                    <a
                      key={s.value}
                      href={`#${s.value}`}
                      className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                    >
                      {s.label} ({s.items.length})
                    </a>
                  ))}
                </nav>
              )}
              {sections.map((s) => (
                <section key={s.value} id={s.value} className="mb-16 scroll-mt-24 last:mb-0">
                  <h2 className="mb-6 text-3xl">{s.label}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {s.items.map((p) => (
                      <article
                        key={p.id}
                        className="flex flex-col overflow-hidden rounded-lg border border-border bg-card/60"
                      >
                        <div className="relative aspect-square bg-muted">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          {!p.is_active && (
                            <span className="absolute left-3 top-3 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-xl">{p.name}</h3>
                          <p className="mt-1 text-lg text-gradient-gold">
                            {formatInr(p.price_inr)}
                          </p>
                          {p.description && (
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                              {p.description}
                            </p>
                          )}
                          <div className="mt-auto pt-5">
                            {p.is_active && (
                              <Button className="w-full" onClick={() => setBuying(p)}>
                                Buy now
                              </Button>
                            )}
                            {isSuperadmin && (
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => setEditing(p)}
                                >
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => void toggleActive(p)}
                                >
                                  {p.is_active ? "Hide" : "Show"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  aria-label={`Delete ${p.name}`}
                                  onClick={() => void remove(p)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </section>

      {buying && (
        <BuyDialog product={buying} open={!!buying} onOpenChange={(o) => !o && setBuying(null)} />
      )}
      {isSuperadmin && editing && (
        <ProductFormDialog
          product={editing === "new" ? null : editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      )}

      <SiteFooter />
    </div>
  );
}

// ---------------------------------------------------------------------
// Superadmin: add / edit a product. Image, name and price are required.
// ---------------------------------------------------------------------

function ProductFormDialog({
  product,
  open,
  onOpenChange,
  onSaved,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price_inr) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "t-shirts");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  function pickFile(f: File | null) {
    if (f && !f.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (f && f.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : (product?.image_url ?? null));
  }

  async function save() {
    const priceInr = Number(price);
    if (!file && !product) return toast.error("Product image is required.");
    if (!name.trim()) return toast.error("Product name is required.");
    if (!price.trim() || !Number.isInteger(priceInr) || priceInr <= 0) {
      return toast.error("Enter a price in whole rupees greater than 0.");
    }

    setSaving(true);
    try {
      let imageUrl = product?.image_url ?? "";
      let imagePath = product?.image_path ?? null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        imagePath = path;
      }

      const fields = {
        name: name.trim(),
        price_inr: priceInr,
        category,
        description: description.trim() || null,
        image_url: imageUrl,
        image_path: imagePath,
      };

      if (product) {
        const { error } = await supabase
          .from("store_products")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", product.id);
        if (error) throw error;
        // Replaced the image — clean up the old file.
        if (file && product.image_path) {
          await supabase.storage.from(BUCKET).remove([product.image_path]);
        }
      } else {
        const { error } = await supabase
          .from("store_products")
          .insert({ ...fields, created_by: user?.id ?? null });
        if (error) throw error;
      }

      toast.success(product ? "Product updated." : "Product added to the store.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Image, name and price are required. Description is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="product-image">Product image *</Label>
            <label
              htmlFor="product-image"
              className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 hover:border-primary/60"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  Click to upload (max 5 MB)
                </span>
              )}
            </label>
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-name">Name *</Label>
            <Input
              id="product-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-category">Section *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="product-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-price">Price (₹) *</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-description">Description (optional)</Label>
            <Textarea
              id="product-description"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <Button disabled={saving} onClick={() => void save()} className="w-full">
          {saving ? "Saving…" : product ? "Save changes" : "Add product"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Checkout: delivery details → Razorpay → verify.
// ---------------------------------------------------------------------

const emptyForm = {
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

function BuyDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, loading } = useSession();
  const create = useServerFn(createStoreOrder);
  const verify = useServerFn(verifyPaymentOrder);
  const [form, setForm] = useState(emptyForm);
  const [quantity, setQuantity] = useState(1);
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
      const order = await create({ data: { ...form, productId: product.id, quantity } });
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
            toast.success("Order placed — we'll ship it to the address you gave.");
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

  if (!loading && !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to order</DialogTitle>
            <DialogDescription>
              Create a free IBG Academy account to order {product.name} — you'll be able to track
              your order from your account.
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

  const total = product.price_inr * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order {product.name}</DialogTitle>
          <DialogDescription>
            {formatInr(product.price_inr)} each — tell us where to ship it. Payment is handled
            securely by Razorpay.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(20, Math.max(1, Math.floor(Number(e.target.value) || 1))))
              }
            />
          </div>
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
          {submitting ? "Processing…" : `Pay ${formatInr(total)} & place order`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
