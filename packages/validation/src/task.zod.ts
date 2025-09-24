import { TaskStatus } from './prisma'
import { z } from './zod'

export const zCreateTask = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Tiêu đề quá ngắn')
    .max(100, 'Tiêu đề quá dài'),
  description: z.string().trim(),
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
  geoLocation: z
    .object({
      address: z.string().trim().optional(),
      name: z.string().trim().optional(),
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
})

export type CreateTaskValues = z.infer<typeof zCreateTask>

export const zTaskListQuery = z.object({
  cursor: z.string().optional(),
  take: z.string().optional(),
  status: z.union([z.enum(TaskStatus), z.array(z.enum(TaskStatus))]).optional(),
  assignedOnly: z.string().optional(),
})
export type TaskListQuery = z.infer<typeof zTaskListQuery>
