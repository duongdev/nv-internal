import { useMutation } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export type DeleteAccountResponse = {
  success: boolean
  message: string
}

/**
 * Delete the current user's account
 * Calls DELETE /v1/account/me endpoint
 */
export async function deleteAccount() {
  const { data } = await callHonoApi<DeleteAccountResponse>((c) =>
    c.v1.account.me.$delete(),
  )

  return data
}

export function useDeleteAccount() {
  return useMutation<DeleteAccountResponse, Error, void>({
    mutationFn: deleteAccount,
  })
}
