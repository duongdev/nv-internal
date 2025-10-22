# Soft Delete Attachment Feature

## Overview

Implementation of soft-delete functionality for attachments in the NV Internal task management application. This feature allows users to delete attachments while maintaining data integrity, providing an audit trail, and enabling potential recovery.

## Implementation Status

 **Completed** - All features implemented, tested, and committed

**Commit**: `e52792c` - `feat(api,mobile): implement soft delete for attachments`

---

## Planning Phase

### Requirements Analysis

Based on the codebase analysis:

- **Database**: Attachment model exists without soft-delete support
- **API**: No DELETE endpoint for attachments
- **Mobile**: AttachmentList displays attachments but has no delete UI
- **Storage**: Files stored in Vercel Blob or local disk
- **Activity Logging**: System tracks actions via Activity model

### Design Decisions

1. **Soft Delete Over Hard Delete**: Preserves data for audit trails and potential recovery
2. **Keep Files in Storage**: Don't delete from Vercel Blob/local disk (cleanup job can be added later)
3. **Permission Model**: Only uploader or admin can delete attachments
4. **Query Filtering**: Default queries exclude deleted attachments
5. **Activity Logging**: Track deletions in task activity feed for visibility

---

## Implementation Details

### 1. Database Schema Changes

**File**: `apps/api/prisma/schema.prisma`

```prisma
model Attachment {
  id               String    @id @default(cuid())
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime? // Soft delete timestamp

  // ... other fields ...

  @@index([deletedAt]) // Index for query performance
}
```

**Migration**: `20251022124058_add_soft_delete_to_attachment`

- Adds nullable `deletedAt` column
- Creates index on `deletedAt` for efficient filtering
- Applied successfully to database

### 2. API Backend Implementation

#### Attachment Service

**File**: `apps/api/src/v1/attachment/attachment.service.ts`

**New Function**: `softDeleteAttachment()` (lines 493-558)

```typescript
export async function softDeleteAttachment({
  attachmentId,
  user,
}: {
  attachmentId: string;
  user: User;
});
```

**Features**:

- Permission checks: Admin or original uploader
- Soft delete by setting `deletedAt` timestamp
- Activity logging to task feed (if attachment linked to task)
- Returns deleted attachment record

**Updated Functions**:

- `getAttachmentsByIds()`: Filters out deleted attachments (line 250)
- `streamLocalFile()`: Excludes deleted attachments (line 359)

#### Attachment Route

**File**: `apps/api/src/v1/attachment/attachment.route.ts`

**New Endpoint**: `DELETE /v1/attachments/:id` (lines 177-215)

**Features**:

- Validates attachment ID
- Requires authentication (global middleware)
- Permission enforcement via service layer
- Vietnamese error messages
- Returns `{ success: true }` on success

**Error Handling**:

- 403: Unauthorized (not admin or uploader)
- 404: Attachment not found
- 500: Server error

#### Activity Service Update

**File**: `apps/api/src/v1/activity/activity.service.ts`

- Maintained TASK and GENERAL topics
- Removed ATTACHMENT topic (not needed)
- Attachment deletions log to TASK topic for visibility in task feed

### 3. Mobile App Implementation

#### Delete Hook

**File**: `apps/mobile/api/attachment/use-delete-attachment.ts` (new file)

```typescript
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      // Invalidate attachment and task queries
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
    },
  });
}
```

**Features**:

- TanStack Query mutation
- Automatic cache invalidation
- Type-safe API calls using Hono RPC

#### Attachment Viewer UI

**File**: `apps/mobile/components/attachment-viewer.tsx`

**New Features**:

1. Delete button with trash icon
2. Loading state with spinner during deletion
3. Confirmation dialog before deletion
4. Error handling with user-friendly messages
5. Auto-close viewer when last attachment deleted
6. Disabled interactions during pending deletion

**UX Flow**:

1. User taps delete button (trash icon)
2. Confirmation dialog shows with filename
3. On confirm, button shows loading spinner
4. Both delete and close buttons disabled
5. On success: viewer closes if last attachment, otherwise stays open
6. On error: alert with error message

#### Activity Feed Display

**File**: `apps/mobile/components/activity-feed.tsx`

**New Activity Type**: `ATTACHMENT_DELETED` (lines 130-137)

```typescript
if (action === 'ATTACHMENT_DELETED' && payload?.originalFilename) {
  return (
    <Text>
      � x�a t�p �nh k�m{' '}
      <Text className="font-sans-medium">{payload.originalFilename}</Text>
    </Text>
  )
}
```

**Display Format**:

- User who deleted the file
- Timestamp of deletion
- Original filename in bold
- Example: "� x�a t�p �nh k�m photo.jpg"

---

## Testing

### Unit Tests

**File**: `apps/api/src/v1/attachment/__tests__/attachment.service.test.ts`

**New Test Suite**: `softDeleteAttachment` (lines 343-518)

**Test Cases**:

1.  Admin can delete any attachment
2.  Uploader can delete their own attachment
3.  Rejects when attachment not found
4.  Rejects when user is not admin and not uploader

**Coverage**: Permission checks, database operations, activity logging

**Results**: All 68 tests passing

### Quality Checks

-  Biome linter: No issues
-  TypeScript compilation: No errors
-  API tests: 68/68 passing
-  Code formatted and clean

