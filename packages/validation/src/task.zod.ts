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
  expectedRevenue: z
    .number()
    .int('Số tiền phải là số nguyên')
    .min(0, 'Số tiền không được âm')
    .max(10_000_000_000, 'Số tiền không được vượt quá 10 tỷ VNĐ')
    .nullable()
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

// Enhanced search and filter schema for task lists
export const zTaskSearchFilterQuery = z.object({
  // Pagination
  cursor: z.string().optional(),
  take: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .pipe(z.number().min(1).max(100)),

  // Search query - searches across multiple fields
  search: z.string().trim().optional(),

  // Status filter (multi-select)
  status: z
    .union([z.enum(TaskStatus), z.array(z.enum(TaskStatus))])
    .optional()
    .transform((val) => {
      if (!val) {
        return undefined
      }
      return Array.isArray(val) ? val : [val]
    }),

  // Assignment filters
  assigneeIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) {
        return undefined
      }
      return Array.isArray(val) ? val : [val]
    }),
  assignedOnly: z.string().optional(), // For backward compatibility

  // Customer filter
  customerId: z.string().optional(),

  // Date range filters
  scheduledFrom: z.string().datetime().optional(),
  scheduledTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  completedFrom: z.string().datetime().optional(),
  completedTo: z.string().datetime().optional(),

  // Sorting
  sortBy: z
    .enum(['scheduledAt', 'createdAt', 'updatedAt', 'completedAt', 'id'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type TaskSearchFilterQuery = z.infer<typeof zTaskSearchFilterQuery>
