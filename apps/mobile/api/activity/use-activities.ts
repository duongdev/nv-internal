import { useQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function fetchActivities({ topic }: { topic?: string }) {
  const { data } = await callHonoApi(
    (c) => c.v1.activity.$get({ query: { topic, take: '1000' } }),
    { toastOnError: true },
  )

  return data.activities ?? []
}

export type FetchActivitiesResponse = Awaited<
  ReturnType<typeof fetchActivities>
>

export type Activity = NonNullable<FetchActivitiesResponse>[number]

export const activitiesQueryOptions = (variables: { topic?: string }) => ({
  queryKey: ['activities', variables.topic],
  queryFn: () => fetchActivities({ topic: variables.topic }),
})

export function useActivities(variables: { topic?: string }) {
  return useQuery<FetchActivitiesResponse>({
    ...activitiesQueryOptions(variables),
  })
}
