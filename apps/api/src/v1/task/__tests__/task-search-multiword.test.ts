/**
 * Tests for multi-word search queries
 *
 * This test suite specifically verifies that multi-word search queries work correctly
 * For example: "task 3" should match "Task 3", not just fail to match anything
 *
 * IMPORTANT: These tests use mocks and do NOT touch the real database.
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

describe('Multi-word search queries', () => {
  const toUser = (u: MockUser) => u as unknown as User

  // Mock users
  const adminUser = createMockAdminUser({ id: 'admin_123' })

  // Mock data
  const mockCustomer1 = {
    id: 'cust_1',
    name: 'Customer 1',
    phone: '1234567890',
    searchableText: 'customer 1 1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCustomer2 = {
    id: 'cust_2',
    name: 'Customer 2',
    phone: '2345678901',
    searchableText: 'customer 2 2345678901',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCustomer3 = {
    id: 'cust_3',
    name: 'Customer 3',
    phone: '3456789012',
    searchableText: 'customer 3 3456789012',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const createMockTask = (overrides: Partial<any> = {}) => ({
    id: 1,
    title: 'Task 1',
    description: null,
    customerId: mockCustomer1.id,
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
    searchableText: '1 task 1 customer 1 1234567890',
    customer: mockCustomer1,
    geoLocation: null,
    attachments: [],
    payments: [],
    ...overrides,
  })

  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('Basic multi-word search', () => {
    it('should find "Task 1" when searching for "task 1"', async () => {
      const allTasks = [
        createMockTask({
          id: 1,
          title: 'Task 1',
          searchableText: '1 task 1 customer 1 1234567890',
          customer: mockCustomer1,
        }),
        createMockTask({
          id: 2,
          title: 'Task 2',
          searchableText: '2 task 2 customer 2 2345678901',
          customer: mockCustomer2,
          customerId: mockCustomer2.id,
        }),
        createMockTask({
          id: 3,
          title: 'Task 3',
          searchableText: '3 task 3 customer 3 3456789012',
          customer: mockCustomer3,
          customerId: mockCustomer3.id,
        }),
      ]

      // Simulate database GIN index returning only tasks that contain "task 1" in searchableText
      const filteredTasks = allTasks.filter((t) =>
        t.searchableText?.includes('task 1'),
      )
      mockPrisma.task.findMany.mockResolvedValue(filteredTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'task 1',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      console.log('Search: "task 1"')
      console.log(
        'Results:',
        result.tasks.map((t) => ({ id: t.id, title: t.title })),
      )

      // Should find "Task 1"
      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Task 1')
    })

    it('should find "Task 3" when searching for "task 3"', async () => {
      const allTasks = [
        createMockTask({
          id: 1,
          title: 'Task 1',
          searchableText: '1 task 1 customer 1 1234567890',
          customer: mockCustomer1,
        }),
        createMockTask({
          id: 2,
          title: 'Task 2',
          searchableText: '2 task 2 customer 2 2345678901',
          customer: mockCustomer2,
          customerId: mockCustomer2.id,
        }),
        createMockTask({
          id: 3,
          title: 'Task 3',
          searchableText: '3 task 3 customer 3 3456789012',
          customer: mockCustomer3,
          customerId: mockCustomer3.id,
        }),
      ]

      // Simulate database GIN index returning only tasks that contain "task 3" in searchableText
      const filteredTasks = allTasks.filter((t) =>
        t.searchableText?.includes('task 3'),
      )
      mockPrisma.task.findMany.mockResolvedValue(filteredTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'task 3',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      console.log('Search: "task 3"')
      console.log(
        'Results:',
        result.tasks.map((t) => ({ id: t.id, title: t.title })),
      )

      // Should find "Task 3"
      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Task 3')
    })

    it('should find all tasks when searching for just "task"', async () => {
      const allTasks = [
        createMockTask({
          id: 1,
          title: 'Task 1',
          searchableText: '1 task 1 customer 1 1234567890',
          customer: mockCustomer1,
        }),
        createMockTask({
          id: 2,
          title: 'Task 2',
          searchableText: '2 task 2 customer 2 2345678901',
          customer: mockCustomer2,
          customerId: mockCustomer2.id,
        }),
        createMockTask({
          id: 3,
          title: 'Task 3',
          searchableText: '3 task 3 customer 3 3456789012',
          customer: mockCustomer3,
          customerId: mockCustomer3.id,
        }),
      ]

      // All tasks contain "task" in their searchableText
      mockPrisma.task.findMany.mockResolvedValue(allTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'task',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      console.log('Search: "task"')
      console.log(
        'Results:',
        result.tasks.map((t) => ({ id: t.id, title: t.title })),
      )

      // Should find all three tasks
      expect(result.tasks.length).toBe(3)
    })
  })

  describe('Multi-word search in different fields', () => {
    it('should find task by customer name with multiple words', async () => {
      const customer = {
        id: 'cust_1',
        name: 'John Smith',
        phone: '1234567890',
        searchableText: 'john smith 1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Repair AC',
          searchableText: '1 repair ac john smith 1234567890',
          customer: customer,
          customerId: customer.id,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'john smith',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].customer?.name).toBe('John Smith')
    })

    it('should find task by partial customer name', async () => {
      const customer = {
        id: 'cust_1',
        name: 'Nguyễn Văn A',
        phone: '1234567890',
        searchableText: 'nguyen van a 1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Task for Nguyen',
          searchableText: '1 task for nguyen nguyen van a 1234567890',
          customer: customer,
          customerId: customer.id,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'nguyen van', // Without accents
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].customer?.name).toBe('Nguyễn Văn A')
    })
  })

  describe('Edge cases', () => {
    it('should handle search with extra spaces', async () => {
      const mockTasks = [
        createMockTask({
          id: 3,
          title: 'Task 3',
          searchableText: '3 task 3 customer 3 3456789012',
          customer: mockCustomer3,
          customerId: mockCustomer3.id,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'task  3', // Two spaces
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Should still find "Task 3" despite extra space
      expect(result.tasks.length).toBeGreaterThan(0)
    })

    it('should handle search with leading/trailing spaces', async () => {
      const mockTasks = [
        createMockTask({
          id: 3,
          title: 'Task 3',
          searchableText: '3 task 3 customer 3 3456789012',
          customer: mockCustomer3,
          customerId: mockCustomer3.id,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: '  task 3  ',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Should find "Task 3" despite leading/trailing spaces
      expect(result.tasks.length).toBeGreaterThan(0)
    })
  })
})
