import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderLines, orders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { TotalsTable } from "@/components/Totals";
import { Notice } from "@/components/shop-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export const dynamic = "force-dynamic";

const COPY: Record<string, { kind: "info" | "error" | "success"; text: string }> = {
  pending: { kind: "info", text: "Waiting for payment. If you just paid, this updates within a few seconds; refresh to check." },
  paid: { kind: "success", text: "Payment received. Thank you! We’re getting your order ready." },
  needs_review: { kind: "info", text: "We received your payment but need to check the order manually. We’ll be in touch by email." },
  cancelled: { kind: "error", text: "This order was cancelled and the items were released." },
  failed: { kind: "error", text: "Payment could not be started for this order." },
};

export default async function OrderPage({
  params, searchParams,
}: { params: Promise<{ number: string }>; searchParams: Promise<{ e?: string; paid?: string }> }) {
  const [{ number }, sp, user] = await Promise.all([params, searchParams, getUser()]);
  const [o] = await db.select().from(orders).where(eq(orders.number, number));
  // Owner, or a guest who knows the order number AND the checkout email. Same 404 either way.
  const allowed = o && ((user && o.userId === user.id) || user?.role === "admin" || (sp.e && sp.e.toLowerCase() === o.email.toLowerCase()));
  if (!o || !allowed) notFound();

  const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, o.id));
  const copy = COPY[o.status];
  const addr = o.shippingAddress;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Order</p>
        <h1 className="text-2xl font-bold tracking-tight">{o.number}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          Status: <Badge variant="outline" className="capitalize">{o.status.replace("_", " ")}</Badge>
        </p>
      </header>
      {copy && <Notice kind={copy.kind}>{copy.text}</Notice>}

      <section aria-labelledby="items">
        <Card>
          <CardHeader><h2 id="items" className="font-heading text-base font-medium">Items</h2></CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span>{l.qty} × {l.name}</span><span>{formatMoney(l.unitPriceCents * l.qty, o.currency)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <TotalsTable t={{ subtotalCents: o.subtotalCents, discountCents: o.discountCents, shippingCents: o.shippingCents, taxCents: o.taxCents, totalCents: o.totalCents }} promo={o.promoCode} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="ship">
        <Card>
          <CardHeader><h2 id="ship" className="font-heading text-base font-medium">Shipping to</h2></CardHeader>
          <CardContent>
            <address className="text-sm not-italic text-muted-foreground">
              {addr.name}<br />{addr.line1}<br />{addr.city}, {addr.state} {addr.pincode}<br />{addr.phone}
            </address>
          </CardContent>
        </Card>
      </section>
      <Button asChild size="lg"><Link href="/products">Continue shopping</Link></Button>
    </article>
  );
}
