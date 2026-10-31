import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { categories } from "@/db/schema";
import { listProducts, type SortKey } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shop-ui";

type SP = Promise<{ q?: string; category?: string; sort?: string; page?: string }>;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
];

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  // Filtered/sorted/paginated/search variants are not separate pages for search engines.
  const filtered = sp.q || sp.sort || (sp.page && sp.page !== "1");
  return {
    title: sp.q ? `Search: ${sp.q}` : "Shop all art",
    description: "Browse paintings, clay art and toys, crochet art and handmade decor.",
    alternates: { canonical: "/products" + (sp.category && !filtered ? `?category=${encodeURIComponent(sp.category)}` : "") },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function Products({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sort = (SORTS.find((s) => s.key === sp.sort)?.key ?? "newest") as SortKey;
  const [cats, { items, total, page, pages }] = await Promise.all([
    db.select().from(categories),
    listProducts({ q: sp.q, category: sp.category, sort, page: Number(sp.page) || 1 }),
  ]);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, category: sp.category, sort: sp.sort, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside aria-label="Filters" className="space-y-8 md:sticky md:top-24 md:self-start">
        <form action="/products" className="space-y-2">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" type="search" defaultValue={sp.q} />
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          <Button className="w-full">Search</Button>
        </form>
        <nav aria-label="Categories">
          <h2 className="mb-2 text-sm font-medium">Category</h2>
          <ul className="flex flex-wrap gap-1 text-sm md:flex-col">
            <li><Button asChild size="sm" variant={!sp.category ? "secondary" : "ghost"} className="w-full justify-start"><Link aria-current={!sp.category ? "page" : undefined} href={href({ category: undefined, page: undefined })}>All</Link></Button></li>
            {cats.map((c) => (
              <li key={c.id}>
                <Button asChild size="sm" variant={sp.category === c.slug ? "secondary" : "ghost"} className="w-full justify-start">
                  <Link aria-current={sp.category === c.slug ? "page" : undefined} href={href({ category: c.slug, page: undefined })}>{c.name}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <section aria-labelledby="h">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="h" className="text-2xl font-bold tracking-tight">{sp.q ? `Results for “${sp.q}”` : "All products"}</h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">{total} {total === 1 ? "product" : "products"}</p>
          </div>
          <nav aria-label="Sort" className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <Button key={s.key} asChild size="sm" variant={sort === s.key ? "default" : "outline"} className="rounded-full">
                <Link href={href({ sort: s.key === "newest" ? undefined : s.key, page: undefined })} aria-current={sort === s.key ? "true" : undefined}>
                  {s.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        {items.length === 0 ? (
          <EmptyState dashed title={`Nothing matched${sp.q ? ` “${sp.q}”` : ""}.`}>
            <p className="text-sm text-muted-foreground">Check the spelling, try a broader word like “tee”, or browse a category.</p>
            <Button asChild><Link href="/products">Clear filters</Link></Button>
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} level={2} />)}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Button asChild variant="outline"><Link href={href({ page: String(page - 1) })}>Previous</Link></Button>}
            <span className="px-2 text-muted-foreground">Page {page} of {pages}</span>
            {page < pages && <Button asChild variant="outline"><Link href={href({ page: String(page + 1) })}>Next</Link></Button>}
          </nav>
        )}
      </section>
    </div>
  );
}
