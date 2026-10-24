import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const EMAIL = `e2e+${Date.now()}@example.com`;

async function addOwl(page: Page) {
  await page.goto("/products?q=owl");
  await page.getByRole("link", { name: /Painted Clay Owl/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Painted Clay Owl" })).toBeVisible();
  await page.getByRole("button", { name: /^One size/ }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added to cart")).toBeVisible();
}

test("browse, search, filter and sort", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/products");
  await expect(page.getByText(/16 products/)).toBeVisible();
  await page.goto("/products?category=paintings");
  await expect(page.getByText(/6 products/)).toBeVisible();
  await page.goto("/products?q=zzzznothing");
  await expect(page.getByText(/Nothing matched/)).toBeVisible();
  await page.goto("/products?sort=price-asc");
  const first = page.locator("ul li h2").first();
  await expect(first).toHaveText("Clay Fridge Magnet Set");
});

test("cart: add, promo, quantity, remove, empty state", async ({ page }) => {
  await addOwl(page);
  await page.goto("/cart");
  await expect(page.getByText("Your cart (1)")).toBeVisible();
  await expect(page.getByText("₹49").first()).toBeVisible(); // shipping on a ₹699 cart
  await page.getByLabel("Promo code").fill("NOPE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "isn't valid" })).toBeVisible();
  await page.getByLabel("Promo code").fill("welcome10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/WELCOME10/).first()).toBeVisible();
  await expect(page.getByText("−₹69.90")).toBeVisible(); // 10% of 699
  await page.getByRole("button", { name: /^Remove/ }).first().click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("checkout ignores forged prices and opens the real Razorpay test checkout", async ({ page, request }) => {
  await addOwl(page);
  await page.goto("/checkout");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Full name").fill("E2E Tester");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Address").fill("12 Test Street");
  await page.getByLabel("City").fill("Pune");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("PIN code").fill("411001");

  // Intercept the request and inject forged money fields; the server must ignore them.
  await page.route("**/api/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    await route.continue({ postData: JSON.stringify({ ...body, total: 1, totalCents: 1, price: 1, unitPriceCents: 1, discount: 99999 }) });
  });
  const respPromise = page.waitForResponse("**/api/checkout");
  await page.getByRole("button", { name: /^Pay / }).click();
  const resp = await respPromise;
  expect(resp.status()).toBe(200);
  const data = await resp.json();
  expect(data.amountCents).toBe(69900 + 4900); // DB price + shipping, not the forged 1
  if (data.provider === "mock") {
    expect(data.providerOrderId).toMatch(/^mock_order_/); // local runs without Razorpay keys
    return;
  }
  expect(data.providerOrderId).toMatch(/^order_/);

  // The Razorpay modal (an iframe from checkout.razorpay.com) should open for that order.
  await expect(page.locator("iframe.razorpay-checkout-frame, iframe[src*='razorpay']").first()).toBeAttached({ timeout: 30_000 });
});

test("guest cannot read someone else's order or the admin area", async ({ page }) => {
  const r = await page.goto("/orders/ORD-DOESNOTEXIST?e=a@b.c");
  expect(r?.status()).toBe(404);
  const a = await page.goto("/admin/products");
  expect(a?.status()).toBe(404);
  const w = await page.request.post("/api/razorpay/webhook", { data: "{}", headers: { "x-razorpay-signature": "bad", "x-razorpay-event-id": "e1" } });
  expect(w.status()).toBe(400);
  const v = await page.request.post("/api/razorpay/verify", { data: { razorpay_order_id: "order_x", razorpay_payment_id: "pay_x", razorpay_signature: "bad" } });
  expect(v.status()).toBe(400);
  const c = await page.request.get("/api/cron/release");
  expect(c.status()).toBe(401);
});

test.describe("accessibility (axe, WCAG 2.x A/AA)", () => {
  for (const path of ["/", "/products", "/products/golden-hour-meadow", "/cart", "/sign-in"]) {
    test(`no violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
