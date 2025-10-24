import type { User } from '@clerk/backend'
import type { Prisma } from '@nv-internal/prisma-client'
import { Decimal } from '@prisma/client/runtime/library'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import type { StorageProvider } from '../../lib/storage/storage.types'
import { createActivity } from '../activity/activity.service'
import { uploadTaskAttachments } from '../attachment/attachment.service'
import { isUserAdmin } from '../user/user.service'

/**
 * Get all payments for a task with summary
 *
 * This endpoint is used by both admin and workers to view payment history.
 * In v1, most tasks will have 0 or 1 payment, but the schema supports multiple for future use.
 *
 * @param taskId - Task ID
 * @returns Payment list with summary (expectedRevenue, totalCollected, hasPayment)
 */
export async function getTaskPayments({ taskId }: { taskId: number }) {
  const logger = getLogger('payment.service:getTaskPayments')
  const prisma = getPrisma()

  logger.trace({ taskId }, 'Getting task payments')

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      payments: {
        orderBy: { collectedAt: 'desc' },
        include: {
          invoiceAttachment: true,
        },
      },
    },
  })

  if (!task) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy công việc',
      cause: 'TASK_NOT_FOUND',
    })
  }

  // Calculate summary
  const totalCollected = task.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  )
  const expectedRevenue = task.expectedRevenue
    ? Number(task.expectedRevenue)
    : null

  logger.info(
    {
      taskId,
      paymentCount: task.payments.length,
      totalCollected,
      expectedRevenue,
    },
    'Retrieved task payments',
  )

  return {
    payments: task.payments,
    summary: {
      expectedRevenue,
      totalCollected,
      hasPayment: task.payments.length > 0,
    },
  }
}

/**
 * Update an existing payment (admin only)
 *
 * Requirements:
 * - User must be admin (403 for non-admins, including original collector)
 * - editReason is REQUIRED for audit trail (minimum 10 characters)
 * - At least one field must be edited (amount or notes)
 * - Full audit trail logged to Activity
 *
 * @param paymentId - Payment CUID
 * @param data - Fields to update (amount, notes)
 * @param editReason - Required reason for edit (audit trail)
 * @param invoiceFile - Optional replacement invoice file
 * @param user - Admin user making the edit
 * @param storage - Storage provider for invoice upload
 * @returns Updated payment record
 */
export async function updatePayment({
  paymentId,
  data,
  editReason,
  invoiceFile,
  user,
  storage,
}: {
  paymentId: string
  data: { amount?: number; notes?: string }
  editReason: string
  invoiceFile?: File
  user: User
  storage: StorageProvider
}) {
  const logger = getLogger('payment.service:updatePayment')
  const prisma = getPrisma()

  logger.trace({ paymentId, userId: user.id, data }, 'Updating payment')

  // Only admin can edit payments
  const userIsAdmin = await isUserAdmin({ user })
  if (!userIsAdmin) {
    throw new HTTPException(403, {
      message: 'Chỉ admin mới có thể chỉnh sửa thanh toán',
      cause: 'INSUFFICIENT_PERMISSIONS',
    })
  }

  // Get original payment for audit trail
  const originalPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      task: true,
      invoiceAttachment: true,
    },
  })

  if (!originalPayment) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy thông tin thanh toán',
      cause: 'PAYMENT_NOT_FOUND',
    })
  }

  // Upload new invoice if provided (OPTIONAL)
  let newInvoiceAttachment:
    | Awaited<ReturnType<typeof uploadTaskAttachments>>[0]
    | null = null

  if (invoiceFile) {
    logger.info(
      { paymentId, filename: invoiceFile.name },
      'Uploading replacement invoice',
    )

    const attachments = await uploadTaskAttachments({
      taskId: originalPayment.taskId,
      files: [invoiceFile],
      user,
      storage,
    })

    newInvoiceAttachment = attachments[0]
  }

  // Update payment with audit trail in transaction
  const updatedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        amount:
          data.amount !== undefined ? new Decimal(data.amount) : undefined,
        notes: data.notes,
        invoiceAttachmentId:
          newInvoiceAttachment?.id ?? originalPayment.invoiceAttachmentId,
      },
      include: {
        invoiceAttachment: true,
      },
    })

    // Log detailed audit activity with change history
    await createActivity(
      {
        action: 'PAYMENT_UPDATED',
        userId: user.id,
        topic: { entityType: 'TASK', entityId: originalPayment.taskId },
        payload: {
          paymentId: payment.id,
          editReason,
          changes: {
            amount:
              data.amount !== undefined
                ? {
                    old: Number(originalPayment.amount),
                    new: Number(payment.amount),
                  }
                : undefined,
            notes:
              data.notes !== undefined
                ? {
                    old: originalPayment.notes,
                    new: payment.notes,
                  }
                : undefined,
            invoiceReplaced: !!newInvoiceAttachment,
            newInvoiceAttachmentId: newInvoiceAttachment?.id,
          },
        },
      },
      tx,
    )

    return payment
  })

  logger.info(
    { paymentId, userId: user.id, editReason },
    'Payment updated successfully with audit trail',
  )

  return updatedPayment
}

