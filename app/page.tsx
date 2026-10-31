import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { db } from "@/lib/db";
import { categories } from "@/db/schema";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

export default async function Home() {
  const [cats, featured] = await Promise.all([db.select().from(categories), listProducts({ sort: "rating" })]);
  return (
    <div className="space-y-16">
      <section className="rounded-3xl bg-primary px-6 py-16 text-primary-foreground sm:px-12 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-widest opacity-80">New this week</p>
        <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Art made by hand, for your walls and shelves.</h1>
        <p className="mt-4 max-w-lg text-base opacity-90 sm:text-lg">Paintings in three sizes, clay toys, crochet and handmade decor. Free shipping over ₹999 and 30-minute holds at checkout.</p>
        <Button asChild size="lg" variant="secondary" className="mt-8">
          <Link href="/products">Shop all</Link>
        </Button>
      </section>

      <section aria-labelledby="cats">
        <h2 id="cats" className="mb-5 text-xl font-semibold tracking-tight">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cats.map((c) => (
            <li key={c.id}>
              <Card className="h-full py-0 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent">
                <Link href={`/products?category=${c.slug}`} className="block px-4 py-7 text-center font-medium outline-none">
                  {c.name}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="feat">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 id="feat" className="text-xl font-semibold tracking-tight">Collector favourites</h2>
          <Button asChild variant="outline">
            <Link href="/products">View all <ArrowRightIcon aria-hidden /></Link>
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.items.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} priority={i < 2} />)}
        </ul>
      </section>
    </div>
  );
}
