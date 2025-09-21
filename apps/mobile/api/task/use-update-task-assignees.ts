import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { taskQueryOptions } from './use-task'

export async function updateTaskAssignees({
  taskId,
  assigneeIds,
}: {
  taskId: number
  assigneeIds: string[]
}) {
  const { data: task } = await callHonoApi(
    (c) =>
      c.v1.task[':id'].assignees.$put({
        param: { id: taskId.toString() },
        json: { assigneeIds },
      }),
    { toastOnError: true },
  )
  return task
}

export type UpdateTaskAssigneesResponse = Awaited<
  ReturnType<typeof updateTaskAssignees>
>

export function useUpdateTaskAssignees(
  mutationOptions?: UseMutationOptions<
    UpdateTaskAssigneesResponse,
    Error,
    { taskId: number; assigneeIds: string[] }
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateTaskAssignees,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate task query
      queryClient.invalidateQueries({
        queryKey: taskQueryOptions({ id: args[2].taskId }).queryKey,
      })
    },
  })

  return mutation
}
