"use client";
import { useState, useTransition } from "react";
import { HeartIcon } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { toggleWishlist } from "@/app/actions/engage";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Notice, StockBadge } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

export type VariantOption = {
  id: number; label: string; color: string; size: string; dimensions: string | null; priceCents: number; compareAt: number | null; available: number;
};

/** Pill/tile toggle used for colour and size choices (selected state is also exposed via aria-pressed). */
const choice = (selected: boolean) =>
  cn(
    "h-auto rounded-lg border px-4 py-2 font-normal",
    // The dark: variants are needed because the outline Button sets dark:bg-input/30, which would otherwise win in dark mode.
    selected
      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:hover:bg-primary/90"
      : "bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent",
  );

export function AddToCart({ variants, productId, initiallySaved }: { variants: VariantOption[]; productId: number; initiallySaved: boolean }) {
  const colors = [...new Set(variants.map((v) => v.color))];
  const first = variants.find((v) => v.available > 0) ?? variants[0];
  const [color, setColor] = useState(first.color);
  const [variantId, setVariantId] = useState<number | null>(first.available > 0 ? first.id : null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, start] = useTransition();

  const sizes = variants.filter((v) => v.color === color);
  const selected = variants.find((v) => v.id === variantId) ?? null;
  const max = selected ? Math.min(selected.available, 20) : 1;

  return (
    <div className="space-y-6">
      {colors.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Colour: <span className="text-muted-foreground">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const any = variants.some((v) => v.color === c && v.available > 0);
              return (
                <Button
                  key={c} type="button" variant="outline" aria-pressed={c === color}
                  onClick={() => {
                    setColor(c);
                    const next = variants.find((v) => v.color === c && v.available > 0);
                    setVariantId(next?.id ?? null);
                    setQty(1);
                  }}
                  className={cn(choice(c === color), "rounded-full py-1.5", !any && "line-through opacity-60")}
                >
                  {c}
                </Button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{sizes[0]?.size === "One size" ? "Details" : "Choose a size"}</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((v) => {
            const out = v.available <= 0;
            return (
              <Button
                key={v.id} type="button" variant="outline" disabled={out} aria-pressed={v.id === variantId}
                aria-label={`${v.size}${v.dimensions ? ` ${v.dimensions}` : ""}${out ? ", sold out" : ""}`}
                onClick={() => { setVariantId(v.id); setQty(1); setMsg(null); }}
                className={cn(choice(v.id === variantId), "inline-block min-w-14 text-center", out && "line-through")}
              >
                {/* Keep the space between the spans so the visible text ("Medium 45 × 60 cm") matches the aria-label. */}
                <span className="block font-medium">{v.size}</span>{" "}
                {v.dimensions && <span className={cn("block text-xs", v.id === variantId ? "text-primary-foreground/90" : "text-muted-foreground")}>{v.dimensions}</span>}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {selected && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-lg font-semibold">{formatMoney(selected.priceCents)}</span>
          {selected.dimensions && <span className="text-muted-foreground">{selected.size}: {selected.dimensions}</span>}
          <StockBadge available={selected.available} />
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Qty
          <NativeSelect className="w-20" value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={!selected}>
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
          </NativeSelect>
        </label>
        <Button
          type="button" size="lg" disabled={!selected || pending}
          onClick={() =>
            start(async () => {
              const r = await addToCart(selected!.id, qty);
              setMsg(r.ok ? { kind: "success", text: r.message ?? "Added to cart" } : { kind: "error", text: r.error });
            })
          }
        >
          {pending ? "Adding…" : selected ? "Add to cart" : "Select an in-stock option"}
        </Button>
        <Button
          type="button" size="lg" variant="outline" aria-pressed={saved}
          onClick={() =>
            start(async () => {
              const r = await toggleWishlist(productId);
              if (r.ok) setSaved(!!r.saved);
              else setMsg({ kind: "error", text: r.error });
            })
          }
        >
          <HeartIcon aria-hidden className={cn(saved && "fill-current text-primary")} />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      <div aria-live="polite" className="min-h-10">{msg && <Notice kind={msg.kind}>{msg.text}</Notice>}</div>
    </div>
  );
}
