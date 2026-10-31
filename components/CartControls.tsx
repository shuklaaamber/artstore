"use client";
import { useState, useTransition } from "react";
import { applyPromo, removeLine, removePromo, updateQty } from "@/app/actions/cart";
import { Notice } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

export function QtyControls({ variantId, qty, max, name }: { variantId: number; qty: number; max: number; name: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const opts = Math.max(1, Math.min(max, 20));
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        <span className="sr-only">Quantity for {name}</span>
        <NativeSelect
          size="sm" className="w-20"
          value={Math.min(qty, opts)} disabled={pending}
          onChange={(e) => start(async () => { const r = await updateQty(variantId, Number(e.target.value)); setErr(r.ok ? null : r.error); })}
        >
          {Array.from({ length: opts }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
        </NativeSelect>
      </label>
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" disabled={pending} aria-label={`Remove ${name}`}
        onClick={() => start(async () => { await removeLine(variantId); })}>
        Remove
      </Button>
      {err && <span role="alert" className="text-destructive">{err}</span>}
    </div>
  );
}

export function PromoBox({ applied, error }: { applied: string | null; error: string | null }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(error);
  const [pending, start] = useTransition();

  if (applied) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
        <span>Code <strong>{applied}</strong> applied{error ? "" : "."}</span>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { await removePromo(); setMsg(null); })}>Remove</Button>
        {error && <p role="alert" className="basis-full text-destructive">{error}</p>}
      </div>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) return;
        start(async () => { const r = await applyPromo(code); setMsg(r.ok ? null : r.error); if (r.ok) setCode(""); });
      }}
    >
      <Label htmlFor="promo">Promo code</Label>
      <div className="flex gap-2">
        <Input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WELCOME10" autoComplete="off" />
        <Button variant="outline" disabled={pending}>{pending ? "…" : "Apply"}</Button>
      </div>
      <div aria-live="polite">{msg && <Notice kind="error">{msg}</Notice>}</div>
    </form>
  );
}
