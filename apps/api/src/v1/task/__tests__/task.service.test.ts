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
  getTaskById,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGeoLocation = {
        id: 'geo_123',
        name: 'Test Location',
        address: '123 Test Street',
        lat: 10.762622,
        lng: 106.660172,
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
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: mockCustomer,
        geoLocation: mockGeoLocation,
      }

      // Setup mocks
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue(mockCustomer)
      mockPrisma.geoLocation.create.mockResolvedValue(mockGeoLocation)
      mockPrisma.task.create.mockResolvedValue(mockTask)
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
})
