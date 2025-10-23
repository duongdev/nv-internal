import type { User } from '@clerk/backend'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { UserPublicMetadata } from '@nv-internal/validation'
import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

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

  // PERFORMANCE OPTIMIZATION: Read user metadata from JWT session claims
  // instead of fetching from Clerk API on every request
  //
  // Custom claims are configured in Clerk Dashboard → Sessions → Customize session token
  // This eliminates ~2000ms API call in dev, ~300-500ms in prod
  //
  // JWT structure includes:
  // {
  //   metadata: {
  //     roles: ['nv_internal_admin', 'nv_internal_worker'],
  //     phoneNumber: '0123456789',
  //     defaultPasswordChanged: false
  //   }
  // }
  const sessionClaims = auth.sessionClaims as CustomJwtSessionClaims

  // Build minimal user object from JWT claims
  // This contains only publicMetadata which is used for authorization
  const defaultMetadata: UserPublicMetadata = {
    roles: [],
    defaultPasswordChanged: false,
  }

  const user: Partial<User> = {
    id: auth.userId,
    // biome-ignore lint/suspicious/noExplicitAny: <ignore>
    publicMetadata: (sessionClaims.metadata ?? defaultMetadata) as any,
  }

  c.set('user', user as User)
  c.header('x-user-id', auth.userId)

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
