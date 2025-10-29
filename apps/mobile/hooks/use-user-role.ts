import { useUser } from '@clerk/clerk-expo'
import type { User } from '@/api/user/use-user-list'
import { getUserRoles, isUserAdmin, isUserWorker } from '@/utils/user-helper'

/**
 * Hook to get user roles from Clerk public metadata
 *
 * Returns:
 * - roles: Array of user roles from public metadata
 * - isAdmin: Boolean indicating if user has admin role
 * - isWorker: Boolean indicating if user has worker role
 */
export function useUserRole() {
  const { user } = useUser()

  if (!user) {
    return { roles: [], isAdmin: false, isWorker: false }
  }

  const roles = getUserRoles(user as unknown as User)
  const isAdmin = isUserAdmin(user as unknown as User)
  const isWorker = isUserWorker(user as unknown as User)

  return { roles, isAdmin, isWorker }
}
