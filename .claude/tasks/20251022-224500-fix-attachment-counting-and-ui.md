# Fix Attachment Counting and UI Issues

## Overview

Fix three issues with task attachments:
1. Deleted attachments are still counted in task attachment display
2. Activity feed doesn't show visual indicator for deleted attachments in TASK_ATTACHMENTS_UPLOADED
3. No optimistic updates when deleting attachments (UI waits for API response)

## Implementation Status

✅ **Completed** - All issues fixed and tested

---

## Problem Analysis

### Issue 1: Deleted Attachments Still Counted

**Current Behavior**: Task shows "10 tệp đính kèm" even after deleting all attachments

**Root Cause**: `apps/api/src/v1/task/task.service.ts:12`
```typescript
const DEFAULT_TASK_INCLUDE: Prisma.TaskInclude = {
  customer: true,
  geoLocation: true,
  attachments: true,  // ❌ Includes soft-deleted attachments
}
```

**Solution**: Add filter to exclude soft-deleted attachments
```typescript
attachments: {
  where: { deletedAt: null }
}
```

### Issue 2: No Visual Indicator for Deleted Attachments in Activity Feed

**Current Behavior**: `TASK_ATTACHMENTS_UPLOADED` activity shows attachment thumbnails, but deleted attachments just disappear

**User Expectation**: Show text message indicating deleted attachments (e.g., "2 tệp đã bị xóa")

**Location**: `apps/mobile/components/activity-feed.tsx:108-129`

**Current Implementation**:
- Fetches attachment IDs from activity payload
- Uses `useAttachments` hook to get full attachment data with signed URLs
- Renders `AttachmentList` component with attachment data

**Problem**: `useAttachments` filters out deleted attachments, so they just disappear without indication

**Solution**:
- Fetch attachments and calculate deleted count
- Show text message "x tệp đã bị xóa" for deleted attachments
- Keep existing thumbnails for active attachments

### Issue 3: No Optimistic Updates on Deletion

**Current Behavior**: Deletion requires API call → response → cache invalidation → re-render

**Location**: `apps/mobile/api/attachment/use-delete-attachment.ts:15-24`

**Current Implementation**:
```typescript
return useMutation({
  mutationFn: deleteAttachment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['attachments'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task'] })
  },
})
```

**Solution**: Add optimistic updates
- `onMutate`: Update cache immediately before API call
- `onError`: Rollback cache changes if API fails
- `onSuccess`: Keep existing invalidation as fallback

---

## Implementation Plan

### Task Checklist

- [ ] **Step 1**: Update API to filter deleted attachments
  - [ ] Modify `DEFAULT_TASK_INCLUDE` in `apps/api/src/v1/task/task.service.ts`
  - [ ] Add `where: { deletedAt: null }` to attachments include
  - [ ] Test API endpoints to verify deleted attachments are excluded

- [ ] **Step 2**: Add deleted attachment placeholder in activity feed
  - [ ] Update `activity-feed.tsx` TASK_ATTACHMENTS_UPLOADED rendering
  - [ ] Create a deleted attachment placeholder component (77x77px with trash icon)
  - [ ] Detect deleted attachments by comparing activity payload with fetched data
  - [ ] Render placeholder for deleted attachments

- [ ] **Step 3**: Implement optimistic updates for deletion
  - [ ] Add `onMutate` to `useDeleteAttachment` hook
  - [ ] Snapshot current cache state
  - [ ] Optimistically remove attachment from all relevant queries:
    - `['attachments', ...]` queries
    - `['task', ...]` queries (remove from attachments array)
    - `['tasks']` queries (update task attachment counts)
  - [ ] Add `onError` with cache rollback
  - [ ] Test optimistic updates with network delay

- [ ] **Step 4**: Improve viewer navigation on delete
  - [ ] Update `attachment-viewer.tsx` delete handler
  - [ ] If not last attachment: navigate to previous (or next if first)
  - [ ] If last attachment: close viewer
  - [ ] Handle optimistic state properly

- [ ] **Step 5**: Testing
  - [ ] Verify attachment count updates immediately after deletion
  - [ ] Check activity feed shows trash icon for deleted attachments
  - [ ] Confirm optimistic UI updates work correctly
  - [ ] Test rollback on deletion failure (simulate network error)
  - [ ] Verify viewer navigation when deleting attachments
  - [ ] Test edge cases (delete all attachments, delete first, delete last)

- [ ] **Step 6**: Code quality
  - [ ] Run `pnpm exec biome check --write .`
  - [ ] Run `pnpm --filter @nv-internal/api test`
  - [ ] Create commit with conventional commit message

---

## Files to Modify

### API Changes
1. **apps/api/src/v1/task/task.service.ts**
   - Lines 9-13: Update `DEFAULT_TASK_INCLUDE`

### Mobile Changes
2. **apps/mobile/components/activity-feed.tsx**
   - Lines 108-129: Update TASK_ATTACHMENTS_UPLOADED rendering
   - Add deleted attachment detection and placeholder rendering

3. **apps/mobile/api/attachment/use-delete-attachment.ts**
   - Lines 12-25: Add optimistic updates (`onMutate`, `onError`)

4. **apps/mobile/components/attachment-viewer.tsx**
   - Lines 48-84: Improve delete handler and navigation logic

---

## User Preferences (from clarifications)

- **Deleted placeholder size**: Same size as thumbnails (77x77px in compact mode)
- **Viewer behavior on delete**: Navigate to previous attachment instead of closing immediately

---

## Testing Scenarios

### Scenario 1: Attachment Count
1. Create task with 10 attachments
2. Delete all 10 attachments
3. ✅ Task should show "Chưa có tệp đính kèm" or "0 tệp đính kèm"

### Scenario 2: Activity Feed
1. Upload 5 attachments (creates TASK_ATTACHMENTS_UPLOADED activity)
2. Delete 2 of those attachments
3. ✅ Activity feed should show 3 thumbnails + 2 trash icon placeholders

### Scenario 3: Optimistic Updates
1. Open attachment viewer
2. Delete attachment with network throttling enabled
3. ✅ UI should update immediately (show next attachment)
4. ✅ API call completes in background

### Scenario 4: Optimistic Rollback
1. Simulate API failure (disconnect network)
2. Try to delete attachment
3. ✅ UI should show error and rollback to original state

### Scenario 5: Viewer Navigation
1. Open viewer with 5 attachments, viewing #3
2. Delete attachment #3
3. ✅ Should navigate to attachment #2
4. Delete attachment #2
5. ✅ Should navigate to attachment #1
6. Delete attachment #1
7. ✅ Should navigate to attachment #4 (next available)

---

## Notes

- Database schema already supports soft delete with `deletedAt` field
- Activity logging for `ATTACHMENT_DELETED` already exists
- The API already creates `TASK_ATTACHMENTS_UPLOADED` activities with attachment IDs
- Need to be careful with cache updates to avoid race conditions

---

## Related Files

- `apps/api/src/v1/attachment/attachment.service.ts` - Attachment business logic
- `apps/mobile/api/attachment/use-attachments.ts` - Attachment query hooks
- `apps/mobile/components/attachment-list.tsx` - Attachment display component
- `packages/prisma-client/` - Shared Prisma client with Attachment model
