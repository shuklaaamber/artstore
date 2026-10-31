"use client";
import { useState, useTransition } from "react";
import { addProductVariant, adjustStock, createProduct, createPromo, setProductStatus, togglePromo, updateOrderStatus, updateProductDetails, updateVariantPrice, updateVariantSize } from "@/app/actions/admin";
import type { OrderStatus } from "@/lib/orders";
import { Notice } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Msg = { ok: boolean; t: string } | null;

/** A visible label stacked over a control, used by every admin form. */
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`space-y-1.5 text-sm font-medium ${className}`}>
      {label}
      <span className="block font-normal">{children}</span>
    </label>
  );
}

export function StockAdjuster({ variantId, label }: { variantId: number; label: string }) {
  const [delta, setDelta] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => { const r = await adjustStock(variantId, Number(delta)); setErr(r.ok ? null : r.error); if (r.ok) setDelta(""); });
      }}
    >
      <Label className="sr-only" htmlFor={`d-${variantId}`}>Change stock for {label}</Label>
      <Input id={`d-${variantId}`} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+5 / -2" inputMode="numeric" className="w-24" />
      <Button variant="outline" disabled={pending || !delta}>Apply</Button>
      {err && <span role="alert" className="text-xs text-destructive">{err}</span>}
    </form>
  );
}

export function ArchiveButton({ productId, status }: { productId: number; status: string }) {
  const [pending, start] = useTransition();
  const next = status === "active" ? "archived" : "active";
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { await setProductStatus(productId, next); })}>
      {status === "active" ? "Archive" : "Restore"}
    </Button>
  );
}

export function OrderStatusSelect({ orderId, current, options }: { orderId: number; current: string; options: OrderStatus[] }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Label className="sr-only" htmlFor={`s-${orderId}`}>Set status</Label>
      <NativeSelect id={`s-${orderId}`} defaultValue="" disabled={pending} className="w-40"
        onChange={(e) => { const v = e.target.value as OrderStatus; if (v) start(async () => { const r = await updateOrderStatus(orderId, v); setErr(r.ok ? null : r.error); }); }}>
        <option value="" disabled>{current.replace("_", " ")}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </NativeSelect>
      {err && <span role="alert" className="text-xs text-destructive">{err}</span>}
    </div>
  );
}

export function NewProductForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <Card>
      <form
        className="grid gap-4 px-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          start(async () => {
            const r = await createProduct({
              name: String(fd.get("name")), categoryId: Number(fd.get("categoryId")),
              price: Number(fd.get("price")), stock: Number(fd.get("stock")), description: String(fd.get("description") ?? ""),
            });
            setMsg({ ok: r.ok, t: r.ok ? (r.message ?? "Created") : r.error });
            if (r.ok) form.reset();
          });
        }}
      >
        <h2 className="font-heading text-base font-medium sm:col-span-2">Add a product</h2>
        <Field label="Name"><Input name="name" required /></Field>
        <Field label="Category">
          <NativeSelect name="categoryId">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect>
        </Field>
        <Field label="Price (₹)"><Input name="price" type="number" step="0.01" min="1" required /></Field>
        <Field label="Opening stock"><Input name="stock" type="number" min="0" defaultValue={10} required /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea name="description" rows={2} /></Field>
        <div className="sm:col-span-2"><Button disabled={pending}>{pending ? "Saving…" : "Create product"}</Button></div>
        <div aria-live="polite" className="sm:col-span-2">{msg && <Notice kind={msg.ok ? "success" : "error"}>{msg.t}</Notice>}</div>
      </form>
    </Card>
  );
}

export function NewPromoForm() {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <Card>
      <form
        className="grid gap-4 px-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const max = String(fd.get("max") ?? "");
          start(async () => {
            const r = await createPromo({
              code: String(fd.get("code")), type: fd.get("type") as "percent" | "fixed" | "free_shipping",
              value: Number(fd.get("value") || 0), minSubtotal: Number(fd.get("min") || 0), maxRedemptions: max ? Number(max) : null,
            });
            setMsg({ ok: r.ok, t: r.ok ? (r.message ?? "Created") : r.error });
            if (r.ok) form.reset();
          });
        }}
      >
        <h2 className="font-heading text-base font-medium sm:col-span-2">New promo code</h2>
        <Field label="Code"><Input name="code" required className="uppercase" /></Field>
        <Field label="Type">
          <NativeSelect name="type">
            <option value="percent">Percent off</option><option value="fixed">Fixed ₹ off</option><option value="free_shipping">Free shipping</option>
          </NativeSelect>
        </Field>
        <Field label="Value (% or ₹)"><Input name="value" type="number" step="0.01" min="0" /></Field>
        <Field label="Minimum subtotal (₹)"><Input name="min" type="number" step="0.01" min="0" /></Field>
        <Field label="Max redemptions (blank = unlimited)"><Input name="max" type="number" min="1" /></Field>
        <div className="self-end"><Button disabled={pending}>Create</Button></div>
        <div aria-live="polite" className="sm:col-span-2">{msg && <Notice kind={msg.ok ? "success" : "error"}>{msg.t}</Notice>}</div>
      </form>
    </Card>
  );
}

