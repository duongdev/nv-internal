# Task Comments System - Backend Implementation

**Parent Plan:** [07-task-comments.md](./07-task-comments.md)
**Related:** [Common Specifications](./07-task-comments-common.md) | [Frontend Implementation](./07-task-comments-frontend.md)

---

## Overview

Backend implementation for task comments using the Activity-based pattern. Minimal new code required (~100 lines) due to 90% reuse of existing services.

### Implementation Strategy
- **Phase 1**: Text-only comments (2 hours, ~50 lines)
- **Phase 2**: Photo attachments (1 hour, ~50 lines)
- **Total**: 3 hours, ~100 lines of backend code

---

## Phase 1: Basic Text Comments

### Step 1: Validation Schema

**File:** `packages/validation/src/task-comment.zod.ts` (NEW)

```typescript
import { z } from 'zod'

// Request schema for comment creation
export const createTaskCommentSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters')
    .trim(),
})

// Response schema
export const taskCommentResponseSchema = z.object({
  success: z.boolean(),
  activity: z.object({
    id: z.string(),
    userId: z.string(),
    action: z.literal('TASK_COMMENTED'),
    payload: z.object({
      type: z.literal('COMMENT'),
      comment: z.string(),
      attachments: z.array(z.object({
        id: z.string(),
        mimeType: z.string(),
        originalFilename: z.string(),
      })).optional(),
    }),
    createdAt: z.date(),
  }),
})

// Activity payload type for TypeScript
export type CommentActivityPayload = {
  type: 'COMMENT'
  comment: string
  attachments?: Array<{
    id: string
    mimeType: string
    originalFilename: string
  }>
  mentionedUsers?: string[] // Future enhancement
}
```

### Step 2: API Endpoint

**File:** `apps/api/src/v1/tasks/route.ts` (EXTEND EXISTING)

```typescript
// Add to existing imports
import { createTaskCommentSchema } from '@nv-internal/validation'

// Add new endpoint to existing router
.post(
  '/:id/comment',
  clerkMiddleware(),
  zValidator('param', z.object({ id: z.coerce.number() })),
  zValidator('json', createTaskCommentSchema),
  async (c) => {
    const { id: taskId } = c.req.valid('param')
    const { comment } = c.req.valid('json')
    const auth = getAuth(c)

    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const activity = await addTaskComment(
        taskId,
        auth.userId,
        comment
      )

      return c.json({ success: true, activity })
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400)
      }
      return c.json({ error: 'Failed to add comment' }, 500)
    }
  }
)
```

### Step 3: Service Function

**File:** `apps/api/src/v1/tasks/task.service.ts` (EXTEND EXISTING)

```typescript
// Add to existing imports
import type { CommentActivityPayload } from '@nv-internal/validation'

// Add new function (reuses existing services)
export async function addTaskComment(
  taskId: number,
  userId: string,
  comment: string
): Promise<Activity> {
  const prisma = getPrisma()

  // Verify task exists and user has access
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assignedUsers: true },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  // Check if user has access (assigned to task or is admin)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const hasAccess =
    user?.role === 'ADMIN' ||
    task.assignedUsers.some(u => u.id === userId)

  if (!hasAccess) {
    throw new Error('Access denied')
  }

  // Create comment activity (reusing existing createActivity)
  const payload: CommentActivityPayload = {
    type: 'COMMENT',
    comment: comment.trim(),
  }

  return await createActivity({
    userId,
    topic: `TASK_${taskId}`,
    action: 'TASK_COMMENTED',
    payload,
  })
}
```

### Step 4: Unit Tests

**File:** `apps/api/src/v1/tasks/__tests__/task-comment.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { addTaskComment } from '../task.service'
import { getPrisma } from '@/lib/db'

describe('Task Comments', () => {
  let taskId: number
  let userId: string

  beforeEach(async () => {
    // Setup test data
    const prisma = getPrisma()
    const user = await prisma.user.create({
      data: { id: 'usr_test', email: 'test@test.com', role: 'EMPLOYEE' }
    })
    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        assignedUsers: { connect: { id: user.id } }
      }
    })
    userId = user.id
    taskId = task.id
  })

  it('should create comment activity', async () => {
    const activity = await addTaskComment(
      taskId,
      userId,
      'Test comment'
    )

    expect(activity.action).toBe('TASK_COMMENTED')
    expect(activity.payload).toMatchObject({
      type: 'COMMENT',
      comment: 'Test comment'
    })
  })

  it('should reject empty comments', async () => {
    await expect(
      addTaskComment(taskId, userId, '')
    ).rejects.toThrow('Comment cannot be empty')
  })

  it('should reject unauthorized users', async () => {
    const otherUserId = 'usr_other'
    await expect(
      addTaskComment(taskId, otherUserId, 'Comment')
    ).rejects.toThrow('Access denied')
  })
})
```

