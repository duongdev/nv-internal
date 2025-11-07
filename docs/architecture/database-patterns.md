# Database Patterns

**Last Updated**: 2025-11-07

Comprehensive guide to database design, optimization, and implementation patterns in the NV Internal project.

---

## Database Schema Overview

### Core Models

The NV Internal database uses PostgreSQL with Prisma ORM. Key models:

- **Task** - Core work item tracking
- **Customer** - Client information
- **GeoLocation** - Location data with GPS coordinates
- **Activity** - Unified event logging for all actions
- **Attachment** - File attachments for tasks
- **Payment** - Payment tracking and invoicing
- **User** - Managed by Clerk, referenced by ID

### Prisma Client Generation

Generated client location: `packages/prisma-client/generated/`

**Rebuild after schema changes**:
```bash
pnpm --filter @nv-internal/prisma-client build
```

---

## ID Patterns

### Prefixed IDs for Readability

All models use prefixed IDs for better debugging and logging:

| Model | Prefix | Example |
|-------|--------|---------|
| Customer | `cust_` | `cust_abc123xyz` |
| GeoLocation | `geo_` | `geo_def456uvw` |
| Activity | `act_` | `act_ghi789rst` |
| Payment | `pay_` | `pay_jkl012mno` |
| Task | (none) | Numeric ID |

**Implementation**:
```typescript
// In Prisma schema
model Customer {
  id String @id @default(cuid())
  // ... other fields
}

// In service layer
const customerId = `cust_${cuid()}`
```

**Benefits**:
- Easy to identify entity type in logs
- Prevents ID collisions across models
- Improves debugging experience
- Clear audit trails

---

## Task Status Flow

Tasks follow a defined lifecycle:

```
PREPARING → READY → IN_PROGRESS → ON_HOLD → COMPLETED
```

### Status Definitions

- **PREPARING**: Task created, not ready for assignment
- **READY**: Task ready to be assigned to workers
- **IN_PROGRESS**: Worker actively working on task
- **ON_HOLD**: Task temporarily paused
- **COMPLETED**: Task finished successfully

### Status Transitions

**Valid transitions**:
- PREPARING → READY
- READY → IN_PROGRESS
- IN_PROGRESS → ON_HOLD
- IN_PROGRESS → COMPLETED
- ON_HOLD → IN_PROGRESS

**Log all status changes** to Activity table:
```typescript
await prisma.activity.create({
  data: {
    action: 'TASK_STATUS_CHANGED',
    taskId: task.id,
    userId: user.id,
    payload: {
      from: oldStatus,
      to: newStatus,
    },
  },
})
```

---

## Activity-Based Event Logging

### Unified Event Log Pattern

The Activity model serves as a single source for all events:

```prisma
model Activity {
  id        String   @id @default(cuid())
  action    String   // Event type
  taskId    String?  // Optional task reference
  userId    String   // Actor
  payload   Json?    // Flexible event data
  createdAt DateTime @default(now())
}
```

### Common Actions

- `TASK_CREATED`
- `TASK_UPDATED`
- `TASK_STATUS_CHANGED`
- `TASK_CHECKED_IN`
- `TASK_CHECKED_OUT`
- `TASK_COMMENTED`
- `PAYMENT_CREATED`
- `PAYMENT_STATUS_CHANGED`

### Pattern Benefits

✅ **Zero new tables needed** - Reuse Activity for any feature that logs events
✅ **Automatic integration** - All events in one place
✅ **Built-in pagination** - Standard Prisma queries work
✅ **Flexible payload** - JSON field adapts to any event type

### Implementation Example: Task Comments

```typescript
// Create comment (no Comment table needed!)
await prisma.activity.create({
  data: {
    action: 'TASK_COMMENTED',
    taskId: task.id,
    userId: user.id,
    payload: {
      comment: 'This is a comment',
      attachmentUrls: ['url1', 'url2'],
    },
  },
})

// Query comments
const comments = await prisma.activity.findMany({
  where: {
    action: 'TASK_COMMENTED',
    taskId: task.id,
  },
  orderBy: { createdAt: 'desc' },
})
```

**See Pattern**: [Activity-Based Events](./patterns/activity-event.md)

---

## Database Optimization Patterns

### Index Strategies

#### GIN Indexes for Array Columns

Use for PostgreSQL array columns (e.g., `assigneeIds`):

```sql
CREATE INDEX "Task_assigneeIds_idx" USING GIN ("assigneeIds");
```

**Why**: Efficient querying with array operators like `hasSome`

