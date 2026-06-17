"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RESEND_SECONDS = 30;

export function ForgotPasswordForm() {
  const [stage, setStage] = useState<"request" | "sent">("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter the email tied to your account.");
      return;
    }
    setError(null);
    setStage("sent");
    startCooldown();
  }

  function onResend() {
    if (cooldown > 0) return;
    startCooldown();
  }

  if (stage === "sent") {
    return (
      <div className="text-center">
        <span className="size-12 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mx-auto">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">
          Check your email
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground leading-[1.55]">
          We sent a password reset link to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Open it
          within 30 minutes — links are single-use.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Button asChild className="h-11 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={cooldown > 0}
            onClick={onResend}
            className="h-11 w-full"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to sign in
      </Link>

      <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">
        Forgot password?
      </h1>
      <p className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
        Enter your work email and we&apos;ll send a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-3">
        <div>
          <label className="text-[12.5px] font-medium block mb-1.5">
            Work email
          </label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="vinh.huynh@gmail.com"
            className={error ? "border-destructive ring-destructive/30" : ""}
          />
          {error ? (
            <p className="text-[12px] text-destructive mt-1">{error}</p>
          ) : null}
        </div>
        <Button type="submit" className="h-11 w-full">
          <Mail className="size-4" aria-hidden />
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-[12px] text-muted-foreground">
        Reset links expire after 30 minutes. If you don&apos;t see the email
        within a few minutes, check your spam folder or contact an admin.
      </p>
    </>
  );
}
