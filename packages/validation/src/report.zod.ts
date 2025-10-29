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

/**
 * Validates employees summary query parameters
 *
 * Query parameters:
 * - startDate: ISO 8601 date string (YYYY-MM-DD) - inclusive
 * - endDate: ISO 8601 date string (YYYY-MM-DD) - inclusive
 * - timezone: IANA timezone identifier (optional, default: Asia/Ho_Chi_Minh)
 * - sort: Sort field - 'revenue', 'tasks', or 'name' (optional, default: 'revenue')
 * - sortOrder: Sort order - 'asc' or 'desc' (optional, default: 'desc')
 *
 * Validation rules:
 * - Both dates are required
 * - Dates must be valid ISO 8601 format
 * - endDate must be >= startDate
 * - Date range must not exceed 92 days (3 months)
 * - Timezone must be a valid IANA identifier
 *
 * Note: We do NOT validate that endDate is not in the future because:
 * 1. The backend query filters by completedAt <= endDate, which naturally excludes future tasks
 * 2. No tasks can have completedAt in the future (business constraint)
 * 3. Future date validation with timezones causes edge cases (e.g., current day rejection)
 * 4. Querying future dates simply returns empty results (graceful handling)
 *
 * Example usage:
 * ```
 * GET /v1/reports/summary?startDate=2025-01-01&endDate=2025-01-31
 * GET /v1/reports/summary?startDate=2025-01-01&endDate=2025-01-31&sort=tasks&sortOrder=asc
 * ```
 */
export const zEmployeesSummaryQuery = z
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
    sort: z
      .enum(['revenue', 'tasks', 'name'], {
        message:
          "Trường sắp xếp không hợp lệ. Chỉ hỗ trợ: 'revenue', 'tasks', 'name'",
      })
      .default('revenue'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        message: "Thứ tự sắp xếp không hợp lệ. Chỉ hỗ trợ: 'asc', 'desc'",
      })
      .default('desc'),
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
      return diffDays <= 92
    },
    {
      message: 'Khoảng thời gian không được vượt quá 92 ngày (3 tháng)',
      path: ['endDate'],
    },
  )

/**
 * Employee summary response schema
 *
 * This represents the summary report data structure returned by the API.
 */
export const zEmployeesSummaryResponse = z.object({
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
    timezone: z.string(),
  }),
  employees: z.array(
    z.object({
      id: z.string(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      username: z.string().nullable(),
      imageUrl: z.string().nullable(),
      metrics: z.object({
        totalRevenue: z.number().min(0),
        tasksCompleted: z.number().int().min(0),
        daysWorked: z.number().int().min(0),
      }),
      hasActivity: z.boolean(),
    }),
  ),
  summary: z.object({
    totalEmployees: z.number().int().min(0),
    activeEmployees: z.number().int().min(0),
    totalRevenue: z.number().min(0),
    totalTasks: z.number().int().min(0),
  }),
})

// Type exports for TypeScript
export type EmployeeReportQuery = z.infer<typeof zEmployeeReportQuery>
export type EmployeeReportParam = z.infer<typeof zEmployeeReportParam>
export type EmployeeReportResponse = z.infer<typeof zEmployeeReportResponse>
export type EmployeesSummaryQuery = z.infer<typeof zEmployeesSummaryQuery>
export type EmployeesSummaryResponse = z.infer<typeof zEmployeesSummaryResponse>
