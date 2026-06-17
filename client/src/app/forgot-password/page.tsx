import { BrandMark } from "@/components/app/brand-mark";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

const STEPS = [
  "Tell us the work email tied to your account.",
  "Open the reset link we send (it lasts 30 minutes).",
  "Pick a new password and you’re back in.",
];

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 min-[880px]:grid-cols-2">
      {/* Left pane */}
      <div className="relative flex flex-col px-6 py-8 min-[880px]:px-[56px] min-[880px]:py-[40px] bg-background">
        <BrandMark />

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[360px] mx-auto">
            <ForgotPasswordForm />
          </div>
        </div>

        <p className="text-[12px] text-muted-foreground">
          © 2026 Sioux Asia · DeviceHub · IT Operations
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
          Sioux Asia · IT Operations
        </p>
        <h2 className="relative mt-[18px] max-w-[16ch] text-[34px] font-semibold leading-[1.15] tracking-[-0.025em]">
          Back in, <span style={{ color: "var(--green-300)" }}>in three steps.</span>
        </h2>

        <ol className="relative mt-7 flex flex-col gap-3 max-w-[36ch]">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="size-7 rounded-full bg-white/[0.12] grid place-items-center text-[12px] font-semibold shrink-0 ring-1 ring-white/20">
                {i + 1}
              </span>
              <span className="text-[14px] leading-[1.55] opacity-[0.92]">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <p className="relative mt-auto text-[12px] opacity-[0.72]">
          Links are single-use and expire in 30 minutes.
        </p>
      </div>
    </div>
  );
}
