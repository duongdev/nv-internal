import type { TaskListQuery, TaskStatus } from '@nv-internal/validation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function fetchAssignedTaskList({
  cursor,
  take,
  status,
}: {
  cursor?: string
  take?: string
  status?: TaskStatus[]
}) {
  const { data } = await callHonoApi(
    (c) =>
      c.v1.task.$get({
        query: {
          cursor,
          take: take?.toString() ?? undefined,
          assignedOnly: 'true',
          status,
        },
      }),
    { toastOnError: true },
  )

  return data
}

export type FetchAssignedTaskListResponse = Awaited<
  ReturnType<typeof fetchAssignedTaskList>
>

export const ASSIGNED_TASK_LIST_QUERY_KEY = ['assigned_tasks']

export function useAssignedTaskInfiniteList({
  status,
  limit,
}: {
  status?: TaskStatus[]
  limit?: number
} = {}) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...ASSIGNED_TASK_LIST_QUERY_KEY, status],
    queryFn: async ({ pageParam = '' }) => {
      return fetchAssignedTaskList({
        cursor: pageParam,
        status,
        take: limit ? limit.toString() : undefined,
      })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })

  return infiniteQuery
}
