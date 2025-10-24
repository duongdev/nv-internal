import type { User } from '@clerk/backend'
import { HTTPException } from 'hono/http-exception'
import { verifyLocation } from '../../lib/geo'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import type { StorageProvider } from '../../lib/storage/storage.types'
import { createActivity } from '../activity/activity.service'
import { uploadTaskAttachments } from '../attachment/attachment.service'
import { createPaymentInTransaction } from '../payment/payment.service'

/**
 * Input data for task event (check-in or check-out)
 */
export interface TaskEventData {
  taskId: number
  userId: string
  latitude: number
  longitude: number
  files: File[]
  notes?: string
  // Payment collection fields (optional, only for check-out)
  paymentCollected?: boolean
  paymentAmount?: number
  paymentNotes?: string
  invoiceFile?: File
}

/**
 * Configuration object that defines behavior differences between event types
 * This abstraction eliminates code duplication between check-in and check-out
 */
interface TaskEventConfig {
  type: 'CHECK_IN' | 'CHECK_OUT'
  requiredStatus: 'READY' | 'IN_PROGRESS'
  targetStatus: 'IN_PROGRESS' | 'COMPLETED'
  timestampField: 'startedAt' | 'completedAt'
  activityAction: 'TASK_CHECKED_IN' | 'TASK_CHECKED_OUT'
  errorMessages: {
    invalidStatus: string
    notAssigned: string
    requiresCheckIn?: string
  }
}

/**
 * Generic task event handler - eliminates code duplication
 * Used by both check-in and check-out with different configurations
 *
 * Flow:
 * 1. Validate task exists, user is assigned, and task status is correct
 * 2. Validate files provided (at least 1 required)
 * 3. Verify GPS location and calculate distance
 * 4. Upload attachments using existing service (creates Attachment records with taskId)
 * 5. Create GeoLocation record for event location
 * 6. Create Activity record with GPS data and attachment summaries in payload
 * 7. Update task status and timestamp
 *
 * @param data - Event data (taskId, userId, GPS, files, notes)
 * @param config - Configuration object defining behavior
 * @param storage - Storage provider for file uploads
 * @returns Event details with attachments, updated task, and warnings
 */
