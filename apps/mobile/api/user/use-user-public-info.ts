import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { getHonoClient } from '@/lib/api-client'

export async function fetchUserPublicInfo(userId: string) {
  const client = await getHonoClient()
  const user = await (
    await client.v1.user[':id']['public-info'].$get({ param: { id: userId } })
  ).json()
  return user
}

export const userPublicInfoQueryOptions = (userId: string) => ({
  queryKey: ['user_public_info', userId],
  queryFn: () => fetchUserPublicInfo(userId),
  enabled: !!userId,
})

export function useUserPublicInfo(
  userId: string,
  queryOptions?: UseQueryOptions<FetchUserPublicInfoResponse>,
) {
  return useQuery({
    ...userPublicInfoQueryOptions(userId),
    ...queryOptions,
  })
}

export type FetchUserPublicInfoResponse = Awaited<
  ReturnType<typeof fetchUserPublicInfo>
>
export type UserPublicInfo = FetchUserPublicInfoResponse
