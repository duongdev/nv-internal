import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function fetchTaskById(taskId: number) {
  const { data: task } = await callHonoApi(
    (c) => c.v1.task[':id'].$get({ param: { id: taskId.toString() } }),
    { throwOnError: false, toastOnError: false },
  )

  return task ?? null
}

export type FetchTaskByIdResponse = Awaited<ReturnType<typeof fetchTaskById>>
export type Task = NonNullable<FetchTaskByIdResponse>

export type TaskQueryVariables = { id: number }

export const taskQueryOptions = (variables: TaskQueryVariables) => ({
  queryKey: ['task', variables.id],
  queryFn: () => fetchTaskById(variables.id),
})

export function useTask(
  variables: { id: number },
  queryOptions?: Partial<UseQueryOptions<FetchTaskByIdResponse>>,
) {
  return useQuery<FetchTaskByIdResponse>({
    ...taskQueryOptions(variables),
    ...queryOptions,
  })
}
