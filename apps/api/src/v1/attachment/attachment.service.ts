import type { User } from '@clerk/backend'
import type { Prisma } from '@nv-internal/prisma-client'
import { getPrisma } from '../../lib/prisma'
import { createActivity } from '../activity/activity.service'
import { getLogger } from '../../lib/log'
import { defaultUploadConfig } from '../../lib/config/upload-config'
import type { StorageProvider } from '../../lib/storage/storage.types'
import { isUserAdmin } from '../user/user.service'
import { isUserAssignedToTask } from '../task/task.service'

export interface UploadAttachmentInput {
  taskId: number
  files: File[]
  user: User
  storage: StorageProvider
}

export async function uploadTaskAttachments({
  taskId,
  files,
  user,
  storage,
}: UploadAttachmentInput) {
  const logger = getLogger('attachment.service:uploadTaskAttachments')
  const prisma = getPrisma()

  // Validate task exists and permission
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    throw new Error('TASK_NOT_FOUND')
  }

  const isAdmin = await isUserAdmin({ user })
  const assigned = await isUserAssignedToTask({ user, task })
  if (!isAdmin && !assigned) {
    const err = new Error('FORBIDDEN') as Error & { status?: number }
    err.status = 403
    throw err
  }

  // Validate files
  if (files.length === 0) {
    const err = new Error('NO_FILES') as Error & { status?: number }
    err.status = 400
    throw err
  }
  if (files.length > defaultUploadConfig.maxFiles) {
    const err = new Error('TOO_MANY_FILES') as Error & { status?: number }
    err.status = 400
    throw err
  }
  const totalSize = files.reduce((s, f) => s + f.size, 0)
  if (totalSize > defaultUploadConfig.maxTotalBytes) {
    const err = new Error('TOTAL_SIZE_EXCEEDED') as Error & { status?: number }
    err.status = 400
    throw err
  }

  for (const f of files) {
    if (f.size > defaultUploadConfig.maxPerFileBytes) {
      const err = new Error('FILE_TOO_LARGE') as Error & { status?: number }
      err.status = 400
      throw err
    }
    if (!defaultUploadConfig.allowedMimeTypes.includes(f.type)) {
      const err = new Error('UNSUPPORTED_MIME') as Error & { status?: number }
      err.status = 400
      throw err
    }
  }

  // Upload & persist
  const toCreate: Array<Prisma.AttachmentCreateManyInput> = []
  const uploaded: Array<{
    provider: string
    pathname: string
    mimeType: string
    size: number
    originalFilename: string
  }> = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const date = new Date()
    const key = `tasks/${taskId}/${date.getUTCFullYear()}/${
      date.getUTCMonth() + 1
    }/${date.getUTCDate()}/${crypto.randomUUID()}-${safeName}`

    await storage.put({ key, body: file, contentType: file.type })

    uploaded.push({
      provider: storage.name,
      pathname: key,
      mimeType: file.type,
      size: file.size,
      originalFilename: file.name,
    })

    toCreate.push({
      taskId,
      provider: storage.name,
      pathname: key,
      mimeType: file.type,
      size: file.size,
      originalFilename: file.name,
      uploadedBy: user.id,
    })
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.attachment.createMany({ data: toCreate })

    await createActivity(
      {
        action: 'TASK_ATTACHMENTS_UPLOADED',
        userId: user.id,
        topic: { entityType: 'TASK', entityId: taskId },
        payload: { attachments: uploaded },
      },
      tx,
    )

    // Return the rows for the response
    const attachments = await tx.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: uploaded.length,
    })
    return attachments
  })

  logger.info(
    { taskId, count: result.length },
    'Uploaded task attachments successfully',
  )
  return result
}


