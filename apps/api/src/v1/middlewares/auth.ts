import type { User } from '@clerk/backend'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'

export const authMiddleware = createMiddleware(async (c, next) => {
  // Bypass auth for attachment view endpoint (uses JWT token instead)
  if (c.req.path.startsWith('/v1/attachments/view/')) {
    return next()
  }

  await clerkMiddleware()(c, () => Promise.resolve())
  const auth = getAuth(c)

  if (!auth?.userId) {
    c.set('userId', null)
    c.set('user', null)
    return c.json({ message: 'unauthorized' }, 401)
  }

  c.set('userId', auth.userId)

  // IMPORTANT: We need to fetch the full user object from Clerk to get publicMetadata
  // The JWT sessionClaims don't contain publicMetadata.roles - they only have org info
  // This is a necessary API call until we store roles in a custom JWT claim
  const clerkClient = c.get('clerk')
  const logger = getLogger('auth-middleware')

  try {
    const user = await clerkClient.users.getUser(auth.userId)
    c.set('user', user)
    c.header('x-user-id', auth.userId)
  } catch (error) {
    logger.error(`Failed to fetch user from Clerk ${error}`)
    // Set minimal user with empty metadata as fallback
    const minimalUser: Partial<User> = {
      id: auth.userId,
      publicMetadata: {},
    }
    c.set('user', minimalUser as User)
    c.header('x-user-id', auth.userId)
  }

  await next()
})

export const getAuthUser = (c: Context) => c.get('user') as User | null

export const getAuthUserStrict = (c: Context) => {
  const user = getAuthUser(c)
  if (!user) {
    throw new HTTPException(401, { message: 'unauthorized' })
  }
  return user
}
