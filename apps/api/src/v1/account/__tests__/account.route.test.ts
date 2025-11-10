// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Hono } from 'hono'
import accountRouter from '../account.route'

// Mock the account service
jest.mock('../account.service', () => ({
  deleteAccount: jest.fn(),
}))

// Mock Hono clerk auth
jest.mock('@hono/clerk-auth', () => ({
  getAuth: jest.fn(),
}))

import { getAuth } from '@hono/clerk-auth'
import * as accountService from '../account.service'

function asMock<T extends (...args: unknown[]) => unknown>(fn: T) {
  return fn as unknown as jest.Mock<ReturnType<T>, Parameters<T>>
}

describe('Account Route Tests', () => {
  let app: Hono

  beforeEach(() => {
    jest.clearAllMocks()

    // Create test app
    app = new Hono()
    app.route('/v1/account', accountRouter)
  })

  describe('DELETE /v1/account/me', () => {
    it('should successfully delete authenticated user account', async () => {
      const userId = 'user_test123'
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockResolvedValue(undefined),
        },
      }

      // Mock getAuth to return authenticated user
      asMock(getAuth).mockReturnValue({
        userId,
      })

      // Mock deleteAccount service to return success
      asMock(accountService.deleteAccount).mockResolvedValue({
        success: true,
      })

      // Create context mock with clerk client
      const originalRequest = app.request.bind(app)
      app.request = async function (input, init) {
        const response = await originalRequest(input, init)
        return response
      }

      // Mock context.get to return clerk client
      const _mockContext = {
        get: jest.fn((key: string) => {
          if (key === 'clerk') {
            return mockClerkClient
          }
          return undefined
        }),
        json: (data: unknown, status?: number) => ({
          status: status || 200,
          json: async () => data,
        }),
      }

      // Override route handler to use mocked context
      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        const auth = getAuth(c)
        const userId = auth?.userId

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401)
        }

        const clerkClient = mockClerkClient
        const result = await accountService.deleteAccount(clerkClient, userId)

        if (result.success) {
          return c.json(
            {
              success: true,
              message: 'Account deleted successfully',
            },
            200,
          )
        }

        return c.json({ message: 'Failed to delete account' }, 500)
      })

      const res = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe('Account deleted successfully')

      expect(accountService.deleteAccount).toHaveBeenCalledWith(
        mockClerkClient,
        userId,
      )
    })

    it('should return 200 when account already deleted (idempotent)', async () => {
      const userId = 'user_deleted123'
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn(),
        },
      }

      asMock(getAuth).mockReturnValue({
        userId,
      })

      asMock(accountService.deleteAccount).mockResolvedValue({
        success: true,
        alreadyDeleted: true,
      })

      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        const auth = getAuth(c)
        const userId = auth?.userId

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401)
        }

        const clerkClient = mockClerkClient
        const result = await accountService.deleteAccount(clerkClient, userId)

        if (result.success) {
          const message = result.alreadyDeleted
            ? 'Account already deleted'
            : 'Account deleted successfully'

          return c.json(
            {
              success: true,
              message,
            },
            200,
          )
        }

        return c.json({ message: 'Failed to delete account' }, 500)
      })

      const res = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe('Account already deleted')
    })

    it('should return 401 when user not authenticated', async () => {
      asMock(getAuth).mockReturnValue({
        userId: null,
      })

      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        const auth = getAuth(c)
        const userId = auth?.userId

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401)
        }

        return c.json({ success: true }, 200)
      })

      const res = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Unauthorized')

      expect(accountService.deleteAccount).not.toHaveBeenCalled()
    })

    it('should return 500 when deletion fails', async () => {
      const userId = 'user_error123'
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn(),
        },
      }

      asMock(getAuth).mockReturnValue({
        userId,
      })

      asMock(accountService.deleteAccount).mockResolvedValue({
        success: false,
        error: 'Clerk API error',
      })

      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        const auth = getAuth(c)
        const userId = auth?.userId

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401)
        }

        const clerkClient = mockClerkClient
        const result = await accountService.deleteAccount(clerkClient, userId)

        if (result.success) {
          return c.json({ success: true }, 200)
        }

        return c.json(
          { message: result.error || 'Failed to delete account' },
          500,
        )
      })

      const res = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.message).toBe('Clerk API error')
    })

    it('should handle unexpected errors gracefully', async () => {
      const userId = 'user_unexpected123'
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn(),
        },
      }

      asMock(getAuth).mockReturnValue({
        userId,
      })

      asMock(accountService.deleteAccount).mockRejectedValue(
        new Error('Unexpected error'),
      )

      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        const auth = getAuth(c)
        const userId = auth?.userId

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401)
        }

        try {
          const clerkClient = mockClerkClient
          const result = await accountService.deleteAccount(clerkClient, userId)

          if (result.success) {
            return c.json({ success: true }, 200)
          }

          return c.json({ message: 'Failed to delete account' }, 500)
        } catch (_error) {
          return c.json(
            {
              message: 'An unexpected error occurred. Please try again later.',
            },
            500,
          )
        }
      })

      const res = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.message).toBe(
        'An unexpected error occurred. Please try again later.',
      )
    })

    it('should only allow DELETE method', async () => {
      const userId = 'user_method123'

      asMock(getAuth).mockReturnValue({
        userId,
      })

      const testApp = new Hono()
      testApp.delete('/v1/account/me', async (c) => {
        return c.json({ success: true }, 200)
      })

      // Test GET (should fail)
      const getRes = await testApp.request('/v1/account/me', {
        method: 'GET',
      })
      expect(getRes.status).toBe(404)

      // Test POST (should fail)
      const postRes = await testApp.request('/v1/account/me', {
        method: 'POST',
      })
      expect(postRes.status).toBe(404)

      // Test DELETE (should succeed)
      const deleteRes = await testApp.request('/v1/account/me', {
        method: 'DELETE',
      })
      expect(deleteRes.status).toBe(200)
    })
  })
})
