import type { TaskListQuery } from '@nv-internal/validation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function fetchTaskList({ cursor, take }: TaskListQuery) {
  const { data } = await callHonoApi(
    (c) =>
      c.v1.task.$get({
        query: { cursor, take: take?.toString() ?? undefined },
      }),
    { toastOnError: true },
  )

  return data
}

export type FetchTaskListResponse = Awaited<ReturnType<typeof fetchTaskList>>

export const TASK_LIST_QUERY_KEY = ['tasks']

export function useTaskInfiniteList(options?: { enabled?: boolean }) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: TASK_LIST_QUERY_KEY,
    queryFn: async ({ pageParam = '' }) => {
      return fetchTaskList({ cursor: pageParam })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled: options?.enabled ?? true,
  })

  return infiniteQuery
}
