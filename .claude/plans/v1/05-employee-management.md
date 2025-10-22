# Phase 4: Employee Management Enhancements

**Timeline:** Week 6
**Priority:** 🟡 Important
**Status:** ⏳ Not Started

---

## Overview

Complete employee management with profile updates and account deletion.

## Current State

- ✅ Create employees
- ✅ Ban/unban employees
- ✅ Update roles
- ❌ Update profile (name, phone, email)
- ❌ Delete employees

---

## API Endpoints

### PUT /v1/user/:id/profile

**Request:**
```typescript
{
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}
```

**Business Logic:**
- Admin only
- Update Clerk user
- Update publicMetadata for phone
- Validate email/phone format

---

### DELETE /v1/user/:id

**Business Logic:**
- Admin only
- Check user has no active tasks (status != COMPLETED)
- Ban user in Clerk (don't hard delete)
- Set user metadata `deleted: true`
- Log activity: `USER_DELETED`

---

## Mobile UI

### Admin: Edit Employee Screen

**Location:** `apps/mobile/app/admin/users/[userId]/edit.tsx`

- Form with firstName, lastName, phone, email
- Save button
- Delete button (confirmation dialog)

### Admin: Employee Details Screen

**Location:** `apps/mobile/app/admin/users/[userId]/view.tsx`

- Employee info
- Task history
- Performance metrics (from reports)
- Edit button
- Delete button

---

## Testing

- Update employee profile
- Delete employee with no active tasks
- Cannot delete employee with active tasks
- Deleted user cannot login

---

## Success Criteria

- ✅ Admin can edit employee profiles
- ✅ Admin can delete employees
- ✅ Cannot delete with active tasks
- ✅ Activity logged
