import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { promoCodes } from "@/db/schema";
import { NewPromoForm, PromoToggle } from "@/components/AdminControls";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin: promos", robots: { index: false } };

export default async function AdminPromos() {
  const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.code));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Promo codes</h1>
      <NewPromoForm />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4">Code</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Value</TableHead>
              <TableHead scope="col">Min (₹)</TableHead>
              <TableHead scope="col">Used</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const now = new Date();
              const active = !(p.endsAt && p.endsAt < now) && !(p.startsAt && p.startsAt > now);
              return (
                <TableRow key={p.code}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">{p.code}</th>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>{p.type === "percent" ? `${p.value}%` : p.type === "fixed" ? `₹${p.value / 100}` : "-"}</TableCell>
                  <TableCell>{p.minSubtotalCents / 100}</TableCell>
                  <TableCell>{p.redeemed}{p.maxRedemptions ? ` / ${p.maxRedemptions}` : ""}</TableCell>
                  <TableCell className="py-2"><PromoToggle code={p.code} active={active} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
