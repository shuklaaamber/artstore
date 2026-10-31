import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, variants } from "@/db/schema";
import { AddVariantForm, ArchiveButton, EditProductForm, NewProductForm, PriceEditor, SizeEditor, StockAdjuster } from "@/components/AdminControls";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin: products", robots: { index: false } };

export default async function AdminProducts() {
  const [cats, rows] = await Promise.all([
    db.select().from(categories),
    db.select({ p: products, v: variants }).from(products).innerJoin(variants, eq(variants.productId, products.id)).orderBy(asc(products.id), asc(variants.id)),
  ]);
  const grouped = new Map<number, { p: typeof products.$inferSelect; vs: (typeof variants.$inferSelect)[] }>();
  for (const { p, v } of rows) {
    if (!grouped.has(p.id)) grouped.set(p.id, { p, vs: [] });
    grouped.get(p.id)!.vs.push(v);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Products &amp; stock</h1>
      <NewProductForm categories={cats} />
      <div className="space-y-6">
        {[...grouped.values()].map(({ p, vs }) => (
          <section key={p.id} aria-label={p.name}>
            <Card className="gap-0 py-0">
              <header className="flex items-center justify-between gap-3 border-b p-4">
                <div className="space-y-1">
                  <h2 className="font-semibold">{p.name}</h2>
                  <Badge variant={p.status === "active" ? "secondary" : "outline"}>{p.status}</Badge>
                </div>
                <ArchiveButton productId={p.id} status={p.status} />
              </header>
              <EditProductForm product={{ id: p.id, name: p.name, description: p.description, categoryId: p.categoryId }} categories={cats} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="px-4">Size &amp; dimensions</TableHead>
                    <TableHead scope="col">On hand</TableHead>
                    <TableHead scope="col">Reserved</TableHead>
                    <TableHead scope="col">Adjust</TableHead>
                    <TableHead scope="col">Price (₹) / was</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vs.map((v) => (
                    <TableRow key={v.id}>
                      <th scope="row" className="px-4 py-3 text-left font-normal"><SizeEditor variantId={v.id} size={v.options.Size ?? "One size"} dimensions={v.options.Dimensions ?? ""} /></th>
                      <TableCell>{v.onHand}</TableCell>
                      <TableCell>{v.reserved}</TableCell>
                      <TableCell className="py-2"><StockAdjuster variantId={v.id} label={`${p.name} ${v.label}`} /></TableCell>
                      <TableCell className="py-2 pr-4"><PriceEditor variantId={v.id} label={`${p.name} ${v.label}`} price={v.priceCents} compareAt={v.compareAtCents} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AddVariantForm productId={p.id} defaultPrice={vs[0].priceCents} />
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
