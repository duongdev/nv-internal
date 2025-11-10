import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { Task } from '@nv-internal/prisma-client'
import { TaskStatus } from '@nv-internal/prisma-client'
import { HTTPException } from 'hono/http-exception'
import {
  createMockAdminUser,
  createMockWorkerUser,
  type MockUser,
} from '../../../test/mock-auth'
import {
  createMockPrismaClient,
  resetPrismaMock,
} from '../../../test/prisma-mock'
import { setTaskExpectedRevenue } from '../../payment/payment.service'
import {
  canUserCreateTask,
  canUserListTasks,
  canUserUpdateTaskAssignees,
  canUserUpdateTaskStatus,
  canUserViewTask,
  createTask,
  deleteTask,
  getTaskById,
  getTaskList,
  searchAndFilterTasks,
  updateTask,
  updateTaskAssignees,
  updateTaskStatus,
} from '../task.service'

// Mock the prisma module
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

describe('Task Service Unit Tests', () => {
  const toUser = (u: MockUser) => u as unknown as import('@clerk/backend').User
  const asTask = (t: Partial<Task>) => t as Task
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  describe('Permission Functions', () => {
    it('should allow admin to create tasks', async () => {
      const adminUser = createMockAdminUser()
      const canCreate = await canUserCreateTask({ user: toUser(adminUser) })
      expect(canCreate).toBe(true)
    })

    it('should not allow worker to create tasks', async () => {
      const workerUser = createMockWorkerUser()
      const canCreate = await canUserCreateTask({ user: toUser(workerUser) })
      expect(canCreate).toBe(false)
    })

    it('should allow admin to list tasks', async () => {
      const adminUser = createMockAdminUser()
      const canList = await canUserListTasks({ user: toUser(adminUser) })
      expect(canList).toBe(true)
    })

    it('should not allow worker to list all tasks', async () => {
      const workerUser = createMockWorkerUser()
      const canList = await canUserListTasks({ user: toUser(workerUser) })
      expect(canList).toBe(false)
    })

    it('should allow admin to view any task', async () => {
      const adminUser = createMockAdminUser()
      const mockTask = {
        id: 1,
        title: 'Test Task',
        assigneeIds: ['worker_123'],
      }
      const canView = await canUserViewTask({
        user: toUser(adminUser),
        task: mockTask,
      })
      expect(canView).toBe(true)
    })

    it('should allow assigned worker to view task', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })
      const mockTask = {
        id: 1,
        title: 'Test Task',
        assigneeIds: ['worker_123'],
      }
      const canView = await canUserViewTask({
        user: toUser(workerUser),
        task: mockTask,
      })
      expect(canView).toBe(true)
    })

    it('should not allow non-assigned worker to view task', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_456' })
      const mockTask = {
        id: 1,
        title: 'Test Task',
        assigneeIds: ['worker_123'],
      }
      const canView = await canUserViewTask({
        user: toUser(workerUser),
        task: mockTask,
      })
      expect(canView).toBe(false)
    })

    it('should allow admin to update task assignees', async () => {
      const adminUser = createMockAdminUser()
      const canUpdate = await canUserUpdateTaskAssignees({
        user: toUser(adminUser),
      })
      expect(canUpdate).toBe(true)
    })

    it('should not allow worker to update task assignees', async () => {
      const workerUser = createMockWorkerUser()
      const canUpdate = await canUserUpdateTaskAssignees({
        user: toUser(workerUser),
      })
      expect(canUpdate).toBe(false)
    })
  })

  describe('Task Status Transitions', () => {
    it('should allow admin to transition PREPARING → READY', async () => {
      const adminUser = createMockAdminUser()
      const mockTask = {
        id: 1,
        status: TaskStatus.PREPARING,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(adminUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.READY,
      })
      expect(canUpdate).toBe(true)
    })

    it('should allow admin to put any task ON_HOLD', async () => {
      const adminUser = createMockAdminUser()
      const mockTask = {
        id: 1,
        status: TaskStatus.IN_PROGRESS,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(adminUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.ON_HOLD,
      })
      expect(canUpdate).toBe(true)
    })

    it('should allow admin to resume from ON_HOLD', async () => {
      const adminUser = createMockAdminUser()
      const mockTask = {
        id: 1,
        status: TaskStatus.ON_HOLD,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(adminUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.READY,
      })
      expect(canUpdate).toBe(true)
    })

    it('should allow assigned worker to transition READY → IN_PROGRESS', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })
      const mockTask = {
        id: 1,
        status: TaskStatus.READY,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(workerUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.IN_PROGRESS,
      })
      expect(canUpdate).toBe(true)
    })

    it('should allow assigned worker to transition IN_PROGRESS → COMPLETED', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })
      const mockTask = {
        id: 1,
        status: TaskStatus.IN_PROGRESS,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(workerUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.COMPLETED,
      })
      expect(canUpdate).toBe(true)
    })

    it('should not allow worker to transition PREPARING → READY', async () => {
      const workerUser = createMockWorkerUser()
      const mockTask = {
        id: 1,
        status: TaskStatus.PREPARING,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(workerUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.READY,
      })
      expect(canUpdate).toBe(false)
    })

    it('should not allow non-assigned worker to update status', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_456' })
      const mockTask = {
        id: 1,
        status: TaskStatus.READY,
        assigneeIds: ['worker_123'],
      }
      const canUpdate = await canUserUpdateTaskStatus({
        user: toUser(workerUser),
        task: asTask(mockTask),
        targetStatus: TaskStatus.IN_PROGRESS,
      })
      expect(canUpdate).toBe(false)
    })
  })

  describe('Task CRUD Operations', () => {
    it('should create a new task', async () => {
      const adminUser = createMockAdminUser()

      // Mock the database operations
      const mockCustomer = {
        id: 'cust_123',
        name: 'Test Customer',
        phone: '0123456789',
        searchableText: 'test customer 0123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGeoLocation = {
        id: 'geo_123',
        name: 'Test Location',
        address: '123 Test Street',
        lat: 10.762622,
        lng: 106.660172,
        searchableText: 'test location 123 test street',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.PREPARING,
        customerId: mockCustomer.id,
        geoLocationId: mockGeoLocation.id,
        assigneeIds: [],
        startedAt: null,
        completedAt: null,
        scheduledAt: null,
        expectedRevenue: null,
        expectedCurrency: 'VND',
        searchableText:
          '1 test task test description test customer 0123456789 test location 123 test street',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: mockCustomer,
        geoLocation: mockGeoLocation,
        attachments: [],
        payments: [],
      }

      // Setup mocks
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue(mockCustomer)
      mockPrisma.geoLocation.create.mockResolvedValue(mockGeoLocation)
      mockPrisma.task.create.mockResolvedValue(mockTask)
      mockPrisma.task.update.mockResolvedValue(mockTask) // For searchableText update
      mockPrisma.activity.create.mockResolvedValue({})

      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        geoLocation: {
          name: 'Test Location',
          address: '123 Test Street',
          lat: 10.762622,
          lng: 106.660172,
        },
      }

      const result = await createTask({
        data: taskData,
        user: toUser(adminUser),
      })

      expect(result).toEqual(mockTask)
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          phone: '0123456789',
          name: 'Test Customer',
        },
      })
      expect(mockPrisma.geoLocation.create).toHaveBeenCalledWith({
        data: {
          address: '123 Test Street',
          name: 'Test Location',
          lat: 10.762622,
          lng: 106.660172,
        },
      })
      expect(mockPrisma.task.create).toHaveBeenCalled()
    })

    it('should return null for non-existent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const result = await getTaskById({ id: 99999 })
      expect(result).toBeNull()
    })

    it('should update task assignees', async () => {
      const adminUser = createMockAdminUser()

      const mockUpdatedTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.PREPARING,
        assigneeIds: ['worker_456', 'worker_789'],
        customerId: 'cust_123',
        geoLocationId: 'geo_123',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
        geoLocation: null,
      }

      mockPrisma.task.update.mockResolvedValue(mockUpdatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      const result = await updateTaskAssignees({
        taskId: 1,
        assigneeIds: ['worker_456', 'worker_789'],
        user: toUser(adminUser),
      })

      expect(result).toEqual(mockUpdatedTask)
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          assigneeIds: ['worker_456', 'worker_789'],
        },
        include: {
          attachments: {
            where: { deletedAt: null },
          },
          customer: true,
          geoLocation: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    })

    it('should update task status', async () => {
      const adminUser = createMockAdminUser()

      const mockUpdatedTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.READY,
        assigneeIds: ['worker_123'],
        customerId: 'cust_123',
        geoLocationId: 'geo_123',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
        geoLocation: null,
      }

      mockPrisma.task.update.mockResolvedValue(mockUpdatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      const result = await updateTaskStatus({
        taskId: 1,
        status: TaskStatus.READY,
        user: toUser(adminUser),
      })

      expect(result).toEqual(mockUpdatedTask)
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: TaskStatus.READY,
        },
        include: {
          attachments: {
            where: { deletedAt: null },
          },
          customer: true,
          geoLocation: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    })
  })

  describe('Expected Revenue Operations', () => {
    it('should allow admin to set expected revenue', async () => {
      const adminUser = createMockAdminUser()

      const existingTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.PREPARING,
        customerId: 'cust_123',
        geoLocationId: 'geo_123',
        assigneeIds: [],
        expectedRevenue: null,
        expectedCurrency: 'VND',
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedTask = {
        ...existingTask,
        expectedRevenue: 5000000,
      }

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue(updatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      const result = await setTaskExpectedRevenue({
        taskId: 1,
        expectedRevenue: 5000000,
        user: toUser(adminUser),
      })

      expect(result.expectedRevenue).toBe(5000000)
      expect(mockPrisma.task.update).toHaveBeenCalled()
    })

    it('should allow admin to update expected revenue', async () => {
      const adminUser = createMockAdminUser()

      const existingTask = {
        id: 1,
        title: 'Test Task',
        expectedRevenue: 3000000,
        expectedCurrency: 'VND',
      }

      const updatedTask = {
        ...existingTask,
        expectedRevenue: 6000000,
      }

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue(updatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      const result = await setTaskExpectedRevenue({
        taskId: 1,
        expectedRevenue: 6000000,
        user: toUser(adminUser),
      })

      expect(result.expectedRevenue).toBe(6000000)
    })

    it('should allow admin to clear expected revenue with null', async () => {
      const adminUser = createMockAdminUser()

      const existingTask = {
        id: 1,
        title: 'Test Task',
        expectedRevenue: 5000000,
        expectedCurrency: 'VND',
      }

      const updatedTask = {
        ...existingTask,
        expectedRevenue: null,
      }

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue(updatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      const result = await setTaskExpectedRevenue({
        taskId: 1,
        expectedRevenue: null,
        user: toUser(adminUser),
      })

      expect(result.expectedRevenue).toBeNull()
    })

    it('should not allow worker to set expected revenue', async () => {
      const workerUser = createMockWorkerUser()

      await expect(
        setTaskExpectedRevenue({
          taskId: 1,
          expectedRevenue: 5000000,
          user: toUser(workerUser),
        }),
      ).rejects.toThrow(HTTPException)

      // Verify the error is 403 Forbidden
      try {
        await setTaskExpectedRevenue({
          taskId: 1,
          expectedRevenue: 5000000,
          user: toUser(workerUser),
        })
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException)
        expect((error as HTTPException).status).toBe(403)
        expect((error as HTTPException).message).toContain('admin')
      }
    })

    it('should return 404 for non-existent task', async () => {
      const adminUser = createMockAdminUser()

      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(
        setTaskExpectedRevenue({
          taskId: 99999,
          expectedRevenue: 5000000,
          user: toUser(adminUser),
        }),
      ).rejects.toThrow(HTTPException)

      // Verify the error is 404 Not Found
      try {
        await setTaskExpectedRevenue({
          taskId: 99999,
          expectedRevenue: 5000000,
          user: toUser(adminUser),
        })
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException)
        expect((error as HTTPException).status).toBe(404)
        expect((error as HTTPException).message).toContain('Không tìm thấy')
      }
    })

    it('should log activity when setting expected revenue', async () => {
      const adminUser = createMockAdminUser()

      const existingTask = {
        id: 1,
        title: 'Test Task',
        expectedRevenue: null,
        expectedCurrency: 'VND',
      }

      const updatedTask = {
        ...existingTask,
        expectedRevenue: 5000000,
      }

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue(updatedTask)
      mockPrisma.activity.create.mockResolvedValue({})

      await setTaskExpectedRevenue({
        taskId: 1,
        expectedRevenue: 5000000,
        user: toUser(adminUser),
      })

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TASK_EXPECTED_REVENUE_UPDATED',
            userId: adminUser.id,
            payload: expect.objectContaining({
              oldExpectedRevenue: null,
              newExpectedRevenue: 5000000,
            }),
          }),
        }),
      )
    })
  })

  describe('Update Task (Full Task Update - PSN-3)', () => {
    describe('authorization', () => {
      it('should allow admin to update PREPARING task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          description: 'Old Description',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'old searchable text',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(result.title).toBe('New Title')
        expect(mockPrisma.task.update).toHaveBeenCalled()
      })

      it('should allow admin to update READY task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          status: TaskStatus.READY,
          deletedAt: null,
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(result.title).toBe('New Title')
      })

      it('should not allow admin to update COMPLETED task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Completed Task',
          status: TaskStatus.COMPLETED,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          updateTask({
            taskId: 1,
            data: { title: 'New Title' },
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should not allow worker to update any task', async () => {
        const workerUser = createMockWorkerUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          updateTask({
            taskId: 1,
            data: { title: 'New Title' },
            user: toUser(workerUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should return 404 for non-existent task', async () => {
        const adminUser = createMockAdminUser()

        mockPrisma.task.findFirst.mockResolvedValue(null)

        await expect(
          updateTask({
            taskId: 99999,
            data: { title: 'New Title' },
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should return 404 for soft-deleted task', async () => {
        const adminUser = createMockAdminUser()

        const _deletedTask = {
          id: 1,
          title: 'Deleted Task',
          status: TaskStatus.PREPARING,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(null) // Soft deleted tasks return null

        await expect(
          updateTask({
            taskId: 1,
            data: { title: 'New Title' },
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })
    })

    describe('validation', () => {
      it('should reject empty update body', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          updateTask({
            taskId: 1,
            data: {},
            user: toUser(adminUser),
          }),
        ).rejects.toThrow()
      })

      it('should reject title too long (>100 chars)', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        const longTitle = 'a'.repeat(101)

        await expect(
          updateTask({
            taskId: 1,
            data: { title: longTitle },
            user: toUser(adminUser),
          }),
        ).rejects.toThrow()
      })

      it('should reject description too long (>5000 chars)', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        const longDescription = 'a'.repeat(5001)

        await expect(
          updateTask({
            taskId: 1,
            data: { description: longDescription },
            user: toUser(adminUser),
          }),
        ).rejects.toThrow()
      })

      it('should reject invalid phone format', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          updateTask({
            taskId: 1,
            data: { customerPhone: '123' }, // Invalid format
            user: toUser(adminUser),
          }),
        ).rejects.toThrow()
      })

      it('should reject invalid data', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          updateTask({
            taskId: 1,
            data: { title: '' }, // Empty title should be rejected
            user: toUser(adminUser),
          }),
        ).rejects.toThrow()
      })

      it('should allow partial update (title only)', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          description: 'Old Description',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'old searchable text',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(result.title).toBe('New Title')
        expect(result.description).toBe('Old Description') // Unchanged
      })
    })

    describe('data integrity', () => {
      it('should update title and refresh searchableText', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          description: 'Test Description',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'old title test description',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 'cust_123',
            name: 'Test Customer',
            phone: '0123456789',
          },
          geoLocation: {
            id: 'geo_123',
            name: 'Test Location',
            address: '123 St',
          },
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
          searchableText:
            'new title test description test customer 0123456789 test location 123 st',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.findUnique.mockResolvedValue(updatedTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(result.searchableText).toContain('new title')
        expect(mockPrisma.task.update).toHaveBeenCalledTimes(2) // Once for update, once for searchableText
      })

      it('should match customer by phone when phone provided', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          deletedAt: null,
        }

        const existingCustomer = {
          id: 'cust_456',
          name: 'Existing Customer',
          phone: '0987654321',
          searchableText: 'existing customer 0987654321',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          customerId: 'cust_456',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { customerPhone: '0987654321' },
          user: toUser(adminUser),
        })

        expect(result.customerId).toBe('cust_456')
        expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
          where: { phone: '0987654321' },
        })
      })

      it('should update customer name when name provided', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          deletedAt: null,
        }

        const existingCustomer = {
          id: 'cust_123',
          name: 'Old Name',
          phone: '0123456789',
        }

        const updatedCustomer = {
          ...existingCustomer,
          name: 'New Name',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer)
        mockPrisma.customer.update.mockResolvedValue(updatedCustomer)
        mockPrisma.task.update.mockResolvedValue(existingTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await updateTask({
          taskId: 1,
          data: { customerName: 'New Name', customerPhone: '0123456789' },
          user: toUser(adminUser),
        })

        expect(mockPrisma.customer.update).toHaveBeenCalledWith({
          where: { id: 'cust_123' },
          data: { name: 'New Name' },
        })
      })

      it('should create new customer when phone does not match existing customer', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          deletedAt: null,
        }

        const newCustomer = {
          id: 'cust_new',
          name: 'New Customer',
          phone: '0999999999',
          searchableText: 'new customer 0999999999',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          customerId: 'cust_new',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.customer.findFirst.mockResolvedValue(null) // No existing customer
        mockPrisma.customer.create.mockResolvedValue(newCustomer)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: { customerPhone: '0999999999', customerName: 'New Customer' },
          user: toUser(adminUser),
        })

        expect(result.customerId).toBe('cust_new')
        expect(mockPrisma.customer.create).toHaveBeenCalledWith({
          data: {
            phone: '0999999999',
            name: 'New Customer',
          },
        })
      })

      it('should update geoLocation when location provided', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
        }

        const newGeoLocation = {
          id: 'geo_456',
          name: 'New Location',
          address: '456 New Street',
          lat: 10.123,
          lng: 106.456,
          searchableText: 'new location 456 new street',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          geoLocationId: 'geo_456',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.geoLocation.create.mockResolvedValue(newGeoLocation)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        const result = await updateTask({
          taskId: 1,
          data: {
            geoLocation: {
              name: 'New Location',
              address: '456 New Street',
              lat: 10.123,
              lng: 106.456,
            },
          },
          user: toUser(adminUser),
        })

        expect(result.geoLocationId).toBe('geo_456')
        expect(mockPrisma.geoLocation.create).toHaveBeenCalled()
      })

      it('should log activity with updated fields', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          description: 'Old Description',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'old searchable text',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(mockPrisma.activity.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'TASK_UPDATED',
              userId: adminUser.id,
              payload: expect.objectContaining({
                updatedFields: expect.arrayContaining(['title']),
              }),
            }),
          }),
        )
      })

      it('should use transaction for all operations', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Old Title',
          status: TaskStatus.PREPARING,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          deletedAt: null,
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'old searchable text',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const updatedTask = {
          ...existingTask,
          title: 'New Title',
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.task.update.mockResolvedValue(updatedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await updateTask({
          taskId: 1,
          data: { title: 'New Title' },
          user: toUser(adminUser),
        })

        expect(mockPrisma.$transaction).toHaveBeenCalled()
      })
    })
  })

  describe('Delete Task (Soft Delete - PSN-3)', () => {
    describe('authorization', () => {
      it('should allow admin to delete PREPARING task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'test task',
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null) // No check-ins
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        expect(mockPrisma.task.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({
              deletedAt: expect.any(Date),
            }),
          }),
        )
      })

      it('should allow admin to delete READY task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.READY,
          deletedAt: null,
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null) // No check-ins
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        expect(mockPrisma.task.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({
              deletedAt: expect.any(Date),
            }),
          }),
        )
      })

      it('should not allow admin to delete IN_PROGRESS task', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.IN_PROGRESS,
          deletedAt: null,
          payments: [],
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          deleteTask({
            taskId: 1,
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should not allow admin to delete task with payments', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          payments: [
            {
              id: 'pay_123',
              amount: 1000000,
              taskId: 1,
              createdAt: new Date(),
            },
          ],
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          deleteTask({
            taskId: 1,
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should not allow admin to delete task with check-ins', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          payments: [],
        }

        const checkInActivity = {
          id: 'act_123',
          action: 'TASK_CHECKED_IN',
          topic: 'TASK_1',
          createdAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(checkInActivity)

        await expect(
          deleteTask({
            taskId: 1,
            user: toUser(adminUser),
          }),
        ).rejects.toThrow(HTTPException)
      })

      it('should not allow worker to delete any task', async () => {
        const workerUser = createMockWorkerUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)

        await expect(
          deleteTask({
            taskId: 1,
            user: toUser(workerUser),
          }),
        ).rejects.toThrow(HTTPException)
      })
    })

    describe('data integrity', () => {
      it('should set deletedAt timestamp (soft delete)', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'test task',
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date('2025-11-11T12:00:00.000Z'),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null) // No check-ins
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        expect(mockPrisma.task.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({
              deletedAt: expect.any(Date),
            }),
          }),
        )
      })

      it('should not appear in getTaskList after delete', async () => {
        const adminUser = createMockAdminUser()

        // First, mock a successful delete
        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null)
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        // Reset mocks for getTaskList call
        resetPrismaMock(mockPrisma)

        // Mock getTaskList to NOT include deleted task (deletedAt: null filter)
        mockPrisma.task.findMany.mockResolvedValue([])

        // Now verify getTaskList doesn't return the deleted task
        const result = await getTaskList({ take: 10 })

        expect(result.tasks).toHaveLength(0)
        expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              deletedAt: null,
            }),
          }),
        )
      })

      it('should not appear in searchAndFilterTasks after delete', async () => {
        const adminUser = createMockAdminUser()

        // Mock a deleted task
        const _deletedTask = {
          id: 1,
          title: 'Deleted Task',
          status: TaskStatus.PREPARING,
          deletedAt: new Date(),
        }

        // searchAndFilterTasks should filter out deleted tasks
        mockPrisma.task.findMany.mockResolvedValue([])

        const result = await searchAndFilterTasks(toUser(adminUser), {
          search: 'Deleted Task',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          status: undefined,
          assigneeIds: undefined,
          take: 20,
        })

        expect(result.tasks).toHaveLength(0)
      })

      it('should return 404 on getTaskById after delete', async () => {
        const _adminUser = createMockAdminUser()

        // Mock findFirst to return null (soft deleted task)
        mockPrisma.task.findFirst.mockResolvedValue(null)

        const result = await getTaskById({ id: 1 })

        expect(result).toBeNull()
        expect(mockPrisma.task.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              id: 1,
              deletedAt: null,
            }),
          }),
        )
      })

      it('should log activity with task snapshot', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'test task test description',
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null) // No check-ins
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        expect(mockPrisma.activity.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'TASK_DELETED',
              userId: adminUser.id,
              payload: expect.objectContaining({
                taskTitle: 'Test Task',
                taskStatus: TaskStatus.PREPARING,
              }),
            }),
          }),
        )
      })

      it('should use transaction for delete', async () => {
        const adminUser = createMockAdminUser()

        const existingTask = {
          id: 1,
          title: 'Test Task',
          status: TaskStatus.PREPARING,
          deletedAt: null,
          customerId: 'cust_123',
          geoLocationId: 'geo_123',
          assigneeIds: [],
          startedAt: null,
          completedAt: null,
          scheduledAt: null,
          expectedRevenue: null,
          expectedCurrency: 'VND',
          searchableText: 'test task',
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }

        const deletedTask = {
          ...existingTask,
          deletedAt: new Date(),
        }

        mockPrisma.task.findFirst.mockResolvedValue(existingTask)
        mockPrisma.activity.findFirst.mockResolvedValue(null) // No check-ins
        mockPrisma.task.update.mockResolvedValue(deletedTask)
        mockPrisma.activity.create.mockResolvedValue({})

        await deleteTask({
          taskId: 1,
          user: toUser(adminUser),
        })

        expect(mockPrisma.$transaction).toHaveBeenCalled()
      })
    })
  })
})
