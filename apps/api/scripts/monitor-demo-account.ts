/**
 * Demo Account Monitoring Script
 *
 * Checks the health and status of the Apple Review demo account.
 * Run this daily during the App Store review period to ensure everything is working.
 *
 * Features:
 * - Verifies Clerk account exists and is active
 * - Checks database records are present
 * - Validates tasks have correct statuses
 * - Monitors activity logs
 * - Checks payment records
 * - Reports on data freshness
 *
 * Usage:
 *   npx tsx scripts/monitor-demo-account.ts
 *   npx tsx scripts/monitor-demo-account.ts --detailed
 *   npx tsx scripts/monitor-demo-account.ts --json
 */

import { clerkClient } from '@clerk/backend'
import { getPrisma } from '../src/lib/prisma'
import { getLogger } from '../src/lib/log'

const logger = getLogger('monitor-demo-account')
const prisma = getPrisma()

const DEMO_EMAIL = 'applereview@namviet.app'

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
}

interface MonitoringReport {
  timestamp: Date
  overall: 'healthy' | 'warning' | 'error'
  checks: {
    clerkAccount: HealthCheckResult
    databaseTasks: HealthCheckResult
    activityLogs: HealthCheckResult
    paymentRecords: HealthCheckResult
    dataFreshness: HealthCheckResult
    customerLocations: HealthCheckResult
  }
  statistics: {
    totalTasks: number
    tasksByStatus: Record<string, number>
    totalActivities: number
    totalPayments: number
    totalCustomers: number
    totalLocations: number
    newestTaskDate: Date | null
    oldestTaskDate: Date | null
  }
  recommendations: string[]
}

/**
 * Check Clerk account status
 */
async function checkClerkAccount(): Promise<HealthCheckResult> {
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [DEMO_EMAIL],
    })

    if (users.data.length === 0) {
      return {
        status: 'error',
        message: '❌ Demo account not found in Clerk',
        details: { email: DEMO_EMAIL },
      }
    }

    const user = users.data[0]

    if (user.banned) {
      return {
        status: 'error',
        message: '❌ Demo account is BANNED',
        details: { userId: user.id, email: DEMO_EMAIL },
      }
    }

    const isDemo = user.publicMetadata?.isDemo === true
    if (!isDemo) {
      return {
        status: 'warning',
        message: '⚠️  Account missing demo metadata flag',
        details: { userId: user.id, metadata: user.publicMetadata },
      }
    }

    const hasWorkerRole =
      (user.publicMetadata?.roles as string[])?.includes('nv_internal_worker') ||
      false
    if (!hasWorkerRole) {
      return {
        status: 'warning',
        message: '⚠️  Account missing worker role',
        details: { userId: user.id, roles: user.publicMetadata?.roles },
      }
    }

    return {
      status: 'healthy',
      message: '✅ Clerk account active and properly configured',
      details: {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
    }
  } catch (error) {
    logger.error('Error checking Clerk account', error)
    return {
      status: 'error',
      message: `❌ Failed to check Clerk account: ${error.message}`,
    }
  }
}

/**
 * Check database tasks
 */
async function checkDatabaseTasks(userId: string): Promise<HealthCheckResult> {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeIds: { has: userId },
      },
      include: {
        customer: true,
        geoLocation: true,
      },
    })

    if (tasks.length === 0) {
      return {
        status: 'error',
        message: '❌ No tasks found for demo account',
        details: { userId },
      }
    }

    // Check for variety of statuses
    const statuses = new Set(tasks.map((t) => t.status))
    if (statuses.size < 3) {
      return {
        status: 'warning',
        message: `⚠️  Only ${statuses.size} task statuses found (need variety)`,
        details: { statuses: Array.from(statuses) },
      }
    }

    // Check for completed tasks
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')
    if (completedTasks.length === 0) {
      return {
        status: 'warning',
        message: '⚠️  No completed tasks found',
      }
    }

    // Check for current/upcoming tasks
    const now = new Date()
    const futureTasks = tasks.filter(
      (t) => t.scheduledAt && t.scheduledAt > now,
    )
    if (futureTasks.length === 0) {
      return {
        status: 'warning',
        message: '⚠️  No upcoming tasks (all tasks may be in the past)',
      }
    }

    return {
      status: 'healthy',
      message: `✅ ${tasks.length} tasks with variety of statuses`,
      details: {
        totalTasks: tasks.length,
        statuses: Array.from(statuses),
        completedTasks: completedTasks.length,
        futureTasks: futureTasks.length,
      },
    }
  } catch (error) {
    logger.error('Error checking database tasks', error)
    return {
      status: 'error',
      message: `❌ Failed to check tasks: ${error.message}`,
    }
  }
}

