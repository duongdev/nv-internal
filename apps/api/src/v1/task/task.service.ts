import type { User } from '@clerk/backend'
import type { Prisma, Task, TaskStatus } from '@nv-internal/prisma-client'
import type {
  CreateTaskValues,
  TaskSearchFilterQuery,
} from '@nv-internal/validation'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'
import { normalizeForSearch } from '../../lib/text-utils'
import { createActivity } from '../activity/activity.service'
import { uploadTaskAttachments } from '../attachment/attachment.service'
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

/**
 * Build searchable text for a task
 *
 * Concatenates all searchable fields (id, title, description, customer, location)
 * and normalizes for Vietnamese accent-insensitive search.
 *
 * @param data - Task data with optional customer and geoLocation
 * @returns Normalized searchable text
 */
function buildSearchableText(data: {
  id?: number
  title?: string
  description?: string | null
  customer?: { name?: string | null; phone?: string | null } | null
  geoLocation?: { address?: string | null; name?: string | null } | null
}): string {
  const parts = [
    data.id?.toString(),
    data.title,
    data.description,
    data.customer?.name,
    data.customer?.phone,
    data.geoLocation?.address,
    data.geoLocation?.name,
  ].filter(Boolean) as string[]

  // Normalize for Vietnamese accent-insensitive search
  // and collapse multiple spaces into single space
  return normalizeForSearch(parts.join(' ')).replace(/\s+/g, ' ').trim()
}

/**
 * Refresh searchableText for a specific task
 *
 * Fetches the task with all related data and updates its searchableText field.
 * Useful when customer or location data changes.
 *
 * @param taskId - ID of the task to refresh
 * @param tx - Prisma transaction client
 */
async function _refreshTaskSearchableText(
  taskId: number,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const task = await tx.task.findUnique({
    where: { id: taskId },
    include: { customer: true, geoLocation: true },
  })

  if (!task) {
    return
  }

  await tx.task.update({
    where: { id: taskId },
    data: {
      searchableText: buildSearchableText({
        id: task.id,
        title: task.title,
        description: task.description,
        customer: task.customer,
        geoLocation: task.geoLocation,
      }),
    },
  })
}

