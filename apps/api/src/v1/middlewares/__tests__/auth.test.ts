import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Hono } from 'hono'

// Mock @hono/clerk-auth module
const mockGetAuth = jest.fn()
const mockClerkMiddleware = jest.fn(() => jest.fn())

jest.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: mockClerkMiddleware,
  getAuth: mockGetAuth,
}))

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function getAuthMiddleware() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../auth') as {
      authMiddleware: ReturnType<typeof import('hono/factory').createMiddleware>
    }
    return mod.authMiddleware
  }

  it('bypasses auth for /v1/attachments/view/* endpoints', async () => {
    const app = new Hono()
    const authMiddleware = getAuthMiddleware()

    app.use('*', authMiddleware)
    app.get('/v1/attachments/view/:token', (c) => c.text('success'))

    const res = await app.request('/v1/attachments/view/some_token_here')

    // Should not call Clerk middleware for this path
    expect(mockClerkMiddleware).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('success')
  })

  it('requires auth for /v1/attachments endpoint', async () => {
    const app = new Hono()
    const authMiddleware = getAuthMiddleware()

    // Mock no user authenticated
    mockGetAuth.mockReturnValue({ userId: null })

    app.use('*', authMiddleware)
    app.get('/v1/attachments', (c) => c.text('success'))

    const res = await app.request('/v1/attachments?ids=att_123')

    // Should call Clerk middleware for this path
    expect(mockClerkMiddleware).toHaveBeenCalled()
    expect(res.status).toBe(401)
  })

  it('allows authenticated requests to protected endpoints', async () => {
    const app = new Hono()
    const authMiddleware = getAuthMiddleware()

    // Mock authenticated user
    mockGetAuth.mockReturnValue({ userId: 'user_123' })

    const mockUser = {
      id: 'user_123',
      firstName: 'Test',
      lastName: 'User',
    }

    app.use('*', authMiddleware)
    app.get('/v1/task', (c) => {
      // Mock clerk client
      c.set('clerk', {
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser),
        },
      })
      return c.text('success')
    })

    const _res = await app.request('/v1/task')

    expect(mockClerkMiddleware).toHaveBeenCalled()
    expect(mockGetAuth).toHaveBeenCalled()
  })

  it('bypasses auth for paths starting with /v1/attachments/view/', async () => {
    const app = new Hono()
    const authMiddleware = getAuthMiddleware()

    app.use('*', authMiddleware)
    app.get('/v1/attachments/view/:token', (c) => c.text('bypassed'))
    app.get('/v1/attachments/view/nested/path', (c) => c.text('also bypassed'))

    const res1 = await app.request('/v1/attachments/view/token123')
    const res2 = await app.request('/v1/attachments/view/nested/path')

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(await res1.text()).toBe('bypassed')
    expect(await res2.text()).toBe('also bypassed')
  })

  it('does not bypass auth for other attachment endpoints', async () => {
    const app = new Hono()
    const authMiddleware = getAuthMiddleware()

    mockGetAuth.mockReturnValue({ userId: null })

    app.use('*', authMiddleware)
    app.get('/v1/attachments', (c) => c.text('should be protected'))

    const res = await app.request('/v1/attachments?ids=att_123')

    expect(mockClerkMiddleware).toHaveBeenCalled()
    expect(res.status).toBe(401)
  })
})
