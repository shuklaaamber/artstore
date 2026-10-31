import type { Metadata } from "next";
import Link from "next/link";
import { getCartView } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { PromoBox, QtyControls } from "@/components/CartControls";
import { TotalsTable } from "@/components/Totals";
import { Notice } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
        <p className="text-muted-foreground">Find something you like and it will show up here.</p>
        <Button asChild size="lg"><Link href="/products">Browse products</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section aria-labelledby="h">
        <h1 id="h" className="mb-5 text-2xl font-bold tracking-tight">Your cart ({cart.itemCount})</h1>
        <Card className="py-0">
          <ul>
            {cart.lines.map((l, i) => (
              <li key={l.variantId}>
                {i > 0 && <Separator />}
                <div className="flex gap-4 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt="" width={96} height={120} loading="lazy" className="h-28 w-24 shrink-0 rounded-lg border object-cover" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link href={`/products/${l.slug}`} className="font-medium hover:underline">{l.productName}</Link>
                        <p className="text-sm text-muted-foreground">{l.label}</p>
                      </div>
                      <p className="font-semibold">{formatMoney(l.unitPriceCents * l.qty)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatMoney(l.unitPriceCents)} each</p>
                    {l.problem && <Notice kind="error">{l.problem}. Update the quantity or remove it to continue.</Notice>}
                    <QtyControls variantId={l.variantId} qty={l.qty} max={l.available} name={`${l.productName} ${l.label}`} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <aside aria-label="Order summary" className="self-start lg:sticky lg:top-24">
        <Card>
          <CardContent className="space-y-4">
            <PromoBox applied={cart.promoCode} error={cart.promoError} />
            <TotalsTable t={cart.totals} promo={cart.promoCode} />
            {cart.hasProblems ? (
              <Notice kind="error">Fix the items marked above to check out.</Notice>
            ) : (
              <Button asChild size="lg" className="w-full"><Link href="/checkout">Checkout</Link></Button>
            )}
            <p className="text-xs text-muted-foreground">Prices are recalculated securely at checkout.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
