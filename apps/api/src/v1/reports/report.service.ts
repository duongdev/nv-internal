import type { ClerkClient } from '@clerk/backend'
import { TZDate } from '@date-fns/tz'
import type {
  EmployeeReportQuery,
  EmployeesSummaryQuery,
} from '@nv-internal/validation'
import { format } from 'date-fns'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'

/**
 * Get employee performance report for a date range
 *
 * This service function generates a comprehensive report showing:
 * - Days worked (based on check-ins from Activity model)
 * - Tasks completed (status=COMPLETED, user in assigneeIds)
 * - Revenue earned (split equally among assignees)
 *
 * **Timezone Handling:**
 * Uses @date-fns/tz to ensure accurate date boundaries in the specified timezone.
 * Example: "2025-01-01" in Asia/Ho_Chi_Minh means 2025-01-01 00:00:00 ICT,
 * not UTC midnight. This ensures check-ins at 1 AM Vietnam time count as the correct day.
 *
 * **Check-in Data:**
 * Days worked is calculated from Activity records with action='TASK_CHECKED_IN'.
 * The check-in/checkout system (Phase 2) stores all check-in events as Activity records.
 *
 * @param userId - Clerk user ID
 * @param startDate - ISO 8601 date string (YYYY-MM-DD) - inclusive
 * @param endDate - ISO 8601 date string (YYYY-MM-DD) - inclusive
 * @param timezone - IANA timezone identifier (default: Asia/Ho_Chi_Minh)
 * @param clerkClient - Clerk client for user data
 * @returns Employee report with metrics and task details
 */
export async function getEmployeeReport({
  userId,
  startDate,
  endDate,
  timezone = 'Asia/Ho_Chi_Minh',
  clerkClient,
}: EmployeeReportQuery & {
  userId: string
  clerkClient: ClerkClient
}) {
  const logger = getLogger('report.service:getEmployeeReport')
  const prisma = getPrisma()

  logger.trace(
    { userId, startDate, endDate, timezone },
    'Generating employee report',
  )

  // Verify user exists in Clerk
  const employee = await clerkClient.users.getUser(userId)
  if (!employee) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy nhân viên',
      cause: 'USER_NOT_FOUND',
    })
  }

  // Convert date strings to timezone-aware boundaries
  // Using TZDate for accurate timezone handling
  // Start: YYYY-MM-DD 00:00:00.000 in specified timezone
  const startTz = TZDate.tz(timezone, `${startDate}T00:00:00.000`)
  // End: YYYY-MM-DD 23:59:59.999 in specified timezone
  const endTz = TZDate.tz(timezone, `${endDate}T23:59:59.999`)

  logger.trace(
    {
      startTz: startTz.toISOString(),
      endTz: endTz.toISOString(),
      timezone,
    },
    'Date boundaries in timezone',
  )

  // Calculate days worked from check-ins
  // Check-ins are stored as Activity records with action='TASK_CHECKED_IN'
  const checkIns = await prisma.activity.findMany({
    where: {
      userId,
      action: 'TASK_CHECKED_IN',
      createdAt: {
        gte: startTz,
        lte: endTz,
      },
    },
    select: { createdAt: true },
  })

  // Extract unique days in the specified timezone
  const uniqueDays = new Set(
    checkIns.map((checkIn) => {
      // Convert UTC timestamp to timezone-aware date
      const zonedDate = new TZDate(checkIn.createdAt, timezone)
      // Format as YYYY-MM-DD in the specified timezone
      return format(zonedDate, 'yyyy-MM-dd')
    }),
  )

  const daysWorked = uniqueDays.size
  logger.info(
    { userId, checkInCount: checkIns.length, daysWorked },
    'Calculated days worked from check-ins',
  )

  // Get completed tasks in date range
  const completedTasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
      assigneeIds: { has: userId },
      completedAt: {
        gte: startTz,
        lte: endTz,
      },
    },
    select: {
      id: true,
      title: true,
      completedAt: true,
      assigneeIds: true,
      expectedRevenue: true,
    },
    orderBy: { completedAt: 'desc' },
  })

  logger.info(
    { userId, tasksCompleted: completedTasks.length },
    'Retrieved completed tasks',
  )

  // Calculate revenue split for each task
  const tasksWithRevenue = completedTasks.map((task) => {
    const revenue = task.expectedRevenue ? Number(task.expectedRevenue) : 0
    const workerCount = task.assigneeIds.length
    const revenueShare = revenue / workerCount

    return {
      id: task.id,
      title: task.title,
      completedAt: task.completedAt?.toISOString() ?? null,
      revenue,
      revenueShare,
      workerCount,
    }
  })

  // Calculate total revenue
  const totalRevenue = tasksWithRevenue.reduce(
    (sum, task) => sum + task.revenueShare,
    0,
  )

  logger.info(
    {
      userId,
      daysWorked,
      tasksCompleted: completedTasks.length,
      totalRevenue,
    },
    'Employee report generated successfully',
  )

  return {
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.emailAddresses[0]?.emailAddress ?? null,
      imageUrl: employee.imageUrl,
    },
    period: {
      startDate,
      endDate,
      timezone,
    },
    metrics: {
      daysWorked,
      tasksCompleted: completedTasks.length,
      totalRevenue,
    },
    tasks: tasksWithRevenue,
  }
}

