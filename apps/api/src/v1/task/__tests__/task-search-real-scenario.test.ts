/**
 * Test real-world scenario reported by user
 *
 * User reports:
 * - Task title: "Mua quat"
 * - Search "Mua" → Found ✅
 * - Search "quat" → Found ✅
 * - Search "Mua quat" → Empty ❌
 *
 * This test simulates what the database might actually be returning
 */

import type { User } from '@clerk/backend'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { TaskStatus } from '@nv-internal/prisma-client'
import type { TaskSearchFilterQuery } from '@nv-internal/validation'
import { createMockAdminUser, type MockUser } from '../../../test/mock-auth'
import {
  createMockPrismaClient,
  resetPrismaMock,
} from '../../../test/prisma-mock'
import { searchAndFilterTasks } from '../task.service'

// Mock Prisma client
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

describe('Real-world scenario: "Mua quat" search issue', () => {
  const toUser = (u: MockUser) => u as unknown as User

  const adminUser = createMockAdminUser({ id: 'admin_123' })

  const mockCustomer = {
    id: 'cust_1',
    name: 'Test Customer',
    phone: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Helper to build searchableText using same logic as service
  const buildSearchableText = (task: any) => {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')

    const parts = [
      task.id?.toString(),
      task.title,
      task.description,
      task.customer?.name,
      task.customer?.phone,
      task.geoLocation?.address,
      task.geoLocation?.name,
    ].filter(Boolean) as string[]

    return normalize(parts.join(' ')).replace(/\s+/g, ' ').trim()
  }

  const taskWithTitleMuaQuat = {
    id: 1,
    title: 'Mua quat',
    description: null,
    customerId: mockCustomer.id,
    geoLocationId: null,
    status: TaskStatus.PREPARING,
    assigneeIds: [adminUser.id],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    expectedRevenue: null,
    expectedCurrency: 'VND',
    customer: mockCustomer,
    geoLocation: null,
    attachments: [],
    payments: [],
    searchableText: buildSearchableText({
      id: 1,
      title: 'Mua quat',
      description: null,
      customer: mockCustomer,
      geoLocation: null,
    }),
  }

  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('Simulating database behavior', () => {
    it('Database returns task when searching "Mua" (single word)', async () => {
      // Simulate: PostgreSQL finds tasks where title contains "Mua"
      mockPrisma.task.findMany.mockResolvedValue([taskWithTitleMuaQuat])

      const result = await searchAndFilterTasks(toUser(adminUser), {
        search: 'Mua',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      console.log('Search "Mua": Found', result.tasks.length, 'tasks')
      expect(result.tasks.length).toBe(1)
    })

    it('Database returns task when searching "quat" (single word)', async () => {
      // Simulate: PostgreSQL finds tasks where title contains "quat"
      mockPrisma.task.findMany.mockResolvedValue([taskWithTitleMuaQuat])

      const result = await searchAndFilterTasks(toUser(adminUser), {
        search: 'quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      console.log('Search "quat": Found', result.tasks.length, 'tasks')
      expect(result.tasks.length).toBe(1)
    })

    it('ISSUE: Database might not return task when searching "Mua quat"', async () => {
      // Hypothesis: Maybe PostgreSQL is not returning the task when searching
      // for the full phrase "Mua quat" due to some query issue?

      // Let's test both scenarios:
      // Scenario 1: Database DOES return the task (expected behavior)
      mockPrisma.task.findMany.mockResolvedValue([taskWithTitleMuaQuat])

      const result1 = await searchAndFilterTasks(toUser(adminUser), {
        search: 'Mua quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      console.log(
        'Search "Mua quat" (DB returns task): Found',
        result1.tasks.length,
        'tasks',
      )
      expect(result1.tasks.length).toBe(1)

      // Scenario 2: Database does NOT return the task (user's reported issue)
      resetPrismaMock(mockPrisma)
      mockPrisma.task.findMany.mockResolvedValue([]) // Database returns empty!

      const result2 = await searchAndFilterTasks(toUser(adminUser), {
        search: 'Mua quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      console.log(
        'Search "Mua quat" (DB returns empty): Found',
        result2.tasks.length,
        'tasks',
      )
      // This would be the user's issue - database returns nothing
      expect(result2.tasks.length).toBe(0)
    })
  })

  describe('Database filtering with searchableText', () => {
    it('Database should correctly filter using searchableText field', async () => {
      const allTasks = [
        taskWithTitleMuaQuat,
        {
          ...taskWithTitleMuaQuat,
          id: 2,
          title: 'Mua dieu hoa',
          searchableText: buildSearchableText({
            id: 2,
            title: 'Mua dieu hoa',
            description: null,
            customer: mockCustomer,
            geoLocation: null,
          }),
        },
        {
          ...taskWithTitleMuaQuat,
          id: 3,
          title: 'Sua quat',
          searchableText: buildSearchableText({
            id: 3,
            title: 'Sua quat',
            description: null,
            customer: mockCustomer,
            geoLocation: null,
          }),
        },
      ]

      // With searchableText implementation:
      // Task 1 searchableText: "1 mua quat test customer 1234567890"
      // Task 2 searchableText: "2 mua dieu hoa test customer 1234567890"
      // Task 3 searchableText: "3 sua quat test customer 1234567890"
      //
      // Search: "mua quat" (normalized)
      // Only Task 1's searchableText contains "mua quat" as substring
      const matchingTasks = allTasks.filter((task) =>
        task.searchableText?.includes('mua quat'),
      )

      mockPrisma.task.findMany.mockResolvedValue(matchingTasks)

      const result = await searchAndFilterTasks(toUser(adminUser), {
        search: 'Mua quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      console.log(
        'Database filtered correctly, returned',
        result.tasks.length,
        'tasks',
      )
      console.log(
        'Filtered tasks:',
        result.tasks.map((t) => t.title),
      )

      // Database should only return "Mua quat" based on searchableText filtering
      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua quat')
    })
  })
})
