import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartView } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { CheckoutForm } from "@/components/CheckoutForm";
import { TotalsTable } from "@/components/Totals";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([getCartView(), getUser()]);
  if (cart.lines.length === 0) redirect("/cart");
  if (cart.hasProblems) redirect("/cart");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-labelledby="h">
        <h1 id="h" className="mb-5 text-2xl font-bold tracking-tight">Checkout</h1>
        {!user && (
          <p className="mb-5 text-sm text-muted-foreground">
            Checking out as a guest. <Link className="text-foreground underline underline-offset-4" href="/sign-in?next=/checkout">Sign in</Link> to track orders.
          </p>
        )}
        <CheckoutForm defaultEmail={user?.email ?? ""} defaultName={user?.name ?? ""} totalLabel={formatMoney(cart.totals.totalCents)} />
      </section>
      <aside aria-label="Order summary" className="self-start lg:sticky lg:top-24">
        <Card>
          <CardHeader><h2 className="font-heading text-base font-medium">Order summary</h2></CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {cart.lines.map((l) => (
                <li key={l.variantId} className="flex justify-between gap-3">
                  <span>{l.qty} × {l.productName} <span className="text-muted-foreground">({l.label})</span></span>
                  <span>{formatMoney(l.unitPriceCents * l.qty)}</span>
                </li>
              ))}
            </ul>
            <TotalsTable t={cart.totals} promo={cart.promoCode} />
            <p className="text-xs text-muted-foreground">Stock is reserved for 30 minutes after you press Pay.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
