"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { GoogleG } from "./google-g";

export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/overview";
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(t("credentialsError"));
      setSubmitting(false);
      return;
    }
    router.push(next);
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (oauthErr) setGoogleLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onPasswordSubmit} className="space-y-3">
        <Field>
          <FieldLabel htmlFor="login-email">{t("emailLabel")}</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            disabled={submitting}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-password">{t("passwordLabel")}</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-[46px] text-[15px] font-medium"
        >
          {submitting ? t("signingIn") : t("signInButton")}
        </Button>
      </form>

      <div className="relative flex items-center">
        <span className="flex-1 h-px bg-border" aria-hidden />
        <span className="px-3 text-xs uppercase tracking-wide text-muted-foreground">
          {t("orDivider")}
        </span>
        <span className="flex-1 h-px bg-border" aria-hidden />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        disabled={googleLoading}
        className="w-full h-[46px] gap-3 bg-card text-[15px] font-medium hover:bg-accent dark:hover:bg-accent"
      >
        <GoogleG className="size-[18px]" />
        {googleLoading ? t("redirecting") : t("continueWithGoogle")}
      </Button>

      {oauthError === "oauth" && (
        <p className="text-xs text-destructive">{t("oauthError")}</p>
      )}
    </div>
  );
}
