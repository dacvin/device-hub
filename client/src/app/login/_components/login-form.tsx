"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GoogleG } from "./google-g";

export function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next") ?? "/devices";
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setLoading(false);
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        disabled={loading}
        className="w-full h-[46px] gap-3 text-sm font-medium"
      >
        <GoogleG className="size-[18px]" />
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>

      {error === "oauth" && (
        <p className="text-xs text-destructive">
          Sign-in failed. Try again.
        </p>
      )}
    </div>
  );
}
