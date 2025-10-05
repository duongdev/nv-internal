import { usePathname } from 'expo-router'

/**
 * A hook to get the current app role based on the pathname.
 * Returns 'admin' if the pathname starts with '/admin', otherwise 'worker'.
 */
export function useAppRole(): AppRole {
  const pathname = usePathname()
  return pathname.startsWith('/admin') ? 'admin' : 'worker'
}

export type AppRole = 'admin' | 'worker'

export function isInAdminApp(): boolean {
  return useAppRole() === 'admin'
}

export function isInWorkerApp(): boolean {
  return useAppRole() === 'worker'
}
