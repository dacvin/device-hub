import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/app/brand-mark";
import { LoginForm } from "./_components/login-form";
import { LoginLanguageSwitcher } from "./_components/login-language-switcher";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const t = await getTranslations("login");

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">
      {/* Left pane */}
      <div className="relative flex flex-col px-6 py-8 md:px-14 md:py-10 bg-background">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LoginLanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[360px] mx-auto md:mx-0 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("signInTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <p className="text-[12px] text-muted-foreground">
          {t("termsPrefix")}{" "}
          <a href="#" className="text-primary underline-offset-4 hover:underline">
            {t("termsLink")}
          </a>
          {t("termsSuffix")}
        </p>
      </div>

      {/* Right pane (hidden < 880px ≈ md) */}
      <div
        className="relative hidden md:flex flex-col text-white p-12 overflow-hidden"
        style={{ background: "linear-gradient(155deg, #277E69, #1F6F5F 48%, #103A33)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(111,207,151,0.45), transparent 70%)", filter: "blur(20px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 -left-10 size-80 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(54,174,136,0.4), transparent 70%)", filter: "blur(24px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative flex-1 flex flex-col justify-center max-w-md">
          <p className="text-xs uppercase tracking-[0.14em] opacity-80 mb-3">DeviceHub</p>
          <h2 className="text-[34px] font-semibold leading-tight">
            {t.rich("taglineRich", {
              accent: (chunks) => <span style={{ color: "#6FCF97" }}>{chunks}</span>,
            })}
          </h2>
          <p className="mt-4 text-sm opacity-90 max-w-sm">{t("description")}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {(["laptops", "monitors", "servers", "printers"] as const).map((k) => (
              <span
                key={k}
                className="rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-xs"
              >
                {t(`chips.${k}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-6 pt-8 border-t border-white/15">
          <Stat value="1,284" label={t("stats.devicesTrackedLabel")} />
          <Stat value="8" label={t("stats.departmentsLabel")} />
          <Stat value="98.2%" label={t("stats.inventoryAccuracyLabel")} />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs opacity-75 mt-1">{label}</div>
    </div>
  );
}
