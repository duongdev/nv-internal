import { useUser } from '@clerk/clerk-expo'
import { useMemo } from 'react'
import type { User } from '@/api/user/use-user-list'
import { isUserAdmin } from '@/utils/user-helper'

export type AppRole = 'admin' | 'worker'

/**
 * A hook to get the current app role based on user's Clerk metadata.
 * Returns 'admin' if user has admin role in their public metadata, otherwise 'worker'.
 *
 * IMPORTANT: This hook determines role from user permissions, NOT from URL pathname.
 * This ensures role remains stable during navigation (e.g., when opening location picker).
 *
 * @returns {AppRole | null} The user's role, or null if user data is still loading
 */
export function useAppRole(): AppRole | null {
  const { user, isLoaded } = useUser()

  return useMemo(() => {
    // Return null while loading to prevent flickering/incorrect role
    if (!isLoaded || !user) {
      return null
    }

    // Check user's actual role from Clerk metadata
    return isUserAdmin(user as unknown as User) ? 'admin' : 'worker'
  }, [isLoaded, user])
}

/**
 * Check if current user is in admin role
 * @returns {boolean} true if admin, false if worker or loading
 */
export function isInAdminApp(): boolean {
  return useAppRole() === 'admin'
}

/**
 * Check if current user is in worker role
 * @returns {boolean} true if worker, false if admin or loading
 */
export function isInWorkerApp(): boolean {
  return useAppRole() === 'worker'
}
