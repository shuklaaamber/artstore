"use client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function useSignOut() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };
}

export function SignOutButton() {
  const signOut = useSignOut();
  return (
    <Button type="button" variant="ghost" className="w-full justify-start" onClick={signOut}>
      <LogOutIcon aria-hidden /> Sign out
    </Button>
  );
}

export function SignOutMenuItem() {
  const signOut = useSignOut();
  return (
    <DropdownMenuItem onSelect={signOut}>
      <LogOutIcon aria-hidden /> Sign out
    </DropdownMenuItem>
  );
}
