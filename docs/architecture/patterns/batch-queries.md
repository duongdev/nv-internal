# Batch Query Pattern

## Overview

The batch query pattern optimizes database access for aggregate reports by replacing N+1 query problems with efficient batch queries. This pattern was established during the Employee Summary implementation to reduce database queries from 100+ to just 2-3.

## Problem: N+1 Queries

When fetching data for multiple entities (e.g., reports for 50 employees), the naive approach makes individual queries for each entity:

```typescript
// ❌ BAD: N+1 Query Pattern (100+ queries for 50 employees)
const employees = await getEmployees();
const reports = await Promise.all(
  employees.map(async (employee) => {
    const tasks = await prisma.task.findMany({
      where: { assigneeIds: { has: employee.id } }
    });
    const checkIns = await prisma.activity.findMany({
      where: { userId: employee.id, action: 'TASK_CHECKED_IN' }
    });
    return processEmployeeData(employee, tasks, checkIns);
  })
);
```

This causes:
- Database connection pool exhaustion
- Poor performance (2-3 seconds for 50 users)
- Serverless function timeouts
- High database load

## Solution: Batch Queries

Query all data once, then process in-memory:

```typescript
// ✅ GOOD: Batch Query Pattern (2-3 queries total)
export async function getEmployeesSummary({
  startDate,
  endDate,
  userIds
}) {
  // Batch Query 1: Get ALL tasks for ALL users
  const allTasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: startDate, lte: endDate },
      assigneeIds: { hasSome: userIds }, // PostgreSQL array operator
    },
    select: {
      id: true,
      expectedRevenue: true,
      assigneeIds: true,
    },
  });

  // Batch Query 2: Get ALL check-ins for ALL users
  const allCheckIns = await prisma.activity.findMany({
    where: {
      userId: { in: userIds },
      action: 'TASK_CHECKED_IN',
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      userId: true,
      createdAt: true,
    },
  });

  // Process in-memory (fast for <1000 records)
  const tasksByUser = groupByUser(allTasks);
  const checkInsByUser = groupByUser(allCheckIns);

  return userIds.map(userId => ({
    userId,
    tasks: tasksByUser.get(userId) || [],
    checkIns: checkInsByUser.get(userId) || [],
  }));
}
```

## Database Indexes

Support batch queries with proper indexes:

```sql
-- GIN index for array overlap queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_assigneeIds_idx"
ON "Task" USING GIN ("assigneeIds");

-- Composite index for status + date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_status_completedAt_idx"
ON "Task" (status, "completedAt")
WHERE status = 'COMPLETED';

-- Composite index for activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Activity_action_userId_createdAt_idx"
ON "Activity" (action, "userId", "createdAt")
WHERE action = 'TASK_CHECKED_IN';
```

## Performance Results

| Metric | N+1 Pattern | Batch Pattern | Improvement |
|--------|------------|---------------|-------------|
| Database Queries | 100+ | 2-3 | 50x fewer |
| Response Time (50 users) | 2-3s | <500ms | 4-6x faster |
| Connection Pool Usage | High risk | Safe | ✅ |
| Scalability | 50 users max | 200+ users | 4x better |

## When to Use

Use batch queries when:
- Fetching data for multiple entities (users, tasks, etc.)
- Building aggregate reports or summaries
- Response includes data from multiple related models
- Performance is critical

## Implementation Guidelines

1. **Query Once**: Fetch all data in 1-3 queries maximum
2. **Filter in Database**: Use WHERE clauses to limit data
3. **Process in Memory**: Group and calculate in JavaScript
4. **Use Array Operators**: PostgreSQL's `hasSome`, `hasAll` for arrays
5. **Add Indexes**: Support queries with appropriate indexes
6. **Monitor Performance**: Track query times and optimize

## Example: In-Memory Grouping

```typescript
function groupByUser<T extends { userId: string }>(
  items: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const userId = item.userId;
    if (!grouped.has(userId)) {
      grouped.set(userId, []);
    }
    grouped.get(userId)!.push(item);
  }

  return grouped;
}
```

## Anti-Patterns to Avoid

❌ **Don't**: Use Promise.all with individual queries
❌ **Don't**: Make queries inside loops
❌ **Don't**: Fetch more data than needed
❌ **Don't**: Skip database indexes

## Related Patterns

- [Database Optimization](../database-optimization.md)
- [Serverless Considerations](../serverless.md)
- [Performance Monitoring](../monitoring.md)

## References

- Implementation: `.claude/tasks/20251029-145000-employee-report-monthly-summary-enhancement.md`
- Service Code: `/apps/api/src/v1/reports/report.service.ts`