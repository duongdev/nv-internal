# Admin Dashboard - Backend Implementation Plan

**Related**: [Main Plan](./06-admin-dashboard.md) | [Common Specs](./06-admin-dashboard-common.md) | [Frontend Plan](./06-admin-dashboard-frontend.md)

## Overview

Backend API implementation for the admin dashboard, providing aggregated statistics and real-time activity data through RESTful endpoints.

## Architecture

### Technology Stack
- **Framework**: Hono (lightweight, fast routing)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Clerk middleware (@hono/clerk-auth)
- **Validation**: Zod schemas from `@nv-internal/validation`
- **Testing**: Jest with ts-jest preset

### File Structure

```
apps/api/src/v1/dashboard/
├── route.ts                    # Hono route definitions
├── dashboard.service.ts        # Business logic and aggregations
├── dashboard.types.ts          # TypeScript types and interfaces
└── __tests__/
    ├── dashboard.test.ts       # Unit tests for service layer
    └── route.test.ts          # Integration tests for endpoints
```

## API Endpoints

### 1. Get Dashboard Statistics

**Endpoint**: `GET /v1/dashboard/stats`

**Authentication**: Required (Clerk)

**Authorization**: Admin role only

**Query Parameters**:
```typescript
{
  date?: string  // ISO date, defaults to today
}
```

**Response**:
```typescript
{
  overview: {
    tasksToday: number,        // Tasks created/scheduled for date
    activeWorkers: number,      // Unique assignees on active tasks
    tasksInProgress: number,    // Status = IN_PROGRESS
    overdueTasks: number        // Should be completed but aren't
  },
  taskDistribution: {
    PREPARING: {
      count: number,
      percentage: number
    },
    READY: {
      count: number,
      percentage: number
    },
    IN_PROGRESS: {
      count: number,
      percentage: number
    },
    ON_HOLD: {
      count: number,
      percentage: number
    },
    COMPLETED: {
      count: number,
      percentage: number
    }
  },
  workerStats: Array<{
    userId: string,
    userName: string,           // From Clerk
    assignedTasks: number,      // Total assigned
    completedToday: number,     // Completed on date
    inProgressTasks: number     // Currently working on
  }>
}
```

**Error Responses**:
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not admin)
- 500: Internal server error

### 2. Get Recent Activities

**Endpoint**: `GET /v1/dashboard/activities`

**Authentication**: Required (Clerk)

**Authorization**: Admin role only

**Query Parameters**:
```typescript
{
  limit?: number  // Default: 10, Max: 50
  offset?: number // Default: 0 (for pagination)
}
```

**Response**:
```typescript
{
  activities: Array<{
    id: string,
    type: string,
    userId: string,
    userName: string,          // From Clerk
    taskId: string,
    taskTitle?: string,        // From Task relation
    payload: Record<string, unknown>,
    createdAt: string          // ISO timestamp
  }>,
  total: number,              // Total count for pagination
  hasMore: boolean            // More items available
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not admin)
- 500: Internal server error

## Service Layer Implementation

### dashboard.service.ts

```typescript
import type { PrismaClient } from '@nv-internal/prisma-client'
import { startOfDay, endOfDay } from 'date-fns'

export interface DashboardStatsOptions {
  date?: Date
}

export async function getDashboardStats(
  prisma: PrismaClient,
  options: DashboardStatsOptions = {}
) {
  const date = options.date || new Date()
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  const now = new Date()

  // Parallel aggregation queries for performance
  const [
    tasksToday,
    tasksByStatus,
    activeWorkerIds,
    overdueTasks,
    workerAssignments
  ] = await Promise.all([
    // Tasks created/scheduled today
    prisma.task.count({
      where: {
        OR: [
          { createdAt: { gte: dayStart, lte: dayEnd } },
          { scheduledAt: { gte: dayStart, lte: dayEnd } }
        ]
      }
    }),

    // Task distribution by status
    prisma.task.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    }),

    // Active workers (unique assignees on non-completed tasks)
    prisma.task.findMany({
      where: {
        status: {
          notIn: ['COMPLETED']
        }
      },
      select: {
        assigneeIds: true
      }
    }),

    // Overdue tasks (should be completed but aren't)
    prisma.task.count({
      where: {
        status: { notIn: ['COMPLETED'] },
        scheduledAt: { lt: now }
      }
    }),

    // Worker assignments and completions
    prisma.task.groupBy({
      by: ['assigneeIds'],
      where: {
        assigneeIds: { isEmpty: false }
      },
      _count: {
        id: true
      }
    })
  ])

  // Process active workers (unique user IDs)
  const activeWorkers = new Set<string>()
  activeWorkerIds.forEach(task => {
    task.assigneeIds.forEach(id => activeWorkers.add(id))
  })

  // Process task distribution with percentages
  const totalTasks = tasksByStatus.reduce((sum, item) => sum + item._count.id, 0)
  const taskDistribution = tasksByStatus.reduce((acc, item) => {
    acc[item.status] = {
      count: item._count.id,
      percentage: totalTasks > 0 ? (item._count.id / totalTasks) * 100 : 0
    }
    return acc
  }, {} as Record<string, { count: number; percentage: number }>)

  // Ensure all statuses are present
  const allStatuses = ['PREPARING', 'READY', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']
  allStatuses.forEach(status => {
    if (!taskDistribution[status]) {
      taskDistribution[status] = { count: 0, percentage: 0 }
    }
  })

  // Get worker statistics
  const workerStats = await getWorkerStats(prisma, date)

  return {
    overview: {
      tasksToday,
      activeWorkers: activeWorkers.size,
      tasksInProgress: taskDistribution.IN_PROGRESS?.count || 0,
      overdueTasks
    },
    taskDistribution,
    workerStats
  }
}

