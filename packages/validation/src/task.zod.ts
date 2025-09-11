import { z } from './zod'

export const zCreateTask = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Tiêu đề quá ngắn')
    .max(100, 'Tiêu đề quá dài'),
  description: z.string().trim(),
  address: z.string().trim().optional(),
  customerPhone: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .length(10, 'Số điện thoại phải có 10 chữ số')
      .regex(/^0\d+$/, 'Số điện thoại không hợp lệ')
      .optional(),
  ]),
  customerName: z.string().trim().optional(),
})

export type CreateTaskValues = z.infer<typeof zCreateTask>
