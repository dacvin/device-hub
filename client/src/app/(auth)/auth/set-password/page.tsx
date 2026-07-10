'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useForm } from '@tanstack/react-form';
import { Loader2, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppWordmark } from '@/components/app-wordmark';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { setPassword } from '@/features/auth/api/set-password';
import { setPasswordSchema } from '@/features/auth/validations/auth';
import { FieldError } from '@/lib/form/field-error';

export default function SetPasswordPage() {
  const router = useRouter();
  const t = useTranslations();

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: setPasswordSchema },
    onSubmit: async ({ value }) => {
      try {
        await setPassword(value);
        toast.success(t('setPassword.successToast'));
        router.push('/');
      } catch {
        toast.error(t('setPassword.failedToast'));
      }
    },
  });

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <AppWordmark />

        <div className="space-y-4">
          <span className="bg-accent text-accent-foreground motion-safe:animate-in motion-safe:zoom-in-75 flex size-11 items-center justify-center rounded-xl duration-500">
            <LockKeyhole className="size-5" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{t('setPassword.heading')}</h1>
            <p className="text-muted-foreground text-sm">{t('setPassword.subtitle')}</p>
          </div>
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
          <form.Field name="password">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>{t('setPassword.newPasswordLabel')}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={t('setPassword.newPasswordPlaceholder')}
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

          <form.Field name="confirm">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t('setPassword.confirmPasswordLabel')}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={t('setPassword.confirmPasswordPlaceholder')}
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
                {t('setPassword.submitButton')}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {t('setPassword.expiredNote')}{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('setPassword.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