async function getWorkerStats(prisma: PrismaClient, date: Date) {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  // Get all tasks with assignees
  const tasks = await prisma.task.findMany({
    where: {
      assigneeIds: { isEmpty: false }
    },
    select: {
      assigneeIds: true,
      status: true,
      completedAt: true
    }
  })

  // Aggregate by worker
  const workerMap = new Map<string, {
    assignedTasks: number,
    completedToday: number,
    inProgressTasks: number
  }>()

  tasks.forEach(task => {
    task.assigneeIds.forEach(userId => {
      const stats = workerMap.get(userId) || {
        assignedTasks: 0,
        completedToday: 0,
        inProgressTasks: 0
      }

      stats.assignedTasks++

      if (task.status === 'IN_PROGRESS') {
        stats.inProgressTasks++
      }

      if (
        task.completedAt &&
        task.completedAt >= dayStart &&
        task.completedAt <= dayEnd
      ) {
        stats.completedToday++
      }

      workerMap.set(userId, stats)
    })
  })

  // Convert to array with user IDs
  return Array.from(workerMap.entries()).map(([userId, stats]) => ({
    userId,
    userName: '', // Will be populated from Clerk in route handler
    ...stats
  }))
}

export async function getRecentActivities(
  prisma: PrismaClient,
  options: { limit?: number; offset?: number } = {}
) {
  const limit = Math.min(options.limit || 10, 50)
  const offset = options.offset || 0

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    }),
    prisma.activity.count()
  ])

  return {
    activities: activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      userId: activity.userId,
      userName: '', // Will be populated from Clerk in route handler
      taskId: activity.taskId,
      taskTitle: activity.task?.title,
      payload: activity.payload,
      createdAt: activity.createdAt.toISOString()
    })),
    total,
    hasMore: offset + limit < total
  }
}
```

### route.ts

```typescript
import { Hono } from 'hono'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getDashboardStats, getRecentActivities } from './dashboard.service'
import { isAdmin } from '@/lib/auth'

const dashboard = new Hono()

// Apply authentication middleware
dashboard.use('*', clerkMiddleware())

// Admin authorization middleware
dashboard.use('*', async (c, next) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const admin = await isAdmin(auth.userId)
  if (!admin) {
    return c.json({ error: 'Forbidden: Admin access required' }, 403)
  }

  await next()
})

// GET /v1/dashboard/stats
const statsQuerySchema = z.object({
  date: z.string().datetime().optional()
})

dashboard.get('/stats', zValidator('query', statsQuerySchema), async (c) => {
  const { date } = c.req.valid('query')

  try {
    const stats = await getDashboardStats(prisma, {
      date: date ? new Date(date) : undefined
    })

    // Enrich worker stats with user names from Clerk
    const auth = getAuth(c)
    const workerStatsWithNames = await Promise.all(
      stats.workerStats.map(async (worker) => {
        const user = await auth.clerkClient.users.getUser(worker.userId)
        return {
          ...worker,
          userName: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || 'Unknown'
        }
      })
    )

    return c.json({
      ...stats,
      workerStats: workerStatsWithNames
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500)
  }
})

// GET /v1/dashboard/activities
const activitiesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  offset: z.coerce.number().min(0).optional()
})

