'use client';

import type { AnyFieldApi } from '@tanstack/react-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/lib/form/field-error';

import { IconPicker } from './icon-picker';

// AnyFieldApi types `name`/`state.value` as `any`; read them as definite strings.
const fieldText = (v: unknown): string => (typeof v === 'string' ? v : '');
const fieldId = (name: unknown): string => String(name);

/** shadcn text/number field bound to a TanStack form field. */
export function CatalogTextField({
  field,
  label,
  required,
  type = 'text',
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  type?: string;
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={fieldId(field.name)}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Input
        id={fieldId(field.name)}
        name={fieldId(field.name)}
        type={type}
        value={fieldText(field.state.value)}
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(e.target.value);
        }}
        aria-invalid={isInvalid}
      />
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

/** shadcn icon-picker field bound to a TanStack form field. */
export function CatalogIconField({ field, label }: { field: AnyFieldApi; label: string }) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label}
        <span className="text-destructive"> *</span>
      </FieldLabel>
      <IconPicker
        value={fieldText(field.state.value)}
        onChange={(v) => {
          field.handleChange(v);
        }}
      />
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}
