import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { TaskStatus } from '@/components/ui/task-status-badge'
import { callHonoApi } from '@/lib/api-client'
import { taskQueryOptions } from './use-task'
import { TASK_LIST_QUERY_KEY } from './use-task-infinite-list'

export async function updateTaskStatus({
  taskId,
  status,
}: {
  taskId: number
  status: TaskStatus
}) {
  const { data: task } = await callHonoApi(
    (c) =>
      c.v1.task[':id'].status.$put({
        param: { id: taskId.toString() },
        json: { status },
      }),
    { toastOnError: true },
  )
  return task
}

export type UpdateTaskStatusResponse = Awaited<
  ReturnType<typeof updateTaskStatus>
>

export function useUpdateTaskStatus(
  mutationOptions?: UseMutationOptions<
    UpdateTaskStatusResponse,
    Error,
    { taskId: number; status: TaskStatus }
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateTaskStatus,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate task query
      queryClient.invalidateQueries({
        queryKey: taskQueryOptions({ id: args[2].taskId }).queryKey,
      })
      queryClient.invalidateQueries({ queryKey: TASK_LIST_QUERY_KEY })
    },
  })

  return mutation
}
