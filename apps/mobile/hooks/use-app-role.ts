import { useUser } from '@clerk/clerk-expo'
import { usePathname } from 'expo-router'
import { useMemo } from 'react'
import type { User } from '@/api/user/use-user-list'
import { isUserAdmin } from '@/utils/user-helper'

export type AppRole = 'admin' | 'worker'

/**
 * A hook to get the current app role based on pathname-first detection with user permission fallback.
 *
 * **Detection Strategy** (in priority order):
 * 1. **Pathname-based**: Detects role from current route (/admin/* → 'admin', /worker/* → 'worker')
 *    - This allows admin users to switch to worker mode by navigating to worker routes
 *    - Resolves PSN-19: Admin users can now start work in worker module
 * 2. **Permission-based**: Falls back to user's Clerk metadata for shared routes (e.g., location picker)
 *    - Ensures role remains consistent when navigating to shared components
 *    - Returns 'admin' if user has admin role, otherwise 'worker'
 *
 * **Edge Cases**:
 * - Shared routes (not under /admin or /worker): Uses user permissions
 * - Module transitions: Role updates automatically based on pathname
 * - RBAC guards provide security layer independently of this hook
 *
 * @returns {AppRole | null} The user's role based on pathname or permissions, or null if user data is still loading
 */
export function useAppRole(): AppRole | null {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()

  return useMemo(() => {
    // Return null while loading to prevent flickering/incorrect role
    if (!isLoaded || !user) {
      return null
    }

    // PRIORITY 1: Detect from pathname (active module)
    if (pathname?.startsWith('/admin')) {
      return 'admin'
    }
    if (pathname?.startsWith('/worker')) {
      return 'worker'
    }

    // PRIORITY 2: Shared routes - fall back to user permissions
    return isUserAdmin(user as unknown as User) ? 'admin' : 'worker'
  }, [isLoaded, user, pathname])
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
