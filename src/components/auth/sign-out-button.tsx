"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary-pill" | "dark-utility";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SignOutButton({
  variant = "outline",
  size = "sm",
  className,
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/sign-in";
          },
        },
      });
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={() => void handleSignOut()}
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
