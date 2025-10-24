import { zValidator } from '@hono/zod-validator'
import { TaskStatus } from '@nv-internal/prisma-client'
import {
  z,
  zCreateTask,
  zNumericIdParam,
  zTaskExpectedRevenue,
  zTaskListQuery,
} from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { LocalDiskProvider } from '../../lib/storage/local-disk.provider'
import { VercelBlobProvider } from '../../lib/storage/vercel-blob.provider'
import { uploadTaskAttachments } from '../attachment/attachment.service'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  getTaskPayments,
  setTaskExpectedRevenue,
} from '../payment/payment.service'
import {
  canUserCreateTask,
  canUserListTasks,
  canUserUpdateTaskAssignees,
  canUserUpdateTaskStatus,
  canUserViewTask,
  createTask,
  getTaskById,
  getTaskList,
  updateTaskAssignees,
  updateTaskStatus,
} from './task.service'

const router = new Hono()
  // Get infinite task list
  .get('/', zValidator('query', zTaskListQuery), async (c) => {
    const {
      cursor,
      take = '10',
      status,
      assignedOnly = 'false',
    } = c.req.valid('query')
    const user = getAuthUserStrict(c)

    let assignedUserIds: string[] | undefined = undefined

    if (assignedOnly === 'true') {
      assignedUserIds = [user.id]
    } else if (!(await canUserListTasks({ user }))) {
      throw new HTTPException(403, {
        message: 'Bạn không có quyền xem danh sách công việc.',
        cause: 'Permission denied',
      })
    }

    const { tasks, nextCursor, hasNextPage } = await getTaskList({
      cursor,
      take: Number(take),
      assignedUserIds,
      status: status ? (Array.isArray(status) ? status : [status]) : undefined,
    })

    return c.json({
      tasks,
      nextCursor,
      hasNextPage,
    })
  })
  // Create new task
  .post('/', zValidator('json', zCreateTask), async (c) => {
    const logger = getLogger('task.route:create')
    const data = c.req.valid('json')
    const user = getAuthUserStrict(c)
    const canCreateTask = await canUserCreateTask({ user })

    if (!canCreateTask) {
      logger.warn({ user }, 'User is not allowed to create tasks')
      throw new HTTPException(403, {
        message: 'Bạn không có quyền tạo công việc.',
        cause: 'Permission denied',
      })
    }

    // Create the task
    try {
      const task = await createTask({ data, user })
      c.status(201)
      return c.json(task)
    } catch (error) {
      const logger = getLogger('task.route:create')
      logger.error({ error }, 'Failed to create task')
      throw new HTTPException(500, {
        message: 'Không thể tạo công việc.',
        cause: error,
      })
    }
  })
  // Get task by ID
  .get('/:id', zValidator('param', zNumericIdParam), async (c) => {
    const { id: taskId } = c.req.valid('param')
    const user = getAuthUserStrict(c)
    const task = await getTaskById({ id: taskId })

    if (!task) {
      throw new HTTPException(404, {
        message: 'Không tìm thấy công việc.',
        cause: 'Task not found',
      })
    }

    if (!(await canUserViewTask({ user, task }))) {
      throw new HTTPException(403, {
        message: 'Bạn không có quyền xem công việc.',
        cause: 'Permission denied',
      })
    }

    return c.json(task)
  })
  /**
   * GET /v1/task/:id/payments
   *
   * Get all payments for a task with summary
   *
   * Authorization:
   * - Admin: Can view any task's payments
   * - Worker: Can only view payments for assigned tasks
   *
   * Response:
   * - payments: Array of payment records with invoice attachments
   * - summary: { expectedRevenue, totalCollected, hasPayment }
   */
  .get('/:id/payments', zValidator('param', zNumericIdParam), async (c) => {
    const logger = getLogger('task.route:getTaskPayments')
    const { id: taskId } = c.req.valid('param')
    const user = getAuthUserStrict(c)

    try {
      // Verify user can view this task
      const task = await getTaskById({ id: taskId })
      if (!task) {
        throw new HTTPException(404, {
          message: 'Không tìm thấy công việc',
          cause: 'TASK_NOT_FOUND',
        })
      }

      const canView = await canUserViewTask({ user, task })
      if (!canView) {
        throw new HTTPException(403, {
          message: 'Bạn không có quyền xem thanh toán của công việc này',
          cause: 'INSUFFICIENT_PERMISSIONS',
        })
      }

      const result = await getTaskPayments({ taskId })

      logger.info(
        { taskId, userId: user.id, paymentCount: result.payments.length },
        'Retrieved task payments',
      )

      return c.json(result, 200)
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      logger.error(
        { error, taskId, userId: user.id },
        'Failed to get task payments',
      )
      throw new HTTPException(500, {
        message: 'Không thể lấy thông tin thanh toán. Vui lòng thử lại.',
        cause: error,
      })
    }
  })
  /**
   * PUT /v1/task/:id/expected-revenue
   *
   * Set expected revenue for a task (admin only)
   *
   * Authorization: Admin only
   *
   * Request body:
   * - expectedRevenue: number | null - Expected payment amount (null = no payment expected)
   * - expectedCurrency?: string - Currency code (default: VND)
   *
   * Response:
   * - task: Updated task record with all relations
   */
  .put(
    '/:id/expected-revenue',
    zValidator('param', zNumericIdParam),
    zValidator('json', zTaskExpectedRevenue),
    async (c) => {
      const logger = getLogger('task.route:setTaskExpectedRevenue')
      const { id: taskId } = c.req.valid('param')
      const { expectedRevenue } = c.req.valid('json')
      const user = getAuthUserStrict(c)

      try {
        const updatedTask = await setTaskExpectedRevenue({
          taskId,
          expectedRevenue,
          user,
        })

        logger.info(
          { taskId, expectedRevenue, userId: user.id },
          'Expected revenue set successfully',
        )

        return c.json({ task: updatedTask }, 200)
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error
        }

        logger.error(
          { error, taskId, userId: user.id },
          'Failed to set expected revenue',
        )
        throw new HTTPException(500, {
          message: 'Không thể đặt doanh thu dự kiến. Vui lòng thử lại.',
          cause: error,
        })
      }
    },
  )
  // Update task assignees
  .put(
    '/:id/assignees',
    zValidator('param', zNumericIdParam),
    zValidator(
      'json',
      z.object({
        assigneeIds: z.array(z.string()),
      }),
    ),
    async (c) => {
      const { id: taskId } = c.req.valid('param')
      const { assigneeIds } = c.req.valid('json')
      const user = getAuthUserStrict(c)
      const logger = getLogger('task.route:updateAssignees')

      // Check permission
      if (!(await canUserUpdateTaskAssignees({ user }))) {
        logger.warn({ user }, 'User is not allowed to update task assignees')
        throw new HTTPException(403, {
          message: 'Bạn không có quyền cập nhật người được giao công việc.',
          cause: 'Permission denied',
        })
      }

      // Update the task assignees
      try {
        const updatedTask = await updateTaskAssignees({
          taskId,
          assigneeIds,
          user,
        })
        return c.json(updatedTask)
      } catch (error) {
        logger.error({ error }, 'Failed to update task assignees')
        throw new HTTPException(500, {
          message: 'Không thể cập nhật người được giao công việc.',
          cause: error,
        })
      }
    },
  )
  // Upload attachments
  .post('/:id/attachments', zValidator('param', zNumericIdParam), async (c) => {
    const { id: taskId } = c.req.valid('param')
    const user = getAuthUserStrict(c)
    const logger = getLogger('task.route:uploadAttachments')

    const form = await c.req.formData()
    const files = form
      .getAll('files')
      .filter((f): f is File => f instanceof File)

    try {
      // Select storage provider based on STORAGE_PROVIDER env var
      // Default to vercel-blob if not set
      const storageProvider = process.env.STORAGE_PROVIDER || 'vercel-blob'
      const storage =
        storageProvider === 'local'
          ? new LocalDiskProvider()
          : new VercelBlobProvider()

      const attachments = await uploadTaskAttachments({
        taskId,
        files,
        user,
        storage,
      })

      c.status(201)
      return c.json({ attachments })
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to upload attachments')
      const errMsg = (error as { message?: string } | null | undefined)?.message
      const rawStatus = (error as { status?: number } | null | undefined)
        ?.status
      const derivedStatus = errMsg === 'TASK_NOT_FOUND' ? 404 : rawStatus
      const status = (
        derivedStatus === 400 || derivedStatus === 403 || derivedStatus === 404
          ? derivedStatus
          : 500
      ) as 400 | 403 | 404 | 500

      // Use specific error message if available (e.g., file validation errors)
      let message: string
      if (status === 400 && errMsg) {
        message = errMsg
      } else if (status === 403) {
        message = 'Bạn không có quyền tải tệp lên công việc này.'
      } else if (status === 404) {
        message = 'Không tìm thấy công việc.'
      } else {
        message = 'Không thể tải tệp lên.'
      }

      throw new HTTPException(status, { message, cause: error })
    }
  })
  // Update task status
  .put(
    '/:id/status',
    zValidator('param', zNumericIdParam),
    zValidator(
      'json',
      z.object({
        status: z.enum(TaskStatus),
      }),
    ),
    async (c) => {
      const { id: taskId } = c.req.valid('param')
      const { status } = c.req.valid('json') as { status: TaskStatus }
      const user = getAuthUserStrict(c)
      const logger = getLogger('task.route:updateStatus')

      // Fetch the task first
      const task = await getTaskById({ id: taskId })
      if (!task) {
        throw new HTTPException(404, {
          message: 'Không tìm thấy công việc.',
          cause: 'Task not found',
        })
      }

      // Check permission with task and target status
      const canUpdate = await canUserUpdateTaskStatus({
        user,
        task,
        targetStatus: status,
      })
      if (!canUpdate) {
        logger.warn(
          { user, taskId, currentStatus: task.status, targetStatus: status },
          'User is not allowed to update task status',
        )

        // Check if user is assigned to provide more specific error message
        const isAssigned = task.assigneeIds.includes(user.id)
        if (!isAssigned) {
          throw new HTTPException(403, {
            message: 'Bạn không được phân công vào công việc này.',
            cause: 'Not assigned to task',
          })
        }

        // Invalid transition
        throw new HTTPException(403, {
          message: `Không thể chuyển trạng thái từ ${task.status} sang ${status}.`,
          cause: 'Invalid status transition',
        })
      }

      // Update the task status
      try {
        const updatedTask = await updateTaskStatus({ taskId, status, user })
        return c.json(updatedTask)
      } catch (error) {
        logger.error({ error }, 'Failed to update task status')
        throw new HTTPException(500, {
          message: 'Không thể cập nhật trạng thái công việc.',
          cause: error,
        })
      }
    },
  )

export default router
