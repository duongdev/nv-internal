import type { UserRole } from '@nv-internal/validation'
import type { User } from '@/api/user/use-user-list'

export function getUserPhoneNumber(user: User): string | null {
  return user.publicMetadata?.phoneNumber ?? null
}

export function getUserRoles(user: User): UserRole[] {
  return user.publicMetadata?.roles ?? []
}
