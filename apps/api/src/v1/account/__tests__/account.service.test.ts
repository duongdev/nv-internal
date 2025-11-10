import type { ClerkClient } from '@clerk/backend'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  createMockPrismaClient,
  resetPrismaMock,
} from '../../../test/prisma-mock'
import { deleteAccount } from '../account.service'

// Mock the prisma module
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

describe('Account Service Unit Tests', () => {
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('deleteAccount', () => {
    it('should successfully delete user from Clerk', async () => {
      const userId = 'user_test123'

      // Mock Clerk client
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockResolvedValue(undefined),
        },
      } as unknown as ClerkClient

      // Mock activity logging
      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result = await deleteAccount(mockClerkClient, userId)

      expect(result.success).toBe(true)
      expect(result.alreadyDeleted).toBeUndefined()
      expect(result.error).toBeUndefined()

      // Verify Clerk API was called
      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith(userId)

      // Verify activity logging
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2)

      // First call: ACCOUNT_DELETION_INITIATED
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          topic: 'GENERAL',
          userId,
          action: 'ACCOUNT_DELETION_INITIATED',
        }),
      })

      // Second call: ACCOUNT_DELETION_COMPLETED
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          topic: 'GENERAL',
          userId,
          action: 'ACCOUNT_DELETION_COMPLETED',
        }),
      })
    })

    it('should handle already deleted user (404 from Clerk)', async () => {
      const userId = 'user_deleted123'

      // Mock Clerk client returning 404
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockRejectedValue({
            status: 404,
            message: 'User not found',
          }),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result = await deleteAccount(mockClerkClient, userId)

      // Should return success (idempotent)
      expect(result.success).toBe(true)
      expect(result.alreadyDeleted).toBe(true)
      expect(result.error).toBeUndefined()

      // Verify activity logging
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2)

      // Second call: ACCOUNT_DELETION_ALREADY_DELETED
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          topic: 'GENERAL',
          userId,
          action: 'ACCOUNT_DELETION_ALREADY_DELETED',
          payload: expect.objectContaining({
            message: 'User already deleted from Clerk',
          }),
        }),
      })
    })

    it('should handle Clerk API failure (500 error)', async () => {
      const userId = 'user_error123'

      // Mock Clerk client returning 500
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockRejectedValue({
            status: 500,
            message: 'Internal server error',
          }),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result = await deleteAccount(mockClerkClient, userId)

      // Should return failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal server error')

      // Verify activity logging
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2)

      // Second call: ACCOUNT_DELETION_FAILED
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          topic: 'GENERAL',
          userId,
          action: 'ACCOUNT_DELETION_FAILED',
          payload: expect.objectContaining({
            error: 'Internal server error',
            status: 500,
          }),
        }),
      })
    })

    it('should handle Clerk API network failure', async () => {
      const userId = 'user_network123'

      // Mock Clerk client throwing network error
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockRejectedValue(new Error('Network timeout')),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result = await deleteAccount(mockClerkClient, userId)

      // Should return failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')

      // Verify activity logging
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2)

      // Second call: ACCOUNT_DELETION_FAILED
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          topic: 'GENERAL',
          userId,
          action: 'ACCOUNT_DELETION_FAILED',
          payload: expect.objectContaining({
            error: 'Network timeout',
          }),
        }),
      })
    })

    it('should handle Clerk error without message field', async () => {
      const userId = 'user_unknown123'

      // Mock Clerk client throwing error without message
      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockRejectedValue({
            status: 403,
            // No message field
          }),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result = await deleteAccount(mockClerkClient, userId)

      // Should return failure with default message
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown Clerk API error')
    })

    it('should be idempotent when called multiple times', async () => {
      const userId = 'user_idempotent123'

      // First call: successful deletion
      const mockClerkClient1 = {
        users: {
          deleteUser: jest.fn().mockResolvedValue(undefined),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      const result1 = await deleteAccount(mockClerkClient1, userId)
      expect(result1.success).toBe(true)
      expect(result1.alreadyDeleted).toBeUndefined()

      // Reset mocks
      resetPrismaMock(mockPrisma)
      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_2',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      // Second call: returns 404 (already deleted)
      const mockClerkClient2 = {
        users: {
          deleteUser: jest.fn().mockRejectedValue({
            status: 404,
            message: 'User not found',
          }),
        },
      } as unknown as ClerkClient

      const result2 = await deleteAccount(mockClerkClient2, userId)
      expect(result2.success).toBe(true)
      expect(result2.alreadyDeleted).toBe(true)
    })

    it('should handle database failure when logging activity', async () => {
      const userId = 'user_dbfail123'

      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockResolvedValue(undefined),
        },
      } as unknown as ClerkClient

      // Mock database failure
      mockPrisma.activity.create.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const result = await deleteAccount(mockClerkClient, userId)

      // Should still return failure due to database error
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should log all activity events with correct metadata', async () => {
      const userId = 'user_metadata123'

      const mockClerkClient = {
        users: {
          deleteUser: jest.fn().mockResolvedValue(undefined),
        },
      } as unknown as ClerkClient

      mockPrisma.activity.create.mockResolvedValue({
        id: 'act_1',
        topic: 'GENERAL',
        userId,
        action: 'ACCOUNT_DELETION_INITIATED',
        payload: {},
        createdAt: new Date(),
      })

      await deleteAccount(mockClerkClient, userId)

      // Verify metadata structure
      const initiatedCall = (mockPrisma.activity.create as jest.Mock).mock
        .calls[0][0]
      expect(initiatedCall.data.payload).toHaveProperty('timestamp')
      expect(typeof initiatedCall.data.payload.timestamp).toBe('string')

      const completedCall = (mockPrisma.activity.create as jest.Mock).mock
        .calls[1][0]
      expect(completedCall.data.payload).toHaveProperty('timestamp')
      expect(typeof completedCall.data.payload.timestamp).toBe('string')
    })
  })
})