/**
 * Get employees summary report for a date range
 *
 * This service function generates a comprehensive summary showing:
 * - Total revenue per employee (split equally among assignees)
 * - Tasks completed per employee
 * - Days worked per employee (based on check-ins)
 * - Aggregate statistics across all employees
 *
 * **Performance Optimization:**
 * Uses batch queries to minimize database round trips:
 * 1. Fetch all active users from Clerk (1 API call)
 * 2. Fetch ALL tasks for ALL users in ONE query (1 DB query)
 * 3. Fetch ALL check-ins for ALL users in ONE query (1 DB query)
 * 4. Aggregate in-memory (fast)
 *
 * This approach avoids N+1 queries and scales efficiently for serverless environments.
 *
 * **Timezone Handling:**
 * Uses @date-fns/tz to ensure accurate date boundaries in the specified timezone.
 *
 * @param startDate - ISO 8601 date string (YYYY-MM-DD) - inclusive
 * @param endDate - ISO 8601 date string (YYYY-MM-DD) - inclusive
 * @param timezone - IANA timezone identifier (default: Asia/Ho_Chi_Minh)
 * @param sort - Sort field: 'revenue', 'tasks', or 'name' (default: 'revenue')
 * @param sortOrder - Sort order: 'asc' or 'desc' (default: 'desc')
 * @param clerkClient - Clerk client for user data
 * @returns Summary report with employee metrics and aggregates
 */
