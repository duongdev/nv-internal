import { z } from 'zod'

/**
 * Validation schemas for employee reports
 *
 * Supports dynamic date range reporting with timezone awareness.
 * All dates are in ISO 8601 format (YYYY-MM-DD) and converted to
 * the specified timezone for accurate boundary calculations.
 */

/**
 * List of valid IANA timezone identifiers
 *
 * Limited to common timezones in Southeast Asia for security and performance.
 * Default: Asia/Ho_Chi_Minh (Vietnam timezone, UTC+7)
 */
const VALID_TIMEZONES = [
  'Asia/Ho_Chi_Minh', // Vietnam (UTC+7)
  'Asia/Bangkok', // Thailand (UTC+7)
  'Asia/Singapore', // Singapore (UTC+8)
  'Asia/Jakarta', // Indonesia Western (UTC+7)
  'Asia/Manila', // Philippines (UTC+8)
  'Asia/Kuala_Lumpur', // Malaysia (UTC+8)
] as const

/**
 * Validates employee report query parameters
 *
 * Query parameters:
 * - startDate: ISO 8601 date string (YYYY-MM-DD) - inclusive
 * - endDate: ISO 8601 date string (YYYY-MM-DD) - inclusive
 * - timezone: IANA timezone identifier (optional, default: Asia/Ho_Chi_Minh)
 *
 * Validation rules:
 * - Both dates are required
 * - Dates must be valid ISO 8601 format
 * - endDate must be >= startDate
 * - Date range must not exceed 365 days (1 year)
 * - Timezone must be a valid IANA identifier
 *
 * Example usage:
 * ```
 * GET /v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31
 * GET /v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Bangkok
 * ```
 */
export const zEmployeeReportQuery = z
  .object({
    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'startDate phải có định dạng YYYY-MM-DD (ví dụ: 2025-01-01)',
      )
      .refine(
        (val) => {
          const date = new Date(val)
          return !isNaN(date.getTime())
        },
        { message: 'startDate không hợp lệ' },
      ),
    endDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'endDate phải có định dạng YYYY-MM-DD (ví dụ: 2025-01-31)',
      )
      .refine(
        (val) => {
          const date = new Date(val)
          return !isNaN(date.getTime())
        },
        { message: 'endDate không hợp lệ' },
      ),
    timezone: z
      .enum(VALID_TIMEZONES, {
        message: `Múi giờ không hợp lệ. Chỉ hỗ trợ: ${VALID_TIMEZONES.join(', ')}`,
      })
      .default('Asia/Ho_Chi_Minh'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'endDate phải lớn hơn hoặc bằng startDate',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 365
    },
    {
      message: 'Khoảng thời gian không được vượt quá 365 ngày',
      path: ['endDate'],
    },
  )

/**
 * Validates userId parameter for employee report route
 */
export const zEmployeeReportParam = z.object({
  userId: z.string().min(1, 'userId không được để trống'),
})

/**
 * Employee report response schema
 *
 * This represents the complete report data structure returned by the API.
 * Used for type inference and validation in both backend and frontend.
 */
export const zEmployeeReportResponse = z.object({
  employee: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string().nullable(),
    imageUrl: z.string().nullable(),
  }),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
    timezone: z.string(),
  }),
  metrics: z.object({
    daysWorked: z.number().int().min(0),
    tasksCompleted: z.number().int().min(0),
    totalRevenue: z.number().min(0),
  }),
  tasks: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      completedAt: z.string().nullable(),
      revenue: z.number().min(0),
      revenueShare: z.number().min(0),
      workerCount: z.number().int().min(1),
    }),
  ),
})

// Type exports for TypeScript
export type EmployeeReportQuery = z.infer<typeof zEmployeeReportQuery>
export type EmployeeReportParam = z.infer<typeof zEmployeeReportParam>
export type EmployeeReportResponse = z.infer<typeof zEmployeeReportResponse>
