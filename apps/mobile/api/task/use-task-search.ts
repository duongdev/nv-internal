import type { TaskSearchFilterQuery } from '@nv-internal/validation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

/**
 * Fetch task search results with Vietnamese accent-insensitive search
 * Uses the enhanced /v1/task/search endpoint
 */
export async function fetchTaskSearch(params: TaskSearchFilterQuery) {
  const { data } = await callHonoApi(
    (c) =>
      c.v1.task.search.$get({
        query: {
          cursor: params.cursor,
          take: params.take?.toString() ?? undefined,
          search: params.search,
          status: params.status,
          assigneeIds: params.assigneeIds,
          assignedOnly: params.assignedOnly,
          customerId: params.customerId,
          scheduledFrom: params.scheduledFrom,
          scheduledTo: params.scheduledTo,
          createdFrom: params.createdFrom,
          createdTo: params.createdTo,
          completedFrom: params.completedFrom,
          completedTo: params.completedTo,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
    { toastOnError: true },
  )

  return data
}

export type FetchTaskSearchResponse = Awaited<
  ReturnType<typeof fetchTaskSearch>
>

export const TASK_SEARCH_QUERY_KEY = ['tasks', 'search']

/**
 * Hook for searching tasks with Vietnamese accent-insensitive search
 * and comprehensive filtering options
 *
 * @param filters - Search and filter parameters
 * @param options - Additional TanStack Query options (e.g., enabled)
 * @returns TanStack Query infinite query result
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isLoading } = useTaskSearch(
 *   { search: 'nguyen' }, // Finds "Nguyễn"
 *   { enabled: searchQuery.length > 0 }
 * )
 * ```
 */
export function useTaskSearch(
  filters: Omit<TaskSearchFilterQuery, 'cursor'>,
  options?: { enabled?: boolean },
) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...TASK_SEARCH_QUERY_KEY, filters],
    queryFn: async ({ pageParam = '' }) => {
      return fetchTaskSearch({
        ...filters,
        cursor: pageParam,
      })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled: options?.enabled ?? true,
  })

  return infiniteQuery
}