---

## Phase 2: Photo Attachments

### Step 1: Update Validation for Multipart

**File:** `packages/validation/src/task-comment.zod.ts` (UPDATE)

```typescript
// Add multipart schema
export const createTaskCommentMultipartSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters')
    .trim(),
  // Files are handled separately by multipart parser
})

// File validation
export const commentFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
})
```

### Step 2: Update Endpoint for Multipart

**File:** `apps/api/src/v1/tasks/route.ts` (UPDATE EXISTING ENDPOINT)

```typescript
// Replace the previous JSON endpoint with multipart
.post(
  '/:id/comment',
  clerkMiddleware(),
  zValidator('param', z.object({ id: z.coerce.number() })),
  async (c) => {
    const { id: taskId } = c.req.valid('param')
    const auth = getAuth(c)

    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse multipart form data
    const formData = await c.req.formData()
    const comment = formData.get('comment')?.toString()

    if (!comment || comment.trim().length === 0) {
      return c.json({ error: 'Comment is required' }, 400)
    }

    if (comment.length > 5000) {
      return c.json({ error: 'Comment too long (max 5000 characters)' }, 400)
    }

    // Get files (if any)
    const files: File[] = []
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`files[${i}]`) as File
      if (file && file.size > 0) {
        // Validate file
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          return c.json({ error: `Invalid file type: ${file.type}` }, 400)
        }
        if (file.size > 10 * 1024 * 1024) {
          return c.json({ error: `File too large: ${file.name}` }, 400)
        }
        files.push(file)
      }
    }

    try {
      const activity = await addTaskComment(
        taskId,
        auth.userId,
        comment,
        files // Pass files to service
      )

      return c.json({ success: true, activity })
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400)
      }
      return c.json({ error: 'Failed to add comment' }, 500)
    }
  }
)
```

### Step 3: Update Service for Attachments

**File:** `apps/api/src/v1/tasks/task.service.ts` (UPDATE EXISTING FUNCTION)

```typescript
// Update the function signature to accept files
export async function addTaskComment(
  taskId: number,
  userId: string,
  comment: string,
  files?: File[] // Add optional files parameter
): Promise<Activity> {
  const prisma = getPrisma()

  // ... existing validation code ...

  // Upload attachments if provided (reusing existing service)
  let attachments: Attachment[] = []
  if (files && files.length > 0) {
    attachments = await uploadTaskAttachments(
      taskId,
      files,
      userId
    )
  }

  // Create comment activity with attachments
  const payload: CommentActivityPayload = {
    type: 'COMMENT',
    comment: comment.trim(),
    attachments: attachments.length > 0
      ? attachments.map(att => ({
          id: att.id,
          mimeType: att.mimeType,
          originalFilename: att.originalFilename,
        }))
      : undefined,
  }

  return await createActivity({
    userId,
    topic: `TASK_${taskId}`,
    action: 'TASK_COMMENTED',
    payload,
  })
}
```

---

## Implementation Checklist

### Phase 1: Text Comments ⏳
- [ ] Create validation schema (`task-comment.zod.ts`)
- [ ] Add comment endpoint to task router
- [ ] Implement `addTaskComment` service function
- [ ] Add access control checks
- [ ] Write unit tests for text comments
- [ ] Test with Postman/Insomnia

### Phase 2: Photo Attachments ⏳
- [ ] Update validation for multipart
- [ ] Modify endpoint to handle FormData
- [ ] Add file validation (type, size)
- [ ] Integrate `uploadTaskAttachments` service
- [ ] Update service to include attachments in payload
- [ ] Test photo upload flow

### Testing ⏳
- [ ] Unit tests for validation
- [ ] Unit tests for service function
- [ ] Integration test for complete flow
- [ ] Error handling tests
- [ ] Performance test with 5 photos

---

## Error Handling

### Validation Errors
- Empty comment → 400 "Comment cannot be empty"
- Comment too long → 400 "Comment cannot exceed 5000 characters"
- Invalid file type → 400 "Invalid file type: {type}"
- File too large → 400 "File too large: {filename}"
- Too many files → 400 "Maximum 5 files allowed"

### Authorization Errors
- Not authenticated → 401 "Unauthorized"
- Not assigned to task → 403 "Access denied"

### Resource Errors
- Task not found → 404 "Task not found"
- Database error → 500 "Failed to add comment"

---

## Performance Considerations

### Optimizations
- Reuse existing database connection pool
- Reuse existing file upload pipeline
- Attachments uploaded in parallel
- Activity creation is single insert
- Indexed queries on topic field

### Expected Performance
- Text comment: <500ms
- With 1 photo: <2s
- With 5 photos: <5s
- Activity feed query: <100ms

