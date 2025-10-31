import { beforeEach, describe, expect, it, jest } from '@jest/globals'
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
import { addTaskComment } from '../task.service'

// Mock the prisma module
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

// Mock uploadTaskAttachments
// Note: We define the mock function using jest.fn() directly in the factory
jest.mock('../../attachment/attachment.service', () => ({
  uploadTaskAttachments: jest.fn(),
}))

// Import the mocked function after mocking
import { uploadTaskAttachments as mockUploadTaskAttachments } from '../../attachment/attachment.service'

describe('Task Comment Service Unit Tests', () => {
  const toUser = (u: MockUser) => u as unknown as import('@clerk/backend').User

  // Mock storage provider
  const mockStorage = {
    name: 'mock-storage',
    put: jest.fn(),
    getSignedUrl: jest.fn(),
  } as unknown as import('../../lib/storage/storage.types').StorageProvider

  beforeEach(() => {
    resetPrismaMock(mockPrisma)
    ;(mockUploadTaskAttachments as jest.Mock).mockReset()
  })

  describe('addTaskComment', () => {
    it('should successfully create comment on assigned task', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Fixed the AC unit',
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Fixed the AC unit',
      })

      expect(result).toEqual(mockActivity)
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, assigneeIds: true },
      })
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          action: 'TASK_COMMENTED',
          userId: 'worker_123',
          topic: 'TASK_1',
          payload: {
            type: 'COMMENT',
            comment: 'Fixed the AC unit',
          },
        },
      })
    })

    it('should allow admin to comment on any task', async () => {
      const adminUser = createMockAdminUser()

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_456'], // Admin is not assigned
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: adminUser.id,
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Admin comment',
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(adminUser),
        comment: 'Admin comment',
      })

      expect(result).toEqual(mockActivity)
      expect(mockPrisma.activity.create).toHaveBeenCalled()
    })

    it('should handle long comments (up to 5000 chars)', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const longComment = 'A'.repeat(5000) // Max allowed length

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: longComment,
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: longComment,
      })

      expect(result).toEqual(mockActivity)
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              comment: longComment,
            }),
          }),
        }),
      )
    })

    it('should reject comment if task not found', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(
        addTaskComment({
          taskId: 99999,
          user: toUser(workerUser),
          comment: 'Comment on non-existent task',
        }),
      ).rejects.toThrow(HTTPException)

      // Verify the error details
      try {
        await addTaskComment({
          taskId: 99999,
          user: toUser(workerUser),
          comment: 'Comment on non-existent task',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException)
        expect((error as HTTPException).status).toBe(404)
        expect((error as HTTPException).message).toContain(
          'Không tìm thấy công việc',
        )
      }
    })

    it('should reject comment if user not assigned to task', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_456' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'], // Different user assigned
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)

      await expect(
        addTaskComment({
          taskId: 1,
          user: toUser(workerUser),
          comment: 'Unauthorized comment',
        }),
      ).rejects.toThrow(HTTPException)

      // Verify the error details
      try {
        await addTaskComment({
          taskId: 1,
          user: toUser(workerUser),
          comment: 'Unauthorized comment',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException)
        expect((error as HTTPException).status).toBe(403)
        expect((error as HTTPException).message).toContain(
          'không có quyền bình luận',
        )
      }
    })

    it('should create activity with correct action and payload structure', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Test comment',
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Test comment',
      })

      // Verify activity was created with correct structure
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          action: 'TASK_COMMENTED',
          userId: 'worker_123',
          topic: 'TASK_1',
          payload: {
            type: 'COMMENT',
            comment: 'Test comment',
          },
        },
      })
    })

    it('should handle comments with special characters', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const commentWithSpecialChars =
        'Fixed A/C unit! Cost: $500. Done @ 3pm. ✓'

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: commentWithSpecialChars,
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: commentWithSpecialChars,
      })

      expect(result.payload).toEqual({
        type: 'COMMENT',
        comment: commentWithSpecialChars,
      })
    })

    it('should handle Vietnamese text comments', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const vietnameseComment =
        'Đã sửa máy lạnh. Thay gas R410A. Khách hàng hài lòng.'

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_123',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: vietnameseComment,
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: vietnameseComment,
      })

      expect(result.payload).toEqual({
        type: 'COMMENT',
        comment: vietnameseComment,
      })
    })

    // ============================================================================
    // Phase 2: Photo Attachment Tests
    // ============================================================================

    it('should successfully create comment with 1 photo attachment', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      // Mock file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Mock uploaded attachment
      const mockUploadedAttachment = {
        id: 'att_photo1',
        mimeType: 'image/jpeg',
        originalFilename: 'test.jpg',
        size: 1024,
        createdAt: new Date(),
        taskId: 1,
        provider: 'mock-storage',
        pathname: 'tasks/1/test.jpg',
        uploadedBy: 'worker_123',
        deletedAt: null,
        blurhash: null,
        width: null,
        height: null,
        thumbnailPathname: null,
        updatedAt: new Date(),
      }

      const mockActivity = {
        id: 'act_comment_photo',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Fixed with proof',
          attachments: [
            {
              id: 'att_photo1',
              mimeType: 'image/jpeg',
              originalFilename: 'test.jpg',
            },
          ],
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      ;(mockUploadTaskAttachments as jest.Mock).mockResolvedValue([
        mockUploadedAttachment,
      ])
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Fixed with proof',
        files: [mockFile],
        storage: mockStorage,
      })

      expect(result).toEqual(mockActivity)
      expect(mockUploadTaskAttachments).toHaveBeenCalledWith({
        taskId: 1,
        files: [mockFile],
        user: toUser(workerUser),
        storage: mockStorage,
      })
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          action: 'TASK_COMMENTED',
          userId: 'worker_123',
          topic: 'TASK_1',
          payload: {
            type: 'COMMENT',
            comment: 'Fixed with proof',
            attachments: [
              {
                id: 'att_photo1',
                mimeType: 'image/jpeg',
                originalFilename: 'test.jpg',
              },
            ],
          },
        },
      })
    })

    it('should successfully create comment with 5 photo attachments (maximum)', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      // Mock 5 files
      const mockFiles = Array.from(
        { length: 5 },
        (_, i) =>
          new File([`test${i}`], `photo${i}.jpg`, { type: 'image/jpeg' }),
      )

      // Mock uploaded attachments
      const mockUploadedAttachments = mockFiles.map((_, i) => ({
        id: `att_photo${i}`,
        mimeType: 'image/jpeg',
        originalFilename: `photo${i}.jpg`,
        size: 1024,
        createdAt: new Date(),
        taskId: 1,
        provider: 'mock-storage',
        pathname: `tasks/1/photo${i}.jpg`,
        uploadedBy: 'worker_123',
        deletedAt: null,
        blurhash: null,
        width: null,
        height: null,
        thumbnailPathname: null,
        updatedAt: new Date(),
      }))

      const attachmentSummaries = mockUploadedAttachments.map((att) => ({
        id: att.id,
        mimeType: att.mimeType,
        originalFilename: att.originalFilename,
      }))

      const mockActivity = {
        id: 'act_comment_5photos',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Multiple photos',
          attachments: attachmentSummaries,
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      ;(mockUploadTaskAttachments as jest.Mock).mockResolvedValue(
        mockUploadedAttachments,
      )
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Multiple photos',
        files: mockFiles,
        storage: mockStorage,
      })

      expect(result.payload).toEqual({
        type: 'COMMENT',
        comment: 'Multiple photos',
        attachments: attachmentSummaries,
      })
      expect(mockUploadTaskAttachments).toHaveBeenCalledWith({
        taskId: 1,
        files: mockFiles,
        user: toUser(workerUser),
        storage: mockStorage,
      })
    })

    it('should successfully create text-only comment without files (backward compatible)', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_text_only',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Text only comment',
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Text only comment',
        // No files parameter - backward compatible
      })

      expect(result.payload).toEqual({
        type: 'COMMENT',
        comment: 'Text only comment',
        // No attachments field when there are no files
      })
      expect(mockUploadTaskAttachments).not.toHaveBeenCalled()
    })

    it('should not upload files when files array is empty', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockActivity = {
        id: 'act_comment_empty_files',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'No files',
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      const result = await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'No files',
        files: [], // Empty array
        storage: mockStorage,
      })

      expect(result.payload).toEqual({
        type: 'COMMENT',
        comment: 'No files',
      })
      expect(mockUploadTaskAttachments).not.toHaveBeenCalled()
    })

    it('should include attachment summaries in activity payload', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockFile = new File(['test'], 'evidence.png', { type: 'image/png' })

      const mockUploadedAttachment = {
        id: 'att_evidence',
        mimeType: 'image/png',
        originalFilename: 'evidence.png',
        size: 2048,
        createdAt: new Date(),
        taskId: 1,
        provider: 'mock-storage',
        pathname: 'tasks/1/evidence.png',
        uploadedBy: 'worker_123',
        deletedAt: null,
        blurhash: 'ABC123',
        width: 800,
        height: 600,
        thumbnailPathname: null,
        updatedAt: new Date(),
      }

      const mockActivity = {
        id: 'act_with_summary',
        action: 'TASK_COMMENTED',
        userId: 'worker_123',
        topic: 'TASK_1',
        payload: {
          type: 'COMMENT',
          comment: 'Evidence photo',
          attachments: [
            {
              id: 'att_evidence',
              mimeType: 'image/png',
              originalFilename: 'evidence.png',
            },
          ],
        },
        createdAt: new Date(),
      }

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      ;(mockUploadTaskAttachments as jest.Mock).mockResolvedValue([
        mockUploadedAttachment,
      ])
      mockPrisma.activity.create.mockResolvedValue(mockActivity)

      await addTaskComment({
        taskId: 1,
        user: toUser(workerUser),
        comment: 'Evidence photo',
        files: [mockFile],
        storage: mockStorage,
      })

      // Verify activity payload contains only summary fields (id, mimeType, originalFilename)
      // Not full attachment data (size, blurhash, width, height, etc.)
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            attachments: [
              {
                id: 'att_evidence',
                mimeType: 'image/png',
                originalFilename: 'evidence.png',
              },
            ],
          }),
        }),
      })
    })

    it('should handle file upload errors gracefully', async () => {
      const workerUser = createMockWorkerUser({ id: 'worker_123' })

      const mockTask = {
        id: 1,
        assigneeIds: ['worker_123'],
      }

      const mockFile = new File(['test'], 'fail.jpg', { type: 'image/jpeg' })

      mockPrisma.task.findUnique.mockResolvedValue(mockTask)
      ;(mockUploadTaskAttachments as jest.Mock).mockRejectedValue(
        new Error('Storage upload failed'),
      )

      await expect(
        addTaskComment({
          taskId: 1,
          user: toUser(workerUser),
          comment: 'Should fail',
          files: [mockFile],
          storage: mockStorage,
        }),
      ).rejects.toThrow('Storage upload failed')

      // Activity should NOT be created if file upload fails
      expect(mockPrisma.activity.create).not.toHaveBeenCalled()
    })
  })
})
