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

export function useTaskInfiniteList() {
  const infiniteQuery = useInfiniteQuery({
    queryKey: ['tasks'],
    queryFn: async ({ pageParam = '' }) => {
      return fetchTaskList({ cursor: pageParam })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })

  return infiniteQuery
}