---

## Security Measures

### Built-in Security (Already Implemented)
- Authentication via Clerk middleware
- Rate limiting on API endpoints
- File type validation
- File size limits
- SQL injection prevention via Prisma
- XSS prevention via input sanitization

### Comment-Specific Security
- Access control based on task assignment
- Admin override for access
- No HTML allowed in comments (plain text only)
- Attachment URLs are signed (Vercel Blob)

---

## Database Queries

### Main Queries Used

```typescript
// 1. Check task exists and get assigned users
const task = await prisma.task.findUnique({
  where: { id: taskId },
  select: { id: true, assignedUsers: true }
})

// 2. Check user role
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { role: true }
})

// 3. Create activity (via createActivity service)
await prisma.activity.create({
  data: {
    userId,
    topic: `TASK_${taskId}`,
    action: 'TASK_COMMENTED',
    payload,
  }
})

// 4. Upload attachments (via uploadTaskAttachments service)
// Handles Vercel Blob upload and Attachment record creation
```

### Query Performance
- All queries use primary key or indexed fields
- Task query: Uses primary key (id)
- User query: Uses primary key (id)
- Activity insert: Single row insert
- Activity query: Uses indexed topic field

---

## Integration Points

### Services Used (100% Reuse)
- `createActivity()` - From activity.service.ts
- `uploadTaskAttachments()` - From attachment.service.ts
- `getPrisma()` - Database connection
- `getAuth()` - Clerk authentication

### Middleware Used
- `clerkMiddleware()` - Authentication
- `zValidator()` - Request validation
- Rate limiting (already configured)
- Error handling (already configured)

---

## Future Enhancements

These can be added without breaking changes:

### v1.1 - Mentions
```typescript
// Add to payload
mentionedUsers: ['usr_manager123', 'usr_worker456']
// Send notifications to mentioned users
```

### v1.2 - Edit Comments
```typescript
// New endpoint: PATCH /v1/tasks/:id/comments/:activityId
// Update activity payload with edited text
// Track edit history in payload
```

### v1.3 - Delete Comments
```typescript
// Soft delete by adding deletedAt to payload
// Or create COMMENT_DELETED activity
```

### v1.4 - Reactions
```typescript
// New activity type: COMMENT_REACTED
// Reference original activity ID
```

### v1.5 - Threading
```typescript
// Add parentActivityId to payload
// Enable nested comment threads
```

---

## Code Examples

### Complete Service Implementation

```typescript
// Complete implementation (~50 lines for Phase 1, ~70 lines for Phase 2)
import { getPrisma } from '@/lib/db'
import { createActivity } from '@/v1/activities/activity.service'
import { uploadTaskAttachments } from '@/v1/attachments/attachment.service'
import type { CommentActivityPayload } from '@nv-internal/validation'

export async function addTaskComment(
  taskId: number,
  userId: string,
  comment: string,
  files?: File[]
): Promise<Activity> {
  const prisma = getPrisma()

  // Validate task and access (20 lines)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assignedUsers: { select: { id: true } } },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const isAssigned = task.assignedUsers.some(u => u.id === userId)
  const isAdmin = user?.role === 'ADMIN'

  if (!isAssigned && !isAdmin) {
    throw new Error('Access denied')
  }

  // Handle attachments if provided (10 lines)
  let attachments: Attachment[] = []
  if (files && files.length > 0) {
    if (files.length > 5) {
      throw new Error('Maximum 5 files allowed')
    }
    attachments = await uploadTaskAttachments(taskId, files, userId)
  }

  // Create activity (15 lines)
  const payload: CommentActivityPayload = {
    type: 'COMMENT',
    comment: comment.trim(),
    attachments: attachments.length > 0
      ? attachments.map(att => ({
          id: att.id,
          mimeType: att.mimeType,
          originalFilename: att.originalFilename,
        }))
      : undefined,
  }

  return await createActivity({
    userId,
    topic: `TASK_${taskId}`,
    action: 'TASK_COMMENTED',
    payload,
  })
}
```

---

## Success Metrics

### Code Metrics
- ✅ <100 lines of new backend code
- ✅ 90% service reuse
- ✅ Zero database changes
- ✅ 3 hours implementation time

### Quality Metrics
- ✅ >80% test coverage
- ✅ All edge cases handled
- ✅ Consistent error messages
- ✅ Performance within targets

---

## Deployment Notes

### Deployment Steps
1. Deploy validation package update
2. Deploy API with new endpoint
3. No database migration needed ✅
4. No environment variables needed ✅
5. Test endpoint with Postman
6. Deploy mobile app update

### Rollback Plan
- Remove endpoint from router
- No database rollback needed
- Redeploy previous API version