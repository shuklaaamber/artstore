import { afterAll, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import crypto from "node:crypto";
import { db, pool } from "@/lib/db";
import { orders, products, promoCodes, variants } from "@/db/schema";
import { startCheckout } from "@/lib/checkout";
import { addVariant, setProductDetails, setPromoActive, setVariantPrice, setVariantSize } from "@/lib/admin-catalog";
import { resolvePromo } from "@/lib/promo";
import { listProducts } from "@/lib/catalog";

// Runs against the DB in DATABASE_URL with uniquely tagged rows that are deleted afterwards.
// (The server actions wrap these functions with requireAdmin; auth itself is covered by lib/auth.)
const TAG = `itest-adm-${crypto.randomBytes(4).toString("hex")}`;
const EMAIL = `${TAG}@example.com`;
const ADDRESS = { name: "Test", phone: "9876543210", line1: "1 Test St", city: "Pune", state: "MH", pincode: "411001" };

async function makeProduct(price = 50000, stock = 5) {
  const [p] = await db.insert(products).values({ slug: `${TAG}-${crypto.randomBytes(3).toString("hex")}`, name: "Admin test", categoryId: 1 }).returning();
  const [v] = await db.insert(variants).values({ productId: p.id, sku: `${p.slug}-sku`, label: "Small · 30 × 40 cm", options: { Color: "Default", Size: "Small", Dimensions: "30 × 40 cm" }, priceCents: price, onHand: stock }).returning();
  return { p, v };
}

afterAll(async () => {
  await db.delete(orders).where(eq(orders.email, EMAIL));
  await db.delete(products).where(like(products.slug, `${TAG}%`));
  await db.delete(promoCodes).where(like(promoCodes.code, `${TAG.toUpperCase()}%`));
  await pool.end();
});

describe("admin catalog", () => {
  it("price change applies to new checkouts but not to an existing order", async () => {
    const { v } = await makeProduct(50000, 5);
    const before = await startCheckout({ userId: null, email: EMAIL, address: ADDRESS, lines: [{ variantId: v.id, qty: 1 }], idempotencyKey: crypto.randomUUID() });
    expect(before.amountCents).toBe(50000 + 4900);

    await setVariantPrice(v.id, 30000, 40000);
    const after = await startCheckout({ userId: null, email: EMAIL, address: ADDRESS, lines: [{ variantId: v.id, qty: 1 }], idempotencyKey: crypto.randomUUID() });
    expect(after.amountCents).toBe(30000 + 4900);

    const [old] = await db.select().from(orders).where(eq(orders.number, before.orderNumber));
    expect(old.totalCents).toBe(50000 + 4900); // snapshot unchanged
  });

  it("rejects bad prices (below ₹1, compare-at not above price)", async () => {
    const { v } = await makeProduct();
    await expect(setVariantPrice(v.id, 50, null)).rejects.toThrow(/between/);
    await expect(setVariantPrice(v.id, 10000, 10000)).rejects.toThrow(/higher/);
    await expect(setVariantPrice(999_999_999, 10000, null)).rejects.toThrow(/not found/);
    expect((await db.select().from(variants).where(eq(variants.id, v.id)))[0].priceCents).toBe(50000);
  });

  it("edits product details", async () => {
    const { p } = await makeProduct();
    await setProductDetails(p.id, { name: "Renamed", description: "New text", categoryId: 1 });
    const [row] = await db.select().from(products).where(eq(products.id, p.id));
    expect([row.name, row.description, row.slug]).toEqual(["Renamed", "New text", p.slug]);
  });

  it("adds a size with dimensions and stock, and refuses a duplicate size", async () => {
    const { p } = await makeProduct();
    const v = await addVariant(p.id, { size: "Large", dimensions: "60 × 90 cm", priceCents: 69900, compareAtCents: 79900, stock: 7 });
    expect([v.label, v.onHand, v.priceCents, v.options]).toEqual(["Large · 60 × 90 cm", 7, 69900, { Color: "Default", Size: "Large", Dimensions: "60 × 90 cm" }]);
    await expect(addVariant(p.id, { size: "Large", dimensions: null, priceCents: 69900, compareAtCents: null, stock: 1 })).rejects.toThrow(/already exists/);
  });

  it("edits a size's name and dimensions, refuses a name another size uses", async () => {
    const { p, v } = await makeProduct();
    await addVariant(p.id, { size: "Medium", dimensions: "45 × 60 cm", priceCents: 80000, compareAtCents: null, stock: 3 });
    await setVariantSize(v.id, "Small", "35 × 45 cm");
    const [row] = await db.select().from(variants).where(eq(variants.id, v.id));
    expect([row.label, row.options]).toEqual(["Small · 35 × 45 cm", { Color: "Default", Size: "Small", Dimensions: "35 × 45 cm" }]);
    await expect(setVariantSize(v.id, "medium", null)).rejects.toThrow(/already uses/);
    await setVariantSize(v.id, "Small", null); // clearing dimensions drops them from label and options
    const [again] = await db.select().from(variants).where(eq(variants.id, v.id));
    expect([again.label, again.options]).toEqual(["Small", { Color: "Default", Size: "Small" }]);
  });

  it("listing shows the cheapest size's price with that same size's 'was' price", async () => {
    const word = `zzcmp${crypto.randomBytes(3).toString("hex")}`;
    const { p, v } = await makeProduct(250000, 3);
    await db.update(products).set({ name: word }).where(eq(products.id, p.id));
    await setVariantPrice(v.id, 250000, 300000); // Small: ₹2,500, was ₹3,000
    await addVariant(p.id, { size: "Large", dimensions: "60 × 90 cm", priceCents: 750000, compareAtCents: 900000, stock: 2 });
    const { items } = await listProducts({ q: word });
    expect(items).toHaveLength(1);
    expect([items[0].minPrice, items[0].compareAt]).toEqual([250000, 300000]); // not the Large size's ₹9,000
  });

  it("deactivating a promo blocks it; reactivating restores it", async () => {
    const code = `${TAG.toUpperCase()}-OFF`;
    await db.insert(promoCodes).values({ code, type: "percent", value: 10 });
    await setPromoActive(code, false);
    await expect(resolvePromo(code, 100000)).rejects.toThrow(/expired/);
    await setPromoActive(code, true);
    await expect(resolvePromo(code, 100000)).resolves.toBeDefined();
  });
});
