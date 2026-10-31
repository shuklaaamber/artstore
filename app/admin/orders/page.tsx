import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { ADMIN_SETTABLE, canTransition, type OrderStatus } from "@/lib/orders";
import { OrderStatusSelect } from "@/components/AdminControls";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin: orders", robots: { index: false } };

export default async function AdminOrders() {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4">Order</TableHead>
              <TableHead scope="col">Customer</TableHead>
              <TableHead scope="col">Total</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <th scope="row" className="px-4 py-3 text-left font-medium">{o.number}</th>
                <TableCell>{o.email}</TableCell>
                <TableCell>{formatMoney(o.totalCents, o.currency)}</TableCell>
                <TableCell className="py-2">
                  <OrderStatusSelect
                    orderId={o.id} current={o.status}
                    options={ADMIN_SETTABLE.filter((s) => s === "cancelled" ? o.status === "pending" || canTransition(o.status as OrderStatus, s) : canTransition(o.status as OrderStatus, s))}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="p-6 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