export function PriceEditor({ variantId, label, price, compareAt }: { variantId: number; label: string; price: number; compareAt: number | null }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const cmp = String(fd.get("compareAt") ?? "").trim();
        start(async () => {
          const r = await updateVariantPrice(variantId, Number(fd.get("price")), cmp ? Number(cmp) : null);
          setMsg({ ok: r.ok, t: r.ok ? "Saved" : r.error });
        });
      }}
    >
      <Label className="sr-only" htmlFor={`pr-${variantId}`}>Price in rupees for {label}</Label>
      <Input id={`pr-${variantId}`} name="price" type="number" step="0.01" min="1" required defaultValue={price / 100} className="w-24" />
      <Label className="sr-only" htmlFor={`cp-${variantId}`}>Original (compare-at) price for {label}, optional</Label>
      <Input id={`cp-${variantId}`} name="compareAt" type="number" step="0.01" min="0" placeholder="was ₹" defaultValue={compareAt ? compareAt / 100 : ""} className="w-24" />
      <Button variant="outline" disabled={pending}>Save</Button>
      {msg && <span role="status" className={`text-xs ${msg.ok ? "text-muted-foreground" : "text-destructive"}`}>{msg.t}</span>}
    </form>
  );
}

export function EditProductForm({ product, categories }: { product: { id: number; name: string; description: string; categoryId: number }; categories: { id: number; name: string }[] }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <details className="border-b p-4">
      <summary className="cursor-pointer text-sm font-medium">Edit details</summary>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const r = await updateProductDetails(product.id, { name: String(fd.get("name")), categoryId: Number(fd.get("categoryId")), description: String(fd.get("description") ?? "") });
            setMsg({ ok: r.ok, t: r.ok ? (r.message ?? "Saved") : r.error });
          });
        }}
      >
        <Field label="Name"><Input name="name" required defaultValue={product.name} /></Field>
        <Field label="Category">
          <NativeSelect name="categoryId" defaultValue={product.categoryId}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect>
        </Field>
        <Field label="Description" className="sm:col-span-2"><Textarea name="description" rows={3} defaultValue={product.description} /></Field>
        <div className="sm:col-span-2"><Button disabled={pending}>{pending ? "Saving…" : "Save details"}</Button></div>
        <div aria-live="polite" className="sm:col-span-2">{msg && <Notice kind={msg.ok ? "success" : "error"}>{msg.t}</Notice>}</div>
      </form>
    </details>
  );
}

export function AddVariantForm({ productId, defaultPrice }: { productId: number; defaultPrice: number }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <details className="border-t p-4">
      <summary className="cursor-pointer text-sm font-medium">Add a size</summary>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const cmp = String(fd.get("compareAt") ?? "").trim();
          start(async () => {
            const r = await addProductVariant(productId, {
              size: String(fd.get("size")), dimensions: String(fd.get("dimensions") ?? ""), price: Number(fd.get("price")),
              compareAt: cmp ? Number(cmp) : null, stock: Number(fd.get("stock")),
            });
            setMsg({ ok: r.ok, t: r.ok ? (r.message ?? "Added") : r.error });
            if (r.ok) form.reset();
          });
        }}
      >
        <Field label="Size name"><Input name="size" required placeholder="Small, Medium, Large" /></Field>
        <Field label="Dimensions"><Input name="dimensions" placeholder="30 × 40 cm" /></Field>
        <Field label="Price (₹)"><Input name="price" type="number" step="0.01" min="1" required defaultValue={defaultPrice / 100} /></Field>
        <Field label="Was (₹)"><Input name="compareAt" type="number" step="0.01" min="0" /></Field>
        <Field label="Stock"><Input name="stock" type="number" min="0" defaultValue={10} required /></Field>
        <div className="sm:col-span-5"><Button disabled={pending}>{pending ? "Adding…" : "Add variant"}</Button></div>
        <div aria-live="polite" className="sm:col-span-5">{msg && <Notice kind={msg.ok ? "success" : "error"}>{msg.t}</Notice>}</div>
      </form>
    </details>
  );
}

export function PromoToggle({ code, active }: { code: string; active: boolean }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={pending} aria-label={`${active ? "Deactivate" : "Activate"} ${code}`}
        onClick={() => start(async () => { const r = await togglePromo(code, !active); setErr(r.ok ? null : r.error); })}>
        {active ? "Deactivate" : "Activate"}
      </Button>
      {err && <span role="alert" className="text-xs text-destructive">{err}</span>}
    </span>
  );
}

export function SizeEditor({ variantId, size, dimensions }: { variantId: number; size: string; dimensions: string }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await updateVariantSize(variantId, { size: String(fd.get("size")), dimensions: String(fd.get("dimensions") ?? "") });
          setMsg({ ok: r.ok, t: r.ok ? "Saved" : r.error });
        });
      }}
    >
      <Label className="sr-only" htmlFor={`sz-${variantId}`}>Size name</Label>
      <Input id={`sz-${variantId}`} name="size" required maxLength={30} defaultValue={size} className="w-28" />
      <Label className="sr-only" htmlFor={`dm-${variantId}`}>Dimensions for {size}</Label>
      <Input id={`dm-${variantId}`} name="dimensions" maxLength={40} placeholder="e.g. 30 × 40 cm" defaultValue={dimensions} className="w-36" />
      <Button variant="outline" disabled={pending}>Save</Button>
      {msg && <span role="status" className={`text-xs ${msg.ok ? "text-muted-foreground" : "text-destructive"}`}>{msg.t}</span>}
    </form>
  );
}
