import "dotenv/config";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db, pool } from "@/lib/db";
import { account, categories, products, promoCodes, user, variants } from "@/db/schema";
import { eq } from "drizzle-orm";

// "paintings": Small/Medium/Large with editable dimensions. "one": a single "One size" variant (handmade pieces).
type Seed = { slug: string; name: string; cat: string; price: number; compareAt?: number; desc: string; sizes: "paintings" | "one"; dims?: string };

const CATS = [
  { slug: "paintings", name: "Paintings" },
  { slug: "clay-toys", name: "Clay Art & Toys" },
  { slug: "crochet", name: "Crochet Art" },
  { slug: "decor", name: "Handmade Decor" },
];

// Dimensions are stored per variant and are editable by an admin afterwards.
// Item prices below are for Small; Medium and Large are scaled and rounded to the nearest ₹50 (Small is exact).
const PAINTING_SIZES = [
  { size: "Small", dims: "30 × 40 cm", mult: 1 },
  { size: "Medium", dims: "45 × 60 cm", mult: 1.75 },
  { size: "Large", dims: "60 × 90 cm", mult: 3 },
];

// Prices in rupees here; stored as paise.
const ITEMS: Seed[] = [
  { slug: "golden-hour-meadow", name: "Golden Hour Meadow", cat: "paintings", price: 2499, compareAt: 2999, sizes: "paintings", desc: "Acrylic on stretched canvas: wildflowers catching the last warm light of the day. Framed and ready to hang." },
  { slug: "monsoon-reflections", name: "Monsoon Reflections", cat: "paintings", price: 2799, sizes: "paintings", desc: "Rain-soaked streets glowing in soft blues and ambers, painted in layered acrylics on canvas." },
  { slug: "blue-lotus-pond", name: "Blue Lotus Pond", cat: "paintings", price: 2299, sizes: "paintings", desc: "A still pond and a single blue lotus in watercolour-style washes on heavyweight cotton canvas." },
  { slug: "abstract-ember", name: "Abstract Ember", cat: "paintings", price: 3299, sizes: "paintings", desc: "Bold abstract in burnt orange, crimson and charcoal, built up with a palette knife for real texture." },
  { slug: "himalayan-dawn", name: "Himalayan Dawn", cat: "paintings", price: 3599, compareAt: 4199, sizes: "paintings", desc: "Snow peaks turning pink at first light, oil on canvas with a hand-finished wooden frame." },
  { slug: "quiet-harbour", name: "Quiet Harbour", cat: "paintings", price: 1999, sizes: "paintings", desc: "Small fishing boats at rest in a calm bay, painted in muted coastal tones." },
  { slug: "handmade-clay-elephant", name: "Handmade Clay Elephant", cat: "clay-toys", price: 899, sizes: "one", dims: "12 cm tall", desc: "Hand-sculpted, air-dried and hand-painted clay elephant with tiny floral motifs." },
  { slug: "clay-tea-set-miniature", name: "Clay Tea-Set Miniature", cat: "clay-toys", price: 1299, compareAt: 1499, sizes: "one", dims: "Teapot, 2 cups, tray", desc: "A miniature tea set modelled by hand, glazed and fired for display or play." },
  { slug: "painted-clay-owl", name: "Painted Clay Owl", cat: "clay-toys", price: 699, sizes: "one", dims: "10 cm tall", desc: "A wide-eyed owl in hand-painted clay, each one slightly different." },
  { slug: "clay-fridge-magnet-set", name: "Clay Fridge Magnet Set", cat: "clay-toys", price: 499, sizes: "one", dims: "Set of 4", desc: "Four tiny hand-modelled clay magnets: a mango, a chai cup, a kite and a lotus." },
  { slug: "crochet-amigurumi-bunny", name: "Crochet Amigurumi Bunny", cat: "crochet", price: 799, sizes: "one", dims: "18 cm tall", desc: "A soft crocheted bunny in cotton yarn with safety eyes, stuffed with hypoallergenic fibre." },
  { slug: "crochet-sunflower-bouquet", name: "Crochet Sunflower Bouquet", cat: "crochet", price: 1099, compareAt: 1299, sizes: "one", dims: "5 flowers", desc: "Five everlasting crocheted sunflowers on wire stems. They never wilt." },
  { slug: "crochet-wall-hanging", name: "Crochet Wall Hanging", cat: "crochet", price: 1499, sizes: "one", dims: "40 × 60 cm", desc: "A boho granny-square wall hanging in earthy tones on a wooden dowel." },
  { slug: "macrame-plant-hanger", name: "Macrame Plant Hanger", cat: "decor", price: 899, sizes: "one", dims: "90 cm long", desc: "Hand-knotted cotton cord plant hanger that holds a pot up to 20 cm wide." },
  { slug: "embroidered-wall-hoop", name: "Embroidered Wall Hoop", cat: "decor", price: 1199, sizes: "one", dims: "25 cm hoop", desc: "Floral hand embroidery on linen, framed in a natural wood hoop." },
  { slug: "hand-painted-diya-set", name: "Hand-Painted Diya Set", cat: "decor", price: 649, sizes: "one", dims: "Set of 6", desc: "Six terracotta diyas hand-painted with traditional patterns." },
];

