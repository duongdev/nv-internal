import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toasts'
import { callHonoApi } from '@/lib/api-client'

export interface UpdateExpectedRevenueParams {
  taskId: number
  expectedRevenue: number | null
}

/**
 * Update expected revenue for a task
 * - Admin-only mutation
 * - Invalidates all related queries after success
 */
export function useUpdateExpectedRevenue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      expectedRevenue,
    }: UpdateExpectedRevenueParams) => {
      const { data } = await callHonoApi((client) =>
        client.v1.task[':id']['expected-revenue'].$put({
          param: { id: taskId.toString() },
          json: { expectedRevenue },
        }),
      )
      return data
    },
    onSuccess: (_, { taskId }) => {
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({
        queryKey: ['task-payments', taskId.toString()],
      })
      queryClient.invalidateQueries({
        queryKey: ['activities', `TASK_${taskId}`],
      })

      // Show success message
      toast.success('Đã cập nhật doanh thu dự kiến', {
        providerKey: 'PERSIST',
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật doanh thu dự kiến', {
        providerKey: 'PERSIST',
      })
    },
  })
}
