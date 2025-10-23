# Task Comments System - Common Specifications

**Parent Plan:** [07-task-comments.md](./07-task-comments.md)
**Related:** [Backend Implementation](./07-task-comments-backend.md) | [Frontend Implementation](./07-task-comments-frontend.md)

---

## Overview

Task commenting system with **optional photo attachments** for collaborative task management. Enables workers and admins to communicate about tasks, share updates, and document issues with photos.

### Key Features
- ✅ **Text Comments**: Plain text messages on tasks
- ✅ **Photo Attachments**: Optional 1-5 photos per comment
- ✅ **Activity Feed Integration**: Comments appear in chronological feed
- ✅ **Zero Database Changes**: Reuses existing Activity and Attachment models
- ✅ **85% Code Reuse**: Leverages existing services and patterns

---

## Business Requirements

### User Stories

**As a Worker:**
- I want to comment on tasks to provide updates
- I want to attach photos to show work progress or issues
- I want to see all comments in the task activity feed

**As an Admin:**
- I want to comment on tasks to give instructions
- I want to see worker comments and photos
- I want all communication logged for accountability

### Functional Requirements

1. **Comment Creation**
   - Users can add text comments to tasks
   - Comments require at least 1 character (no empty comments)
   - Maximum comment length: 5000 characters
   - Vietnamese language support

2. **Photo Attachments**
   - Optional 1-5 photos per comment
   - Supported formats: JPEG, PNG, WebP
   - Maximum file size: 10MB per photo
   - Photos appear in task.attachments automatically

3. **Activity Feed**
   - Comments appear in chronological order
   - Mixed with other activities (status changes, check-ins)
   - Shows commenter name, timestamp, text, and photos
   - Real-time updates without page refresh

---

## Architecture Decision: Activity-Based Comments

**Decision:** Implement comments using the **existing Activity pattern**:
1. **Upload attachments** (if any) using existing `uploadTaskAttachments` service
2. **Create Activity** with action='TASK_COMMENTED' and comment data in payload
3. **Display in feed** using existing activity components

**Rationale:**
- ✅ **Zero schema changes** - No new tables or columns needed
- ✅ **Proven pattern** - Identical to check-in/checkout implementation
- ✅ **Unified feed** - All task events in one chronological view
- ✅ **Built-in features** - Pagination, filtering, indexing already exist
- ✅ **85% code reuse** - Most logic already implemented
- ✅ **Future-proof** - Easy to add mentions, reactions, threading

**Alternative Considered (Rejected):**
- ❌ Separate Comment table - Would require migration, duplicate attachment logic, separate feed

---

## Database Schema

### 🎉 ZERO Schema Changes Required!

Uses existing models exactly as-is:

**Activity Model (existing):**
```prisma
model Activity {
  id        String   @id @default(prefixedId("act"))
  userId    String
  topic     String   // "TASK_123" for task activities
  action    String   // "TASK_COMMENTED" for comments
  payload   Json?    // Comment text and attachment info
  createdAt DateTime

  @@index([topic, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
}
```

**Attachment Model (existing):**
```prisma
model Attachment {
  id               String  @id @default(prefixedId("att"))
  taskId           Int?    // Links to task
  url              String
  mimeType         String
  originalFilename String
  fileSize         Int
  // ... other fields
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User writes comment with 2 photos                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ uploadTaskAttachments() service (EXISTING)                  │
│ - Creates 2 Attachment records                              │
│ - Sets taskId = 123                                         │
│ - Returns [att1, att2]                                      │
│ - Creates TASK_ATTACHMENTS_UPLOADED activity                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ createActivity() service (EXISTING)                         │
│ - action = 'TASK_COMMENTED'                                 │
│ - topic = 'TASK_123'                                        │
│ - payload = {                                               │
│     type: 'COMMENT',                                        │
│     comment: 'Máy lạnh đã được vệ sinh',                    │
│     attachments: [                                          │
│       { id: 'att_1', mimeType: 'image/jpeg', ... }         │
│       { id: 'att_2', mimeType: 'image/jpeg', ... }         │
│     ]                                                       │
│   }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Activity Feed Display                                       │
│ - Fetches activities by topic='TASK_123'                    │
│ - Renders comment with text and photo thumbnails            │
│ - Updates in real-time via React Query                      │
└─────────────────────────────────────────────────────────────┘
```

---

## API Specifications

### Create Comment Endpoint

**Endpoint:** `POST /v1/tasks/:id/comment`

**Request (Multipart Form Data):**
```
comment: "Đã kiểm tra và vệ sinh máy lạnh" (required)
files[]: [photo1.jpg, photo2.jpg] (optional, max 5)
```

**Validation:**
- Comment: 1-5000 characters, required
- Files: Optional, max 5, max 10MB each
- Supported types: image/jpeg, image/png, image/webp

