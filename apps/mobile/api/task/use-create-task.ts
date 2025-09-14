import type { CreateTaskValues } from '@nv-internal/validation'
import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

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
  // const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createTask,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate task list query
      // queryClient.invalidateQueries(['tasks'])
    },
  })

  return mutation
}
