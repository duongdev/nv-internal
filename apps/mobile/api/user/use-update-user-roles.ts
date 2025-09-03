import type { UserRole } from '@nv-internal/validation'
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { userListQueryOptions } from './use-user-list'

export async function updateUserRoles({
  userId,
  roles,
}: {
  userId: string
  roles: UserRole[]
}) {
  const { data: user } = await callHonoApi(
    (c) =>
      c.v1.user[':id'].roles.$put({
        json: { roles },
        param: { id: userId },
      }),
    { toastOnError: true },
  )
  return user
}

export type UpdateUserRolesResponse = Awaited<
  ReturnType<typeof updateUserRoles>
>

export function useUpdateUserRoles(
  mutationOptions?: UseMutationOptions<
    UpdateUserRolesResponse,
    Error,
    { userId: string; roles: UserRole[] }
  >,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateUserRoles,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate user list query
      queryClient.invalidateQueries({ queryKey: userListQueryOptions.queryKey })
    },
  })

  return mutation
}
