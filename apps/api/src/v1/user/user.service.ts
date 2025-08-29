import type { ClerkClient, User } from '@clerk/backend'
import { getLogger } from '../../lib/log'
import type { z } from '../../lib/zod'
import type { zCreateUser } from '../validators/user.zod'
import { UserRole } from './user.const'

export function doesUserHaveRole({
  user,
  ...args
}: { user: User } & (
  | { role: UserRole }
  | { any: UserRole[] }
  | { all: UserRole[] }
)) {
  const rolesOfUser = (user.publicMetadata?.roles ?? []) as UserRole[]

  if ('role' in args) {
    return rolesOfUser.includes(args.role)
  }

  if ('any' in args) {
    return rolesOfUser.some((role) => args.any.includes(role))
  }

  if ('all' in args) {
    return args.all.every((role) => rolesOfUser.includes(role))
  }

  return false
}

export function isUserAdmin({ user }: { user: User }) {
  return doesUserHaveRole({ user, role: UserRole.nvInternalAdmin })
}

export function canUserCreateUser({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserListUsers({ user }: { user: User }) {
  return isUserAdmin({ user })
}

// ---

export async function createClerkUser({
  clerkClient,
  data,
}: {
  clerkClient: ClerkClient
  data: z.infer<typeof zCreateUser>
}) {
  const logger = getLogger('createClerkUser')

  logger.trace({ data }, 'Creating user in Clerk')

  // Create the user in Clerk
  const user = await clerkClient.users.createUser({
    firstName: data.firstName,
    lastName: data.lastName,
    emailAddress: data.email ? [data.email] : undefined,
    username: data.username,
    password: data.password || data.username,
    publicMetadata: {
      phoneNumber: data.phone,
      roles: [UserRole.nvInternalWorker],
    },
  })

  logger.trace({ user }, 'User created in Clerk')

  return user
}

export async function getAllUsers({
  clerkClient,
}: {
  clerkClient: ClerkClient
}) {
  const totalUserCount = await clerkClient.users.getCount()

  // Keep pagination in mind
  const pageSize = 100
  const pageCount = Math.ceil(totalUserCount / pageSize)

  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      clerkClient.users.getUserList({ offset: i * pageSize, limit: pageSize }),
    ),
  )

  return pages.map((p) => p.data).flat()
}
