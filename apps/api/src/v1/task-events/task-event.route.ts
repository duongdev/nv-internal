import { z, zCheckInInput, zCheckoutWithPayment } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getStorageProvider } from '../../lib/storage/get-storage-provider'
import { zValidator } from '../../lib/z-validator'
import { getAuthUserStrict } from '../middlewares/auth'
import { checkInToTask, checkOutFromTask } from './task-event.service'

const router = new Hono()
  // Check-in to task
  .post(
    '/:id/check-in',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/) })),
    zValidator('form', zCheckInInput),
    async (c) => {
      const logger = getLogger('task-events.route:check-in')
      const taskId = parseInt(c.req.valid('param').id, 10)
      const formData = c.req.valid('form')
      const user = getAuthUserStrict(c)
      const storage = getStorageProvider()

      try {
        // Convert base64 attachments to File objects if provided
        let files = formData.files || []
        if (formData.attachments && !formData.files) {
          files = formData.attachments.map((att) => {
            const buffer = Buffer.from(att.data, 'base64')
            const blob = new Blob([buffer], { type: att.mimeType })
            return new File([blob], att.filename, { type: att.mimeType })
          })
        }

        const result = await checkInToTask(
          {
            taskId,
            userId: user.id,
            latitude: formData.latitude,
            longitude: formData.longitude,
            files,
            notes: formData.notes,
          },
          storage,
        )

        logger.info(
          { taskId, userId: user.id, warnings: result.warnings },
          'Check-in successful',
        )

        return c.json(
          {
            checkIn: result.event,
            task: result.task,
            warnings: result.warnings,
          },
          201,
        )
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error
        }

        logger.error({ error, taskId, userId: user.id }, 'Check-in failed')
        throw new HTTPException(500, {
          message: 'Không thể check-in. Vui lòng thử lại.',
          cause: error,
        })
      }
    },
  )
  // Check-out from task (with optional payment collection)
  .post(
    '/:id/check-out',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/) })),
    zValidator('form', zCheckoutWithPayment),
    async (c) => {
      const logger = getLogger('task-events.route:check-out')
      const taskId = parseInt(c.req.valid('param').id, 10)
      const formData = c.req.valid('form')
      const user = getAuthUserStrict(c)
      const storage = getStorageProvider()

      try {
        // Convert base64 attachments to File objects if provided
        let files = formData.files || []
        if (formData.attachments && !formData.files) {
          files = formData.attachments.map((att) => {
            const buffer = Buffer.from(att.data, 'base64')
            const blob = new Blob([buffer], { type: att.mimeType })
            return new File([blob], att.filename, { type: att.mimeType })
          })
        }

        const result = await checkOutFromTask(
          {
            taskId,
            userId: user.id,
            latitude: formData.latitude,
            longitude: formData.longitude,
            files,
            notes: formData.notes,
            // Payment fields (optional)
            paymentCollected: formData.paymentCollected,
            paymentAmount: formData.paymentAmount,
            paymentNotes: formData.paymentNotes,
            invoiceFile: formData.invoiceFile,
          },
          storage,
        )

        logger.info(
          {
            taskId,
            userId: user.id,
            warnings: result.warnings,
            paymentCollected: !!result.payment,
          },
          'Check-out successful',
        )

        return c.json(
          {
            checkOut: result.event,
            task: result.task,
            payment: result.payment,
            warnings: result.warnings,
          },
          201,
        )
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error
        }

        logger.error({ error, taskId, userId: user.id }, 'Check-out failed')
        throw new HTTPException(500, {
          message: 'Không thể check-out. Vui lòng thử lại.',
          cause: error,
        })
      }
    },
  )

export default router
