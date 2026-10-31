import { CircleAlertIcon, CircleCheckIcon, InfoIcon, StarIcon } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function Price({ cents, compareAt, className = "" }: { cents: number; compareAt?: number | null; className?: string }) {
  return (
    <span className={className}>
      <span className="font-semibold">{formatMoney(cents)}</span>
      {compareAt && compareAt > cents ? (
        <>
          {" "}
          <s className="text-sm text-muted-foreground"><span className="sr-only">Was </span>{formatMoney(compareAt)}</s>
        </>
      ) : null}
    </span>
  );
}

export function Stars({ rating, count }: { rating: number; count: number }) {
  if (!count) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  const filled = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${count} reviews`}>
      <span aria-hidden className="inline-flex text-warning">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className={cn("size-3.5", i < filled && "fill-current")} />
        ))}
      </span>
      <span aria-hidden className="text-muted-foreground">({count})</span>
    </span>
  );
}

export function StockBadge({ available }: { available: number }) {
  if (available <= 0) return <Badge variant="secondary">Sold out</Badge>;
  if (available <= 5) return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">Only {available} left</Badge>;
  return <span className="text-xs font-medium text-success">In stock</span>;
}

const TONES = {
  info: { cls: "text-muted-foreground", Icon: InfoIcon },
  error: { cls: "border-destructive/50 text-destructive", Icon: CircleAlertIcon },
  success: { cls: "border-success/50 text-success", Icon: CircleCheckIcon },
};

/** Inline message. Errors use role="alert", everything else role="status" (same as before). */
export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const { cls, Icon } = TONES[kind];
  return (
    <Alert role={kind === "error" ? "alert" : "status"} className={cn("items-center", cls)}>
      <Icon aria-hidden />
      <div>{children}</div>
    </Alert>
  );
}

/** Centered empty / message state used by the cart, orders, wishlist, search and 404 pages. */
export function EmptyState({ title, children, dashed = false }: { title: string; children?: React.ReactNode; dashed?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-xl px-6 py-14 text-center", dashed && "border border-dashed")}>
      <p className="text-lg font-medium">{title}</p>
      {children}
    </div>
  );
}
