'use client';

import type { ReactNode } from 'react';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateGroup } from '@/features/catalogs/api/create-group';
import { useCreateManufacturer } from '@/features/catalogs/api/create-manufacturer';
import {
  getGroupsQueryOptions,
  getPaginatedGroups,
} from '@/features/catalogs/api/get-paginated-groups';
import {
  getManufacturersQueryOptions,
  getPaginatedManufacturers,
} from '@/features/catalogs/api/get-paginated-manufacturers';
import { IconPicker } from '@/features/catalogs/components/icon-picker';
import { createGroupFormSchema } from '@/features/catalogs/validations/group';
import { createManufacturerFormSchema } from '@/features/catalogs/validations/manufacturer';
import { FieldError } from '@/lib/form/field-error';

import { DeviceSources, DeviceStatuses, DeviceUnits } from '../constants/device';
import { createDeviceFormSchema } from '../validations/device';
import { DeviceDocumentsField } from './device-documents-field';
import { DeviceFkField, type FkOption, makeCatalogSearchSource } from './device-fk-field';
import { DevicePhotosField } from './device-photos-field';
import { STATUS_LABEL_KEY } from './device-status-indicator';
import { type MediaEntry, useDeviceMedia } from './use-device-media';

import type { DeviceFileDescriptor } from '../types/device';
import type { CreateDeviceFormValues } from '../validations/device';

const NONE = '__none__';

// AnyFieldApi types `name`/`state.value` as `any`; read them as definite strings.
const fieldText = (v: unknown): string => (typeof v === 'string' ? v : '');
const fieldId = (name: unknown): string => String(name);

export type DeviceFormMedia = { photos: MediaEntry[]; documents: MediaEntry[] };