export async function recordTaskEvent(
  data: TaskEventData,
  config: TaskEventConfig,
  storage: StorageProvider,
) {
  const logger = getLogger('task-event.service:recordTaskEvent')
  const prisma = getPrisma()

  logger.info(
    { taskId: data.taskId, userId: data.userId, type: config.type },
    'Recording task event',
  )

  // 1. Get task with validation
  const task = await prisma.task.findUnique({
    where: { id: data.taskId },
    include: {
      geoLocation: true,
    },
  })

  if (!task) {
    throw new HTTPException(404, { message: 'Không tìm thấy công việc' })
  }

  // 2. Authorization check
  if (!task.assigneeIds.includes(data.userId)) {
    throw new HTTPException(403, {
      message: config.errorMessages.notAssigned,
    })
  }

  // 3. Status validation (different for check-in vs check-out)
  if (task.status !== config.requiredStatus) {
    throw new HTTPException(400, {
      message: config.errorMessages.invalidStatus,
    })
  }

  // 4. For check-out, verify that user has checked in
  if (config.type === 'CHECK_OUT') {
    const checkInActivity = await prisma.activity.findFirst({
      where: {
        topic: `TASK_${data.taskId}`,
        action: 'TASK_CHECKED_IN',
        userId: data.userId,
      },
    })

    if (!checkInActivity) {
      throw new HTTPException(400, {
        message: config.errorMessages.requiresCheckIn || 'Chưa check-in',
      })
    }
  }

  // 5. GPS verification (only if task has location)
  let distance = 0
  let warnings: string[] = []

  if (task.geoLocation) {
    const verification = verifyLocation(
      { lat: task.geoLocation.lat, lng: task.geoLocation.lng },
      { lat: data.latitude, lng: data.longitude },
    )
    distance = verification.distance
    warnings = verification.warnings

    logger.info(
      {
        distance,
        withinRange: verification.withinRange,
        warnings,
      },
      'GPS verification completed',
    )
  }

  // 6. Upload attachments if provided
  // This creates Attachment records with taskId set, so they appear in task.attachments
  // It also creates TASK_ATTACHMENTS_UPLOADED activity
  let attachments: Awaited<ReturnType<typeof uploadTaskAttachments>> = []

  if (data.files && data.files.length > 0) {
    attachments = await uploadTaskAttachments({
      taskId: data.taskId,
      files: data.files,
      user: { id: data.userId } as User,
      storage,
    })

    logger.info(
      { count: attachments.length },
      'Uploaded attachments for task event',
    )
  } else {
    logger.info('No attachments provided for task event')
  }

  // 6b. Upload invoice file BEFORE transaction (optional, only for checkout with payment)
  let invoiceAttachment:
    | Awaited<ReturnType<typeof uploadTaskAttachments>>[0]
    | null = null

  if (
    config.type === 'CHECK_OUT' &&
    data.paymentCollected &&
    data.invoiceFile
  ) {
    logger.info(
      { filename: data.invoiceFile.name },
      'Uploading invoice file for payment',
    )

    const invoiceAttachments = await uploadTaskAttachments({
      taskId: data.taskId,
      files: [data.invoiceFile],
      user: { id: data.userId } as User,
      storage,
    })

    invoiceAttachment = invoiceAttachments[0]
    logger.info({ attachmentId: invoiceAttachment.id }, 'Invoice uploaded')
  }

  // 7. Create event in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create GeoLocation for event
    const geoLocation = await tx.geoLocation.create({
      data: {
        lat: data.latitude,
        lng: data.longitude,
      },
    })

    // Prepare attachment summary for activity payload
    const attachmentSummary = attachments.map((att) => ({
      id: att.id,
      mimeType: att.mimeType,
      originalFilename: att.originalFilename,
    }))

    // Create payment if collected (only for check-out)
    let payment = null
    if (
      config.type === 'CHECK_OUT' &&
      data.paymentCollected &&
      data.paymentAmount
    ) {
      logger.info(
        { taskId: data.taskId, amount: data.paymentAmount },
        'Creating payment in transaction',
      )

      payment = await createPaymentInTransaction({
        taskId: data.taskId,
        amount: data.paymentAmount,
        collectedBy: data.userId,
        invoiceAttachment,
        notes: data.paymentNotes,
        tx,
      })
    }

    // Create Activity with check-in/out data
    // This follows the same pattern as TASK_ATTACHMENTS_UPLOADED
    await createActivity(
      {
        action: config.activityAction,
        userId: data.userId,
        topic: { entityType: 'TASK', entityId: data.taskId },
        payload: {
          type: config.type,
          geoLocation: {
            id: geoLocation.id,
            lat: data.latitude,
            lng: data.longitude,
          },
          distanceFromTask: distance,
          attachments: attachmentSummary,
          notes: data.notes,
          warnings: warnings.length > 0 ? warnings : undefined,
          paymentCollected: !!payment,
        },
      },
      tx,
    )

    // Update task status and timestamp
    const updatedTask = await tx.task.update({
      where: { id: data.taskId },
      data: {
        status: config.targetStatus,
        [config.timestampField]: new Date(),
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

    return { geoLocation, task: updatedTask, payment }
  })

  logger.info(
    {
      taskId: data.taskId,
      type: config.type,
      status: result.task.status,
    },
    'Task event recorded successfully',
  )

  return {
    event: {
      type: config.type,
      geoLocation: result.geoLocation,
      distance,
      attachments,
    },
    task: result.task,
    payment: result.payment,
    warnings,
  }
}

/**
 * Check-in to a task
 *
 * Requirements:
 * - Task must exist
 * - User must be assigned to task
 * - Task status must be READY
 * - At least 1 file attachment required
 * - GPS coordinates required
 *
 * Effects:
 * - Uploads attachments (appear in task.attachments)
 * - Creates Activity with TASK_CHECKED_IN action
 * - Updates task status to IN_PROGRESS
 * - Sets task.startedAt timestamp
 *
 * @param data - Check-in data
 * @param storage - Storage provider
 * @returns Check-in event details with attachments and updated task
 */
export async function checkInToTask(
  data: TaskEventData,
  storage: StorageProvider,
) {
  return recordTaskEvent(
    data,
    {
      type: 'CHECK_IN',
      requiredStatus: 'READY',
      targetStatus: 'IN_PROGRESS',
      timestampField: 'startedAt',
      activityAction: 'TASK_CHECKED_IN',
      errorMessages: {
        invalidStatus: 'Công việc chưa sẵn sàng để check-in',
        notAssigned: 'Bạn không được phân công vào công việc này',
      },
    },
    storage,
  )
}

/**
 * Check-out from a task
 *
 * Requirements:
 * - Task must exist
 * - User must be assigned to task
 * - Task status must be IN_PROGRESS
 * - User must have checked in (TASK_CHECKED_IN activity exists)
 * - At least 1 file attachment required
 * - GPS coordinates required
 *
 * Effects:
 * - Uploads attachments (appear in task.attachments)
 * - Creates Activity with TASK_CHECKED_OUT action
 * - Updates task status to COMPLETED
 * - Sets task.completedAt timestamp
 *
 * @param data - Check-out data
 * @param storage - Storage provider
 * @returns Check-out event details with attachments and updated task
 */
export async function checkOutFromTask(
  data: TaskEventData,
  storage: StorageProvider,
) {
  return recordTaskEvent(
    data,
    {
      type: 'CHECK_OUT',
      requiredStatus: 'IN_PROGRESS',
      targetStatus: 'COMPLETED',
      timestampField: 'completedAt',
      activityAction: 'TASK_CHECKED_OUT',
      errorMessages: {
        invalidStatus: 'Công việc chưa bắt đầu hoặc đã hoàn thành',
        notAssigned: 'Bạn không được phân công vào công việc này',
        requiresCheckIn: 'Bạn phải check-in trước khi check-out',
      },
    },
    storage,
  )
}
