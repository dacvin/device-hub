import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Laptop, Monitor, Printer, Server, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/app/brand-mark";
import { LoginForm } from "./_components/login-form";
import { LoginLanguageSwitcher } from "./_components/login-language-switcher";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const t = await getTranslations("login");

  return (
    <div className="min-h-screen w-full grid grid-cols-1 min-[880px]:grid-cols-2">
      {/* Left pane */}
      <div className="relative flex flex-col px-6 py-8 min-[880px]:px-[56px] min-[880px]:py-[40px] bg-background">
        <div className="flex items-center justify-between">
          <BrandMark />
          <LoginLanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[360px] mx-auto">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">
              {t("signInTitle")}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
              {t("subtitle")}
            </p>

            <div className="mt-7">
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-[18px] flex items-center gap-2 rounded-md bg-secondary text-secondary-foreground px-[14px] py-[12px] text-[13px] leading-[1.45]">
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              <span>{t("managedNote")}</span>
            </div>

            <p className="mt-[22px] text-[12px] leading-[1.6] text-muted-foreground">
              {t("termsPrefix")}{" "}
              <a
                href="#"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("termsLink")}
              </a>
              {t("termsSuffix")}
            </p>
          </div>
        </div>

        <p className="text-[12px] text-muted-foreground">
          {t("footer")}
        </p>
      </div>

      {/* Right pane (hidden < 880px) */}
      <div
        className="relative hidden min-[880px]:flex flex-col text-white px-[56px] py-[48px] overflow-hidden"
        style={{
          background:
            "linear-gradient(155deg, var(--green-700) 0%, var(--green-800) 48%, var(--green-950) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute size-[320px] -right-20 -top-[60px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(111,207,151,0.55), transparent 65%)",
            filter: "blur(2px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute size-[280px] -left-[60px] bottom-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(70,188,138,0.4), transparent 65%)",
            filter: "blur(2px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 70% 30%, #000 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 70% 30%, #000 30%, transparent 75%)",
          }}
        />

        <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] opacity-[0.75]">
          {t("eyebrow")}
        </p>
        <h2 className="relative mt-[18px] max-w-[13ch] text-[34px] font-semibold leading-[1.15] tracking-[-0.025em]">
          {t.rich("taglineRich", {
            accent: (chunks) => (
              <span style={{ color: "var(--green-300)" }}>{chunks}</span>
            ),
          })}
        </h2>

        <div className="relative mt-7 flex flex-wrap gap-2.5">
          {CHIP_ITEMS.map(({ key, Icon }) => (
            <span
              key={key}
              className="inline-flex items-center gap-[7px] rounded-full border border-white/[0.18] bg-white/[0.12] px-[13px] py-[7px] text-[13px] font-medium"
            >
              <Icon className="size-[14px]" aria-hidden />
              {t(`chips.${key}`)}
            </span>
          ))}
        </div>

        <div className="relative mt-auto flex gap-10">
          <Stat value="1,284" label={t("stats.devicesTrackedLabel")} />
          <Stat value="8" label={t("stats.departmentsLabel")} />
          <Stat value="98.2%" label={t("stats.inventoryAccuracyLabel")} />
        </div>
      </div>
    </div>
  );
}

const CHIP_ITEMS = [
  { key: "laptops" as const, Icon: Laptop },
  { key: "monitors" as const, Icon: Monitor },
  { key: "servers" as const, Icon: Server },
  { key: "printers" as const, Icon: Printer },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[30px] font-semibold tracking-[-0.02em]">{value}</div>
      <div className="mt-0.5 text-[13px] opacity-[0.72]">{label}</div>
    </div>
  );
}

