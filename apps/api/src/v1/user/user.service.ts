import type { ClerkClient, User } from '@clerk/backend'
import type { ClerkAPIResponseError } from '@clerk/types'
import { UserRole, type z, type zCreateUser } from '@nv-internal/validation'
import { getLogger } from '../../lib/log'

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

export async function canUserBanUnbanUser({ user }: { user: User }) {
  return isUserAdmin({ user })
}

// ---

export async function createClerkUser({
  clerkClient,
  data,
  usernameRetryCount,
}: {
  clerkClient: ClerkClient
  data: z.infer<typeof zCreateUser>
  usernameRetryCount?: number
}) {
  const logger = getLogger('createClerkUser')

  logger.trace({ data }, 'Creating user in Clerk')

  try {
    // Create the user in Clerk
    const username = usernameRetryCount
      ? `${data.username}${usernameRetryCount}`
      : data.username
    const user = await clerkClient.users.createUser({
      skipPasswordChecks: true,

      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: data.email ? [data.email] : undefined,
      username,
      password: data.password || username,
      publicMetadata: {
        phoneNumber: data.phone,
        roles: [UserRole.nvInternalWorker],
      },
    })

    logger.trace({ user }, 'User created in Clerk')

    return user
  } catch (error) {
    // If the username is taken, try again appending a number
    const clerkError = error as ClerkAPIResponseError

    const isUsernameTaken = clerkError.errors.some(
      (e) => e.code === 'form_identifier_exists',
    )

    if (isUsernameTaken) {
      logger.warn(
        { error, data },
        'Username is already taken, trying again with a different username',
      )
      return createClerkUser({
        clerkClient,
        data,
        usernameRetryCount: (usernameRetryCount ?? 0) + 1,
      })
    }

    logger.error({ error, data }, 'Error creating user in Clerk')
    throw error
  }
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

export async function banUser({
  clerkClient,
  userId,
}: {
  clerkClient: ClerkClient
  userId: string
}) {
  const logger = getLogger('banUser')

  logger.trace({ userId }, 'Banning user in Clerk')

  try {
    const updatedUser = await clerkClient.users.banUser(userId)

    logger.trace({ userId, updatedUser }, 'User banned in Clerk')

    return updatedUser
  } catch (error) {
    logger.error({ error, userId }, 'Error banning user in Clerk')
    throw error
  }
}

export async function unbanUser({
  clerkClient,
  userId,
}: {
  clerkClient: ClerkClient
  userId: string
}) {
  const logger = getLogger('unbanUser')

  logger.trace({ userId }, 'Unbanning user in Clerk')

  try {
    const updatedUser = await clerkClient.users.unbanUser(userId)

    logger.trace({ userId, updatedUser }, 'User unbanned in Clerk')

    return updatedUser
  } catch (error) {
    logger.error({ error, userId }, 'Error unbanning user in Clerk')
    throw error
  }
}
