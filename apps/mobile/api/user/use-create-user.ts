import type { z, zCreateUser } from '@nv-internal/validation'
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'
import { userListQueryOptions } from './use-user-list'

export async function createUser(data: z.infer<typeof zCreateUser>) {
  const { data: user } = await callHonoApi((c) =>
    c.v1.user.$post({ json: data }),
  )

  return user
}

export type CreateUserResponse = Awaited<ReturnType<typeof createUser>>

export function useCreateUser(
  mutationOptions?: UseMutationOptions<
    CreateUserResponse,
    Error,
    z.infer<typeof zCreateUser>
  >,
) {
  const queryClient = useQueryClient()

  return useMutation<CreateUserResponse, Error, z.infer<typeof zCreateUser>>({
    mutationFn: createUser,
    ...mutationOptions,
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate user list query
      queryClient.invalidateQueries({ queryKey: userListQueryOptions.queryKey })
    },
  })
}
