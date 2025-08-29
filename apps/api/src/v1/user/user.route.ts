import { zValidator } from '@hono/zod-validator'
import { zCreateUser } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  canUserListUsers,
  createClerkUser,
  getAllUsers,
  isUserAdmin,
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
      console.error('Error creating user:', error)
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

export default router
