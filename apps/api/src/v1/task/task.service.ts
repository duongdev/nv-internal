import type { User } from '@clerk/backend'
import type { Prisma, Task, TaskStatus } from '@nv-internal/prisma-client'
import type {
  CreateTaskValues,
  TaskSearchFilterQuery,
} from '@nv-internal/validation'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import { normalizeForSearch } from '../../lib/text-utils'
import { createActivity } from '../activity/activity.service'
import { isUserAdmin } from '../user/user.service'

const DEFAULT_TASK_INCLUDE: Prisma.TaskInclude = {
  customer: true,
  geoLocation: true,
  attachments: {
    where: { deletedAt: null },
  },
  payments: {
    orderBy: { createdAt: 'desc' },
    take: 1, // Only latest payment for list view
  },
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
          expectedRevenue: data.expectedRevenue,
          expectedCurrency: 'VND', // Default currency
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

/**
 * Search and filter tasks with enhanced capabilities
 *
 * This function provides comprehensive search and filter functionality for tasks:
 * - Vietnamese accent-insensitive search across multiple fields
 * - Multiple filter criteria (status, assignee, customer, date ranges)
 * - Flexible sorting options
 * - Cursor-based pagination
 * - Role-based access control
 *
 * Access Control:
 * - Non-admins: Can ONLY see their assigned tasks (assignedOnly is forced to true)
 * - Admins: Can see all tasks by default, OR filter to their assigned tasks with assignedOnly=true
 *           This allows admins to use both admin module (all tasks) and worker module (assigned only)
 *
 * @param user - The authenticated user making the request
 * @param filters - Search and filter parameters
 * @returns Object with tasks array, pagination info, and metadata
 */
export async function searchAndFilterTasks(
  user: User,
  filters: TaskSearchFilterQuery,
) {
  const logger = getLogger('task.service:searchAndFilterTasks')
  const prisma = getPrisma()

  const {
    search,
    status,
    assigneeIds,
    assignedOnly,
    customerId,
    scheduledFrom,
    scheduledTo,
    createdFrom,
    createdTo,
    completedFrom,
    completedTo,
    cursor,
    take = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters

  const isAdmin = await isUserAdmin({ user })

  // Build WHERE clause
  const whereConditions: Prisma.TaskWhereInput[] = []

  // Access control: Non-admins can ONLY see their assigned tasks
  // Admins can see all tasks UNLESS assignedOnly is explicitly set to 'true'
  // This enables admins to use both admin module (all tasks) and worker module (assigned only)
  const shouldFilterByAssignment = !isAdmin || assignedOnly === 'true'

  if (shouldFilterByAssignment) {
    whereConditions.push({ assigneeIds: { has: user.id } })
  }

  // Status filter
  if (status && status.length > 0) {
    whereConditions.push({ status: { in: status } })
  }

  // Assignee filter (admin only, or user filtering their own tasks)
  if (assigneeIds && assigneeIds.length > 0) {
    if (isAdmin || assigneeIds.includes(user.id)) {
      whereConditions.push({ assigneeIds: { hasSome: assigneeIds } })
    } else {
      logger.warn(
        { userId: user.id, requestedIds: assigneeIds },
        'Non-admin user attempted to filter by other users',
      )
    }
  }

  // Customer filter
  if (customerId) {
    whereConditions.push({ customerId })
  }

  // Date range filters
  if (scheduledFrom || scheduledTo) {
    const scheduledAtFilter: Prisma.DateTimeNullableFilter = {}
    if (scheduledFrom) {
      scheduledAtFilter.gte = new Date(scheduledFrom)
    }
    if (scheduledTo) {
      scheduledAtFilter.lte = new Date(scheduledTo)
    }
    whereConditions.push({ scheduledAt: scheduledAtFilter })
  }

  if (createdFrom || createdTo) {
    const createdAtFilter: Prisma.DateTimeFilter = {}
    if (createdFrom) {
      createdAtFilter.gte = new Date(createdFrom)
    }
    if (createdTo) {
      createdAtFilter.lte = new Date(createdTo)
    }
    whereConditions.push({ createdAt: createdAtFilter })
  }

  if (completedFrom || completedTo) {
    const completedAtFilter: Prisma.DateTimeNullableFilter = {}
    if (completedFrom) {
      completedAtFilter.gte = new Date(completedFrom)
    }
    if (completedTo) {
      completedAtFilter.lte = new Date(completedTo)
    }
    whereConditions.push({ completedAt: completedAtFilter })
  }

  // Search implementation
  // For Vietnamese accent-insensitive search, we search using case-insensitive mode
  // and will do accent normalization in post-processing if needed
  if (search && search.length > 0) {
    const searchConditions: Prisma.TaskWhereInput[] = [
      // Search by task ID (convert to string for partial match)
      {
        id: {
          equals: Number.isNaN(Number.parseInt(search))
            ? undefined
            : Number.parseInt(search),
        },
      },
      // Search in title
      { title: { contains: search, mode: 'insensitive' } },
      // Search in description
      { description: { contains: search, mode: 'insensitive' } },
      // Search in customer name
      {
        customer: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
      // Search in customer phone
      {
        customer: {
          phone: { contains: search, mode: 'insensitive' },
        },
      },
      // Search in address
      {
        geoLocation: {
          address: { contains: search, mode: 'insensitive' },
        },
      },
      // Search in location name
      {
        geoLocation: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
    ]

    // biome-ignore lint/style/useNamingConvention: Prisma uses uppercase for logical operators
    whereConditions.push({ OR: searchConditions })
  }

  const where: Prisma.TaskWhereInput =
    // biome-ignore lint/style/useNamingConvention: Prisma uses uppercase for logical operators
    whereConditions.length > 0 ? { AND: whereConditions } : {}

  // Fetch tasks with pagination
  const tasks = await prisma.task.findMany({
    where,
    include: DEFAULT_TASK_INCLUDE,
    orderBy: { [sortBy]: sortOrder },
    take: take + 1, // Fetch one extra to determine if there's a next page
    ...(cursor ? { cursor: { id: Number.parseInt(cursor, 10) }, skip: 1 } : {}),
  })

  // Determine pagination info
  const hasNextPage = tasks.length > take
  const tasksToReturn = hasNextPage ? tasks.slice(0, -1) : tasks
  const nextCursor = hasNextPage
    ? tasksToReturn[tasksToReturn.length - 1].id.toString()
    : null

  // For Vietnamese accent-insensitive search, filter results post-query
  // This is necessary because PostgreSQL's case-insensitive search doesn't handle accents
  let filteredTasks = tasksToReturn
  if (search && search.length > 0) {
    const normalizedSearch = normalizeForSearch(search)

    filteredTasks = tasksToReturn.filter((task) => {
      // Check task ID
      if (task.id.toString().includes(search)) {
        return true
      }

      // Check title
      if (normalizeForSearch(task.title || '').includes(normalizedSearch)) {
        return true
      }

      // Check description
      if (
        normalizeForSearch(task.description || '').includes(normalizedSearch)
      ) {
        return true
      }

      // Check customer name
      if (
        task.customer?.name &&
        normalizeForSearch(task.customer.name).includes(normalizedSearch)
      ) {
        return true
      }

      // Check customer phone
      if (
        task.customer?.phone &&
        normalizeForSearch(task.customer.phone).includes(normalizedSearch)
      ) {
        return true
      }

      // Check address
      if (
        task.geoLocation?.address &&
        normalizeForSearch(task.geoLocation.address).includes(normalizedSearch)
      ) {
        return true
      }

      // Check location name
      if (
        task.geoLocation?.name &&
        normalizeForSearch(task.geoLocation.name).includes(normalizedSearch)
      ) {
        return true
      }

      return false
    })
  }

  logger.debug(
    {
      userId: user.id,
      filters,
      totalResults: filteredTasks.length,
      hasNextPage,
    },
    'Search and filter completed',
  )

  return {
    tasks: filteredTasks,
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
