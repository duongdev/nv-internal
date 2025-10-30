import {
  type UserPublicMetadata,
  UserRole,
  zUserPublicMetadata,
} from '@nv-internal/validation'
import type { User } from '@/api/user/use-user-list'

export function getUserPublicMetadata(user: User): UserPublicMetadata {
  return zUserPublicMetadata.parse(user.publicMetadata) as UserPublicMetadata
}

export function getUserPhoneNumber(user: User): string | null {
  return getUserPublicMetadata(user).phoneNumber ?? null
}

export function getUserRoles(user: User): UserRole[] {
  return getUserPublicMetadata(user).roles ?? []
}

export function formatPhoneNumber(
  phoneNumber: string | null,
  emptyFallback?: string | null,
): string {
  if (!phoneNumber) {
    return (
      (emptyFallback === null && '') || emptyFallback || 'Chưa có số điện thoại'
    )
  }

  // Format the phone number as needed
  return phoneNumber
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d{4})(\d{3})/, '$1 $2 $3')
}

export function getUserFullName(
  user: Pick<User, 'firstName' | 'lastName'>,
): string {
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Unknown'
}

/**
 * Get user initials from first and last name
 * Returns up to 2 characters (first letter of each name)
 *
 * @example
 * getUserInitials({ firstName: 'John', lastName: 'Doe' }) // 'JD'
 * getUserInitials({ firstName: 'Nguyen', lastName: null }) // 'N'
 * getUserInitials({ firstName: null, lastName: 'Doe' }) // 'D'
 */
export function getUserInitials(
  user: Pick<User, 'firstName' | 'lastName'>,
): string {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  return `${lastInitial}${firstInitial}` || '?'
}

export function getUserPrimaryEmail(user: User): string | null {
  return user.emailAddresses[0]?.emailAddress ?? null
}

export function isUserBanned(user: User): boolean {
  return user.banned ?? false
}

export function isUserAdmin(user: User): boolean {
  return getUserRoles(user).includes(UserRole.nvInternalAdmin)
}

export function isUserWorker(user: User): boolean {
  return getUserRoles(user).includes(UserRole.nvInternalWorker)
}
