# Implement Task Comments Feature

## Overview

Implement task commenting system with optional photo attachments using the Activity-based pattern. This feature enables collaborative communication on tasks with zero database changes required.

## Implementation Status

⏳ Not Started - Documentation Complete

## Problem Analysis

### Current State
- TaskCommentBox UI component exists but is not connected to backend
- Activity model already supports flexible payload for different event types
- Attachment system fully functional for task photos
- Activity feed displays all task-related events

### Requirements
- Users need to communicate about tasks (updates, issues, questions)
- Comments should support Vietnamese text
- Optional photo attachments (1-5 per comment) for visual documentation
- All comments must appear in chronological activity feed
- Photos must appear in task.attachments list

### Solution
Use existing Activity pattern (identical to check-in/checkout implementation):
1. Create comment with text via API
2. Upload photos using existing `uploadTaskAttachments` service
3. Store comment data in Activity with action='TASK_COMMENTED'
4. Display in existing activity feed

## Implementation Plan

### Phase 1: Basic Text Comments (2-3 hours)

Backend Tasks:
- [ ] Create validation schema in `packages/validation/src/task-comment.zod.ts`
  - Comment: 1-5000 characters, required
  - Activity payload type definition
- [ ] Add comment endpoint to `apps/api/src/v1/tasks/route.ts`
  - POST /v1/tasks/:id/comment
  - Multipart form data support
- [ ] Create `addTaskComment` service function in task.service.ts
  - Verify task exists and user has access
  - Create activity with TASK_COMMENTED action
- [ ] Write unit tests for comment creation

Frontend Tasks:
- [ ] Create `useTaskComment` hook in `apps/mobile/hooks/`
  - Handle API calls with React Query
  - Invalidate task activities on success
- [ ] Wire TaskCommentBox component to API
  - Connect to useTaskComment hook
  - Add loading states and error handling
- [ ] Update activity feed to display comments
  - Add TASK_COMMENTED case to activity renderer

### Phase 2: Photo Attachments (2-3 hours)

Backend Tasks:
- [ ] Update validation for file uploads
  - Support image/jpeg, image/png, image/webp
  - Max 5 files, max 10MB each
- [ ] Integrate uploadTaskAttachments in comment service
  - Upload photos before creating activity
  - Include attachment summaries in payload

Frontend Tasks:
- [ ] Create CommentPhotoSelector component
  - Camera and library selection
  - Preview selected photos
  - Remove photo functionality
- [ ] Integrate photo selector with TaskCommentBox
  - Handle image-to-file conversion
  - Display photo count and previews
- [ ] Test photo upload flow end-to-end

## Technical Architecture

### Activity-Based Pattern (Zero DB Changes)

```typescript
// Activity payload structure for comments
{
  type: 'COMMENT',
  comment: "Máy lạnh đã được vệ sinh xong",
  attachments?: [
    { id: 'att_xxx', mimeType: 'image/jpeg', originalFilename: 'completed.jpg' }
  ]
}
```

### Code Reuse Statistics
- Backend: 90% service reuse (createActivity, uploadTaskAttachments)
- Frontend: 80% component reuse (TaskCommentBox exists, activity feed ready)
- Total new code: ~200 lines
- Implementation time: 4-6 hours total

### Service Flow
1. User submits comment with optional photos
2. Photos uploaded via `uploadTaskAttachments` (sets taskId)
3. Activity created with TASK_COMMENTED action
4. Activity feed automatically displays new comment
5. Photos appear in task.attachments list

## Testing Scenarios

### Unit Tests
- [ ] Comment validation (empty, too long, special characters)
- [ ] Access control (assigned users, admin override)
- [ ] File validation (type, size, count)
- [ ] Activity creation with correct payload

### Integration Tests
- [ ] End-to-end comment submission
- [ ] Photo upload with comments
- [ ] Activity feed updates
- [ ] Task attachment list updates

### Manual Testing
- [ ] Vietnamese text input
- [ ] Send comment with 1 photo
- [ ] Send comment with 5 photos (max)
- [ ] Try 6th photo (should block)
- [ ] Test on slow network
- [ ] Test offline behavior
- [ ] Verify in activity feed
- [ ] Verify in task attachments

## V1 Plan References

This implementation follows the detailed specifications in:
- Main plan: `.claude/plans/v1/07-task-comments.md`
- Common specs: `.claude/plans/v1/07-task-comments-common.md`
- Backend plan: `.claude/plans/v1/07-task-comments-backend.md`
- Frontend plan: `.claude/plans/v1/07-task-comments-frontend.md`

## Key Benefits

1. **Zero Database Changes**: Uses existing Activity and Attachment models
2. **Maximum Code Reuse**: 85% of functionality already exists
3. **Fast Implementation**: 4-6 hours total (can be split into 2 phases)
4. **Proven Pattern**: Identical to successful check-in/checkout implementation
5. **Future Proof**: Easy to add mentions, reactions, threading without migrations

## Risk Analysis

### Low Risks
- Technical complexity: Minimal, uses proven patterns
- Performance: Activity queries already optimized with indexes
- Security: Existing auth and validation patterns apply
- Data migration: None required

### Mitigation
- Start with text-only (Phase 1) to deliver value quickly
- Add photos (Phase 2) only after text comments work
- Use existing rate limiting to prevent spam
- Test with production-like data volumes

## Success Criteria

- [ ] Users can add text comments to tasks
- [ ] Comments support 1-5000 characters
- [ ] Optional 1-5 photos per comment
- [ ] Comments appear immediately in activity feed
- [ ] Photos appear in task.attachments
- [ ] Vietnamese language fully supported
- [ ] <200 lines of new code
- [ ] Implementation completed in <6 hours

## Notes

### Why Activity Model?
After analyzing alternatives, the Activity model is perfect because:
- Already indexed for fast queries
- Flexible JSON payload for any data structure
- Unified feed experience (all events in one place)
- No migrations needed
- Proven by check-in/checkout feature

### Implementation Priority
This feature can be implemented immediately as it has:
- No dependencies on other v1 features
- UI component already exists (TaskCommentBox)
- All backend services ready to reuse
- Clear implementation path with low risk

### Future Enhancements (Post-v1)
The Activity-based architecture enables easy additions:
- Mentions: Add mentionedUsers array to payload
- Reactions: New COMMENT_REACTED activity type
- Edit/Delete: New activity types with references
- Threading: Add parentActivityId to payload
- Rich text: Store markdown in comment field

All future features work within the existing model!