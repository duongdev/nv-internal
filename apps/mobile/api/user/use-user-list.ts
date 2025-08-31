import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { orderBy } from 'lodash-es'
import { getHonoClient } from '@/lib/api-client'

export async function fetchUserList() {
  const client = await getHonoClient()
  const users = await (await client.v1.user.$get()).json()
  return orderBy(users, ['firstName'], ['asc'])
}

export const userListQueryOptions = {
  queryKey: ['user_list'],
  queryFn: fetchUserList,
}

export function useUserList(
  queryOptions?: UseQueryOptions<FetchUserListResponse>,
) {
  return useQuery({
    ...userListQueryOptions,
    ...queryOptions,
  })
}

export type FetchUserListResponse = Awaited<ReturnType<typeof fetchUserList>>
export type User = FetchUserListResponse[number]
