import type { ActivityListQuery } from '@nv-internal/validation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function fetchActivityList({
  cursor,
  take,
  topic,
}: ActivityListQuery) {
  const { data } = await callHonoApi(
    (c) =>
      c.v1.activity.$get({
        query: { cursor, take: take?.toString() ?? undefined, topic },
      }),
    { toastOnError: true },
  )

  return data
}

export type FetchActivityListResponse = Awaited<
  ReturnType<typeof fetchActivityList>
>

export const ACTIVITY_LIST_QUERY_KEY = (topic?: string) => ['activities', topic]

export function useActivityInfiniteList({
  topic,
  limit = 100,
}: {
  topic?: string
  limit?: number
} = {}) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: ACTIVITY_LIST_QUERY_KEY(topic),
    queryFn: async ({ pageParam = '' }) => {
      return fetchActivityList({
        cursor: pageParam,
        topic,
        take: limit.toString(),
      })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })

  return infiniteQuery
}
