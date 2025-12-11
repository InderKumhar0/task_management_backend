import { z } from 'zod';

export const baseSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(20),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
});

export const signupSchema = baseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

export const loginSchema = baseSchema.pick({
  email: true,
  password: true,
});
