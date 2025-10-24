import { Readable } from 'node:stream'
import { z } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { zValidator } from '../../lib/z-validator'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  getAttachmentsByIds,
  softDeleteAttachment,
  streamLocalFile,
} from './attachment.service'

const router = new Hono()
  // Get attachments by IDs with signed URLs (requires auth - handled by global middleware)
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        ids: z
          .string()
          .transform((val) => val.split(',').filter(Boolean))
          .pipe(z.array(z.string()).min(1).max(100)),
      }),
    ),
    async (c) => {
      const { ids } = c.req.valid('query')
      const user = getAuthUserStrict(c)
      const logger = getLogger('attachment.route:getAttachments')

      try {
        const attachments = await getAttachmentsByIds({ ids })
        logger.info(
          { userId: user.id, count: attachments.length },
          'Retrieved attachments',
        )
        return c.json({ attachments })
      } catch (error) {
        logger.error({ error }, 'Failed to get attachments')
        throw new HTTPException(500, {
          message: 'Không thể lấy thông tin tệp đính kèm.',
          cause: error,
        })
      }
    },
  )
  // Handle CORS preflight for /view/:token
  .options('/view/:token', (c) => {
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Range')
    c.header('Access-Control-Max-Age', '86400')
    return c.body(null, 204)
  })
  // Stream file (no auth required, token-based security)
  .get(
    '/view/:token',
    zValidator('param', z.object({ token: z.string() })),
    async (c) => {
      const { token } = c.req.valid('param')
      const logger = getLogger('attachment.route:viewFile')

      try {
        // Parse Range header for video streaming support
        const rangeHeader = c.req.header('Range')

        logger.info(
          { token: token.substring(0, 20), rangeHeader },
          'File request received',
        )

        // Parse range if provided
        let start: number | undefined
        let end: number | undefined
        if (rangeHeader) {
          const parts = rangeHeader.replace(/bytes=/, '').split('-')
          start = parseInt(parts[0], 10)
          end = parts[1] ? parseInt(parts[1], 10) : undefined
        }

        // Get file stream with optional range
        const result = await streamLocalFile({ token, start, end })
        const { stream, mimeType, size, filename, blobUrl, provider } = result

        // For files from Vercel Blob, redirect to the public CDN URL
        // This provides better performance, reduces API load, and enables
        // Range request support for progressive streaming (critical for videos)
        // EXCEPTION: PDFs need CORS headers for PDF.js in WebView, so proxy them
        const isPdf = mimeType === 'application/pdf'
        if (provider === 'vercel-blob' && blobUrl && !isPdf) {
          logger.info(
            { blobUrl, mimeType },
            'Redirecting to Vercel Blob CDN for direct access',
          )
          return c.redirect(blobUrl, 302)
        }

        // Convert Node.js stream to Web ReadableStream
        const webStream = Readable.toWeb(stream as Readable) as ReadableStream

        // Handle Range request for local files
        if (rangeHeader && start !== undefined) {
          const actualEnd = end !== undefined ? end : size - 1

          // Validate range
          if (start >= size || actualEnd >= size || start > actualEnd) {
            throw new HTTPException(416, {
              message: 'Requested range not satisfiable',
            })
          }

          const contentLength = actualEnd - start + 1

          // Set headers for range response
          c.status(206) // Partial Content
          c.header('Content-Type', mimeType)
          c.header('Content-Length', contentLength.toString())
          c.header('Content-Range', `bytes ${start}-${actualEnd}/${size}`)
          c.header('Accept-Ranges', 'bytes')
          c.header('Content-Disposition', `inline; filename="${filename}"`)
          c.header('Cache-Control', 'private, max-age=3600')
          // Add CORS headers for WebView PDF.js support
          c.header('Access-Control-Allow-Origin', '*')
          c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
          c.header('Access-Control-Allow-Headers', 'Range')

          logger.info(
            { start, end: actualEnd, contentLength, totalSize: size },
            'Streaming range',
          )

          return c.body(webStream)
        }

        // No range request - return full file
        c.header('Content-Type', mimeType)
        c.header('Content-Length', size.toString())
        c.header('Accept-Ranges', 'bytes')
        c.header('Content-Disposition', `inline; filename="${filename}"`)
        c.header('Cache-Control', 'private, max-age=3600')
        // Add CORS headers for WebView PDF.js support
        c.header('Access-Control-Allow-Origin', '*')
        c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        c.header('Access-Control-Allow-Headers', 'Range')

        logger.info({ totalSize: size }, 'Streaming full file')

        return c.body(webStream)
      } catch (error: unknown) {
        logger.error({ error }, 'Failed to stream file')
        const errMsg = (error as { message?: string } | null | undefined)
          ?.message
        const rawStatus = (error as { status?: number } | null | undefined)
          ?.status
        const status = (
          rawStatus === 403 || rawStatus === 404 || rawStatus === 416
            ? rawStatus
            : 500
        ) as 403 | 404 | 416 | 500

        let message: string
        if (status === 403) {
          message = 'URL đã hết hạn hoặc không hợp lệ.'
        } else if (status === 404) {
          message = 'Không tìm thấy tệp.'
        } else if (status === 416) {
          message = 'Phạm vi yêu cầu không hợp lệ.'
        } else {
          message = errMsg || 'Không thể tải tệp.'
        }

        throw new HTTPException(status, { message, cause: error })
      }
    },
  )
  // Delete attachment (soft delete)
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid('param')
      const user = getAuthUserStrict(c)
      const logger = getLogger('attachment.route:deleteAttachment')

      try {
        await softDeleteAttachment({ attachmentId: id, user })
        logger.info({ attachmentId: id, userId: user.id }, 'Deleted attachment')
        return c.json({ success: true })
      } catch (error: unknown) {
        logger.error({ error, attachmentId: id }, 'Failed to delete attachment')
        const errMsg = (error as { message?: string } | null | undefined)
          ?.message
        const rawStatus = (error as { status?: number } | null | undefined)
          ?.status
        const derivedStatus =
          errMsg === 'ATTACHMENT_NOT_FOUND' ? 404 : rawStatus
        const status = (
          derivedStatus === 403 || derivedStatus === 404 ? derivedStatus : 500
        ) as 403 | 404 | 500

        let message: string
        if (status === 403) {
          message = 'Bạn không có quyền xóa tệp đính kèm này.'
        } else if (status === 404) {
          message = 'Không tìm thấy tệp đính kèm.'
        } else {
          message = 'Không thể xóa tệp đính kèm.'
        }

        throw new HTTPException(status, { message, cause: error })
      }
    },
  )

export default router
