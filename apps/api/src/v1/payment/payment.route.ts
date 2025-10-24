import { zValidator } from '@hono/zod-validator'
import { zCuidParam, zUpdatePayment } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getStorageProvider } from '../../lib/storage/get-storage-provider'
import { getAuthUserStrict } from '../middlewares/auth'
import { updatePayment } from './payment.service'

/**
 * Payment Router - handles payment-specific CRUD operations
 *
 * Mounted at: /v1/payment
 *
 * Routes:
 * - PUT /:id - Update a payment (admin only)
 *
 * Note: Task-scoped payment endpoints (list payments, set expected revenue)
 * are in the task router for better REST resource alignment.
 */
const router = new Hono()
  /**
   * PUT /v1/payment/:id
   *
   * Update a payment (admin only)
   *
   * Authorization: Admin only (403 for non-admins, including original collector)
   *
   * Request body (FormData):
   * - amount?: number - Corrected payment amount
   * - notes?: string - Updated notes
   * - editReason: string (REQUIRED) - Reason for edit (min 10 chars, for audit trail)
   * - invoiceFile?: File - Replacement invoice photo (optional, JPEG/PNG/HEIC only)
   *
   * Response:
   * - payment: Updated payment record with invoice attachment
   *
   * Note: All changes are logged to Activity with full audit trail
   */
  .put(
    '/:id',
    zValidator('param', zCuidParam),
    zValidator('form', zUpdatePayment, (result, c) => {
      if (!result.success) {
        const logger = getLogger('payment.route:updatePayment:validation')
        logger.error({ errors: result.error.issues }, 'Validation failed')
        return c.json(
          {
            error: 'Validation failed',
            details: result.error.issues,
          },
          400,
        )
      }
    }),
    async (c) => {
      const logger = getLogger('payment.route:updatePayment')
      const { id: paymentId } = c.req.valid('param')
      const formData = c.req.valid('form')
      const user = getAuthUserStrict(c)
      const storage = getStorageProvider()

      try {
        const updatedPayment = await updatePayment({
          paymentId,
          data: {
            amount: formData.amount,
            notes: formData.notes,
          },
          editReason: formData.editReason,
          invoiceFile: formData.invoiceFile,
          user,
          storage,
        })

        logger.info(
          { paymentId, userId: user.id, editReason: formData.editReason },
          'Payment updated successfully',
        )

        return c.json({ payment: updatedPayment }, 200)
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error
        }

        logger.error(
          { error, paymentId, userId: user.id },
          'Failed to update payment',
        )
        throw new HTTPException(500, {
          message: 'Không thể cập nhật thanh toán. Vui lòng thử lại.',
          cause: error,
        })
      }
    },
  )

export default router
