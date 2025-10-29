import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

export interface EmployeeReportTask {
  id: number
  title: string
  completedAt: string
  revenue: number
  revenueShare: number
  workerCount: number
}

export interface EmployeeReportMetrics {
  daysWorked: number
  tasksCompleted: number
  totalRevenue: number
}

export interface EmployeeReportPeriod {
  startDate: string
  endDate: string
}

export interface EmployeeReportEmployee {
  id: string
  firstName: string
  lastName: string
  username: string
}

export interface EmployeeReportResponse {
  employee: EmployeeReportEmployee
  period: EmployeeReportPeriod
  metrics: EmployeeReportMetrics
  tasks: EmployeeReportTask[]
}

export interface UseEmployeeReportParams {
  userId: string
  startDate: string // ISO 8601 format: YYYY-MM-DD
  endDate: string // ISO 8601 format: YYYY-MM-DD
  timezone?: string // IANA timezone (default: Asia/Ho_Chi_Minh)
}

/**
 * Fetch employee report for a specific date range
 */
export function useEmployeeReport(
  params: UseEmployeeReportParams,
  options?: Partial<
    Omit<
      UseQueryOptions<
        EmployeeReportResponse,
        Error,
        EmployeeReportResponse,
        (string | UseEmployeeReportParams)[]
      >,
      'queryKey' | 'queryFn'
    >
  >,
) {
  const { userId, startDate, endDate, timezone = 'Asia/Ho_Chi_Minh' } = params

  return useQuery({
    queryKey: ['employee-report', params],
    queryFn: async () => {
      const { callHonoApi } = await import('@/lib/api-client')

      const { data } = await callHonoApi((client) =>
        client.v1.reports.employee[':userId'].$get({
          param: { userId },
          query: {
            startDate,
            endDate,
            timezone: timezone as 'Asia/Ho_Chi_Minh',
          },
        }),
      )

      return data as unknown as EmployeeReportResponse
    },
    enabled: !!userId && !!startDate && !!endDate,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    ...options,
  })
}
