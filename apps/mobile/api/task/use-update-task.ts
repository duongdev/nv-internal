import type { UpdateTaskValues } from '@nv-internal/validation'
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { activitiesQueryOptions } from '../activity/use-activities'
import { taskQueryOptions } from './use-task'
import { TASK_LIST_QUERY_KEY } from './use-task-infinite-list'

export async function updateTask({
  taskId,
  data,
}: {
  taskId: number
  data: UpdateTaskValues
}) {
  const { data: task } = await callHonoApi(
    (c) =>
      c.v1.task[':id'].$patch({
        param: { id: taskId.toString() },
        json: data,
      }),
    { toastOnError: true },
  )
  return task
}

export type UpdateTaskResponse = Awaited<ReturnType<typeof updateTask>>

export function useUpdateTask(
  mutationOptions?: UseMutationOptions<
    UpdateTaskResponse,
    Error,
    { taskId: number; data: UpdateTaskValues }
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateTask,
    onSuccess: (data, { taskId }, ...args) => {
      mutationOptions?.onSuccess?.(
        data,
        { taskId, data: {} as UpdateTaskValues },
        ...args,
      )
      // Invalidate queries to refresh with server data
      queryClient.invalidateQueries({
        queryKey: taskQueryOptions({ id: taskId }).queryKey,
      })
      queryClient.invalidateQueries({ queryKey: TASK_LIST_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: activitiesQueryOptions({ topic: `TASK_${taskId}` }).queryKey,
      })
    },
    onError: (err, variables, context) => {
      mutationOptions?.onError?.(err, variables, context)
    },
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
    },
  })

  return mutation
}
