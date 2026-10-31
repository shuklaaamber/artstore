import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">We couldn’t find that page</h1>
      <p className="text-muted-foreground">The link may be old, or the product may have been removed.</p>
      <Button asChild size="lg"><Link href="/products">Browse products</Link></Button>
    </div>
  );
}
