"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { mergeCartAfterSignIn } from "@/app/actions/cart";
import { Notice } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, next }: { mode: "sign-in" | "sign-up"; next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const up = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = up
      ? await authClient.signUp.email({ email, password, name: String(fd.get("name")) })
      : await authClient.signIn.email({ email, password });
    if (res.error) {
      setError(res.error.message ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    // Wait for the cart merge and a refresh BEFORE navigating, so protected pages see the new session.
    await mergeCartAfterSignIn();
    router.refresh();
    router.push(next);
  }

  return (
    <Card className="mx-auto my-6 max-w-sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <CardHeader>
          <h1 className="text-2xl font-bold leading-snug">{up ? "Create your account" : "Sign in"}</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          {up && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete={up ? "new-password" : "current-password"} />
            {up && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
          <div aria-live="assertive">{error && <Notice kind="error">{error}</Notice>}</div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : up ? "Create account" : "Sign in"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            {up ? "Already have an account? " : "New here? "}
            <Link className="text-foreground underline underline-offset-4" href={`${up ? "/sign-in" : "/sign-up"}?next=${encodeURIComponent(next)}`}>{up ? "Sign in" : "Create an account"}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
