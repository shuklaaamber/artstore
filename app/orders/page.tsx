import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/shop-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/orders");
  const rows = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));

  return (
    <section aria-labelledby="h" className="space-y-5">
      <h1 id="h" className="text-2xl font-bold tracking-tight">Your orders</h1>
      {rows.length === 0 ? (
        <EmptyState dashed title="You haven’t placed any orders yet.">
          <Button asChild><Link href="/products">Start shopping</Link></Button>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <ul>
            {rows.map((o, i) => (
              <li key={o.id}>
                {i > 0 && <Separator />}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link href={`/orders/${o.number}`} className="font-medium hover:underline">{o.number}</Link>
                    <p className="text-sm text-muted-foreground">{o.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{o.status.replace("_", " ")}</Badge>
                  <span className="font-semibold">{formatMoney(o.totalCents, o.currency)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
