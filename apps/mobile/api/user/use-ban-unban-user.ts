import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { userListQueryOptions } from './use-user-list'

export async function banUnbanUser({
  userId,
  ban,
}: {
  userId: string
  ban: boolean
}) {
  const { data: user } = await callHonoApi(
    (c) =>
      c.v1.user[':id'].ban.$post({
        json: { ban },
        param: { id: userId },
      }),
    { toastOnError: true },
  )
  return user
}

export type BanUnbanUserResponse = Awaited<ReturnType<typeof banUnbanUser>>

export function useBanUnbanUser(
  mutationOptions?: UseMutationOptions<
    BanUnbanUserResponse,
    Error,
    { userId: string; ban: boolean }
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: banUnbanUser,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate user list query
      queryClient.invalidateQueries({ queryKey: userListQueryOptions.queryKey })
    },
  })

  return mutation
}