export async function canUserCreateTask({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserListTasks({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export function isUserAssignedToTask({
  user,
  task,
}: {
  user: User
  task: { id: number; assigneeIds: string[] }
}) {
  return task.assigneeIds.includes(user.id)
}

export function canUserViewTask({
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

export function canUserUpdateTaskStatus({
  user,
  task,
  targetStatus,
}: {
  user: User
  task: Task
  targetStatus: TaskStatus
}): boolean {
  const isAdmin = isUserAdmin({ user })
  const isAssigned = isUserAssignedToTask({ user, task })

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

      // Build initial searchableText (without task ID since it's auto-generated)
      // We'll update it after creation to include the ID
      const initialSearchableText = buildSearchableText({
        title: data.title,
        description: data.description,
        customer,
        geoLocation: geoLocationId
          ? await tx.geoLocation.findUnique({ where: { id: geoLocationId } })
          : null,
      })

      const taskData = {
        title: data.title,
        description: data.description,
        customerId: customer.id,
        geoLocationId,
        expectedRevenue: data.expectedRevenue,
        expectedCurrency: 'VND' as const, // Default currency
        searchableText: initialSearchableText, // Required field
      }

      const createdTask = await tx.task.create({
        data: taskData,
        include: DEFAULT_TASK_INCLUDE,
      })

      // Now update searchableText to include the generated task ID
      const finalTask = await tx.task.update({
        where: { id: createdTask.id },
        data: {
          searchableText: buildSearchableText({
            id: createdTask.id,
            title: createdTask.title,
            description: createdTask.description,
            customer: createdTask.customer,
            geoLocation: createdTask.geoLocation,
          }),
        },
        include: DEFAULT_TASK_INCLUDE,
      })

      // Create activity log
      await createActivity(
        {
          action: 'TASK_CREATED',
          userId: user.id,
          topic: { entityType: 'TASK', entityId: finalTask.id },
          payload: {},
        },
        tx,
      )

      return finalTask
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

  const isAdmin = isUserAdmin({ user })

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

  // Search implementation using searchableText field
  // This provides Vietnamese accent-insensitive search across all relevant fields
  if (search && search.length > 0) {
    // Normalize search query: lowercase, remove accents, collapse whitespace
    const normalizedSearch = normalizeForSearch(
      search.trim().replace(/\s+/g, ' '),
    )

    // Defensive: Check for NOT NULL to handle existing records with NULL values
    // This is temporary until migration populates all records
    whereConditions.push({
      // biome-ignore lint/style/useNamingConvention: Prisma uses uppercase for logical operators
      AND: [
        { searchableText: { not: null } },
        {
          searchableText: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
      ],
    })
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

  logger.debug(
    {
      userId: user.id,
      filters,
      totalResults: tasksToReturn.length,
      hasNextPage,
    },
    'Search and filter completed',
  )

  return {
    tasks: tasksToReturn,
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

/**
 * Add a comment to a task with optional photo attachments
 *
 * Requirements:
 * - Task must exist
 * - User must be assigned to task OR be an admin
 * - Comment text is required (validated by Zod schema)
 * - Photo attachments are optional (0-5 files allowed)
 *
 * Effects:
 * - Creates Activity with TASK_COMMENTED action
 * - Payload contains comment text and attachment summaries (if provided)
 * - Uploads files using uploadTaskAttachments service
 * - Links attachments to task automatically
 *
 * @param taskId - ID of the task to comment on
 * @param user - The user adding the comment
 * @param comment - Comment text (1-5000 characters)
 * @param files - Optional photo attachments (0-5 files)
 * @param storage - Storage provider for file uploads
 * @returns Created activity record
 */
export async function addTaskComment({
  taskId,
  user,
  comment,
  files,
  storage,
}: {
  taskId: number
  user: User
  comment: string
  files?: File[]
  storage?: import('../../lib/storage/storage.types').StorageProvider
}) {
  const logger = getLogger('task.service:addTaskComment')
  const prisma = getPrisma()

  logger.trace(
    {
      taskId,
      userId: user.id,
      commentLength: comment.length,
      fileCount: files?.length || 0,
    },
    'Adding task comment',
  )

  // 1. Get task with assigneeIds to verify access
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assigneeIds: true },
  })

  if (!task) {
    throw new HTTPException(404, { message: 'Không tìm thấy công việc' })
  }

  // 2. Check user is assigned to task or is admin
  const isAssigned = isUserAssignedToTask({ user, task })
  const isAdmin = isUserAdmin({ user })

  if (!isAssigned && !isAdmin) {
    throw new HTTPException(403, {
      message: 'Bạn không có quyền bình luận vào công việc này',
    })
  }

  // 3. Upload attachments if files provided
  let attachmentSummaries: Array<{
    id: string
    mimeType: string
    originalFilename: string
  }> = []

  if (files && files.length > 0 && storage) {
    try {
      const uploadedAttachments = await uploadTaskAttachments({
        taskId,
        files,
        user,
        storage,
      })

      attachmentSummaries = uploadedAttachments.map((att) => ({
        id: att.id,
        mimeType: att.mimeType,
        originalFilename: att.originalFilename,
      }))

      logger.info(
        {
          taskId,
          userId: user.id,
          attachmentCount: attachmentSummaries.length,
        },
        'Uploaded comment attachments',
      )
    } catch (error) {
      logger.error(
        {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          taskId,
          userId: user.id,
        },
        'Error uploading comment attachments',
      )
      throw error
    }
  }

  // 4. Create activity using existing createActivity service
  try {
    const payload: {
      type: 'COMMENT'
      comment: string
      attachments?: Array<{
        id: string
        mimeType: string
        originalFilename: string
      }>
    } = {
      type: 'COMMENT',
      comment,
    }

    // Include attachment summaries if any were uploaded
    if (attachmentSummaries.length > 0) {
      payload.attachments = attachmentSummaries
    }

    const activity = await createActivity({
      action: 'TASK_COMMENTED',
      userId: user.id,
      topic: { entityType: 'TASK', entityId: taskId },
      payload,
    })

    logger.info(
      {
        taskId,
        userId: user.id,
        activityId: activity.id,
        hasAttachments: attachmentSummaries.length > 0,
      },
      'Task comment added successfully',
    )

    return activity
  } catch (error) {
    logger.error(
      { error, taskId, userId: user.id },
      'Error adding task comment',
    )
    throw error
  }
}
