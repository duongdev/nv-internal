// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  createMockAdminUser,
  createMockWorkerUser,
} from '../../../test/mock-auth'
import {
  createMockPrismaClient,
  resetPrismaMock,
} from '../../../test/prisma-mock'

// Mock Prisma getter to use our mock client
const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

// Mock activity creation to avoid side effects
jest.mock('../../activity/activity.service', () => {
  const createActivityMock = jest.fn() as unknown as jest.Mock<Promise<unknown>>
  ;(
    createActivityMock as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({})
  return { createActivity: createActivityMock }
})

// Mock upload config to deterministic values for validation
jest.mock('../../../lib/config/upload-config', () => ({
  defaultUploadConfig: {
    maxFiles: 10,
    maxPerFileBytes: 10,
    maxTotalBytes: 100000000,
    allowedMimeTypes: ['image/png', 'image/jpeg'],
  },
}))

// Mock permission helpers
jest.mock('../../user/user.service', () => ({
  isUserAdmin: jest.fn(
    async ({ user }: { user: { publicMetadata?: { roles?: string[] } } }) =>
      user.publicMetadata?.roles?.includes('nv_internal_admin') ?? false,
  ),
}))
jest.mock('../../task/task.service', () => ({
  isUserAssignedToTask: jest.fn(
    async ({
      user,
      task,
    }: {
      user: { id: string }
      task: { assigneeIds?: string[] }
    }) => task.assigneeIds?.includes(user.id) ?? false,
  ),
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

describe('uploadTaskAttachments', () => {
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
  })

  function getUpload() {
    // require to ensure mocks apply without ESM dynamic import flags
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../attachment.service') as {
      uploadTaskAttachments: typeof import('../attachment.service').uploadTaskAttachments
    }
    return mod.uploadTaskAttachments
  }

  it('uploads files as admin and persists records', async () => {
    const admin = createMockAdminUser()
    const storage = createMockStorage()

    // Task exists and has assignees
    mockPrisma.task.findUnique!.mockResolvedValue({
      id: 1,
      assigneeIds: [],
    })

    // attachment createMany success and then findMany returns rows
    mockPrisma.attachment.createMany.mockResolvedValue({ count: 2 })
    const now = new Date()
    mockPrisma.attachment.findMany.mockResolvedValue([
      {
        id: 'att_1',
        createdAt: now,
        updatedAt: now,
        taskId: 1,
        provider: 'mock-storage',
        url: null,
        pathname: 'k1',
        size: 10,
        mimeType: 'image/png',
        originalFilename: 'a.png',
        fileHash: null,
        uploadedBy: admin.id,
      },
      {
        id: 'att_2',
        createdAt: now,
        updatedAt: now,
        taskId: 1,
        provider: 'mock-storage',
        url: null,
        pathname: 'k2',
        size: 20,
        mimeType: 'image/jpeg',
        originalFilename: 'b.jpg',
        fileHash: null,
        uploadedBy: admin.id,
      },
    ])

    const files = [
      makeFile('a.png', 'image/png', 5),
      makeFile('b.jpg', 'image/jpeg', 8),
    ]

    const uploadTaskAttachments = getUpload()
    const result = await uploadTaskAttachments({
      taskId: 1,
      files,
      user: admin as unknown as import('@clerk/backend').User,
      storage:
        storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
    })

    expect(storage.put).toHaveBeenCalledTimes(2)
    expect(mockPrisma.attachment.createMany).toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  it('rejects when task not found', async () => {
    const admin = createMockAdminUser()
    const storage = createMockStorage()
    mockPrisma.task.findUnique!.mockResolvedValue(null)

    const uploadTaskAttachments = getUpload()
    await expect(
      uploadTaskAttachments({
        taskId: 999,
        files: [makeFile('a.png', 'image/png', 10)],
        user: admin as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toThrow('TASK_NOT_FOUND')
  })

  it('rejects when not admin or assigned', async () => {
    const worker = createMockWorkerUser({ id: 'worker_x' })
    const storage = createMockStorage()
    mockPrisma.task.findUnique!.mockResolvedValue({
      id: 1,
      assigneeIds: ['worker_y'],
    })

    const uploadTaskAttachments = getUpload()
    await expect(
      uploadTaskAttachments({
        taskId: 1,
        files: [makeFile('a.png', 'image/png', 10)],
        user: worker as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toMatchObject({ message: 'FORBIDDEN' })
  })

  it('validates files count and sizes', async () => {
    const admin = createMockAdminUser()
    const storage = createMockStorage()
    mockPrisma.task.findUnique!.mockResolvedValue({ id: 1, assigneeIds: [] })

    // No files
    const uploadTaskAttachments = getUpload()
    await expect(
      uploadTaskAttachments({
        taskId: 1,
        files: [],
        user: admin as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toMatchObject({ message: 'NO_FILES' })

    // Too many files (using config default: we'll try 100 files)
    const many = Array.from({ length: 100 }, (_, i) =>
      makeFile(`f${i}.png`, 'image/png', 1),
    )
    await expect(
      uploadTaskAttachments({
        taskId: 1,
        files: many,
        user: admin as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toMatchObject({ message: 'TOO_MANY_FILES' })

    // Per-file too large
    await expect(
      uploadTaskAttachments({
        taskId: 1,
        files: [makeFile('big.png', 'image/png', 20)],
        user: admin as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toThrow()

    // Unsupported mime
    await expect(
      uploadTaskAttachments({
        taskId: 1,
        files: [makeFile('file.txt', 'text/plain', 10)],
        user: admin as unknown as import('@clerk/backend').User,
        storage:
          storage as unknown as import('../../../lib/storage/storage.types').StorageProvider,
      }),
    ).rejects.toThrow()
  })
})

describe('getAttachmentsByIds', () => {
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
    // Set environment variable for JWT signing
    process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'
  })

  function getService() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../attachment.service') as {
      getAttachmentsByIds: typeof import('../attachment.service').getAttachmentsByIds
    }
    return mod.getAttachmentsByIds
  }

  it('returns empty array for empty input', async () => {
    const getAttachmentsByIds = getService()
    const result = await getAttachmentsByIds({ ids: [] })
    expect(result).toEqual([])
  })

  it('retrieves attachments and generates signed URLs', async () => {
    const now = new Date()
    mockPrisma.attachment.findMany.mockResolvedValue([
      {
        id: 'att_1',
        createdAt: now,
        updatedAt: now,
        taskId: 1,
        provider: 'local-disk',
        url: null,
        pathname: 'path/to/file.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        originalFilename: 'test.jpg',
        fileHash: null,
        uploadedBy: 'user_123',
      },
    ])

    const getAttachmentsByIds = getService()
    const result = await getAttachmentsByIds({ ids: ['att_1'] })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'att_1',
      originalFilename: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
    })
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('expiresAt')
    expect(typeof result[0].url).toBe('string')
  })
})

describe('streamLocalFile', () => {
  beforeEach(() => {
    resetPrismaMock(mockPrisma)
    // Set environment variable for JWT verification
    process.env.ATTACHMENT_JWT_SECRET = 'test-secret-key-for-jwt'
  })

  function getService() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../attachment.service') as {
      streamLocalFile: typeof import('../attachment.service').streamLocalFile
    }
    return mod.streamLocalFile
  }

  it('rejects invalid JWT token', async () => {
    const streamLocalFile = getService()
    await expect(
      streamLocalFile({ token: 'invalid_token' }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Invalid'),
      status: 403,
    })
  })

  it('rejects when attachment not found in database', async () => {
    // Create a valid JWT token but mock no attachment in DB
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken')
    const secret = process.env.ATTACHMENT_JWT_SECRET || 'test-secret'
    const token = jwt.sign(
      { key: 'nonexistent/path.jpg', filename: 'test.jpg' },
      secret,
      { expiresIn: '1h' },
    )

    mockPrisma.attachment.findFirst!.mockResolvedValue(null)

    const streamLocalFile = getService()
    await expect(streamLocalFile({ token })).rejects.toMatchObject({
      message: expect.stringContaining('not found'),
      status: 404,
    })
  })
})
