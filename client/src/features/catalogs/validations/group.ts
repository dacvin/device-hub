import { z } from 'zod';

export const createGroupFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'validation.nameRequired' }),
  icon: z.string().trim().min(1, { message: 'validation.iconRequired' }),
});

export type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;

export const updateGroupFormSchema = createGroupFormSchema;
export type UpdateGroupFormValues = z.infer<typeof updateGroupFormSchema>;
