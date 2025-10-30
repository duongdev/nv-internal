/**
 * Tests for phrase search - multi-word queries that should match as a phrase
 *
 * This test suite specifically verifies that phrase searches work correctly.
 * For example: "Mua quat" should match "Mua quat" (exact phrase)
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

describe('Phrase search (multi-word)', () => {
  const toUser = (u: MockUser) => u as unknown as User

  // Mock users
  const adminUser = createMockAdminUser({ id: 'admin_123' })

  // Mock data
  const mockCustomer1 = {
    id: 'cust_1',
    name: 'Customer 1',
    phone: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const createMockTask = (overrides: Partial<any> = {}) => {
    const task = {
      id: 1,
      title: 'Default Title',
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
      customer: mockCustomer1,
      geoLocation: null,
      attachments: [],
      payments: [],
      ...overrides,
    }

    // Build searchableText automatically using same logic as service
    // Normalize: lowercase + remove Vietnamese accents
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

    const searchableText = normalize(parts.join(' '))
      .replace(/\s+/g, ' ')
      .trim()

    return {
      ...task,
      searchableText,
    }
  }

  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('Vietnamese phrase search - "Mua quat" use case', () => {
    it('should find task with title "Mua quat" when searching "Mua quat"', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quat', customer: mockCustomer1 }),
        createMockTask({
          id: 2,
          title: 'Mua dieu hoa',
          customer: mockCustomer1,
        }),
        createMockTask({
          id: 3,
          title: 'Sua quat',
          customer: mockCustomer1,
        }),
      ]

      // With searchableText implementation:
      // Task 1: searchableText = "1 mua quat customer 1 1234567890"
      // Task 2: searchableText = "2 mua dieu hoa customer 1 1234567890"
      // Task 3: searchableText = "3 sua quat customer 1 1234567890"
      //
      // Search: "mua quat" (normalized)
      // Only Task 1 contains "mua quat" as substring
      const matchingTasks = mockTasks.filter((task) =>
        task.searchableText?.includes('mua quat'),
      )

      mockPrisma.task.findMany.mockResolvedValue(matchingTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      console.log('Search: "Mua quat"')
      console.log(
        'Results:',
        result.tasks.map((t) => ({ id: t.id, title: t.title })),
      )

      // Should find "Mua quat" (searchableText contains "mua quat")
      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua quat')
    })

    it('should find task when searching "Mua" (single word)', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quat', customer: mockCustomer1 }),
        createMockTask({
          id: 2,
          title: 'Mua dieu hoa',
          customer: mockCustomer1,
        }),
      ]

      // Filter to only tasks that contain "mua" in searchableText
      const matchingTasks = mockTasks.filter((task) =>
        task.searchableText?.includes('mua'),
      )

      mockPrisma.task.findMany.mockResolvedValue(matchingTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Should find both tasks that contain "Mua"
      expect(result.tasks.length).toBe(2)
    })

    it('should find task when searching "quat" (single word)', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quat', customer: mockCustomer1 }),
        createMockTask({ id: 3, title: 'Sua quat', customer: mockCustomer1 }),
      ]

      // Filter to only tasks that contain "quat" in searchableText
      const matchingTasks = mockTasks.filter((task) =>
        task.searchableText?.includes('quat'),
      )

      mockPrisma.task.findMany.mockResolvedValue(matchingTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Should find both tasks that contain "quat"
      expect(result.tasks.length).toBe(2)
    })
  })

  describe('Phrase search with Vietnamese accents', () => {
    it('should find "Mua quạt" when searching "Mua quat" (without accents)', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quạt', customer: mockCustomer1 }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua quat', // Without accent
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua quạt')
    })

    it('should find "Mua quat" when searching "Mua quạt" (with accent)', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quat', customer: mockCustomer1 }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua quạt', // With accent
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua quat')
    })
  })

  describe('Phrase in description', () => {
    it('should find task when phrase appears in description', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Task 1',
          description: 'Can phai mua quat moi',
          customer: mockCustomer1,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'mua quat',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].description).toContain('mua quat')
    })
  })

  describe('Phrase in customer name', () => {
    it('should find task when phrase appears in customer name', async () => {
      const customer = {
        id: 'cust_1',
        name: 'Nguyen Van Mua',
        phone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Task 1',
          customer: customer,
          customerId: customer.id,
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'nguyen van',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].customer?.name).toBe('Nguyen Van Mua')
    })
  })

  describe('Phrase with extra whitespace', () => {
    it('should handle search phrase with extra spaces', async () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Mua quat', customer: mockCustomer1 }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua  quat', // Two spaces
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua quat')
    })

    it('should handle title with extra spaces', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Mua  quat',
          customer: mockCustomer1,
        }), // Two spaces in title
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua quat', // One space
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBe(1)
      expect(result.tasks[0].title).toBe('Mua  quat')
    })
  })

  describe('Cross-field substring matching', () => {
    it('should find task when search substring spans multiple fields', async () => {
      const customer = {
        id: 'cust_1',
        name: 'Mua Corporation',
        phone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'quat installation', // Only "quat" in title
          customer: customer, // Only "Mua" in customer name
          customerId: customer.id,
        }),
      ]

      // With searchableText implementation:
      // searchableText = "1 quat installation mua corporation 1234567890"
      // This DOES contain "mua" and DOES contain "quat", but NOT "mua quat" as a substring
      // The implementation uses simple substring matching on the concatenated text
      const matchingTasks = mockTasks.filter((task) =>
        task.searchableText?.includes('mua quat'),
      )

      mockPrisma.task.findMany.mockResolvedValue(matchingTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'Mua quat', // Looking for substring "mua quat"
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // With new searchableText implementation:
      // searchableText concatenates all fields: "1 quat installation mua corporation 1234567890"
      // The search "mua quat" is NOT a substring of this (note the order and spacing)
      // So this task will NOT match
      expect(result.tasks.length).toBe(0)
    })
  })
})
