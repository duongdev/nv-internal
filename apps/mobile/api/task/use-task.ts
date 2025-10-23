import {
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { activitiesQueryOptions } from '@/api/activity/use-activities'
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
  const queryClient = useQueryClient()

  const query = useQuery<FetchTaskByIdResponse>({
    ...taskQueryOptions(variables),
    ...queryOptions,
  })

  // Prefetch activities for this task to reduce sequential requests
  // This runs in parallel with the task query
  if (variables.id && query.isSuccess) {
    queryClient.prefetchQuery(
      activitiesQueryOptions({ topic: `TASK_${variables.id}` }),
    )
  }

  return query
}
