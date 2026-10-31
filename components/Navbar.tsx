import Link from "next/link";
import { SearchIcon, ShoppingBagIcon } from "lucide-react";
import { cartItemCount } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/MobileNav";
import { SignOutMenuItem } from "@/components/SignOutButton";

export async function Navbar() {
  const [count, user] = await Promise.all([cartItemCount(), getUser()]);
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav aria-label="Main" className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <MobileNav user={user ? { name: user.name, role: user.role } : null} />
        <Link href="/" className="text-lg font-bold tracking-tight">
          Canvas &amp; Co.
        </Link>
        <Button asChild variant="ghost" className="hidden md:inline-flex">
          <Link href="/products">Shop</Link>
        </Button>
        <form action="/products" role="search" className="relative order-last w-full sm:order-none sm:ml-auto sm:w-72">
          <label htmlFor="nav-search" className="sr-only">Search products</label>
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="nav-search" name="q" type="search" placeholder="Search paintings, clay, crochet…" className="rounded-full pl-9" />
        </form>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden rounded-full md:inline-flex" aria-label="Account menu">
                  <Avatar size="sm"><AvatarFallback>{initial}</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/orders">Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/wishlist">Wishlist</Link></DropdownMenuItem>
                {user.role === "admin" && <DropdownMenuItem asChild><Link href="/admin">Admin</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/cart">
              <ShoppingBagIcon aria-hidden />
              Cart
              <Badge aria-live="polite" className="min-w-5 justify-center px-1.5">
                {count}
                <span className="sr-only"> items in cart</span>
              </Badge>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
