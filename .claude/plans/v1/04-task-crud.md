# Phase 3b: Task CRUD Enhancements

**Timeline:** Week 5 (Parallel with Reports)
**Priority:** 🟡 Important
**Status:** ⏳ Not Started

---

## Overview

Allow admin to edit and delete tasks. Critical for fixing errors and managing task lifecycle.

## Current State

- ✅ Create tasks
- ❌ Edit tasks
- ❌ Delete tasks

---

## API Endpoints

### PUT /v1/task/:id

**Request:**
```typescript
{
  title?: string
  description?: string
  customerName?: string
  customerPhone?: string
  geoLocation?: {
    lat: number
    lng: number
    address?: string
    name?: string
  }
}
```

**Business Logic:**
- Admin only
- Cannot edit if status = COMPLETED
- Log activity: `TASK_UPDATED`
- Update customer if phone changed
- Create new GeoLocation if location changed

---

### DELETE /v1/task/:id

**Business Logic:**
- Admin only
- Soft delete (add deletedAt timestamp to Task model)
- Can only delete if status = PREPARING or READY
- Cannot delete if has check-ins
- Log activity: `TASK_DELETED`

---

## Database Changes

```prisma
model Task {
  // Add soft delete
  deletedAt DateTime?

  @@index([deletedAt])
}
```

Update all queries to filter `WHERE deletedAt IS NULL`

---

## Mobile UI

### Admin: Edit Task Screen

**Location:** `apps/mobile/app/admin/tasks/[taskId]/edit.tsx`

- Reuse form from create screen
- Pre-populate with existing data
- Disable editing if COMPLETED
- Save button calls PUT endpoint

### Task Details Enhancements

- Add "Edit" button (if PREPARING or READY)
- Add "Delete" button with confirmation dialog
- Show "Edited" badge if task was modified

---

## Validation

Reuse `zCreateTask` schema, but make all fields optional:

```typescript
export const zUpdateTask = zCreateTask.partial()
```

---

## Testing

- Admin can update task title/description
- Admin can update customer info
- Admin can update location
- Cannot edit COMPLETED tasks
- Soft delete works
- Cannot delete IN_PROGRESS tasks
- Cannot delete tasks with check-ins

---

## Success Criteria

- ✅ Admin can edit tasks (PREPARING/READY only)
- ✅ Admin can delete tasks (PREPARING/READY only)
- ✅ Soft delete implemented
- ✅ Edit history in activity feed
- ✅ Validation prevents invalid edits