function FieldRow({
  field,
  label,
  required,
  children,
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  children: (isInvalid: boolean) => ReactNode;
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={fieldId(field.name)}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {children(isInvalid)}
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

function TextControl({
  field,
  isInvalid,
  type = 'text',
}: {
  field: AnyFieldApi;
  isInvalid: boolean;
  type?: string;
}) {
  return (
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
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function DeviceForm({
  defaultValues,
  initialFk,
  initialPhotos = [],
  initialDocuments = [],
  onSubmit,
  onCancel,
}: {
  defaultValues: CreateDeviceFormValues;
  initialFk?: { group?: FkOption; manufacturer?: FkOption };
  initialPhotos?: DeviceFileDescriptor[];
  initialDocuments?: DeviceFileDescriptor[];
  onSubmit: (values: CreateDeviceFormValues, media: DeviceFormMedia) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations('devices');
  const tRoot = useTranslations();

  const photos = useDeviceMedia(initialPhotos, { withPreview: true });
  const documents = useDeviceMedia(initialDocuments, { withPreview: false });

  const form = useForm({
    defaultValues,
    validators: {
      // z.coerce fields widen the Standard-Schema input to `unknown`; constrain
      // only the value shape, per the shadcn-docs pattern.
      onSubmit: createDeviceFormSchema as unknown as z.ZodType<
        CreateDeviceFormValues,
        CreateDeviceFormValues
      >,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value, { photos: photos.entries, documents: documents.entries });
    },
  });

  const groupSearch = makeCatalogSearchSource(
    (q) => getPaginatedGroups({ q, limit: 20 }),
    (r) => ({
      id: r.id,
      label: r.name,
      auxiliaryData: { defaultInventoryCycleMonths: r.defaultInventoryCycleMonths },
    }),
  );
  const manufacturerSearch = makeCatalogSearchSource(
    (q) => getPaginatedManufacturers({ q, limit: 20 }),
    (r) => ({ id: r.id, label: r.name }),
  );

  const createGroup = useCreateGroup();
  const createManufacturer = useCreateManufacturer();

  const unitOptions = DeviceUnits.map((value) => ({
    value,
    label: t(`unit${value[0].toUpperCase()}${value.slice(1)}`),
  }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Card>
        <CardContent className="space-y-8">
          {/* Identity */}
          <Section title={t('sectionIdentity')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="code">
                {(field) => (
                  <FieldRow field={field} label={t('fieldCode')} required>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="name">
                {(field) => (
                  <FieldRow field={field} label={t('fieldName')} required>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
                  </FieldRow>
                )}
              </form.Field>
            </div>
          </Section>

          {/* Classification */}
          <Section title={t('sectionClassification')}>
            <div className="space-y-4">
              <form.Field name="groupId">
                {(field) => (
                  <DeviceFkField
                    field={field}
                    label={t('fieldGroup')}
                    placeholder={t('fieldGroup')}
                    search={groupSearch}
                    initialItem={initialFk?.group ?? null}
                    addNewLabel={t('addNewGroup')}
                    onSelectItem={(item) => {
                      const months = item?.auxiliaryData?.defaultInventoryCycleMonths;
                      if (months) form.setFieldValue('inventoryCycleMonths', months);
                    }}
                    addNew={{
                      title: t('addNewGroup'),
                      schema: createGroupFormSchema,
                      defaultValues: { name: '', icon: '', defaultInventoryCycleMonths: 12 },
                      create: async (values) => {
                        const g = await createGroup.mutateAsync(values as never);
                        return {
                          id: g.id,
                          name: g.name,
                          defaultInventoryCycleMonths: g.defaultInventoryCycleMonths,
                        };
                      },
                      invalidateKey: getGroupsQueryOptions().queryKey,
                      renderFields: (f) => (
                        <>
                          <f.Field name="name">
                            {(x) => (
                              <FieldRow field={x} label={tRoot('catalogs.fieldName')} required>
                                {(inv) => <TextControl field={x} isInvalid={inv} />}
                              </FieldRow>
                            )}
                          </f.Field>
                          <f.Field name="icon">
                            {(x) => (
                              <FieldRow field={x} label={tRoot('catalogs.fieldIcon')} required>
                                {() => (
                                  <IconPicker
                                    value={fieldText(x.state.value)}
                                    onChange={(v) => {
                                      x.handleChange(v);
                                    }}
                                  />
                                )}
                              </FieldRow>
                            )}
                          </f.Field>
                          <f.Field name="defaultInventoryCycleMonths">
                            {(x) => (
                              <FieldRow field={x} label={tRoot('catalogs.fieldCycle')}>
                                {(inv) => <TextControl field={x} isInvalid={inv} type="number" />}
                              </FieldRow>
                            )}
                          </f.Field>
                        </>
                      ),
                    }}
                  />
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="unit">
                  {(field) => (
                    <FieldRow field={field} label={t('fieldUnit')} required>
                      {() => (
                        <Select
                          value={fieldText(field.state.value)}
                          onValueChange={(v) => {
                            field.handleChange(v as never);
                          }}
                        >
                          <SelectTrigger id={fieldId(field.name)} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FieldRow>
                  )}
                </form.Field>

                <form.Field name="manufacturerId">
                  {(field) => (
                    <DeviceFkField
                      field={field}
                      label={t('fieldManufacturer')}
                      placeholder={t('fieldManufacturer')}
                      search={manufacturerSearch}
                      initialItem={initialFk?.manufacturer ?? null}
                      addNewLabel={t('addNewManufacturer')}
                      addNew={{
                        title: t('addNewManufacturer'),
                        schema: createManufacturerFormSchema,
                        defaultValues: { name: '', supportContact: '' },
                        create: async (values) => {
                          const m = await createManufacturer.mutateAsync(values as never);
                          return { id: m.id, name: m.name };
                        },
                        invalidateKey: getManufacturersQueryOptions().queryKey,
                        renderFields: (f) => (
                          <>
                            <f.Field name="name">
                              {(x) => (
                                <FieldRow field={x} label={tRoot('catalogs.fieldName')} required>
                                  {(inv) => <TextControl field={x} isInvalid={inv} />}
                                </FieldRow>
                              )}
                            </f.Field>
                            <f.Field name="supportContact">
                              {(x) => (
                                <FieldRow field={x} label={tRoot('catalogs.fieldSupportContact')}>
                                  {(inv) => <TextControl field={x} isInvalid={inv} />}
                                </FieldRow>
                              )}
                            </f.Field>
                          </>
                        ),
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="model">
                  {(field) => (
                    <FieldRow field={field} label={t('fieldModel')}>
                      {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
                    </FieldRow>
                  )}
                </form.Field>
                <form.Field name="serialNumber">
                  {(field) => (
                    <FieldRow field={field} label={t('fieldSerialNumber')}>
                      {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
                    </FieldRow>
                  )}
                </form.Field>
              </div>

              <form.Field name="specifications">
                {(field) => (
                  <FieldRow field={field} label={t('fieldSpecifications')}>
                    {(isInvalid) => (
                      <Textarea
                        id={fieldId(field.name)}
                        value={fieldText(field.state.value)}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                        aria-invalid={isInvalid}
                      />
                    )}
                  </FieldRow>
                )}
              </form.Field>
            </div>
          </Section>

          {/* Status & condition */}
          <Section title={t('sectionStatus')}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <form.Field name="status">
                {(field) => (
                  <FieldRow field={field} label={t('fieldStatus')} required>
                    {() => (
                      <Select
                        value={fieldText(field.state.value)}
                        onValueChange={(v) => {
                          field.handleChange(v as never);
                        }}
                      >
                        <SelectTrigger id={fieldId(field.name)} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DeviceStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {tRoot(STATUS_LABEL_KEY[s])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="condition">
                {(field) => (
                  <FieldRow field={field} label={t('fieldCondition')}>
                    {(isInvalid) => (
                      <TextControl field={field} isInvalid={isInvalid} type="number" />
                    )}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="quantity">
                {(field) => (
                  <FieldRow field={field} label={t('fieldQuantity')}>
                    {(isInvalid) => (
                      <TextControl field={field} isInvalid={isInvalid} type="number" />
                    )}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="source">
                {(field) => (
                  <FieldRow field={field} label={t('fieldSource')}>
                    {() => (
                      <Select
                        value={fieldText(field.state.value) || NONE}
                        onValueChange={(v) => {
                          field.handleChange((v === NONE ? '' : v) as never);
                        }}
                      >
                        <SelectTrigger id={fieldId(field.name)} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>{t('empty')}</SelectItem>
                          {DeviceSources.map((s) => (
                            <SelectItem key={s} value={s}>
                              {t(`source${s}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="location">
                {(field) => (
                  <FieldRow field={field} label={t('fieldLocation')}>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
                  </FieldRow>
                )}
              </form.Field>
            </div>
          </Section>

          {/* Lifecycle & warranty */}
          <Section title={t('sectionLifecycle')}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <form.Field name="importDate">
                {(field) => (
                  <FieldRow field={field} label={t('fieldImportDate')}>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} type="date" />}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="lastCheckDate">
                {(field) => (
                  <FieldRow field={field} label={t('fieldLastCheckDate')}>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} type="date" />}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="inventoryCycleMonths">
                {(field) => (
                  <FieldRow field={field} label={t('fieldInventoryCycleMonths')}>
                    {(isInvalid) => (
                      <TextControl field={field} isInvalid={isInvalid} type="number" />
                    )}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="warrantyStart">
                {(field) => (
                  <FieldRow field={field} label={t('fieldWarrantyStart')}>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} type="date" />}
                  </FieldRow>
                )}
              </form.Field>
              <form.Field name="warrantyEnd">
                {(field) => (
                  <FieldRow field={field} label={t('fieldWarrantyEnd')}>
                    {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} type="date" />}
                  </FieldRow>
                )}
              </form.Field>
            </div>
          </Section>

          {/* Notes */}
          <Section title={t('sectionNotes')}>
            <form.Field name="notes">
              {(field) => (
                <FieldRow field={field} label={t('fieldNotes')}>
                  {(isInvalid) => (
                    <Textarea
                      id={fieldId(field.name)}
                      value={fieldText(field.state.value)}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      aria-invalid={isInvalid}
                    />
                  )}
                </FieldRow>
              )}
            </form.Field>
          </Section>

          {/* Media */}
          <Section title={t('sectionMedia')}>
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t('photosLabel')}
              </p>
              <DevicePhotosField media={photos} />
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t('documentsLabel')}
              </p>
              <DeviceDocumentsField media={documents} />
            </div>
          </Section>

          <div className="flex justify-end gap-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <form.Subscribe
              selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {t('save')}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
