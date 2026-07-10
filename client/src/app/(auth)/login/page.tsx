'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppWordmark } from '@/components/app-wordmark';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signInWithGoogle, signInWithPassword } from '@/features/auth/api/sign-in';
import { signInSchema } from '@/features/auth/validations/auth';
import { FieldError } from '@/lib/form/field-error';

const ERROR_CODE_MAP: Record<string, string> = {
  not_invited: 'errors.notInvited',
  invalid_link: 'errors.invalidLink',
  verify_failed: 'errors.verifyFailed',
  exchange_failed: 'errors.exchangeFailed',
};

// Geometric device grid — laptop, monitor, phone — as line-art on the ink panel.
function DeviceFleetIllustration() {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-sidebar-foreground w-full max-w-[300px]"
    >
      {/* Laptop */}
      <rect x="20" y="60" width="80" height="52" rx="4" fill="currentColor" fillOpacity={0.16} />
      <rect x="28" y="68" width="64" height="36" rx="2" fill="currentColor" fillOpacity={0.22} />
      <rect x="12" y="112" width="96" height="6" rx="3" fill="currentColor" fillOpacity={0.16} />
      <rect x="44" y="114" width="32" height="2" rx="1" fill="currentColor" fillOpacity={0.32} />
      {/* Monitor */}
      <rect x="120" y="40" width="88" height="60" rx="4" fill="currentColor" fillOpacity={0.16} />
      <rect x="130" y="50" width="68" height="40" rx="2" fill="currentColor" fillOpacity={0.22} />
      <rect x="156" y="100" width="16" height="20" rx="2" fill="currentColor" fillOpacity={0.16} />
      <rect x="140" y="118" width="48" height="6" rx="3" fill="currentColor" fillOpacity={0.16} />
      {/* Phone */}
      <rect x="226" y="54" width="36" height="64" rx="6" fill="currentColor" fillOpacity={0.16} />
      <rect x="231" y="62" width="26" height="44" rx="2" fill="currentColor" fillOpacity={0.22} />
      <rect x="239" y="110" width="10" height="2" rx="1" fill="currentColor" fillOpacity={0.32} />
      {/* Connection lines */}
      <line
        x1="100"
        y1="86"
        x2="120"
        y2="70"
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="208"
        y1="70"
        x2="226"
        y2="76"
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* Status pings — teal */}
      <circle cx="60" cy="80" r="3" className="fill-primary" />
      <circle cx="164" cy="70" r="3" className="fill-primary" />
      <circle cx="244" cy="76" r="3" className="fill-primary" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.88Z"
        fill="#4285F4"
      />
      <path
        d="M8 16c2.16 0 3.97-.71 5.3-1.94l-2.58-2a4.8 4.8 0 0 1-7.14-2.52H.94v2.07A8 8 0 0 0 8 16Z"
        fill="#34A853"
      />
      <path
        d="M3.58 9.54A4.8 4.8 0 0 1 3.33 8c0-.54.09-1.06.25-1.54V4.39H.94A8 8 0 0 0 0 8c0 1.29.31 2.51.94 3.61l2.64-2.07Z"
        fill="#FBBC05"
      />
      <path
        d="M8 3.2c1.22 0 2.31.42 3.17 1.24l2.37-2.37A8 8 0 0 0 .94 4.39L3.58 6.46A4.79 4.79 0 0 1 8 3.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Signature: a mono telemetry legend echoing the app's device-status vocabulary.
function StatusReadout({ labels }: { labels: [string, string, string, string] }) {
  const dots = [
    { c: 'bg-status-in-use', label: labels[0] },
    { c: 'bg-status-storage', label: labels[1] },
    { c: 'bg-status-repair', label: labels[2] },
    { c: 'bg-status-retired', label: labels[3] },
  ];
  return (
    <ul className="text-sidebar-foreground/60 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] tracking-wide uppercase tabular-nums">
      {dots.map((d) => (
        <li key={d.label} className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${d.c}`} />
          {d.label}
        </li>
      ))}
    </ul>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  // Surface ?error= from the OAuth/confirm callback.
  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      toast.error(t(ERROR_CODE_MAP[errorCode] ?? 'errors.generic'));
    }
  }, [searchParams, t]);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      try {
        await signInWithPassword(value);
        router.push('/');
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        const key = raw.includes('Invalid login credentials')
          ? 'errors.invalidCredentials'
          : 'errors.generic';
        toast.error(t(key));
      }
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast.error(t('login.googleSignInFailed'));
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — the deep-ink instrument rail identity */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border relative hidden flex-col justify-between border-r p-10 lg:flex xl:p-14">
        <AppWordmark className="text-white" />
        <div className="flex flex-col items-start gap-8">
          <DeviceFleetIllustration />
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              {t('login.coverHeading')}
            </h2>
            <p className="text-sidebar-foreground/70 max-w-sm text-base">
              {t('login.coverSubtext')}
            </p>
          </div>
        </div>
        <StatusReadout
          labels={[
            t('devices.statusInUse'),
            t('devices.statusStorage'),
            t('devices.statusRepair'),
            t('devices.statusRetired'),
          ]}
        />
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          <AppWordmark className="lg:hidden" />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.heading')}</h1>
            <p className="text-muted-foreground text-sm">{t('login.subtitle')}</p>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('login.emailLabel')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder={t('login.emailPlaceholder')}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="password">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t('login.passwordLabel')}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('login.passwordPlaceholder')}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe
              selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {t('login.signInButton')}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t('login.divider')}
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <Button variant="outline" size="lg" className="h-10 w-full" onClick={handleGoogleSignIn}>
            <GoogleLogo />
            {t('login.googleButton')}
          </Button>
        </div>
      </main>
    </div>
  );
}