export async function getEmployeesSummary({
  startDate,
  endDate,
  timezone = 'Asia/Ho_Chi_Minh',
  sort = 'revenue',
  sortOrder = 'desc',
  clerkClient,
}: EmployeesSummaryQuery & {
  clerkClient: ClerkClient
}) {
  const logger = getLogger('report.service:getEmployeesSummary')
  const prisma = getPrisma()

  logger.trace(
    { startDate, endDate, timezone, sort, sortOrder },
    'Generating employees summary report',
  )

  try {
    // Step 1: Create timezone-aware date boundaries
    const startTz = TZDate.tz(timezone, `${startDate}T00:00:00.000`)
    const endTz = TZDate.tz(timezone, `${endDate}T23:59:59.999`)

    logger.trace(
      {
        startTz: startTz.toISOString(),
        endTz: endTz.toISOString(),
        timezone,
      },
      'Date boundaries in timezone',
    )

    // Step 2: Fetch all active users from Clerk
    const { data: allUsers, totalCount } = await clerkClient.users.getUserList({
      limit: 500, // Clerk max limit
    })

    // Filter out banned users
    const activeUsers = allUsers.filter((u) => !u.banned)
    const userIds = activeUsers.map((u) => u.id)

    logger.info(
      {
        totalUsers: totalCount,
        activeUsers: activeUsers.length,
        bannedUsers: allUsers.length - activeUsers.length,
      },
      'Fetched users from Clerk',
    )

    // Early return if no active users
    if (userIds.length === 0) {
      logger.info('No active users found, returning empty summary')
      return {
        period: { startDate, endDate, timezone },
        employees: [],
        summary: {
          totalEmployees: 0,
          activeEmployees: 0,
          totalRevenue: 0,
          totalTasks: 0,
        },
      }
    }

    // Step 3: BATCH QUERY - Fetch ALL tasks for ALL users in ONE query
    const allTasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startTz, lte: endTz },
        assigneeIds: { hasSome: userIds }, // PostgreSQL array overlap
      },
      select: {
        id: true,
        expectedRevenue: true,
        assigneeIds: true,
        completedAt: true,
      },
    })

    logger.info(
      { totalTasks: allTasks.length },
      'Fetched completed tasks in date range',
    )

    // Step 4: BATCH QUERY - Fetch ALL check-ins for ALL users in ONE query
    const allCheckIns = await prisma.activity.findMany({
      where: {
        userId: { in: userIds },
        action: 'TASK_CHECKED_IN',
        createdAt: { gte: startTz, lte: endTz },
      },
      select: {
        userId: true,
        createdAt: true,
      },
    })

    logger.info(
      { totalCheckIns: allCheckIns.length },
      'Fetched check-in activities in date range',
    )

    // Step 5: Group and aggregate in-memory (fast)
    const employeeMetrics = activeUsers.map((user) => {
      // Filter tasks for this user
      const userTasks = allTasks.filter((t) => t.assigneeIds.includes(user.id))

      // Calculate revenue (split for multi-assignee tasks)
      const totalRevenue = userTasks.reduce((sum, task) => {
        const revenue = task.expectedRevenue ? Number(task.expectedRevenue) : 0
        const share = revenue / task.assigneeIds.length
        return sum + share
      }, 0)

      // Calculate days worked (unique dates from check-ins)
      const userCheckIns = allCheckIns.filter((c) => c.userId === user.id)
      const uniqueDays = new Set(
        userCheckIns.map((c) => {
          const zonedDate = new TZDate(c.createdAt, timezone)
          return format(zonedDate, 'yyyy-MM-dd')
        }),
      )

      // Determine if employee has any activity
      const hasActivity = userTasks.length > 0 || uniqueDays.size > 0

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        metrics: {
          totalRevenue,
          tasksCompleted: userTasks.length,
          daysWorked: uniqueDays.size,
        },
        hasActivity,
      }
    })

    logger.trace(
      { employeeCount: employeeMetrics.length },
      'Aggregated metrics',
    )

    // Step 6: Sort results
    employeeMetrics.sort((a, b) => {
      let comparison = 0

      if (sort === 'revenue') {
        comparison = a.metrics.totalRevenue - b.metrics.totalRevenue
      } else if (sort === 'tasks') {
        comparison = a.metrics.tasksCompleted - b.metrics.tasksCompleted
      } else if (sort === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim()
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim()
        comparison = nameA.localeCompare(nameB)
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Step 7: Calculate summary statistics
    // Count employees who have activity (tasks completed or check-ins)
    const activeEmployees = employeeMetrics.filter(
      (e) => e.metrics.tasksCompleted > 0 || e.metrics.daysWorked > 0,
    ).length

    const summary = {
      totalEmployees: employeeMetrics.length,
      activeEmployees,
      totalRevenue: employeeMetrics.reduce(
        (sum, e) => sum + e.metrics.totalRevenue,
        0,
      ),
      totalTasks: allTasks.length, // Use actual task count (multi-assignee tasks counted once)
    }

    logger.info(
      {
        employeeCount: employeeMetrics.length,
        activeEmployees,
        dateRange: `${startDate} to ${endDate}`,
        tasksProcessed: allTasks.length,
        checkInsProcessed: allCheckIns.length,
        totalRevenue: summary.totalRevenue,
        totalTasks: summary.totalTasks,
      },
      'Summary generated successfully',
    )

    return {
      period: { startDate, endDate, timezone },
      employees: employeeMetrics,
      summary,
    }
  } catch (error) {
    logger.error({ error }, 'Failed to generate employee summary')

    if (error instanceof HTTPException) {
      throw error
    }

    throw new HTTPException(500, {
      message: 'Không thể tạo báo cáo tổng hợp. Vui lòng thử lại.',
      cause: error,
    })
  }
}
