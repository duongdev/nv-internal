// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockWorkerUser } from '../../../test/mock-auth'
import {
  createMockPrismaClient,
  resetPrismaMock,
} from '../../../test/prisma-mock'

// Mock Prisma getter to use our mock client
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

// Mock activity creation
const mockCreateActivity = jest.fn() as unknown as jest.Mock<Promise<unknown>>
;(
  mockCreateActivity as unknown as { mockResolvedValue: (v: unknown) => void }
).mockResolvedValue({})
jest.mock('../../activity/activity.service', () => ({
  createActivity: mockCreateActivity,
}))

// Mock attachment upload
const mockUploadTaskAttachments = jest.fn() as unknown as jest.Mock<
  Promise<unknown[]>
>
;(
  mockUploadTaskAttachments as unknown as {
    mockResolvedValue: (v: unknown) => void
  }
).mockResolvedValue([
  {
    id: 'att_1',
    mimeType: 'image/jpeg',
    originalFilename: 'photo.jpg',
  },
])
jest.mock('../../attachment/attachment.service', () => ({
  uploadTaskAttachments: mockUploadTaskAttachments,
}))

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

function createMockStorage() {
  const putMock = jest.fn() as unknown as jest.Mock<Promise<void>>
  ;(
    putMock as unknown as { mockResolvedValue: (v?: unknown) => void }
  ).mockResolvedValue()
  return {
    name: 'mock-storage',
    put: putMock,
  }
}

