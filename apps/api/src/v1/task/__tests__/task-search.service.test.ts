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
 */

import type { User } from '@clerk/backend'
import { afterAll, beforeEach, describe, expect, it } from '@jest/globals'
import { TaskStatus } from '@nv-internal/prisma-client'
import type { TaskSearchFilterQuery } from '@nv-internal/validation'
import { getPrisma } from '../../../lib/prisma'
import { searchAndFilterTasks } from '../task.service'

const prisma = getPrisma()

// Mock users
const adminUser: User = {
  id: 'admin_123',
  publicMetadata: { role: 'admin' },
} as User

const workerUser: User = {
  id: 'worker_456',
  publicMetadata: { role: 'worker' },
} as User

const otherWorkerUser: User = {
  id: 'worker_789',
  publicMetadata: { role: 'worker' },
} as User

describe('searchAndFilterTasks', () => {
  // Test data setup
  let testCustomer: { id: string }
  let testGeoLocation: { id: string }
  let _testTasks: Array<{ id: number }>

  beforeEach(async () => {
    // Clean up previous test data
    await prisma.task.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.geoLocation.deleteMany()

    // Create test customer with Vietnamese name
    testCustomer = await prisma.customer.create({
      data: {
        name: 'Nguyễn Văn A',
        phone: '0987654321',
      },
    })

    // Create test geo location with Vietnamese address
    testGeoLocation = await prisma.geoLocation.create({
      data: {
        name: 'Hà Nội',
        address: 'Số 123, Đường Láng, Quận Đống Đa, Hà Nội',
        lat: 21.0285,
        lng: 105.8542,
      },
    })

    // Create test tasks with various statuses and assignees
    _testTasks = await Promise.all([
      // Task 1: Admin task, preparing
      prisma.task.create({
        data: {
          title: 'Sửa điều hòa',
          description: 'Khách hàng cần sửa điều hòa gấp',
          customerId: testCustomer.id,
          geoLocationId: testGeoLocation.id,
          status: TaskStatus.PREPARING,
          assigneeIds: [adminUser.id],
          createdAt: new Date('2025-01-01'),
        },
      }),
      // Task 2: Worker task, in progress
      prisma.task.create({
        data: {
          title: 'Lắp đặt máy lạnh mới',
          description: 'Lắp đặt máy lạnh Daikin 2HP',
          customerId: testCustomer.id,
          geoLocationId: testGeoLocation.id,
          status: TaskStatus.IN_PROGRESS,
          assigneeIds: [workerUser.id],
          startedAt: new Date('2025-01-02'),
          createdAt: new Date('2025-01-02'),
        },
      }),
      // Task 3: Other worker task, completed
      prisma.task.create({
        data: {
          title: 'Vệ sinh máy lạnh',
          description: 'Vệ sinh và bảo dưỡng định kỳ',
          customerId: testCustomer.id,
          geoLocationId: testGeoLocation.id,
          status: TaskStatus.COMPLETED,
          assigneeIds: [otherWorkerUser.id],
          startedAt: new Date('2025-01-03'),
          completedAt: new Date('2025-01-04'),
          createdAt: new Date('2025-01-03'),
        },
      }),
      // Task 4: Multi-assignee task
      prisma.task.create({
        data: {
          title: 'Kiểm tra hệ thống',
          description: 'Kiểm tra toàn bộ hệ thống điều hòa',
          customerId: testCustomer.id,
          geoLocationId: testGeoLocation.id,
          status: TaskStatus.READY,
          assigneeIds: [workerUser.id, otherWorkerUser.id],
          createdAt: new Date('2025-01-05'),
        },
      }),
    ])
  })

  describe('Vietnamese accent-insensitive search', () => {
    it('should find tasks by customer name without accents', async () => {
      const filters: TaskSearchFilterQuery = {
        search: 'nguyen van a', // No accents
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.customer?.name === 'Nguyễn Văn A'),
      ).toBe(true)
    })

    it('should find tasks by address without accents', async () => {
      const filters: TaskSearchFilterQuery = {
        search: 'ha noi', // No accents for "Hà Nội"
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.geoLocation?.name?.includes('Hà Nội')),
      ).toBe(true)
    })

    it('should find tasks by title without accents', async () => {
      const filters: TaskSearchFilterQuery = {
        search: 'sua dieu hoa', // No accents for "Sửa điều hòa"
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(result.tasks.some((t) => t.title.includes('Sửa điều hòa'))).toBe(
        true,
      )
    })

    it('should find tasks by partial phone number', async () => {
      const filters: TaskSearchFilterQuery = {
        search: '0987', // Partial phone
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.some((t) => t.customer?.phone?.startsWith('0987')),
      ).toBe(true)
    })
  })

  describe('Status filtering', () => {
    it('should filter tasks by single status', async () => {
      const filters: TaskSearchFilterQuery = {
        status: [TaskStatus.IN_PROGRESS],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.status === TaskStatus.IN_PROGRESS),
      ).toBe(true)
    })

    it('should filter tasks by multiple statuses', async () => {
      const filters: TaskSearchFilterQuery = {
        status: [TaskStatus.PREPARING, TaskStatus.READY],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        assigneeIds: [workerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(workerUser.id)),
      ).toBe(true)
    })

    it('should filter tasks by multiple assignees', async () => {
      const filters: TaskSearchFilterQuery = {
        assigneeIds: [workerUser.id, otherWorkerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        createdFrom: new Date('2025-01-02').toISOString(),
        createdTo: new Date('2025-01-04').toISOString(),
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        completedFrom: new Date('2025-01-04').toISOString(),
        completedTo: new Date('2025-01-05').toISOString(),
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        search: 'may lanh',
        status: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        search: 'nguyen',
        status: [TaskStatus.IN_PROGRESS],
        assigneeIds: [workerUser.id],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks
    })

    it('should restrict worker to only assigned tasks', async () => {
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(workerUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
      expect(
        result.tasks.every((t) => t.assigneeIds.includes(workerUser.id)),
      ).toBe(true)
    })

    it('should allow worker to use assignedOnly filter', async () => {
      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'true',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(workerUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'true',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      // Admin should see all tasks (not just their assigned ones)
      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks

      // Should include tasks assigned to other workers
      const hasOtherWorkerTasks = result.tasks.some((t) =>
        t.assigneeIds.includes(otherWorkerUser.id),
      )
      expect(hasOtherWorkerTasks).toBe(true)
    })

    it('should allow admin to see all tasks even with assignedOnly=false', async () => {
      const filters: TaskSearchFilterQuery = {
        assignedOnly: 'false',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      // Admin should see all tasks when explicitly setting assignedOnly to false
      expect(result.tasks.length).toBeGreaterThanOrEqual(4) // All test tasks
    })
  })

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const filters: TaskSearchFilterQuery = {
        take: 2,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const firstPage = await searchAndFilterTasks(adminUser, filters)

      expect(firstPage.tasks.length).toBeLessThanOrEqual(2)
      expect(firstPage.hasNextPage).toBe(true)
      expect(firstPage.nextCursor).toBeTruthy()

      // Fetch second page
      const secondPageFilters: TaskSearchFilterQuery = {
        ...filters,
        cursor: firstPage.nextCursor || undefined,
      }

      const secondPage = await searchAndFilterTasks(
        adminUser,
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
      const filters: TaskSearchFilterQuery = {
        take: 100, // More than total tasks
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.hasNextPage).toBe(false)
      expect(result.nextCursor).toBeNull()
    })
  })

  describe('Sorting', () => {
    it('should sort by creation date descending', async () => {
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(1)
      for (let i = 0; i < result.tasks.length - 1; i++) {
        expect(
          new Date(result.tasks[i].createdAt).getTime(),
        ).toBeLessThanOrEqual(new Date(result.tasks[i + 1].createdAt).getTime())
      }
    })

    it('should sort by task ID', async () => {
      const filters: TaskSearchFilterQuery = {
        take: 20,
        sortBy: 'id',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

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
      const filters: TaskSearchFilterQuery = {
        search: 'nonexistentcustomer12345',
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks).toEqual([])
      expect(result.hasNextPage).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('should handle empty status filter array', async () => {
      const filters: TaskSearchFilterQuery = {
        status: [],
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks.length).toBeGreaterThan(0)
    })

    it('should handle customer filter with no tasks', async () => {
      const otherCustomer = await prisma.customer.create({
        data: {
          name: 'Trần Thị B',
          phone: '0123456789',
        },
      })

      const filters: TaskSearchFilterQuery = {
        customerId: otherCustomer.id,
        take: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const result = await searchAndFilterTasks(adminUser, filters)

      expect(result.tasks).toEqual([])
    })
  })

  // Clean up after all tests to prevent data leakage
  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.geoLocation.deleteMany()
  })
})
