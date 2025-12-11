import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['PENDING', 'INPROGRESS', 'COMPLETED']).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(20).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['PENDING', 'INPROGRESS', 'COMPLETED']).optional(),
});
