# Service Layer Error Handling Pattern

When implementing service layer functions, always use `HTTPException` for proper error handling.

## The Problem

Throwing plain `Error` objects loses type safety and requires manual error parsing in routes.

## The Solution

Use Hono's `HTTPException` for consistent, type-safe error handling:

```typescript
// ✅ GOOD - HTTPException with proper status and message
import { HTTPException } from 'hono/http-exception'

export async function getTask(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  if (!task) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy công việc',
      cause: 'TASK_NOT_FOUND'
    })
  }

  return task
}
```

## Anti-pattern

```typescript
// ❌ BAD - Plain Error with custom status property
export async function getTask(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  if (!task) {
    const err = new Error('TASK_NOT_FOUND') as Error & { status?: number }
    err.status = 404
    throw err  // Route must manually parse this!
  }

  return task
}
```

## Benefits

- ✅ Type-safe error handling
- ✅ Automatic status code propagation
- ✅ Consistent error structure
- ✅ Vietnamese error messages for users
- ✅ Error cause for debugging

## Reference

Implementation guide: `.claude/tasks/20251023-160800-backend-code-quality-improvements.md`