/**
 * Check activity logs
 */
async function checkActivityLogs(userId: string): Promise<HealthCheckResult> {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (activities.length === 0) {
      return {
        status: 'warning',
        message: '⚠️  No activity logs found',
      }
    }

    // Check for variety of actions
    const actions = new Set(activities.map((a) => a.action))
    const expectedActions = ['TASK_CREATED', 'TASK_CHECKED_IN', 'TASK_COMPLETED']
    const hasExpectedActions = expectedActions.some((action) =>
      actions.has(action),
    )

    if (!hasExpectedActions) {
      return {
        status: 'warning',
        message: '⚠️  Activity logs missing expected actions',
        details: { found: Array.from(actions), expected: expectedActions },
      }
    }

    return {
      status: 'healthy',
      message: `✅ ${activities.length} activity records`,
      details: {
        totalActivities: activities.length,
        uniqueActions: Array.from(actions),
        latestActivity: activities[0]?.createdAt,
      },
    }
  } catch (error) {
    logger.error('Error checking activity logs', error)
    return {
      status: 'error',
      message: `❌ Failed to check activities: ${error.message}`,
    }
  }
}

/**
 * Check payment records
 */
async function checkPaymentRecords(userId: string): Promise<HealthCheckResult> {
  try {
    const payments = await prisma.payment.findMany({
      where: { collectedBy: userId },
      include: { task: true },
    })

    if (payments.length === 0) {
      return {
        status: 'warning',
        message: '⚠️  No payment records found',
      }
    }

    // Check that payments match completed tasks
    const completedTasks = await prisma.task.count({
      where: {
        assigneeIds: { has: userId },
        status: 'COMPLETED',
      },
    })

    if (payments.length < completedTasks) {
      return {
        status: 'warning',
        message: `⚠️  ${completedTasks} completed tasks but only ${payments.length} payments`,
      }
    }

    return {
      status: 'healthy',
      message: `✅ ${payments.length} payment records`,
      details: {
        totalPayments: payments.length,
        totalAmount: payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        ),
        currency: payments[0]?.currency || 'VND',
      },
    }
  } catch (error) {
    logger.error('Error checking payment records', error)
    return {
      status: 'error',
      message: `❌ Failed to check payments: ${error.message}`,
    }
  }
}

/**
 * Check data freshness
 */
