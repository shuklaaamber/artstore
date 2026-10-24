import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, promoCodes, variants } from "@/db/schema";

const MAX_CENTS = 100_000_000; // ₹10,00,000

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function checkPrices(priceCents: number, compareAtCents: number | null) {
  if (!Number.isInteger(priceCents) || priceCents < 100 || priceCents > MAX_CENTS) throw new Error("Price must be between ₹1 and ₹10,00,000.");
  if (compareAtCents != null) {
    if (!Number.isInteger(compareAtCents) || compareAtCents > MAX_CENTS) throw new Error("Compare-at price is out of range.");
    if (compareAtCents <= priceCents) throw new Error("Compare-at (original) price must be higher than the selling price.");
  }
}

/** Changes the live price of one variant. Existing orders keep their price (order_lines snapshot it); carts show the new price. */
export async function setVariantPrice(variantId: number, priceCents: number, compareAtCents: number | null) {
  checkPrices(priceCents, compareAtCents);
  const r = await db.update(variants).set({ priceCents, compareAtCents }).where(eq(variants.id, variantId)).returning({ id: variants.id });
  if (r.length === 0) throw new Error("Variant not found.");
}

export async function setProductDetails(productId: number, d: { name: string; description: string; categoryId: number }) {
  const r = await db.update(products).set(d).where(eq(products.id, productId)).returning({ id: products.id });
  if (r.length === 0) throw new Error("Product not found.");
}

const labelFor = (size: string, dimensions: string | null) => (dimensions ? `${size} · ${dimensions}` : size);

export async function addVariant(productId: number, d: { size: string; dimensions: string | null; priceCents: number; compareAtCents: number | null; stock: number }) {
  checkPrices(d.priceCents, d.compareAtCents);
  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, productId));
  if (!p) throw new Error("Product not found.");
  const sku = `${p.slug}-${slug(d.size)}`;
  try {
    const [v] = await db
      .insert(variants)
      .values({
        productId, sku, label: labelFor(d.size, d.dimensions), options: { Color: "Default", Size: d.size, ...(d.dimensions ? { Dimensions: d.dimensions } : {}) },
        priceCents: d.priceCents, compareAtCents: d.compareAtCents, onHand: d.stock,
      })
      .returning();
    return v;
  } catch (e) {
    if ((e as { cause?: { code?: string } })?.cause?.code === "23505") throw new Error("That size already exists for this product.");
    throw e;
  }
}

/** Renames a size and/or edits its dimensions (e.g. Medium, "45 × 60 cm"). The SKU is left unchanged. */
export async function setVariantSize(variantId: number, size: string, dimensions: string | null) {
  const [v] = await db.select().from(variants).where(eq(variants.id, variantId));
  if (!v) throw new Error("Variant not found.");
  const siblings = await db.select({ id: variants.id, options: variants.options }).from(variants).where(eq(variants.productId, v.productId));
  if (siblings.some((s) => s.id !== variantId && (s.options.Size ?? "").toLowerCase() === size.toLowerCase())) {
    throw new Error("Another size of this product already uses that name.");
  }
  const { Dimensions: _old, ...rest } = v.options;
  void _old;
  await db.update(variants).set({ label: labelFor(size, dimensions), options: { ...rest, Size: size, ...(dimensions ? { Dimensions: dimensions } : {}) } }).where(eq(variants.id, variantId));
}

/** Deactivating ends the promo now (existing orders are unaffected); reactivating clears the end date. */
export async function setPromoActive(code: string, active: boolean) {
  const r = await db.update(promoCodes).set({ endsAt: active ? null : new Date() }).where(eq(promoCodes.code, code)).returning({ code: promoCodes.code });
  if (r.length === 0) throw new Error("Promo not found.");
}
