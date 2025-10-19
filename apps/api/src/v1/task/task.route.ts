import { zValidator } from '@hono/zod-validator'
import { TaskStatus } from '@nv-internal/prisma-client'
import { z, zCreateTask, zTaskListQuery } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getAuthUserStrict } from '../middlewares/auth'
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
  .get(
    '/:id',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/) })),
    async (c) => {
      const taskId = parseInt(c.req.valid('param').id, 10)
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
    },
  )
  // Update task assignees
  .put(
    '/:id/assignees',
    zValidator('param', z.object({ id: z.string() })),
    zValidator(
      'json',
      z.object({
        assigneeIds: z.array(z.string()),
      }),
    ),
    async (c) => {
      const taskId = parseInt(c.req.valid('param').id, 10)
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
  // Update task status
  .put(
    '/:id/status',
    zValidator('param', z.object({ id: z.string() })),
    zValidator(
      'json',
      z.object({
        status: z.enum(TaskStatus),
      }),
    ),
    async (c) => {
      const taskId = parseInt(c.req.valid('param').id, 10)
      const { status } = c.req.valid('json') as { status: TaskStatus }
      const user = getAuthUserStrict(c)
      const logger = getLogger('task.route:updateStatus')

      // Check permission
      if (!(await canUserUpdateTaskStatus({ user }))) {
        logger.warn({ user }, 'User is not allowed to update task status')
        throw new HTTPException(403, {
          message: 'Bạn không có quyền cập nhật trạng thái công việc.',
          cause: 'Permission denied',
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