async function checkDataFreshness(userId: string): Promise<HealthCheckResult> {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentTasks = await prisma.task.count({
      where: {
        assigneeIds: { has: userId },
        OR: [
          { createdAt: { gte: thirtyDaysAgo } },
          { scheduledAt: { gte: now } },
        ],
      },
    })

    const tasks = await prisma.task.findMany({
      where: { assigneeIds: { has: userId } },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    if (tasks.length === 0) {
      return {
        status: 'error',
        message: '❌ No tasks found',
      }
    }

    const newestTask = tasks[0]
    const daysSinceCreated = Math.floor(
      (now.getTime() - newestTask.createdAt.getTime()) /
        (24 * 60 * 60 * 1000),
    )

    if (daysSinceCreated > 30) {
      return {
        status: 'warning',
        message: `⚠️  Newest task is ${daysSinceCreated} days old (consider refresh)`,
        details: { newestTaskDate: newestTask.createdAt },
      }
    }

    if (recentTasks === 0) {
      return {
        status: 'warning',
        message: '⚠️  No tasks with recent or upcoming dates',
      }
    }

    return {
      status: 'healthy',
      message: `✅ Data is fresh (${recentTasks} recent/upcoming tasks)`,
      details: {
        newestTaskDate: newestTask.createdAt,
        daysSinceCreated,
        recentTasks,
      },
    }
  } catch (error) {
    logger.error('Error checking data freshness', error)
    return {
      status: 'error',
      message: `❌ Failed to check data freshness: ${error.message}`,
    }
  }
}

/**
 * Check customers and locations
 */
async function checkCustomerLocations(): Promise<HealthCheckResult> {
  try {
    const customers = await prisma.customer.findMany({
      where: { id: { startsWith: 'cust_demo_' } },
    })

    const locations = await prisma.geoLocation.findMany({
      where: { id: { startsWith: 'geo_demo_' } },
    })

    if (customers.length === 0) {
      return {
        status: 'error',
        message: '❌ No demo customers found',
      }
    }

    if (locations.length === 0) {
      return {
        status: 'error',
        message: '❌ No demo locations found',
      }
    }

    return {
      status: 'healthy',
      message: `✅ ${customers.length} customers, ${locations.length} locations`,
      details: {
        customers: customers.length,
        locations: locations.length,
      },
    }
  } catch (error) {
    logger.error('Error checking customers and locations', error)
    return {
      status: 'error',
      message: `❌ Failed to check customers/locations: ${error.message}`,
    }
  }
}

/**
 * Generate recommendations based on check results
 */
function generateRecommendations(report: MonitoringReport): string[] {
  const recommendations: string[] = []

  // Check overall status
  if (report.overall === 'error') {
    recommendations.push(
      '🚨 CRITICAL: Fix errors immediately before Apple review',
    )
  }

  // Check Clerk account
  if (report.checks.clerkAccount.status === 'error') {
    recommendations.push(
      '🔧 Run: npx tsx scripts/setup-demo-account.ts',
    )
  }

  // Check tasks
  if (
    report.checks.databaseTasks.status === 'error' ||
    report.statistics.totalTasks < 5
  ) {
    recommendations.push(
      '🔧 Run: npx tsx scripts/setup-demo-account.ts --reset',
    )
  }

  // Check data freshness
  if (report.checks.dataFreshness.status === 'warning') {
    recommendations.push(
      '📅 Consider refreshing data: npx tsx scripts/setup-demo-account.ts --reset',
    )
  }

  // Check variety
  const statusCount = Object.keys(report.statistics.tasksByStatus).length
  if (statusCount < 3) {
    recommendations.push(
      '⚠️  Add more task variety (need at least 3 different statuses)',
    )
  }

  // Check payments
  if (report.checks.paymentRecords.status === 'warning') {
    recommendations.push(
      '💰 Ensure all completed tasks have payment records',
    )
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Demo account is healthy and ready for review!')
  }

  return recommendations
}

/**
 * Main monitoring function
 */
async function monitorDemoAccount() {
  const isDetailed = process.argv.includes('--detailed')
  const isJson = process.argv.includes('--json')

  if (!isJson) {
    console.log('═══════════════════════════════════════════════════════')
    console.log('  DEMO ACCOUNT HEALTH CHECK')
    console.log('═══════════════════════════════════════════════════════')
    console.log()
  }

  try {
    // Run all checks
    const clerkCheck = await checkClerkAccount()

    if (clerkCheck.status === 'error') {
      const report: MonitoringReport = {
        timestamp: new Date(),
        overall: 'error',
        checks: {
          clerkAccount: clerkCheck,
          databaseTasks: {
            status: 'error',
            message: 'Skipped (Clerk account error)',
          },
          activityLogs: {
            status: 'error',
            message: 'Skipped (Clerk account error)',
          },
          paymentRecords: {
            status: 'error',
            message: 'Skipped (Clerk account error)',
          },
          dataFreshness: {
            status: 'error',
            message: 'Skipped (Clerk account error)',
          },
          customerLocations: {
            status: 'error',
            message: 'Skipped (Clerk account error)',
          },
        },
        statistics: {
          totalTasks: 0,
          tasksByStatus: {},
          totalActivities: 0,
          totalPayments: 0,
          totalCustomers: 0,
          totalLocations: 0,
          newestTaskDate: null,
          oldestTaskDate: null,
        },
        recommendations: generateRecommendations({} as any),
      }

      if (isJson) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        console.log(clerkCheck.message)
        console.log('\n🚨 Cannot proceed without Clerk account')
      }

      process.exit(1)
    }

    const userId = clerkCheck.details?.userId

    // Run remaining checks
    const [
      tasksCheck,
      activityCheck,
      paymentCheck,
      freshnessCheck,
      customerLocationCheck,
    ] = await Promise.all([
      checkDatabaseTasks(userId),
      checkActivityLogs(userId),
      checkPaymentRecords(userId),
      checkDataFreshness(userId),
      checkCustomerLocations(),
    ])

    // Gather statistics
    const tasks = await prisma.task.findMany({
      where: { assigneeIds: { has: userId } },
    })

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const activities = await prisma.activity.count({
      where: { userId },
    })

    const payments = await prisma.payment.count({
      where: { collectedBy: userId },
    })

    const customers = await prisma.customer.count({
      where: { id: { startsWith: 'cust_demo_' } },
    })

    const locations = await prisma.geoLocation.count({
      where: { id: { startsWith: 'geo_demo_' } },
    })

    const sortedTasks = tasks.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    // Build report
    const report: MonitoringReport = {
      timestamp: new Date(),
      overall: 'healthy',
      checks: {
        clerkAccount: clerkCheck,
        databaseTasks: tasksCheck,
        activityLogs: activityCheck,
        paymentRecords: paymentCheck,
        dataFreshness: freshnessCheck,
        customerLocations: customerLocationCheck,
      },
      statistics: {
        totalTasks: tasks.length,
        tasksByStatus,
        totalActivities: activities,
        totalPayments: payments,
        totalCustomers: customers,
        totalLocations: locations,
        newestTaskDate: sortedTasks[0]?.createdAt || null,
        oldestTaskDate: sortedTasks[sortedTasks.length - 1]?.createdAt || null,
      },
      recommendations: [],
    }

    // Determine overall status
    const hasError = Object.values(report.checks).some(
      (c) => c.status === 'error',
    )
    const hasWarning = Object.values(report.checks).some(
      (c) => c.status === 'warning',
    )
    report.overall = hasError ? 'error' : hasWarning ? 'warning' : 'healthy'

    // Generate recommendations
    report.recommendations = generateRecommendations(report)

    // Output
    if (isJson) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      // Console output
      console.log('📊 CHECKS:')
      console.log(`   ${clerkCheck.message}`)
      console.log(`   ${tasksCheck.message}`)
      console.log(`   ${activityCheck.message}`)
      console.log(`   ${paymentCheck.message}`)
      console.log(`   ${freshnessCheck.message}`)
      console.log(`   ${customerLocationCheck.message}`)
      console.log()

      console.log('📈 STATISTICS:')
      console.log(`   Total Tasks: ${report.statistics.totalTasks}`)
      console.log(`   By Status:`)
      Object.entries(report.statistics.tasksByStatus).forEach(
        ([status, count]) => {
          console.log(`     - ${status}: ${count}`)
        },
      )
      console.log(`   Activities: ${report.statistics.totalActivities}`)
      console.log(`   Payments: ${report.statistics.totalPayments}`)
      console.log(`   Customers: ${report.statistics.totalCustomers}`)
      console.log(`   Locations: ${report.statistics.totalLocations}`)
      console.log()

      if (isDetailed) {
        console.log('🔍 DETAILED INFO:')
        console.log('   Clerk Account:', clerkCheck.details)
        console.log('   Tasks:', tasksCheck.details)
        console.log('   Activities:', activityCheck.details)
        console.log('   Payments:', paymentCheck.details)
        console.log('   Freshness:', freshnessCheck.details)
        console.log()
      }

      console.log('💡 RECOMMENDATIONS:')
      report.recommendations.forEach((rec) => {
        console.log(`   ${rec}`)
      })
      console.log()

      console.log('═══════════════════════════════════════════════════════')
      const statusEmoji =
        report.overall === 'healthy'
          ? '✅'
          : report.overall === 'warning'
            ? '⚠️'
            : '❌'
      console.log(
        `  ${statusEmoji} OVERALL STATUS: ${report.overall.toUpperCase()}`,
      )
      console.log('═══════════════════════════════════════════════════════')
      console.log()
    }

    // Exit code
    process.exit(report.overall === 'error' ? 1 : 0)
  } catch (error) {
    logger.error('Fatal error during monitoring', error)
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run monitoring
monitorDemoAccount()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
