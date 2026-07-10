import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email({ message: 'validation.emailInvalid' }),
  password: z.string().min(6, { message: 'validation.passwordMin' }),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const setPasswordSchema = z
  .object({
    password: z.string().min(6, { message: 'validation.passwordMin' }),
    confirm: z.string().min(6, { message: 'validation.passwordMin' }),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'validation.passwordsNoMatch',
    path: ['confirm'],
  });
export type SetPasswordValues = z.infer<typeof setPasswordSchema>;

export const inviteSchema = z.object({
  name: z.string().min(1, { message: 'validation.nameRequired' }),
  email: z.email({ message: 'validation.emailInvalid' }),
});
export type InviteValues = z.infer<typeof inviteSchema>;