describe('task-event service', () => {
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
    jest.clearAllMocks()
  })

  function getService() {
    // require to ensure mocks apply
    const mod = require('../task-event.service') as {
      checkInToTask: (
        data: {
          taskId: number
          userId: string
          latitude: number
          longitude: number
          files: File[]
          notes?: string
        },
        storage: unknown,
      ) => Promise<unknown>
      checkOutFromTask: (
        data: {
          taskId: number
          userId: string
          latitude: number
          longitude: number
          files: File[]
          notes?: string
        },
        storage: unknown,
      ) => Promise<unknown>
    }
    return mod
  }

  describe('checkInToTask', () => {
    it('should check in successfully when task is READY and user is assigned', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      // Mock task query
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'READY',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          geoLocation: {
            create: jest.fn().mockResolvedValue({
              id: 'geo_2',
              lat: 21.0286,
              lng: 105.8543,
            }),
          },
          task: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              status: 'IN_PROGRESS',
              startedAt: new Date(),
              customer: null,
              geoLocation: {
                id: 'geo_1',
                lat: 21.0285,
                lng: 105.8542,
              },
              attachments: [
                {
                  id: 'att_1',
                  mimeType: 'image/jpeg',
                  originalFilename: 'photo.jpg',
                },
              ],
            }),
          },
        }
        return await callback(txMock)
      })

      const result = await checkInToTask(
        {
          taskId: 1,
          userId: worker.id,
          latitude: 21.0286,
          longitude: 105.8543,
          files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          notes: 'Starting work',
        },
        storage,
      )

      // Verify result structure
      expect(result).toHaveProperty('event')
      expect(result).toHaveProperty('task')
      expect(result).toHaveProperty('warnings')
      expect(result.event.type).toBe('CHECK_IN')
      expect(result.task.status).toBe('IN_PROGRESS')
      expect(result.warnings).toHaveLength(0)

      // Verify attachments were uploaded
      expect(mockUploadTaskAttachments).toHaveBeenCalledWith({
        taskId: 1,
        files: expect.any(Array),
        user: { id: worker.id },
        storage,
      })

      // Verify activity was created
      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TASK_CHECKED_IN',
          userId: worker.id,
          topic: { entityType: 'TASK', entityId: 1 },
          payload: expect.objectContaining({
            type: 'CHECK_IN',
            notes: 'Starting work',
          }),
        }),
        expect.anything(),
      )
    })

    it('should return warnings when far from task location', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      // Mock task at one location
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'READY',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          geoLocation: {
            create: jest.fn().mockResolvedValue({
              id: 'geo_2',
              lat: 21.0295,
              lng: 105.8552,
            }),
          },
          task: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              status: 'IN_PROGRESS',
              startedAt: new Date(),
              customer: null,
              geoLocation: {
                id: 'geo_1',
                lat: 21.0285,
                lng: 105.8542,
              },
              attachments: [],
            }),
          },
        }
        return await callback(txMock)
      })

      // Check in from far away location (>100m)
      const result = await checkInToTask(
        {
          taskId: 1,
          userId: worker.id,
          latitude: 21.0295,
          longitude: 105.8552,
          files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
        },
        storage,
      )

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('cách vị trí công việc')
    })

    it('should throw error when task not found', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce(null)

      await expect(
        checkInToTask(
          {
            taskId: 999,
            userId: worker.id,
            latitude: 21.0285,
            longitude: 105.8542,
            files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          },
          storage,
        ),
      ).rejects.toThrow('Không tìm thấy công việc')
    })

    it('should throw error when user not assigned', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'READY',
        assigneeIds: ['other_user'],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      await expect(
        checkInToTask(
          {
            taskId: 1,
            userId: worker.id,
            latitude: 21.0285,
            longitude: 105.8542,
            files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          },
          storage,
        ),
      ).rejects.toThrow('không được phân công')
    })

    it('should throw error when task status is not READY', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'IN_PROGRESS',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      await expect(
        checkInToTask(
          {
            taskId: 1,
            userId: worker.id,
            latitude: 21.0285,
            longitude: 105.8542,
            files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          },
          storage,
        ),
      ).rejects.toThrow('chưa sẵn sàng')
    })

    it('should allow check-in without files', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkInToTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'READY',
        assigneeIds: [worker.id],
        geoLocation: null, // No location requirement
      })

      // Mock geoLocation creation for the event
      mockPrisma.geoLocation.create.mockResolvedValueOnce({
        id: 'geo_event_1',
        lat: 21.0285,
        lng: 105.8542,
        name: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Mock task update in transaction
      mockPrisma.task.update.mockResolvedValueOnce({
        id: 1,
        status: 'IN_PROGRESS',
        title: 'Test Task',
        description: 'Test Description',
        assigneeIds: [worker.id],
        customerId: 'cust_123',
        geoLocationId: null,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'cust_123',
          name: 'Test Customer',
          phone: '0123456789',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        geoLocation: null,
        attachments: [],
      })

      const result = await checkInToTask(
        {
          taskId: 1,
          userId: worker.id,
          latitude: 21.0285,
          longitude: 105.8542,
          files: [],
        },
        storage,
      )

      // Verify result structure
      expect(result).toHaveProperty('event')
      expect(result).toHaveProperty('task')
      expect(result).toHaveProperty('warnings')
      expect(result.event.type).toBe('CHECK_IN')
      expect(result.task.status).toBe('IN_PROGRESS')

      // Verify NO attachments were uploaded since files array was empty
      expect(mockUploadTaskAttachments).not.toHaveBeenCalled()

      // Verify activity was created
      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TASK_CHECKED_IN',
          userId: worker.id,
          topic: { entityType: 'TASK', entityId: 1 },
          payload: expect.objectContaining({
            type: 'CHECK_IN',
            attachments: [],
          }),
        }),
        expect.anything(),
      )
    })
  })

  describe('checkOutFromTask', () => {
    it('should check out successfully when task is IN_PROGRESS and user checked in', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkOutFromTask } = getService()

      // Mock task query
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'IN_PROGRESS',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      // Mock check-in activity exists
      mockPrisma.activity.findFirst.mockResolvedValueOnce({
        id: 'act_1',
        action: 'TASK_CHECKED_IN',
        userId: worker.id,
      })

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          geoLocation: {
            create: jest.fn().mockResolvedValue({
              id: 'geo_3',
              lat: 21.0286,
              lng: 105.8543,
            }),
          },
          task: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              status: 'COMPLETED',
              completedAt: new Date(),
              customer: null,
              geoLocation: {
                id: 'geo_1',
                lat: 21.0285,
                lng: 105.8542,
              },
              attachments: [],
            }),
          },
        }
        return await callback(txMock)
      })

      const result = await checkOutFromTask(
        {
          taskId: 1,
          userId: worker.id,
          latitude: 21.0286,
          longitude: 105.8543,
          files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          notes: 'Work completed',
        },
        storage,
      )

      expect(result.event.type).toBe('CHECK_OUT')
      expect(result.task.status).toBe('COMPLETED')

      // Verify activity was created with correct action
      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TASK_CHECKED_OUT',
          payload: expect.objectContaining({
            type: 'CHECK_OUT',
          }),
        }),
        expect.anything(),
      )
    })

    it('should throw error when task status is not IN_PROGRESS', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkOutFromTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'READY',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      await expect(
        checkOutFromTask(
          {
            taskId: 1,
            userId: worker.id,
            latitude: 21.0285,
            longitude: 105.8542,
            files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          },
          storage,
        ),
      ).rejects.toThrow('chưa bắt đầu hoặc đã hoàn thành')
    })

    it('should throw error when user has not checked in', async () => {
      const worker = createMockWorkerUser()
      const storage = createMockStorage()
      const { checkOutFromTask } = getService()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'IN_PROGRESS',
        assigneeIds: [worker.id],
        geoLocation: {
          id: 'geo_1',
          lat: 21.0285,
          lng: 105.8542,
        },
      })

      // No check-in activity found
      mockPrisma.activity.findFirst.mockResolvedValueOnce(null)

      await expect(
        checkOutFromTask(
          {
            taskId: 1,
            userId: worker.id,
            latitude: 21.0285,
            longitude: 105.8542,
            files: [makeFile('photo.jpg', 'image/jpeg', 1000)],
          },
          storage,
        ),
      ).rejects.toThrow('check-in')
    })
  })
})
