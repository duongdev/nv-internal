import { zValidator } from '@hono/zod-validator'
import { UserRole, z, zCreateUser } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  banUser,
  canUserBanUnbanUser,
  canUserListUsers,
  canUserUpdateUserRoles,
  createClerkUser,
  getAllUsers,
  isUserAdmin,
  unbanUser,
  updateUserRoles,
} from './user.service'

const router = new Hono()
  // Get current user
  .get('/me', (c) => {
    const user = getAuthUserStrict(c)
    return c.json(user)
  })
  // Create a new user
  .post('/', zValidator('json', zCreateUser), async (c) => {
    const data = c.req.valid('json')
    const user = getAuthUserStrict(c)
    const clerkClient = c.get('clerk')
    const canCreateUser = isUserAdmin({ user })

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

    if (!canUserListUsers({ user })) {
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

      if (!canUserBanUnbanUser({ user })) {
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
        roles: z.array(
          z.union(Object.values(UserRole).map((role) => z.literal(role))),
        ),
      }),
    ),
    async (c) => {
      const user = getAuthUserStrict(c)
      const clerkClient = c.get('clerk')
      const { id: userId } = c.req.valid('param')
      const { roles } = c.req.valid('json')

      if (!canUserUpdateUserRoles({ user })) {
        throw new HTTPException(403, {
          message: 'Bạn không có quyền cập nhật vai trò người dùng.',
          cause: 'Permission denied',
        })
      }

      const updatedUser = await updateUserRoles({ clerkClient, userId, roles })
      return c.json(updatedUser)
    },
  )

export default router
