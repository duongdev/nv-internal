import type { User } from '@clerk/backend'
import type { Prisma, Task, TaskStatus } from '@nv-internal/prisma-client'
import type { CreateTaskValues } from '@nv-internal/validation'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import { createActivity } from '../activity/activity.service'
import { isUserAdmin } from '../user/user.service'

const DEFAULT_TASK_INCLUDE: Prisma.TaskInclude = {
  customer: true,
  geoLocation: true,
}

export async function canUserCreateTask({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserListTasks({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function isUserAssignedToTask({
  user,
  task,
}: {
  user: User
  task: { id: number; assigneeIds: string[] }
}) {
  return task.assigneeIds.includes(user.id)
}

export async function canUserViewTask({
  user,
  task,
}: {
  user: User
  task: { id: number; assigneeIds: string[] }
}) {
  return isUserAdmin({ user }) || isUserAssignedToTask({ user, task })
}

export async function canUserUpdateTaskAssignees({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserUpdateTaskStatus({
  user,
  task,
  targetStatus,
}: {
  user: User
  task: Task
  targetStatus: TaskStatus
}): Promise<boolean> {
  const isAdmin = await isUserAdmin({ user })
  const isAssigned = await isUserAssignedToTask({ user, task })

  // Admin permissions
  if (isAdmin) {
    // Admin can: PREPARING → READY, any status → ON_HOLD, ON_HOLD → any status
    if (task.status === 'PREPARING' && targetStatus === 'READY') {
      return true
    }
    if (targetStatus === 'ON_HOLD') {
      return true
    }
    if (task.status === 'ON_HOLD') {
      return true
    }
    // Admin can also do worker transitions if they're assigned
    if (isAssigned) {
      if (task.status === 'READY' && targetStatus === 'IN_PROGRESS') {
        return true
      }
      if (task.status === 'IN_PROGRESS' && targetStatus === 'COMPLETED') {
        return true
      }
    }
  }

  // Worker permissions (only if assigned)
  if (isAssigned && !isAdmin) {
    // Worker can: READY → IN_PROGRESS, IN_PROGRESS → COMPLETED
    if (task.status === 'READY' && targetStatus === 'IN_PROGRESS') {
      return true
    }
    if (task.status === 'IN_PROGRESS' && targetStatus === 'COMPLETED') {
      return true
    }
  }

  return false
}

export async function createTask({
  data,
  user,
}: {
  data: CreateTaskValues
  user: User
}) {
  const logger = getLogger('task.service:createTask')

  logger.trace({ data, user }, 'Creating task')

  try {
    const prisma = getPrisma()
    const task = await prisma.$transaction(async (tx) => {
      const hasCustomer = data.customerName || data.customerPhone

      let customer = hasCustomer
        ? await tx.customer.findFirst({
            where: {
              phone: data.customerPhone,
              name: data.customerName,
            },
          })
        : null

      if (!customer) {
        logger.trace({ data }, 'Creating new customer')
        customer = await tx.customer.create({
          data: {
            phone: data.customerPhone,
            name: data.customerName,
          },
        })
      }

      logger.trace({ customer }, 'Using existing customer')

      let geoLocationId: string | undefined = undefined
      if (
        data.geoLocation?.lat !== undefined &&
        data.geoLocation?.lng !== undefined
      ) {
        const geoLocation = await tx.geoLocation.create({
          data: {
            address: data.geoLocation.address,
            name: data.geoLocation.name,
            lat: data.geoLocation.lat,
            lng: data.geoLocation.lng,
          },
        })
        geoLocationId = geoLocation.id
      }

      const createdTask = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          customerId: customer.id,
          geoLocationId,
        },
        include: DEFAULT_TASK_INCLUDE,
      })

      // Create activity log
      await createActivity(
        {
          action: 'TASK_CREATED',
          userId: user.id,
          topic: { entityType: 'TASK', entityId: createdTask.id },
          payload: {},
        },
        tx,
      )

      return createdTask
    })

    logger.info({ task }, 'Task created successfully')

    return task
  } catch (error) {
    logger.error({ error }, 'Error creating task')
    throw error
  }
}

export async function getTaskList({
  cursor,
  take = 10,
  assignedUserIds,
  status,
}: {
  cursor?: string
  take?: number
  assignedUserIds?: string[]
  status?: TaskStatus[]
}) {
  const prisma = getPrisma()

  const where: Prisma.TaskWhereInput = {
    ...(assignedUserIds ? { assigneeIds: { hasSome: assignedUserIds } } : {}),
    ...(status ? { status: { in: status } } : {}),
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: DEFAULT_TASK_INCLUDE,
    ...(cursor ? { cursor: { id: parseInt(cursor, 10) }, skip: 1 } : {}),
  })

  const hasNextPage = tasks.length === take
  const nextCursor = hasNextPage
    ? tasks[tasks.length - 1].id.toString()
    : undefined

  return {
    tasks,
    nextCursor,
    hasNextPage,
  }
}

export async function getTaskById({ id }: { id: number }) {
  const prisma = getPrisma()

  const task = await prisma.task.findUnique({
    where: { id },
    include: DEFAULT_TASK_INCLUDE,
  })

  return task
}

export async function updateTaskAssignees({
  taskId,
  assigneeIds,
  user,
}: {
  taskId: number
  assigneeIds: string[]
  user: User | null
}) {
  const prisma = getPrisma()
  const logger = getLogger('task.service:updateTaskAssignees')

  logger.trace({ taskId, assigneeIds, user }, 'Updating task assignees')

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          assigneeIds,
        },
        include: DEFAULT_TASK_INCLUDE,
      })

      // Create activity log
      await createActivity(
        {
          action: 'TASK_ASSIGNEES_UPDATED',
          userId: user?.id || null,
          topic: { entityType: 'TASK', entityId: task.id },
          payload: { newAssigneeIds: assigneeIds },
        },
        tx,
      )

      return task
    })

    logger.info({ updatedTask }, 'Task assignees updated successfully')
    return updatedTask
  } catch (error) {
    logger.error({ error }, 'Error updating task assignees')
    throw error
  }
}

export async function updateTaskStatus({
  taskId,
  status,
  user,
}: {
  taskId: number
  status: TaskStatus
  user: User | null
}) {
  const prisma = getPrisma()
  const logger = getLogger('task.service:updateTaskStatus')

  logger.trace({ taskId, status, user }, 'Updating task status')

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          status,
        },
        include: DEFAULT_TASK_INCLUDE,
      })

      // Create activity log
      await createActivity(
        {
          action: 'TASK_STATUS_UPDATED',
          userId: user?.id || null,
          topic: { entityType: 'TASK', entityId: task.id },
          payload: { newStatus: status },
        },
        tx,
      )

      return task
    })

    logger.info({ updatedTask }, 'Task status updated successfully')
    return updatedTask
  } catch (error) {
    logger.error({ error }, 'Error updating task status')
    throw error
  }
}
