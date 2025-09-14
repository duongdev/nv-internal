import { zValidator } from '@hono/zod-validator'
import { zCreateTask, zTaskListQuery } from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getAuthUserStrict } from '../middlewares/auth'
import {
  canUserCreateTask,
  canUserListTasks,
  createTask,
  getTaskList,
} from './task.service'

const router = new Hono()
  // Get infinite task list
  .get('/', zValidator('query', zTaskListQuery), async (c) => {
    const { cursor, take } = c.req.valid('query')
    const user = getAuthUserStrict(c)

    if (!(await canUserListTasks({ user }))) {
      throw new HTTPException(403, {
        message: 'Bạn không có quyền xem danh sách tác vụ.',
        cause: 'Permission denied',
      })
    }

    const { tasks, nextCursor, hasNextPage } = await getTaskList({
      cursor,
      take,
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
        message: 'Bạn không có quyền tạo tác vụ.',
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
        message: 'Không thể tạo tác vụ.',
        cause: error,
      })
    }
  })

export default router
