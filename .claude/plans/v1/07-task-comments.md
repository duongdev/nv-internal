# Phase 6: Task Comments System

**Timeline:** Week 5 (Parallel with Reports/CRUD)
**Priority:** 🟡 Important
**Status:** ⏳ Not Started

---

## 📋 Implementation Summary

Activity-based comment system for tasks with optional photo attachments. Reuses existing Activity and Attachment models - **ZERO database changes needed!**

### Documentation Structure

This plan is organized into modular documents for easier navigation:

1. **[Common Specifications](./07-task-comments-common.md)** - Shared architecture, data flow, success criteria
2. **[Backend Implementation](./07-task-comments-backend.md)** - API endpoints, services, validation, testing
3. **[Frontend Implementation](./07-task-comments-frontend.md)** - Mobile UI, components, real-time updates

### Quick Links by Role

**Backend Developer:**

- Start with [Common Specifications](./07-task-comments-common.md#architecture-decision-activity-based-comments) for architecture
- Review [Backend Implementation](./07-task-comments-backend.md) for API details
- Check [Service Layer](./07-task-comments-backend.md#service-layer) for code reuse patterns

**Mobile Developer:**

- Review [Common Specifications](./07-task-comments-common.md#data-flow-diagram) for data flow
- Follow [Frontend Implementation](./07-task-comments-frontend.md) for UI components
- See [TaskCommentBox Component](./07-task-comments-frontend.md#existing-component-taskcommentbox) integration

**Project Manager:**

- View [Success Criteria](./07-task-comments-common.md#success-criteria) in Common Specifications
- Review [Code Reuse Analysis](./07-task-comments-common.md#code-reuse-analysis) for efficiency gains (85% reuse)
- Check implementation checklists in each document

---

## Overview

Implement task commenting system with **optional photo attachments** for collaborative task management.

### Key Features

- ✅ **Text Comments**: Plain text messages on tasks
- ✅ **Photo Attachments**: Optional 1-5 photos per comment
- ✅ **Activity-Based**: Reuses existing Activity + Attachment models
- ✅ **Real-time Updates**: Comments appear instantly in activity feed
- ✅ **85% Code Reuse**: Maximum leverage of existing infrastructure

### Architecture Highlights

**Zero Database Changes:** Uses existing Activity and Attachment models exactly as-is.

**Service Flow:**

```typescript
// Comment flow (similar to check-in/out):
1. uploadTaskAttachments() → creates Attachment records (if photos)
2. createActivity() → action='TASK_COMMENTED', payload has comment + attachment summaries
3. Activity appears in feed with comment text

// Pattern identical to CHECK_IN/CHECK_OUT implementation
```

**Activity Payload Structure:**

```typescript
{
  type: 'COMMENT',
  comment: "Đã hoàn thành kiểm tra máy lạnh tầng 2",
  attachments?: [
    { id: 'att_xxx', mimeType: 'image/jpeg', originalFilename: 'machine-status.jpg' }
  ],
  mentionedUsers?: ['usr_manager123']  // Future enhancement
}
```

---

## Implementation Checklist

### Phase 1: Basic Text Comments (2-3 hours)

See [Backend Implementation](./07-task-comments-backend.md#phase-1-basic-text-comments) for detailed checklist.

- [ ] Add comment validation schema (`packages/validation/src/task-comment.zod.ts`)
- [ ] Create comment endpoint (`POST /v1/tasks/:id/comment`)
- [ ] Extend existing task service
- [ ] Add activity payload type
- [ ] Connect existing TaskCommentBox component
- [ ] Write unit tests

### Phase 2: Photo Attachments (2-3 hours)

See [Backend Implementation](./07-task-comments-backend.md#phase-2-photo-attachments) and [Frontend Implementation](./07-task-comments-frontend.md#phase-2-photo-attachments) for details.

- [ ] Extend validation for multipart
- [ ] Reuse uploadTaskAttachments service
- [ ] Update TaskCommentBox for photo selection
- [ ] Add attachment preview UI
- [ ] Test photo upload flow
- [ ] Verify attachments appear in task.attachments

---

## Code Reuse Analysis

### Backend Reuse (90%)

**Existing Services to Reuse:**
- `createActivity()` - Already handles all activity creation
- `uploadTaskAttachments()` - Already handles file uploads
- `getPrisma()` - Database connection
- Activity validation patterns

**New Code Required (~100 lines):**
- Comment-specific validation schema
- One new API endpoint
- Activity payload type definition

### Frontend Reuse (80%)

**Existing Components to Reuse:**
- `TaskCommentBox` - UI already exists, just needs connection
- `AttachmentList` - Display comment attachments
- `useTaskActivities` - Fetch and display comments
- Photo picker utilities from check-in feature

**New Code Required (~100 lines):**
- Wire up TaskCommentBox to API
- Add photo selection to comment box
- Handle optimistic updates

### Total Implementation Estimate

- **Phase 1 (Text):** 2-3 hours (50-75 lines new code)
- **Phase 2 (Photos):** 2-3 hours (100-150 lines new code)
- **Total:** 4-6 hours, ~200 lines new code
- **Code Reuse:** 85% (using existing patterns/services)

---

## Comparison to Check-in/Checkout

This feature follows the **exact same pattern** as check-in/checkout:

| Aspect | Check-in/Checkout | Task Comments |
|--------|------------------|---------------|
| **Database Changes** | Zero | Zero |
| **Uses Activity Model** | ✅ Yes | ✅ Yes |
| **Uses Attachment Model** | ✅ Yes | ✅ Yes |
| **Service Reuse** | 85% | 85% |
| **API Pattern** | POST with multipart | POST with multipart |
| **Activity Payload** | JSON with event data | JSON with comment data |
| **Appears in Feed** | ✅ Yes | ✅ Yes |
| **Mobile UI Pattern** | Shared component | Shared component |

---

## Critical Requirements

### 1. Comments MUST appear in Activity feed

- All comments visible in chronological activity feed
- Mixed with other activities (status changes, check-ins, etc.)
- Activity payload contains comment text and attachment summaries

### 2. Photo attachments MUST appear in task.attachments

- Comment photos automatically visible in task attachments list
- Achieved by uploading to task (sets taskId on attachment)
- No separate comment attachment system needed

### 3. UI Component already exists

- `TaskCommentBox` component is already built
- Just needs to be wired to the API
- Follows existing UI patterns

---

## Success Metrics

- ✅ Users can add text comments to tasks
- ✅ Users can optionally attach 1-5 photos to comments
- ✅ Comments appear in activity feed immediately
- ✅ Photos appear in task.attachments automatically
- ✅ All actions logged with proper attribution
- ✅ Implementation in <6 hours
- ✅ <200 lines of new code
- ✅ Zero database migrations
- ✅ Unit test coverage maintained

---

## Benefits of Activity-Based Architecture

**Why Activity Model is Perfect for Comments:**

1. **Already Indexed**: Activities indexed by topic (taskId), userId, createdAt
2. **Already Paginated**: Existing pagination for activity feeds
3. **Already Filtered**: Can filter by action type to show only comments
4. **Unified Feed**: Comments appear alongside all task events
5. **No Migration**: Zero database changes needed
6. **Proven Pattern**: Identical to check-in/checkout implementation
7. **Future Proof**: Easy to add mentions, reactions, threading later

**What We DON'T Need:**

- ❌ Separate Comment table
- ❌ New foreign key relationships
- ❌ Complex joins for fetching
- ❌ Separate attachment system
- ❌ New indexes
- ❌ Migration scripts

---

## Implementation Notes

### Backend Simplicity

```typescript
// Entire comment service (simplified):
async function addTaskComment(
  taskId: number,
  userId: string,
  comment: string,
  files?: File[]
) {
  // 1. Upload attachments if provided (existing service)
  const attachments = files ?
    await uploadTaskAttachments(taskId, files, userId) : []

  // 2. Create activity (existing service)
  await createActivity({
    userId,
    topic: `TASK_${taskId}`,
    action: 'TASK_COMMENTED',
    payload: {
      type: 'COMMENT',
      comment,
      attachments: attachments.map(a => ({
        id: a.id,
        mimeType: a.mimeType,
        originalFilename: a.originalFilename
      }))
    }
  })
}
```

### Frontend Simplicity

```tsx
// Wire existing TaskCommentBox to API:
const handleSendComment = async () => {
  await addComment.mutateAsync({
    taskId,
    comment: commentText,
    attachments: selectedPhotos
  })
  setCommentText('')
  setSelectedPhotos([])
}
```

---

## Future Enhancements (Not v1)

These can be added later using the same Activity pattern:

1. **Mentions**: Add `mentionedUsers` to payload
2. **Reactions**: New activity type `COMMENT_REACTED`
3. **Threading**: Add `parentActivityId` to payload
4. **Edit/Delete**: New activity types with original reference
5. **Rich Text**: Store markdown in comment field
6. **Voice Notes**: Upload as attachment with audio mime type

All future features work within existing Activity model!

---

## Key Files

### Backend

- `apps/api/src/v1/tasks/task.service.ts` - Extend with comment function
- `apps/api/src/v1/tasks/route.ts` - Add comment endpoint
- `packages/validation/src/task-comment.zod.ts` - Comment validation (NEW)

### Frontend

- `apps/mobile/components/task-comment-box.tsx` - Existing component to wire up
- `apps/mobile/hooks/useTaskComment.ts` - API integration hook (NEW)
- `apps/mobile/components/attachment-picker.tsx` - Reuse from check-in

---

## Dependencies

- **Requires**: Activity model, Attachment model (already exist)
- **Blocks**: None
- **Nice to have before**: Check-in/checkout (for attachment picker patterns)

---

## Risk Assessment

### Low Risk 🟢

1. **Technical Risk**: Minimal - uses proven patterns
2. **Timeline Risk**: Low - 4-6 hours total
3. **Migration Risk**: Zero - no database changes
4. **Performance Risk**: Low - indexed queries
5. **Security Risk**: Low - existing auth/validation

### Mitigation

- Start with text-only comments (2 hours)
- Add photos in second phase if time permits
- Test with production-like data volumes
- Use existing rate limiting middleware

---

## Success Story

*"We implemented task comments in just 4 hours with 200 lines of code by reusing our Activity pattern. Zero database changes, zero migrations, and it works perfectly with our existing activity feed. The TaskCommentBox component was already built - we just had to connect it!"*