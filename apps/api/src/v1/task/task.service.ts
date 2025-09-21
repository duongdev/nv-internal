import type { User } from '@clerk/backend'
import type { CreateTaskValues } from '@nv-internal/validation'
import type { Prisma } from '../../../generated/prisma'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import { isUserAdmin } from '../user/user.service'

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

      const createdTask = await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          address: data.address,
          customerId: customer.id,
        },
        include: {
          customer: true,
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
}: {
  cursor?: string
  take?: number
}) {
  const prisma = getPrisma()

  const where: Prisma.TaskWhereInput = {
    // Add any necessary filters here
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: { customer: true },
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
    include: { customer: true },
  })

  return task
}

export async function updateTaskAssignees({
  taskId,
  assigneeIds,
}: {
  taskId: number
  assigneeIds: string[]
}) {
  const prisma = getPrisma()
  const logger = getLogger('task.service:updateTaskAssignees')

  logger.trace({ taskId, assigneeIds }, 'Updating task assignees')

  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeIds,
      },
      include: { customer: true },
    })

    logger.info({ updatedTask }, 'Task assignees updated successfully')

    return updatedTask
  } catch (error) {
    logger.error({ error }, 'Error updating task assignees')
    throw error
  }
}
