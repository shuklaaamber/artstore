"use client";
import { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/engage";
import { Notice } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ productId, signedIn }: { productId: number; signedIn: boolean }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) return <p className="text-sm text-muted-foreground"><a className="text-foreground underline underline-offset-4" href="/sign-in">Sign in</a> to write a review.</p>;

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await submitReview({ productId, rating, body });
            setMsg(r.ok ? { ok: true, text: r.message ?? "Saved" } : { ok: false, text: r.error });
          });
        }}
      >
        <CardHeader><h3 className="font-heading text-base font-medium">Write a review</h3></CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-40 space-y-1.5">
            <Label htmlFor="rating">Rating</Label>
            <NativeSelect id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-body">Your review (optional)</Label>
            <Textarea id="review-body" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          <Button disabled={pending}>{pending ? "Saving…" : "Submit review"}</Button>
          <div aria-live="polite">{msg && <Notice kind={msg.ok ? "success" : "error"}>{msg.text}</Notice>}</div>
        </CardContent>
      </form>
    </Card>
  );
}