dashboard.get('/activities', zValidator('query', activitiesQuerySchema), async (c) => {
  const { limit, offset } = c.req.valid('query')

  try {
    const result = await getRecentActivities(prisma, { limit, offset })

    // Enrich activities with user names from Clerk
    const auth = getAuth(c)
    const activitiesWithNames = await Promise.all(
      result.activities.map(async (activity) => {
        const user = await auth.clerkClient.users.getUser(activity.userId)
        return {
          ...activity,
          userName: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || 'Unknown'
        }
      })
    )

    return c.json({
      ...result,
      activities: activitiesWithNames
    })
  } catch (error) {
    console.error('Dashboard activities error:', error)
    return c.json({ error: 'Failed to fetch recent activities' }, 500)
  }
})

export default dashboard
```

## Database Optimization

### Indexes Required

```prisma
// In schema.prisma

model Task {
  // Existing fields...

  @@index([status])
  @@index([createdAt])
  @@index([scheduledAt])
  @@index([completedAt])
  @@index([assigneeIds])
}

model Activity {
  // Existing fields...

  @@index([createdAt])
  @@index([taskId])
  @@index([userId])
}
```

### Migration

```bash
npx prisma migrate dev --name add_dashboard_indexes
```

## Testing Strategy

### Unit Tests (dashboard.test.ts)

```typescript
import { getDashboardStats, getRecentActivities } from '../dashboard.service'
import { prisma } from '@/lib/prisma'

describe('Dashboard Service', () => {
  describe('getDashboardStats', () => {
    it('returns correct task counts by status', async () => {
      // Test implementation
    })

    it('calculates overdue tasks correctly', async () => {
      // Test implementation
    })

    it('identifies active workers accurately', async () => {
      // Test implementation
    })

    it('calculates percentages correctly', async () => {
      // Test implementation
    })

    it('handles empty data gracefully', async () => {
      // Test implementation
    })

    it('filters tasks by date correctly', async () => {
      // Test implementation
    })
  })

  describe('getRecentActivities', () => {
    it('returns activities ordered by creation date', async () => {
      // Test implementation
    })

    it('respects limit parameter', async () => {
      // Test implementation
    })

    it('handles pagination with offset', async () => {
      // Test implementation
    })

    it('includes task information', async () => {
      // Test implementation
    })
  })
})
```

### Integration Tests (route.test.ts)

```typescript
import { testClient } from 'hono/testing'
import dashboard from '../route'

describe('Dashboard Routes', () => {
  describe('GET /stats', () => {
    it('returns 401 without authentication', async () => {
      // Test implementation
    })

    it('returns 403 for non-admin users', async () => {
      // Test implementation
    })

    it('returns dashboard statistics for admin', async () => {
      // Test implementation
    })

    it('accepts optional date parameter', async () => {
      // Test implementation
    })
  })

  describe('GET /activities', () => {
    it('returns recent activities for admin', async () => {
      // Test implementation
    })

    it('respects limit and offset parameters', async () => {
      // Test implementation
    })

    it('enriches activities with user names', async () => {
      // Test implementation
    })
  })
})
```

## Performance Considerations

### Query Optimization
- Use parallel Promise.all() for independent queries
- Implement database indexes on frequently queried fields
- Limit data fetching to necessary fields only

### Caching Strategy
- Cache dashboard stats for 5 minutes (client-side via TanStack Query)
- Invalidate cache on task/activity mutations
- Use stale-while-revalidate pattern

### Monitoring
- Log slow queries (> 500ms)
- Track API response times
- Monitor database connection pool usage

## Security Considerations

### Authentication
- All endpoints require Clerk authentication
- Token validation on every request

### Authorization
- Admin role check via `isAdmin()` helper
- Block non-admin access with 403 response

### Data Exposure
- Only return necessary user information
- Sanitize activity payloads (remove sensitive data)
- No raw Clerk tokens in responses

## Error Handling

### Strategy
- Try-catch blocks around all async operations
- Log errors with context for debugging
- Return user-friendly error messages
- Use appropriate HTTP status codes

### Error Responses
```typescript
{
  error: string,           // User-friendly message
  code?: string,          // Optional error code
  details?: unknown       // Optional additional context (dev only)
}
```

## Deployment Checklist

- [ ] Create database indexes via migration
- [ ] Write and pass all unit tests
- [ ] Write and pass all integration tests
- [ ] Test with production-like data volumes
- [ ] Verify admin role enforcement
- [ ] Test error scenarios
- [ ] Review and optimize queries
- [ ] Add monitoring and logging
- [ ] Update API documentation
- [ ] Deploy to staging for UAT
- [ ] Production deployment

## Related Documentation

- [Main Plan](./06-admin-dashboard.md)
- [Common Specifications](./06-admin-dashboard-common.md)
- [Frontend Plan](./06-admin-dashboard-frontend.md)
- [v1 Master Plan](./README.md)