const round50 = (n: number) => Math.round(n / 50) * 50;

function stockFor(i: number, j: number) {
  // Deterministic spread, including a couple of low/zero-stock variants to exercise those UI states.
  return [12, 8, 15, 6, 20, 3, 10, 0][(i * 3 + j) % 8];
}

async function main() {
  await db.insert(categories).values(CATS).onConflictDoNothing();
  const cats = await db.select().from(categories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  for (const [i, it] of ITEMS.entries()) {
    const [p] = await db
      .insert(products)
      .values({ slug: it.slug, name: it.name, description: it.desc, categoryId: catId(it.cat), image: `/img/${it.slug}` })
      .onConflictDoNothing()
      .returning();
    if (!p) continue; // already seeded
    const defs = it.sizes === "paintings"
      ? PAINTING_SIZES.map((s) => ({ size: s.size, dims: s.dims, price: s.mult === 1 ? it.price : round50(it.price * s.mult), compareAt: it.compareAt ? (s.mult === 1 ? it.compareAt : round50(it.compareAt * s.mult)) : null }))
      : [{ size: "One size", dims: it.dims ?? null, price: it.price, compareAt: it.compareAt ?? null }];
    const rows = defs.map((d, j) => ({
      productId: p.id,
      sku: `${it.slug}-${d.size}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: d.dims ? `${d.size} · ${d.dims}` : d.size,
      options: { Color: "Default", Size: d.size, ...(d.dims ? { Dimensions: d.dims } : {}) },
      priceCents: d.price * 100,
      compareAtCents: d.compareAt ? d.compareAt * 100 : null,
      onHand: it.sizes === "one" ? stockFor(i, 1) || 4 : stockFor(i, j),
      reserved: 0,
    }));
    await db.insert(variants).values(rows).onConflictDoNothing();
  }

  await db
    .insert(promoCodes)
    .values([
      { code: "WELCOME10", type: "percent", value: 10, minSubtotalCents: 0 },
      { code: "FREESHIP", type: "free_shipping", value: 0, minSubtotalCents: 0 },
      { code: "FLAT200", type: "fixed", value: 20000, minSubtotalCents: 99900 },
    ])
    .onConflictDoNothing();

  // Admin account: password from ADMIN_PASSWORD, otherwise random and printed once.
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
    const id = crypto.randomUUID();
    await db.insert(user).values({ id, name: "Store Admin", email, emailVerified: true, role: "admin" });
    await db.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(password) });
    console.log(`\nAdmin created: ${email} / ${password}\n(Change this password; it is shown only once.)`);
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
