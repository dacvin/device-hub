import { z } from 'zod';

import { SORTABLE_COLUMNS, UserRoles, UserStatuses } from '../constants/member';

const sortSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [column, direction] = part.split('.');
        return { column, ascending: direction !== 'desc' };
      }),
  )
  .pipe(z.array(z.object({ column: z.enum(SORTABLE_COLUMNS), ascending: z.boolean() })).min(1))
  .catch([{ column: 'name', ascending: true }]);

export const listParamsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  role: z
    .union([z.enum(UserRoles), z.array(z.enum(UserRoles))])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch(undefined),
  status: z
    .union([z.enum(UserStatuses), z.array(z.enum(UserStatuses))])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch(undefined),
  sort: sortSchema,
});

export type ListParams = z.infer<typeof listParamsSchema>;

export const updateMemberSchema = z.object({
  name: z.string().min(1, { message: 'validation.nameRequired' }),
  phone: z.string(),
});

export type UpdateMemberValues = z.infer<typeof updateMemberSchema>;
