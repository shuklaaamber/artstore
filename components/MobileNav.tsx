"use client";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SignOutButton } from "@/components/SignOutButton";

/** Slide-over menu shown below the md breakpoint; mirrors the desktop links and account menu. */
export function MobileNav({ user }: { user: { name: string; role: string } | null }) {
  const links = [
    { href: "/products", label: "Shop" },
    ...(user
      ? [
          { href: "/orders", label: "Orders" },
          { href: "/wishlist", label: "Wishlist" },
          ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
        ]
      : [{ href: "/sign-in", label: "Sign in" }]),
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Canvas &amp; Co.</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {links.map((l) => (
            <SheetClose key={l.href} asChild>
              <Button asChild variant="ghost" className="justify-start">
                <Link href={l.href}>{l.label}</Link>
              </Button>
            </SheetClose>
          ))}
          {user && (
            <>
              <Separator className="my-2" />
              <SignOutButton />
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