---

## API Reference

### Delete Attachment

**Endpoint**: `DELETE /v1/attachments/:id`

**Authentication**: Required (Clerk)

**Parameters**:

- `id` (path): Attachment ID (CUID format)

**Permissions**:

- Admin users: Can delete any attachment
- Regular users: Can only delete attachments they uploaded

**Response**:

```json
{
  "success": true
}
```

**Error Responses**:

403 Forbidden:

```json
{
  "message": "B�n kh�ng c� quy�n x�a t�p �nh k�m n�y."
}
```

404 Not Found:

```json
{
  "message": "Kh�ng t�m th�y t�p �nh k�m."
}
```

500 Server Error:

```json
{
  "message": "Kh�ng th� x�a t�p �nh k�m."
}
```

---

## Usage Guide

### For Mobile App Users

1. **View Attachments**: Open task details to see attachments
2. **Open Viewer**: Tap attachment to view full screen
3. **Delete Attachment**:
   - Tap trash icon in top-right corner
   - Confirm deletion in dialog
   - Wait for loading indicator
   - Viewer closes automatically if last attachment

4. **View Activity**: Check task activity feed to see deletion history

### For Developers

#### Query Attachments (Automatic Filtering)

```typescript
// Soft-deleted attachments are automatically excluded
const attachments = await getAttachmentsByIds({ ids: ["att_123"] });
```

#### Delete Attachment (Mobile)

```typescript
const { mutate, isPending } = useDeleteAttachment();

mutate(attachmentId, {
  onSuccess: () => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});
```

#### Delete Attachment (API)

```typescript
await softDeleteAttachment({
  attachmentId: "att_123",
  user: clerkUser,
});
```

---

## Technical Specifications

### Database

- **Column**: `deletedAt` (DateTime, nullable)
- **Index**: Yes (for query performance)
- **Default**: NULL (not deleted)
- **Cascade**: No cascading deletes (soft delete only)

### Permissions

- **Admin**: Full delete access (any attachment)
- **Uploader**: Can delete own attachments only
- **Other Users**: No delete access

### Activity Logging

- **Topic**: TASK (linked via `taskId`)
- **Action**: `ATTACHMENT_DELETED`
- **Payload**:
  ```json
  {
    "attachmentId": "att_123",
    "originalFilename": "photo.jpg",
    "mimeType": "image/jpeg"
  }
  ```

### Query Filtering

All attachment queries include `deletedAt: null` filter:

- `getAttachmentsByIds()`
- `streamLocalFile()`

---

## Future Enhancements

### Potential Improvements

1. **Admin View**: Show deleted attachments with restore option
2. **Permanent Delete**: Add hard delete after retention period
3. **Storage Cleanup**: Automated job to delete files after X days
4. **Bulk Operations**: Delete multiple attachments at once
5. **Restore Feature**: Undelete attachments (set `deletedAt` to null)
6. **Audit Report**: Generate deletion activity reports

### Implementation Considerations

- Restore requires updating `deletedAt` to null
- Storage cleanup needs background job
- Bulk delete needs transaction handling
- Admin view needs separate query without filter

---

## Files Changed

### Database

- `apps/api/prisma/schema.prisma` - Schema changes
- `apps/api/prisma/migrations/20251022124058_add_soft_delete_to_attachment/` - Migration files

### API (Backend)

- `apps/api/src/v1/attachment/attachment.service.ts` - Core logic
- `apps/api/src/v1/attachment/attachment.route.ts` - REST endpoint
- `apps/api/src/v1/attachment/__tests__/attachment.service.test.ts` - Tests
- `apps/api/src/v1/activity/activity.service.ts` - Activity logging

### Mobile (Frontend)

- `apps/mobile/api/attachment/use-delete-attachment.ts` - React hook (new)
- `apps/mobile/components/attachment-viewer.tsx` - UI with delete button
- `apps/mobile/components/activity-feed.tsx` - Activity display

---

## Commit Information

**SHA**: `e52792caeb49834e78a38787a0ca27ae091fa778`
**Author**: Dustin Do
**Date**: Wed Oct 22 19:56:58 2025 +0700
**Branch**: `feature/soft-delete-attachment`

**Stats**: 8 files changed, 400 insertions(+), 11 deletions(-)

**Message**:

```
feat(api,mobile): implement soft delete for attachments

Add soft-delete functionality with permission checks and activity logging.

Database:
- Add deletedAt field to Attachment model with index
- Create migration for schema changes

API:
- Implement softDeleteAttachment service with admin/uploader permissions
- Add DELETE /v1/attachments/:id endpoint
- Update queries to filter out deleted attachments
- Log deletion events to task activity feed

Mobile:
- Create useDeleteAttachment hook with cache invalidation
- Add delete button with loading state to attachment viewer
- Show confirmation dialog before deletion
- Display deletion activity in task feed

Tests:
- Add comprehensive soft-delete tests covering permissions
- All 68 tests passing
```

---

## References

- **Prisma Documentation**: Soft delete patterns
- **Hono Documentation**: REST API design
- **TanStack Query**: Mutation and cache invalidation
- **React Native**: ActivityIndicator component
- **Project CLAUDE.md**: Architecture and conventions