/**
 * Set expected revenue for a task (admin only)
 *
 * This allows admins to set the expected payment amount for a task.
 * Null value means no payment expected.
 *
 * @param taskId - Task ID
 * @param expectedRevenue - Expected payment amount (null for no payment expected)
 * @param user - Admin user
 * @returns Updated task
 */
export async function setTaskExpectedRevenue({
  taskId,
  expectedRevenue,
  user,
}: {
  taskId: number
  expectedRevenue: number | null
  user: User
}) {
  const logger = getLogger('payment.service:setTaskExpectedRevenue')
  const prisma = getPrisma()

  logger.trace(
    { taskId, expectedRevenue, userId: user.id },
    'Setting expected revenue',
  )

  // Only admin can set expected revenue
  const userIsAdmin = await isUserAdmin({ user })
  if (!userIsAdmin) {
    throw new HTTPException(403, {
      message: 'Chỉ admin mới có thể đặt doanh thu dự kiến',
      cause: 'INSUFFICIENT_PERMISSIONS',
    })
  }

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy công việc',
      cause: 'TASK_NOT_FOUND',
    })
  }

  // Update task with expected revenue
  const updatedTask = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        expectedRevenue:
          expectedRevenue !== null ? new Decimal(expectedRevenue) : null,
      },
      include: {
        customer: true,
        geoLocation: true,
        attachments: {
          where: { deletedAt: null },
        },
        payments: true,
      },
    })

    // Log activity
    await createActivity(
      {
        action: 'TASK_EXPECTED_REVENUE_UPDATED',
        userId: user.id,
        topic: { entityType: 'TASK', entityId: taskId },
        payload: {
          oldExpectedRevenue: task.expectedRevenue
            ? Number(task.expectedRevenue)
            : null,
          newExpectedRevenue: expectedRevenue,
        },
      },
      tx,
    )

    return updated
  })

  logger.info(
    { taskId, expectedRevenue, userId: user.id },
    'Expected revenue set successfully',
  )

  return updatedTask
}

/**
 * Create payment during checkout (internal service function)
 *
 * This is called by the checkout service when a worker confirms payment collection.
 * It's not directly exposed as an API endpoint - payment creation only happens during checkout.
 *
 * NOTE: This function expects to be called within a transaction context.
 * File uploads should happen BEFORE calling this function to avoid serverless timeout.
 *
 * @param data - Payment data
 * @param invoiceAttachment - Already uploaded invoice attachment (optional)
 * @param tx - Prisma transaction client
 * @returns Created payment record
 */
export async function createPaymentInTransaction({
  taskId,
  amount,
  collectedBy,
  invoiceAttachment,
  notes,
  tx,
}: {
  taskId: number
  amount: number
  collectedBy: string
  invoiceAttachment?: { id: string } | null
  notes?: string
  tx: Prisma.TransactionClient
}) {
  const logger = getLogger('payment.service:createPaymentInTransaction')

  logger.trace(
    { taskId, amount, collectedBy, hasInvoice: !!invoiceAttachment },
    'Creating payment in transaction',
  )

  const payment = await tx.payment.create({
    data: {
      taskId,
      amount: new Decimal(amount),
      currency: 'VND',
      collectedBy,
      collectedAt: new Date(),
      invoiceAttachmentId: invoiceAttachment?.id ?? null,
      notes,
    },
    include: {
      invoiceAttachment: true,
    },
  })

  // Log payment collection activity
  await createActivity(
    {
      action: 'PAYMENT_COLLECTED',
      userId: collectedBy,
      topic: { entityType: 'TASK', entityId: taskId },
      payload: {
        paymentId: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        hasInvoice: !!invoiceAttachment,
        invoiceAttachmentId: invoiceAttachment?.id,
        notes: payment.notes,
      },
    },
    tx,
  )

  logger.info(
    { paymentId: payment.id, taskId, amount, hasInvoice: !!invoiceAttachment },
    'Payment created in transaction',
  )

  return payment
}
