import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.role !== "admin") notFound(); // don't reveal that /admin exists
  return (
    <div className="space-y-6">
      <div>
        <nav aria-label="Admin" className="-ml-3 flex flex-wrap gap-1">
          <Button asChild variant="ghost"><Link href="/admin/products">Products &amp; stock</Link></Button>
          <Button asChild variant="ghost"><Link href="/admin/orders">Orders</Link></Button>
          <Button asChild variant="ghost"><Link href="/admin/promos">Promo codes</Link></Button>
        </nav>
        <Separator className="mt-2" />
      </div>
      {children}
    </div>
  );
}
