import type { ClerkClient } from '@clerk/backend'
import { TZDate } from '@date-fns/tz'
import type { EmployeeReportQuery } from '@nv-internal/validation'
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
