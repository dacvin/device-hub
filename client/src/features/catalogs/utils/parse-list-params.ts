import { z } from 'zod';

export interface SortRule {
  column: string;
  ascending: boolean;
}

export function makeListParamsSchema(
  sortableColumns: readonly [string, ...string[]],
  defaultSort: SortRule,
) {
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
    .pipe(z.array(z.object({ column: z.enum(sortableColumns), ascending: z.boolean() })).min(1))
    .catch([defaultSort]);

  return z.object({
    page: z.coerce.number().int().positive().catch(1),
    limit: z.coerce.number().int().positive().max(100).catch(20),
    q: z.string().trim().min(1).optional().catch(undefined),
    sort: sortSchema,
  });
}

export type ListParams = z.infer<ReturnType<typeof makeListParamsSchema>>;