**Example Query**:
```typescript
const tasks = await prisma.task.findMany({
  where: {
    assigneeIds: {
      hasSome: [userId],
    },
  },
})
```

#### Composite Indexes

Combine frequently queried columns:

```sql
CREATE INDEX "Task_status_completedAt_idx" ON "Task" (status, "completedAt");
```

**Why**: Optimizes queries filtering by multiple columns

**Example Query**:
```typescript
const completedTasks = await prisma.task.findMany({
  where: {
    status: 'COMPLETED',
    completedAt: {
      gte: startDate,
      lte: endDate,
    },
  },
})
```

#### Partial Indexes

Filter at index level for better performance:

```sql
CREATE INDEX "Activity_checkins_idx" ON "Activity" ("userId", "createdAt")
WHERE "action" = 'TASK_CHECKED_IN';
```

**Why**: Smaller index size, faster queries for specific action types

**Example Query**:
```typescript
const checkins = await prisma.activity.findMany({
  where: {
    action: 'TASK_CHECKED_IN',
    userId: user.id,
    createdAt: {
      gte: startDate,
    },
  },
})
```

#### Use CONCURRENTLY for Production

Avoid locking tables during index creation:

```sql
CREATE INDEX CONCURRENTLY "Task_searchableText_idx"
ON "Task" ("searchableText");
```

**Why**: Prevents downtime in production

---

### SearchableText Pattern

**Problem**: Complex multi-field OR queries with poor performance

**Solution**: Pre-computed searchable text field

#### Implementation

```typescript
// Build searchable text at write time
function buildSearchableText(task: Task): string {
  const parts = [
    task.id,
    task.title,
    task.description,
    task.customer?.name,
    task.customer?.phone,
    task.geoLocation?.address,
    task.geoLocation?.name,
  ].filter(Boolean)

  return parts
    .map(part => normalizeForSearch(part.trim().replace(/\s+/g, ' ')))
    .join(' ')
}

// Simple query at read time
const results = await prisma.task.findMany({
  where: {
    searchableText: {
      contains: normalizeForSearch(query),
      mode: 'insensitive',
    },
  },
})
```

#### Benefits

- **70% code reduction**: 140 lines → 50 lines
- **2-3x faster queries**: Single indexed field vs multiple JOINs
- **Perfect pagination**: No post-processing needed
- **Type safety**: Full Prisma support maintained
- Vietnamese accent-insensitive search built-in

**See Pattern**: [SearchableText](./patterns/searchable-text.md)

---

### Batch Query Pattern

**Problem**: N+1 queries for aggregate reports (100+ queries)

**Solution**: Query all data once, process in-memory

#### Implementation

```typescript
// ❌ BAD: N+1 queries
for (const user of users) {
  const tasks = await prisma.task.findMany({
    where: { assigneeIds: { has: user.id } },
  })
  const revenue = calculateRevenue(tasks)
}

// ✅ GOOD: Batch query
const allUsers = await prisma.user.findMany()
const allTasks = await prisma.task.findMany({
  where: {
    assigneeIds: { hasSome: allUsers.map(u => u.id) },
  },
})
const allPayments = await prisma.payment.findMany({
  where: {
    taskId: { in: allTasks.map(t => t.id) },
  },
})

// Process in-memory
for (const user of allUsers) {
  const userTasks = allTasks.filter(t => t.assigneeIds.includes(user.id))
  const userPayments = allPayments.filter(p =>
    userTasks.some(t => t.id === p.taskId)
  )
  const revenue = calculateRevenue(userPayments)
}
```

**Benefits**:
- Reduced from 100+ queries to 2-3
- Faster overall execution
- Less database load

**See Pattern**: [Batch Queries](./patterns/batch-queries.md)

---

## Transaction Patterns

### When to Use Transactions

Use Prisma transactions for multi-model operations:

✅ **Use transactions for**:
- Creating multiple related records
- Updating multiple models atomically
- State changes that must be consistent
- Financial operations (payments)

❌ **Don't use transactions for**:
- Single model operations
- Read-only queries
- Operations that can be eventual consistent

### Interactive Transactions (Recommended)