**Response:**
```json
{
  "success": true,
  "activity": {
    "id": "act_abc123",
    "action": "TASK_COMMENTED",
    "payload": {
      "type": "COMMENT",
      "comment": "Đã kiểm tra và vệ sinh máy lạnh",
      "attachments": [
        {
          "id": "att_xyz",
          "mimeType": "image/jpeg",
          "originalFilename": "machine.jpg"
        }
      ]
    },
    "createdAt": "2024-10-23T10:30:00Z"
  }
}
```

---

## Code Reuse Analysis

### What We Reuse (85%)

**Backend Services:**
- `createActivity()` - 100% reused
- `uploadTaskAttachments()` - 100% reused
- `getPrisma()` - 100% reused
- Error handling - 100% reused
- Auth middleware - 100% reused
- Validation patterns - 90% reused

**Frontend Components:**
- `TaskCommentBox` - 80% exists
- `AttachmentList` - 100% reused
- `useTaskActivities` - 100% reused
- Photo picker - 100% reused from check-in
- Activity feed - 100% reused

### What We Build New (15%)

**Backend (~100 lines):**
- Comment validation schema (20 lines)
- Comment endpoint handler (50 lines)
- Activity payload type (10 lines)
- Unit tests (20 lines)

**Frontend (~100 lines):**
- Wire TaskCommentBox to API (30 lines)
- Add photo selection (40 lines)
- Optimistic updates (20 lines)
- Integration tests (10 lines)

**Total: ~200 lines of new code**

---

## Success Criteria

### Functional Success
- ✅ Users can add text comments to tasks
- ✅ Comments support 1-5000 characters
- ✅ Users can attach 0-5 photos per comment
- ✅ Comments appear immediately in activity feed
- ✅ Photos appear in task.attachments list
- ✅ Vietnamese language fully supported

### Technical Success
- ✅ Zero database migrations required
- ✅ <200 lines of new code
- ✅ 85% code reuse achieved
- ✅ Implementation in <6 hours
- ✅ All existing tests still pass
- ✅ New feature has >80% test coverage

### Performance Success
- ✅ Comment submission <2 seconds on 4G
- ✅ Photo upload <5 seconds per photo
- ✅ Activity feed loads <1 second
- ✅ No performance degradation

---

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication (existing middleware)
- Users can only comment on tasks they have access to
- Activity automatically tracks userId for attribution

### Input Validation
- Comment text sanitized for XSS
- File upload validation (type, size)
- Rate limiting on comment creation (existing middleware)

### Data Privacy
- Comments visible to all task participants
- No ability to edit/delete comments in v1
- Full audit trail via Activity model

---

## Testing Strategy

### Unit Tests
- Comment validation schema
- Service function logic
- Error handling paths

### Integration Tests
- End-to-end comment creation
- Photo upload with comments
- Activity feed updates

### Manual Testing
- Vietnamese text input
- Multiple photo selection
- Offline error handling
- Performance on slow networks

---

## Migration Path

### From Current State to Comments
1. **No database migration needed** ✅
2. Deploy backend with new endpoint
3. Deploy mobile app with wired component
4. Enable feature flag if needed

### Future Enhancements
All can be added without schema changes:

1. **Mentions**: Add `mentionedUsers` array to payload
2. **Reactions**: New activity type 'COMMENT_REACTED'
3. **Edit/Delete**: New activity types with references
4. **Threading**: Add `parentActivityId` to payload
5. **Rich Text**: Store markdown in comment field

---

## Comparison with Similar Features

| Feature | Check-in/Checkout | Task Comments | Attachment Upload |
|---------|------------------|---------------|-------------------|
| **Uses Activity** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Uses Attachments** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Database Changes** | None | None | None |
| **Code Reuse** | 85% | 85% | Base feature |
| **Implementation** | 4 hours | 4 hours | Already done |
| **New Code** | ~200 lines | ~200 lines | N/A |

---

## Decision Log

### Why Activity Model for Comments?

**Pros:**
- Zero migrations needed
- Unified activity feed
- Built-in pagination/filtering
- Proven pattern from check-in/checkout
- 85% code reuse

**Cons:**
- No comment editing in v1 (can add later)
- Comments mixed with other activities (actually a pro for most users)

**Decision:** Activity model is perfect for v1. Can enhance later without breaking changes.

### Why 5 Photo Limit?

**Reasoning:**
- Matches check-in/checkout pattern
- Sufficient for documenting issues
- Reduces storage costs
- Faster uploads on mobile networks
- Can increase later if needed

---

## Implementation Readiness Checklist

- [x] Business requirements defined
- [x] Technical architecture decided
- [x] No database migrations needed
- [x] UI component already exists (TaskCommentBox)
- [x] Backend services ready to reuse
- [x] Authentication/authorization in place
- [x] File upload system working
- [x] Activity feed functioning
- [ ] Backend endpoint implementation needed
- [ ] Frontend wiring needed

**Ready to implement: YES ✅**