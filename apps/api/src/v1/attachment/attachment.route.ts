import { Readable } from 'node:stream'
import { zValidator } from '@hono/zod-validator'
import { z } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getAuthUserStrict } from '../middlewares/auth'
import { getAttachmentsByIds, streamLocalFile } from './attachment.service'

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
  // Stream file (no auth required, token-based security)
  .get(
    '/view/:token',
    zValidator('param', z.object({ token: z.string() })),
    async (c) => {
      const { token } = c.req.valid('param')
      const logger = getLogger('attachment.route:viewFile')

      try {
        const {
          stream: fileStream,
          mimeType,
          size,
          filename,
        } = await streamLocalFile({ token })

        // Convert Node.js stream to Web ReadableStream
        const webStream = Readable.toWeb(
          fileStream as Readable,
        ) as ReadableStream

        // Set headers and return the stream
        c.header('Content-Type', mimeType)
        c.header('Content-Length', size.toString())
        c.header('Content-Disposition', `inline; filename="${filename}"`)
        c.header('Cache-Control', 'private, max-age=3600')

        return c.body(webStream)
      } catch (error: unknown) {
        logger.error({ error }, 'Failed to stream file')
        const errMsg = (error as { message?: string } | null | undefined)
          ?.message
        const rawStatus = (error as { status?: number } | null | undefined)
          ?.status
        const status = (
          rawStatus === 403 || rawStatus === 404 ? rawStatus : 500
        ) as 403 | 404 | 500

        let message: string
        if (status === 403) {
          message = 'URL đã hết hạn hoặc không hợp lệ.'
        } else if (status === 404) {
          message = 'Không tìm thấy tệp.'
        } else {
          message = errMsg || 'Không thể tải tệp.'
        }

        throw new HTTPException(status, { message, cause: error })
      }
    },
  )

export default router
