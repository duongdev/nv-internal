import type { CreateTaskValues } from '@nv-internal/validation'
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { TASK_LIST_QUERY_KEY } from './use-task-infinite-list'

export async function createTask(data: CreateTaskValues) {
  const { data: task } = await callHonoApi(
    (c) => c.v1.task.$post({ json: data }),
    {
      throwOnError: false,
      toastOnError: true,
    },
  )

  return task
}

export type CreateTaskResponse = Awaited<ReturnType<typeof createTask>>

export function useCreateTask(
  mutationOptions?: UseMutationOptions<
    CreateTaskResponse,
    Error,
    CreateTaskValues
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createTask,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate task list query
      queryClient.invalidateQueries({ queryKey: TASK_LIST_QUERY_KEY })
    },
  })

  return mutation
}