For Vercel serverless functions:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create payment
  const payment = await tx.payment.create({
    data: paymentData,
  })

  // Update task status
  const task = await tx.task.update({
    where: { id: taskId },
    data: { status: 'COMPLETED' },
  })

  // Log activity
  await tx.activity.create({
    data: {
      action: 'PAYMENT_CREATED',
      taskId: task.id,
      userId: user.id,
      payload: { paymentId: payment.id },
    },
  })

  return { payment, task }
})
```

**Why interactive transactions**:
- Work with Vercel serverless (no connection pooling issues)
- Can handle errors within transaction
- More flexible than batch transactions

**See Pattern**: [Payment Transactions](./patterns/payment-transactions.md)

---

## Migration Patterns

### Creating Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_searchable_text_field

# Apply migrations in production
npx prisma migrate deploy
```

### Migration Best Practices

1. **Always backup database** before applying migrations
2. **Test migrations** on staging environment first
3. **Use reversible migrations** when possible
4. **Create indexes CONCURRENTLY** in production
5. **Document breaking changes** in migration PR

### Schema Change Checklist

When changing Prisma schema:

- [ ] Update `schema.prisma`
- [ ] Create migration: `npx prisma migrate dev`
- [ ] Update Zod schemas in `@nv-internal/validation`
- [ ] Rebuild Prisma client: `pnpm --filter @nv-internal/prisma-client build`
- [ ] Update service layer functions
- [ ] Update tests
- [ ] Test migration on staging
- [ ] Document changes

---

## Query Optimization

### Pagination Best Practices

#### Cursor-Based Pagination (Recommended)

```typescript
const tasks = await prisma.task.findMany({
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
})

const nextCursor = tasks.length === 20 ? tasks[19].id : null
```

**Benefits**:
- Consistent results (no skipped/duplicate items)
- Efficient for large datasets
- Works well with real-time updates

#### Offset Pagination (Use Sparingly)

```typescript
const tasks = await prisma.task.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
})
```

**Limitations**:
- Inefficient for large offsets
- Can skip/duplicate items with concurrent updates
- Only use for small datasets or admin interfaces

### Select Only Needed Fields

```typescript
// ❌ BAD: Fetch all fields
const tasks = await prisma.task.findMany()

// ✅ GOOD: Select specific fields
const tasks = await prisma.task.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    createdAt: true,
  },
})
```

### Use Include Wisely

```typescript
// ❌ BAD: Deep nesting
const tasks = await prisma.task.findMany({
  include: {
    customer: {
      include: {
        tasks: {
          include: {
            attachments: true,
          },
        },
      },
    },
  },
})

// ✅ GOOD: Only include what's needed
const tasks = await prisma.task.findMany({
  include: {
    customer: {
      select: {
        id: true,
        name: true,
      },
    },
  },
})
```

---

## Vietnamese Text Handling

### Accent-Insensitive Search

Use the `normalizeForSearch` utility:

```typescript
import { normalizeForSearch } from '@/lib/vietnamese'

// Normalize both query and stored text
const normalizedQuery = normalizeForSearch(searchQuery)

const results = await prisma.task.findMany({
  where: {
    searchableText: {
      contains: normalizedQuery,
      mode: 'insensitive',
    },
  },
})
```

**Why**: Vietnamese users often type without diacritics for speed

**See Pattern**: [Vietnamese Search](./patterns/vietnamese-search.md)

---

## Defensive Programming

### Always Provide Fallbacks

```typescript
// ❌ BAD: Assumes data exists
const name = user.firstName + ' ' + user.lastName

// ✅ GOOD: Defensive with fallbacks
const name = (user?.firstName || '') + ' ' + (user?.lastName || '')
const email = user?.email || 'Unknown'
```

### Null-Safe Operations

```typescript
// ❌ BAD: Can crash with null
const phone = customer.phone.toLowerCase()

// ✅ GOOD: Null-safe
const phone = (customer.phone || '').toLowerCase()
```

---

## Related Patterns

- [Activity-Based Events](./patterns/activity-event.md)
- [SearchableText Pattern](./patterns/searchable-text.md)
- [Payment Transactions](./patterns/payment-transactions.md)
- [Batch Queries](./patterns/batch-queries.md)
- [Vietnamese Search](./patterns/vietnamese-search.md)

---

## Quick Reference

### Common Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Rebuild Prisma client package
pnpm --filter @nv-internal/prisma-client build

# Open Prisma Studio
npx prisma studio
```

### Testing Database Operations

All backend tests use mocks exclusively (NEVER real database):

```typescript
import { createMockPrismaClient, resetPrismaMock } from '@/test-utils'

beforeEach(() => {
  resetPrismaMock()
  const mockPrisma = createMockPrismaClient()
  mockPrisma.task.findMany.mockResolvedValue([...])
})
```

**See**: `apps/api/README.md#testing` for full testing patterns
