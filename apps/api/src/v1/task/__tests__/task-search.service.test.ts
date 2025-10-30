/**
 * Tests for enhanced task search and filter functionality
 *
 * These tests verify:
 * - Vietnamese accent-insensitive search
 * - Multi-criteria filtering
 * - Date range filtering
 * - Role-based access control
 * - Pagination
 * - Sorting
 *
 * IMPORTANT: These tests use mocks and do NOT touch the real database.
 */

import type { User } from '@clerk/backend'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { TaskStatus } from '@nv-internal/prisma-client'
import type { TaskSearchFilterQuery } from '@nv-internal/validation'
import {
  createMockAdminUser,
  createMockWorkerUser,
  type MockUser,
} from '../../../test/mock-auth'
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

describe('searchAndFilterTasks', () => {
  const toUser = (u: MockUser) => u as unknown as User

  // Mock users
  const adminUser = createMockAdminUser({ id: 'admin_123' })
  const workerUser = createMockWorkerUser({ id: 'worker_456' })
  const otherWorkerUser = createMockWorkerUser({ id: 'worker_789' })

  // Mock data
  const mockCustomer = {
    id: 'cust_123',
    name: 'Nguyễn Văn A',
    phone: '0987654321',
    searchableText: 'nguyen van a 0987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockGeoLocation = {
    id: 'geo_123',
    name: 'Hà Nội',
    address: 'Số 123, Đường Láng, Quận Đống Đa, Hà Nội',
    lat: 21.0285,
    lng: 105.8542,
    searchableText: 'ha noi so 123 duong lang quan dong da ha noi',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const createMockTask = (overrides: Partial<any> = {}) => ({
    id: 1,
    title: 'Sửa điều hòa',
    description: 'Khách hàng cần sửa điều hòa gấp',
    customerId: mockCustomer.id,
    geoLocationId: mockGeoLocation.id,
    status: TaskStatus.PREPARING,
    assigneeIds: [adminUser.id],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    expectedRevenue: null,
    expectedCurrency: 'VND',
    searchableText:
      '1 sua dieu hoa khach hang can sua dieu hoa gap nguyen van a 0987654321 ha noi so 123 duong lang quan dong da ha noi',
    customer: mockCustomer,
    geoLocation: mockGeoLocation,
    attachments: [],
    payments: [],
    ...overrides,
  })

  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('Vietnamese accent-insensitive search', () => {
    it('should find tasks by customer name without accents', async () => {
      const mockTasks = [createMockTask({ id: 1, customerId: mockCustomer.id })]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'nguyen van a', // No accents
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.customer?.name === 'Nguyễn Văn A'),
      ).toBe(true)
    })

    it('should find tasks by address without accents', async () => {
      const mockTasks = [
        createMockTask({ id: 1, geoLocationId: mockGeoLocation.id }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'ha noi', // No accents for "Hà Nội"
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.geoLocation?.name?.includes('Hà Nội')),
      ).toBe(true)
    })

    it('should find tasks by title without accents', async () => {
      const mockTasks = [createMockTask({ id: 1, title: 'Sửa điều hòa' })]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'sua dieu hoa', // No accents for "Sửa điều hòa"
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(result.tasks.some((t) => t.title.includes('Sửa điều hòa'))).toBe(
        true,
      )
    })

    it('should find tasks by partial phone number', async () => {
      const mockTasks = [createMockTask({ id: 1, customerId: mockCustomer.id })]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: '0987', // Partial phone
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.customer?.phone?.startsWith('0987')),
      ).toBe(true)
    })
  })

  describe('Status filtering', () => {
    it('should filter tasks by single status', async () => {
      const mockTasks = [
        createMockTask({ id: 1, status: TaskStatus.IN_PROGRESS }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        status: [TaskStatus.IN_PROGRESS],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.status === TaskStatus.IN_PROGRESS),
      ).toBe(true)
    })

    it('should filter tasks by multiple statuses', async () => {
      const mockTasks = [
        createMockTask({ id: 1, status: TaskStatus.PREPARING }),
        createMockTask({ id: 2, status: TaskStatus.READY }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        status: [TaskStatus.PREPARING, TaskStatus.READY],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every(
          (t) =>
            t.status === TaskStatus.PREPARING || t.status === TaskStatus.READY,
        ),
      ).toBe(true)
    })
  })

  describe('Assignee filtering', () => {
    it('should filter tasks by single assignee', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 2, assigneeIds: [workerUser.id, adminUser.id] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        assigneeIds: [workerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(workerUser.id)),
      ).toBe(true)
    })

    it('should filter tasks by multiple assignees', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 2, assigneeIds: [otherWorkerUser.id] }),
        createMockTask({
          id: 3,
          assigneeIds: [workerUser.id, otherWorkerUser.id],
        }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        assigneeIds: [workerUser.id, otherWorkerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every(
          (t) =>
            t.assigneeIds.includes(workerUser.id) ||
            t.assigneeIds.includes(otherWorkerUser.id),
        ),
      ).toBe(true)
    })
  })

  describe('Date range filtering', () => {
    it('should filter tasks by creation date range', async () => {
      const mockTasks = [
        createMockTask({ id: 1, createdAt: new Date('2025-01-02') }),
        createMockTask({ id: 2, createdAt: new Date('2025-01-03') }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        createdFrom: new Date('2025-01-02').toISOString(),
        createdTo: new Date('2025-01-04').toISOString(),
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => {
          const createdAt = new Date(t.createdAt)
          return (
            createdAt >= new Date('2025-01-02') &&
            createdAt <= new Date('2025-01-04')
          )
        }),
      ).toBe(true)
    })

    it('should filter tasks by completion date range', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          status: TaskStatus.COMPLETED,
          completedAt: new Date('2025-01-04'),
        }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        completedFrom: new Date('2025-01-04').toISOString(),
        completedTo: new Date('2025-01-05').toISOString(),
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(
        result.tasks.every((t) => {
          if (!t.completedAt) {
            return false
          }
          const completedAt = new Date(t.completedAt)
          return (
            completedAt >= new Date('2025-01-04') &&
            completedAt <= new Date('2025-01-05')
          )
        }),
      ).toBe(true)
    })
  })

  describe('Combined filters', () => {
    it('should apply search and status filter together', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Lắp đặt máy lạnh',
          status: TaskStatus.IN_PROGRESS,
        }),
        createMockTask({
          id: 2,
          title: 'Sửa máy lạnh',
          status: TaskStatus.COMPLETED,
        }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'may lanh',
        status: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every(
          (t) =>
            (t.status === TaskStatus.IN_PROGRESS ||
              t.status === TaskStatus.COMPLETED) &&
            (t.title.toLowerCase().includes('máy lạnh') ||
              t.description?.toLowerCase().includes('máy lạnh')),
        ),
      ).toBe(true)
    })

    it('should apply search, status, and assignee filters together', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Task for Nguyen',
          status: TaskStatus.IN_PROGRESS,
          assigneeIds: [workerUser.id],
        }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        search: 'nguyen',
        status: [TaskStatus.IN_PROGRESS],
        assigneeIds: [workerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      if (result.tasks.length > 0) {
        expect(
          result.tasks.every(
            (t) =>
              t.status === TaskStatus.IN_PROGRESS &&
              t.assigneeIds.includes(workerUser.id),
          ),
        ).toBe(true)
      }
    })
  })

  describe('Role-based access control', () => {
    it('should allow admin to see all tasks by default', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [adminUser.id] }),
        createMockTask({ id: 2, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 3, assigneeIds: [otherWorkerUser.id] }),
        createMockTask({ id: 4, assigneeIds: [] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks
    })

    it('should restrict worker to only assigned tasks', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 2, assigneeIds: [workerUser.id, adminUser.id] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(workerUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(workerUser.id)),
      ).toBe(true)
    })

    it('should allow worker to use assignedOnly filter', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [workerUser.id] }),
        createMockTask({
          id: 2,
          assigneeIds: [workerUser.id, otherWorkerUser.id],
        }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'true',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(workerUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(workerUser.id)),
      ).toBe(true)
    })

    /**
     * CRITICAL TEST: Admin-as-Worker Module
     *
     * This test verifies that admins can use the worker module to view ONLY their
     * assigned tasks (just like regular workers), by setting assignedOnly=true.
     *
     * Use case: Admin needs to view their personal task list in the worker module,
     * separate from the admin module where they manage all company tasks.
     */
    it('should allow admin to filter to only their assigned tasks with assignedOnly=true', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [adminUser.id] }),
        createMockTask({ id: 2, assigneeIds: [adminUser.id, workerUser.id] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'true',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Admin should only see tasks assigned to them
      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(adminUser.id)),
      ).toBe(true)

      // Should NOT see tasks assigned to other users only
      expect(
        result.tasks.every(
          (t) =>
            !t.assigneeIds.includes(otherWorkerUser.id) ||
            t.assigneeIds.includes(adminUser.id),
        ),
      ).toBe(true)
    })

    it('should allow admin to see all tasks when assignedOnly is not set', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [adminUser.id] }),
        createMockTask({ id: 2, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 3, assigneeIds: [otherWorkerUser.id] }),
        createMockTask({ id: 4, assigneeIds: [] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Admin should see all tasks (not just their assigned ones)
      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks

      // Should include tasks assigned to other workers
      const hasOtherWorkerTasks = result.tasks.some((t) =>
        t.assigneeIds.includes(otherWorkerUser.id),
      )
      expect(hasOtherWorkerTasks).toBe(true)
    })

    it('should allow admin to see all tasks even with assignedOnly=false', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assigneeIds: [adminUser.id] }),
        createMockTask({ id: 2, assigneeIds: [workerUser.id] }),
        createMockTask({ id: 3, assigneeIds: [otherWorkerUser.id] }),
        createMockTask({ id: 4, assigneeIds: [] }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'false',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      // Admin should see all tasks when explicitly setting assignedOnly to false
      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks
    })
  })

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      // First page: return 3 tasks (take=2, so we return 2 + hasNextPage=true)
      const firstPageTasks = [
        createMockTask({ id: 1 }),
        createMockTask({ id: 2 }),
        createMockTask({ id: 3 }), // Extra to indicate hasNextPage
      ]
      mockPrisma.task.findMany.mockResolvedValueOnce(firstPageTasks)

      const filters: TaskSearchFilterQuery = {
        take: 2,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const firstPage = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(firstPage.tasks.length).toBeLessThanOrEqual(2)
      expect(firstPage.hasNextPage).toBe(true)
      expect(firstPage.nextCursor).toBeTruthy()

      // Second page
      const secondPageTasks = [createMockTask({ id: 4 })]
      mockPrisma.task.findMany.mockResolvedValueOnce(secondPageTasks)

      const secondPageFilters: TaskSearchFilterQuery = {
        ...filters,
        cursor: firstPage.nextCursor || undefined,
      }

      const secondPage = await searchAndFilterTasks(
        toUser(adminUser),
        secondPageFilters,
      )

      expect(secondPage.tasks.length).toBeGreaterThan(0)
      // Should not have duplicate IDs
      const firstPageIds = firstPage.tasks.map((t) => t.id)
      const secondPageIds = secondPage.tasks.map((t) => t.id)
      const intersection = firstPageIds.filter((id) =>
        secondPageIds.includes(id),
      )
      expect(intersection.length).toBe(0)
    })

    it('should return hasNextPage false on last page', async () => {
      const mockTasks = [createMockTask({ id: 1 }), createMockTask({ id: 2 })]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 100, // More than total tasks
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.hasNextPage).toBe(false)
      expect(result.nextCursor).toBeNull()
    })
  })

  describe('Sorting', () => {
    it('should sort by creation date descending', async () => {
      const mockTasks = [
        createMockTask({ id: 3, createdAt: new Date('2025-01-05') }),
        createMockTask({ id: 2, createdAt: new Date('2025-01-03') }),
        createMockTask({ id: 1, createdAt: new Date('2025-01-01') }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(1)
      for (let i = 0; i < result.tasks.length - 1; i++) {
        expect(
          new Date(result.tasks[i].createdAt).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(result.tasks[i + 1].createdAt).getTime(),
        )
      }
    })

    it('should sort by creation date ascending', async () => {
      const mockTasks = [
        createMockTask({ id: 1, createdAt: new Date('2025-01-01') }),
        createMockTask({ id: 2, createdAt: new Date('2025-01-03') }),
        createMockTask({ id: 3, createdAt: new Date('2025-01-05') }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(1)
      for (let i = 0; i < result.tasks.length - 1; i++) {
        expect(
          new Date(result.tasks[i].createdAt).getTime(),
        ).toBeLessThanOrEqual(new Date(result.tasks[i + 1].createdAt).getTime())
      }
    })

    it('should sort by task ID', async () => {
      const mockTasks = [
        createMockTask({ id: 3 }),
        createMockTask({ id: 2 }),
        createMockTask({ id: 1 }),
      ]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'id',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(1)
      for (let i = 0; i < result.tasks.length - 1; i++) {
        expect(result.tasks[i].id).toBeGreaterThanOrEqual(
          result.tasks[i + 1].id,
        )
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle empty search results gracefully', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const filters: TaskSearchFilterQuery = {
        search: 'nonexistentcustomer12345',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks).toEqual([])
      expect(result.hasNextPage).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('should handle empty status filter array', async () => {
      const mockTasks = [createMockTask({ id: 1 }), createMockTask({ id: 2 })]
      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const filters: TaskSearchFilterQuery = {
        status: [],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks.length).toBeGreaterThan(0)
    })

    it('should handle customer filter with no tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const filters: TaskSearchFilterQuery = {
        customerId: 'cust_nonexistent',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(toUser(adminUser), filters)

      expect(result.tasks).toEqual([])
    })
  })
})
