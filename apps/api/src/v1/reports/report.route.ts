import {
  zEmployeeReportParam,
  zEmployeeReportQuery,
} from '@nv-internal/validation'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { zValidator } from '../../lib/z-validator'
import { getAuthUserStrict } from '../middlewares/auth'
import { isUserAdmin } from '../user/user.service'
import { getEmployeeReport } from './report.service'

const router = new Hono()

/**
 * GET /v1/reports/employee/:userId
 *
 * Get employee performance report for a dynamic date range
 *
 * Authorization:
 * - Admin only: Can view reports for any employee
 * - Workers cannot view reports (future enhancement: workers can view their own)
 *
 * Query Parameters:
 * - startDate (required): ISO 8601 date string (YYYY-MM-DD)
 * - endDate (required): ISO 8601 date string (YYYY-MM-DD)
 * - timezone (optional): IANA timezone identifier (default: Asia/Ho_Chi_Minh)
 *
 * Response:
 * - employee: { id, firstName, lastName, email, imageUrl }
 * - period: { startDate, endDate, timezone }
 * - metrics: { daysWorked, tasksCompleted, totalRevenue }
 * - tasks: [{ id, title, completedAt, revenue, revenueShare, workerCount }]
 *
 * Examples:
 * - GET /v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31
 * - GET /v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Bangkok
 */
router.get(
  '/employee/:userId',
  zValidator('param', zEmployeeReportParam),
  zValidator('query', zEmployeeReportQuery),
  async (c) => {
    const logger = getLogger('report.route:getEmployeeReport')
    const { userId } = c.req.valid('param')
    const query = c.req.valid('query')
    const user = getAuthUserStrict(c)

    try {
      // Authorization: Admin only for now
      // Future enhancement: Workers can view their own reports (user.id === userId)
      const userIsAdmin = await isUserAdmin({ user })
      if (!userIsAdmin) {
        logger.warn(
          { userId: user.id, requestedUserId: userId },
          'Non-admin user attempted to access employee report',
        )
        throw new HTTPException(403, {
          message: 'Chỉ admin mới có thể xem báo cáo nhân viên',
          cause: 'INSUFFICIENT_PERMISSIONS',
        })
      }

      const clerkClient = c.get('clerk')
      const report = await getEmployeeReport({
        userId,
        ...query,
        clerkClient,
      })

      logger.info(
        {
          requestedBy: user.id,
          targetUserId: userId,
          dateRange: `${query.startDate} to ${query.endDate}`,
          tasksCompleted: report.metrics.tasksCompleted,
        },
        'Employee report generated successfully',
      )

      return c.json(report, 200)
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      logger.error(
        { error, userId, query },
        'Failed to generate employee report',
      )
      throw new HTTPException(500, {
        message: 'Không thể tạo báo cáo. Vui lòng thử lại.',
        cause: error,
      })
    }
  },
)

export default router
