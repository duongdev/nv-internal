import type { User } from '@clerk/backend'
import type { CreateTaskValues } from '@nv-internal/validation'
import type { Prisma, TaskStatus } from '../../../generated/prisma'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
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

export async function canUserViewTask({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserUpdateTaskAssignees({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserUpdateTaskStatus({ user }: { user: User }) {
  return isUserAdmin({ user })
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
      await tx.activity.create({
        data: {
          action: 'TASK_CREATED',
          userId: user.id,
          topic: `TASK_${createdTask.id}`,
        },
      })

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
      await tx.activity.create({
        data: {
          action: 'TASK_ASSIGNEES_UPDATED',
          userId: user?.id || null,
          topic: `TASK_${task.id}`,
          payload: { newAssigneeIds: assigneeIds },
        },
      })

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
      await tx.activity.create({
        data: {
          action: 'TASK_STATUS_UPDATED',
          userId: user?.id || null,
          topic: `TASK_${task.id}`,
          payload: { newStatus: status },
        },
      })

      return task
    })

    logger.info({ updatedTask }, 'Task status updated successfully')
    return updatedTask
  } catch (error) {
    logger.error({ error }, 'Error updating task status')
    throw error
  }
}
