import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export interface TaskPaymentsSummary {
  expectedRevenue: number | null
  totalCollected: number
  hasPayment: boolean
}

export interface TaskPayment {
  id: string
  amount: number
  currency: string
  collectedAt: string
  collectedBy: string // Clerk user ID
  invoiceAttachmentId?: string | null
  notes?: string | null
}

export interface TaskPaymentsResponse {
  payments: TaskPayment[]
  summary: TaskPaymentsSummary
}

/**
 * Fetch payments for a task with summary
 */
export function useTaskPayments(
  taskId: number,
  options?: Partial<
    Omit<
      UseQueryOptions<
        TaskPaymentsResponse,
        Error,
        TaskPaymentsResponse,
        string[]
      >,
      'queryKey' | 'queryFn'
    >
  >,
) {
  return useQuery({
    queryKey: ['task-payments', taskId.toString()],
    queryFn: async () => {
      const { data } = await callHonoApi((client) =>
        client.v1.task[':id'].payments.$get({
          param: { id: taskId.toString() },
        }),
      )
      return data as unknown as TaskPaymentsResponse
    },
    enabled: !!taskId,
    ...options,
  })
}
