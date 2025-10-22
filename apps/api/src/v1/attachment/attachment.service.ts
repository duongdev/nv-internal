import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { User } from '@clerk/backend'
import type { Prisma } from '@nv-internal/prisma-client'
import jwt from 'jsonwebtoken'
import { generateBlurhash } from '../../lib/blurhash'
import { defaultUploadConfig } from '../../lib/config/upload-config'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import { LocalDiskProvider } from '../../lib/storage/local-disk.provider'
import type { StorageProvider } from '../../lib/storage/storage.types'
import { VercelBlobProvider } from '../../lib/storage/vercel-blob.provider'
import { createActivity } from '../activity/activity.service'
import { isUserAssignedToTask } from '../task/task.service'
import { isUserAdmin } from '../user/user.service'

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
      const maxMB = defaultUploadConfig.maxPerFileBytes / 1024 / 1024
      const err = new Error(
        `Tệp "${f.name}" quá lớn (${Math.round(f.size / 1024 / 1024)}MB). Kích thước tối đa: ${maxMB}MB`,
      ) as Error & { status?: number }
      err.status = 400
      throw err
    }
    if (!defaultUploadConfig.allowedMimeTypes.includes(f.type)) {
      const err = new Error(
        `Loại tệp "${f.type}" không được hỗ trợ. Chỉ chấp nhận: ${defaultUploadConfig.allowedMimeTypes.join(', ')}`,
      ) as Error & { status?: number }
      err.status = 400
      throw err
    }
  }

  // Upload & persist
  interface FileInfo {
    file: File
    key: string
    safeName: string
  }

  const fileInfos: FileInfo[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const date = new Date()
    const key = `tasks/${taskId}/${date.getUTCFullYear()}/${
      date.getUTCMonth() + 1
    }/${date.getUTCDate()}/${crypto.randomUUID()}-${safeName}`

    fileInfos.push({
      file,
      key,
      safeName,
    })
  }

  // Upload all files to storage
  for (const info of fileInfos) {
    try {
      await storage.put({
        key: info.key,
        body: info.file,
        contentType: info.file.type,
      })
    } catch (storageError) {
      logger.error(
        {
          error: String(storageError),
          key: info.key,
          fileName: info.file.name,
        },
        'Failed to upload file to storage',
      )
      throw storageError
    }
  }

  // Create attachment records with blurhash for images only
  const toCreate: Array<Prisma.AttachmentCreateManyInput> = []
  const uploaded: Array<{
    provider: string
    pathname: string
    mimeType: string
    size: number
    originalFilename: string
  }> = []

  for (const info of fileInfos) {
    const baseData = {
      taskId,
      provider: storage.name,
      pathname: info.key,
      mimeType: info.file.type,
      size: info.file.size,
      originalFilename: info.file.name,
      uploadedBy: user.id,
    }

    // Generate blurhash for images only
    let blurhashData:
      | { blurhash: string; width: number; height: number }
      | undefined
    if (info.file.type.startsWith('image/')) {
      try {
        // Get file buffer to generate blurhash
        const buffer = Buffer.from(await info.file.arrayBuffer())
        blurhashData = await generateBlurhash(buffer)
        logger.info(
          { filename: info.file.name, blurhash: blurhashData.blurhash },
          'Generated blurhash for image',
        )
      } catch (error) {
        logger.warn(
          { error, filename: info.file.name },
          'Failed to generate blurhash for image',
        )
      }
    }

    uploaded.push({
      provider: storage.name,
      pathname: info.key,
      mimeType: info.file.type,
      size: info.file.size,
      originalFilename: info.file.name,
    })

    toCreate.push({
      ...baseData,
      blurhash: blurhashData?.blurhash,
      width: blurhashData?.width,
      height: blurhashData?.height,
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

/**
 * Get attachments by IDs and resolve signed URLs
 */
export async function getAttachmentsByIds({ ids }: { ids: string[] }): Promise<
  Array<{
    id: string
    originalFilename: string
    size: number
    mimeType: string
    createdAt: Date
    url: string
    expiresAt: string
    thumbnailUrl?: string
    blurhash?: string
    width?: number
    height?: number
  }>
> {
  const logger = getLogger('attachment.service:getAttachmentsByIds')
  const prisma = getPrisma()

  if (ids.length === 0) {
    return []
  }

  const attachments = await prisma.attachment.findMany({
    where: { id: { in: ids } },
  })

  const expiresInSec = 3600 // 1 hour
  const expiresAt = new Date(Date.now() + expiresInSec * 1000)

  const result = await Promise.all(
    attachments.map(async (attachment) => {
      // Use the attachment's own provider, not the global one
      const storage =
        attachment.provider === 'local-disk'
          ? new LocalDiskProvider()
          : new VercelBlobProvider()

      const url = await storage.getSignedUrl(attachment.pathname, {
        expiresInSec,
        dispositionFilename: attachment.originalFilename,
      })

      // Generate signed URL for thumbnail if it exists
      let thumbnailUrl: string | undefined
      if (attachment.thumbnailPathname) {
        try {
          thumbnailUrl = await storage.getSignedUrl(
            attachment.thumbnailPathname,
            {
              expiresInSec,
              dispositionFilename: `thumb_${attachment.originalFilename}`,
            },
          )
        } catch (error) {
          logger.warn(
            { error, attachmentId: attachment.id },
            'Failed to generate thumbnail URL',
          )
        }
      }

      return {
        id: attachment.id,
        originalFilename: attachment.originalFilename,
        size: attachment.size,
        mimeType: attachment.mimeType,
        createdAt: attachment.createdAt,
        url,
        expiresAt: expiresAt.toISOString(),
        thumbnailUrl,
        blurhash: attachment.blurhash ?? undefined,
        width: attachment.width ?? undefined,
        height: attachment.height ?? undefined,
      }
    }),
  )

  logger.info({ count: result.length }, 'Resolved attachment URLs')
  return result
}

/**
 * Stream file for attachment view endpoint
 * Validates JWT token and returns file stream (works for both local and Vercel Blob)
 * Supports byte range requests for video streaming
 */
export async function streamLocalFile({
  token,
  start,
  end,
}: {
  token: string
  start?: number
  end?: number
}): Promise<{
  stream: NodeJS.ReadableStream
  mimeType: string
  size: number
  filename: string
  blobUrl?: string
  provider?: string
}> {
  const logger = getLogger('attachment.service:streamFile')
  const secret = process.env.ATTACHMENT_JWT_SECRET

  if (!secret) {
    throw new Error('ATTACHMENT_JWT_SECRET not configured')
  }

  // Verify and decode token
  let payload: { key: string; filename?: string; provider?: string }
  try {
    payload = jwt.verify(token, secret) as {
      key: string
      filename?: string
      provider?: string
    }
  } catch (error) {
    logger.warn({ error }, 'Invalid or expired token')
    const err = new Error('Invalid or expired attachment URL') as Error & {
      status?: number
    }
    err.status = 403
    throw err
  }

  const { key, filename, provider } = payload

  // Get attachment from database to verify it exists and get metadata
  const prisma = getPrisma()
  const attachment = await prisma.attachment.findFirst({
    where: { pathname: key },
  })

  if (!attachment) {
    logger.warn({ key }, 'Attachment not found for key')
    const err = new Error('Attachment not found') as Error & { status?: number }
    err.status = 404
    throw err
  }

  // Handle based on storage provider
  if (provider === 'vercel-blob') {
    // Use Vercel Blob SDK to get the file metadata and URL
    const { head } = await import('@vercel/blob')

    logger.info({ key, provider }, 'Fetching from Vercel Blob')

    try {
      // Pass the token from environment variable
      const token = process.env.BLOB_READ_WRITE_TOKEN
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN not configured')
      }

      const blobInfo = await head(key, { token })
      if (!blobInfo) {
        throw new Error('Blob not found')
      }

      logger.info(
        { key, blobUrl: blobInfo.url, blobSize: blobInfo.size },
        'Found blob in Vercel Blob storage',
      )

      // Prepare fetch options with range header if needed
      const fetchOptions: RequestInit = {}
      if (start !== undefined) {
        const endPart = end !== undefined ? end.toString() : ''
        fetchOptions.headers = {
          // biome-ignore lint/style/useNamingConvention: Range is a standard HTTP header
          Range: `bytes=${start}-${endPart}`,
        }
      }

      // Fetch the file from the blob URL
      const response = await fetch(blobInfo.url, fetchOptions)
      if (!response.ok && response.status !== 206) {
        logger.error(
          { status: response.status, key, blobUrl: blobInfo.url },
          'Failed to fetch from Vercel Blob',
        )
        const err = new Error('File not found in storage') as Error & {
          status?: number
        }
        err.status = 404
        throw err
      }

      // Get actual size from blobInfo (most reliable) or response headers as fallback
      const actualSize =
        blobInfo.size || parseInt(response.headers.get('content-length') || '0')

      // Convert web ReadableStream to Node ReadableStream
      const webStream = response.body
      if (!webStream) {
        throw new Error('No response body from Vercel Blob')
      }

      const { Readable } = await import('node:stream')
      const nodeStream = Readable.fromWeb(webStream as never)

      return {
        stream: nodeStream,
        mimeType: attachment.mimeType,
        size: actualSize,
        filename: filename || attachment.originalFilename,
        blobUrl: blobInfo.url, // Return blob URL for potential redirect
        provider: 'vercel-blob',
      }
    } catch (error) {
      logger.error({ error, key }, 'Failed to fetch blob metadata')
      const err = new Error('File not found in storage') as Error & {
        status?: number
      }
      err.status = 404
      throw err
    }
  }

  // Handle local storage (default)
  const UPLOAD_ROOT = join(process.cwd(), '.uploads')
  const filePath = join(UPLOAD_ROOT, key)

  // Verify file exists and get size
  let fileStats: { size: number }
  try {
    fileStats = await stat(filePath)
  } catch (error) {
    logger.error({ error, filePath }, 'File not found on disk')
    const err = new Error('File not found') as Error & { status?: number }
    err.status = 404
    throw err
  }

  // Create read stream with range support
  // Note: createReadStream's end is inclusive, and HTTP Range end is also inclusive
  const streamOptions: { start?: number; end?: number } = {}
  if (start !== undefined) {
    streamOptions.start = start
  }
  if (end !== undefined) {
    streamOptions.end = end // Both HTTP Range and createReadStream use inclusive end
  }

  const stream = createReadStream(filePath, streamOptions)

  logger.info(
    { key, size: fileStats.size, provider: 'local-disk', range: streamOptions },
    'Streaming local file',
  )

  return {
    stream,
    mimeType: attachment.mimeType,
    size: fileStats.size,
    filename: filename || attachment.originalFilename,
    provider: 'local-disk',
  }
}
