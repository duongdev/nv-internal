import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export interface EmployeeSummaryMetrics {
  tasksCompleted: number
  totalRevenue: number
  daysWorked: number
}

export interface EmployeeSummary {
  id: string
  firstName: string
  lastName: string
  email: string | null
  imageUrl: string
  metrics: EmployeeSummaryMetrics
  hasActivity: boolean
}

export interface SummaryStatistics {
  totalEmployees: number
  activeEmployees: number
  totalRevenue: number
  totalTasks: number
}

export interface EmployeesSummaryPeriod {
  startDate: string
  endDate: string
  timezone: string
}

export interface EmployeesSummaryResponse {
  period: EmployeesSummaryPeriod
  employees: EmployeeSummary[]
  summary: SummaryStatistics
}

export interface UseEmployeesSummaryParams {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  timezone?: string // IANA timezone (default: Asia/Ho_Chi_Minh)
  sort?: 'revenue' | 'tasks' | 'name'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Fetch employees summary for a specific date range
 */
export function useEmployeesSummary(
  params: UseEmployeesSummaryParams,
  options?: Partial<
    Omit<
      UseQueryOptions<
        EmployeesSummaryResponse,
        Error,
        EmployeesSummaryResponse,
        (string | UseEmployeesSummaryParams)[]
      >,
      'queryKey' | 'queryFn'
    >
  >,
) {
  const {
    startDate,
    endDate,
    timezone = 'Asia/Ho_Chi_Minh',
    sort = 'revenue',
    sortOrder = 'desc',
  } = params

  return useQuery({
    queryKey: ['reports', 'summary', params],
    queryFn: async () => {
      const { data } = await callHonoApi((client) =>
        client.v1.reports.summary.$get({
          query: {
            startDate,
            endDate,
            timezone: timezone as 'Asia/Ho_Chi_Minh', // Type assertion for default value
            sort,
            sortOrder,
          },
        }),
      )

      // Add defensive logging to debug API response structure (dev only)
      // eslint-disable-next-line no-console
      console.info('📊 Summary API Response:', {
        totalEmployees: data.employees?.length,
        hasActiveEmployees: 'activeEmployees' in (data.summary || {}),
        activeEmployeesValue: data.summary?.activeEmployees,
        firstEmployeeHasActivity: data.employees?.[0]?.hasActivity,
        sampleEmployee: data.employees?.[0]
          ? {
              id: data.employees[0].id,
              hasActivity: data.employees[0].hasActivity,
              metrics: data.employees[0].metrics,
            }
          : null,
      })

      // Normalize API response with defensive fallbacks
      const response = data as unknown as EmployeesSummaryResponse

      // Add client-side fallback for hasActivity if not provided by backend
      const normalizedEmployees = response.employees.map((employee) => ({
        ...employee,
        hasActivity:
          employee.hasActivity ??
          (employee.metrics.tasksCompleted > 0 ||
            employee.metrics.daysWorked > 0),
      }))

      // Add client-side fallback for activeEmployees if not provided by backend
      const activeEmployees =
        response.summary.activeEmployees ??
        normalizedEmployees.filter(
          (emp) => emp.metrics.tasksCompleted > 0 || emp.metrics.daysWorked > 0,
        ).length

      return {
        ...response,
        employees: normalizedEmployees,
        summary: {
          ...response.summary,
          activeEmployees,
        },
      }
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes (fresher than detail view)
    gcTime: 1000 * 60 * 60, // 1 hour
    ...options,
  })
}
