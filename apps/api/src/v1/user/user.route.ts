import { getAuth } from '@hono/clerk-auth'
import { UserRole, z, zCreateUser } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '../../lib/z-validator'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  banUser,
  canUserBanUnbanUser,
  canUserCreateUser,
  canUserListUsers,
  canUserUpdateUserRoles,
  createClerkUser,
  getAllUsers,
  unbanUser,
  updateUserRoles,
} from './user.service'

const router = new Hono()
  // Get current user (fetch full user data from Clerk on-demand)
  .get('/me', async (c) => {
    const auth = getAuth(c)
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'unauthorized' })
    }

    const clerkClient = c.get('clerk')
    const user = await clerkClient.users.getUser(auth.userId)
    return c.json(user)
  })
  // Create a new user
  .post('/', zValidator('json', zCreateUser), async (c) => {
    const data = c.req.valid('json')
    const user = getAuthUserStrict(c)
    const clerkClient = c.get('clerk')
    const canCreateUser = canUserCreateUser({ user })

    if (!canCreateUser) {
      throw new HTTPException(403, {
        message: 'Bạn không có quyền tạo người dùng.',
        cause: 'Permission denied',
      })
    }

    try {
      const user = await createClerkUser({ clerkClient, data })
      c.status(201)
      return c.json(user)
    } catch (error) {
      throw new HTTPException(500, {
        message: 'Không thể tạo người dùng.',
        cause: error,
      })
    }
  })
  // Get all users
  .get('/', async (c) => {
    const user = getAuthUserStrict(c)
    const clerkClient = c.get('clerk')

    if (!(await canUserListUsers({ user }))) {
      throw new HTTPException(403, {
        message: 'Bạn không có quyền xem danh sách người dùng.',
        cause: 'Permission denied',
      })
    }

    const users = await getAllUsers({ clerkClient })
    return c.json(users)
  })
  // Ban/unban user
  .put(
    '/:id/ban',
    zValidator('param', z.object({ id: z.string() })),
    zValidator('json', z.object({ ban: z.boolean() })),
    async (c) => {
      const user = getAuthUserStrict(c)
      const clerkClient = c.get('clerk')
      const { id: userId } = c.req.valid('param')
      const { ban } = c.req.valid('json')

      if (!(await canUserBanUnbanUser({ user }))) {
        throw new HTTPException(403, {
          message: 'Bạn không có quyền khoá người dùng.',
          cause: 'Permission denied',
        })
      }

      const updatedUser = ban
        ? await banUser({ clerkClient, userId })
        : await unbanUser({ clerkClient, userId })

      return c.json(updatedUser)
    },
  )
  // Update roles
  .put(
    '/:id/roles',
    zValidator('param', z.object({ id: z.string() })),
    zValidator(
      'json',
      z.object({
        roles: z.array(z.enum(UserRole)),
      }),
    ),
    async (c) => {
      const user = getAuthUserStrict(c)
      const clerkClient = c.get('clerk')
      const { id: userId } = c.req.valid('param')
      const { roles } = c.req.valid('json')

      if (!(await canUserUpdateUserRoles({ user }))) {
        throw new HTTPException(403, {
          message: 'Bạn không có quyền cập nhật vai trò người dùng.',
          cause: 'Permission denied',
        })
      }

      const updatedUser = await updateUserRoles({ clerkClient, userId, roles })
      return c.json(updatedUser)
    },
  )
  // Get a user by id (public info)
  .get(
    '/:id/public-info',
    zValidator('param', z.object({ id: z.string() })),
    async (c) => {
      getAuthUserStrict(c)
      const clerkClient = c.get('clerk')
      const { id: userId } = c.req.valid('param')

      const user = await clerkClient.users.getUser(userId)
      if (!user) {
        throw new HTTPException(404, {
          message: 'Người dùng không tồn tại.',
          cause: 'Not found',
        })
      }

      return c.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        banned: user.banned,
        publicMetadata: user.publicMetadata,
        imageUrl: user.imageUrl,
        hasImage: user.hasImage,
      })
    },
  )

export default router
