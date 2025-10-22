# Redesign Task Details Screen

## Overview

Redesign the task details screen for both worker and admin views, inspired by a Yard Management System design from Instagram. The goal is to improve visual hierarchy, scannability, and user experience using a card-based layout with React Native Reusables components.

## Implementation Status

✅ Completed

**Completion Date:** 2025-10-22

All core implementation tasks have been completed:
- ✅ TaskDetails component refactored with flat header and card-based sections
- ✅ TaskCommentBox component created for Activities card
- ✅ TaskAction component updated for CTA row usage with completed state
- ✅ Worker task view screen updated
- ✅ Admin task view screen updated
- ✅ TaskBottomActions component deprecated
- ⏳ Testing pending (requires manual testing on device/simulator)

## Design Inspiration

Instagram post: https://www.instagram.com/p/DPAHYsoEsv_/?img_index=1&igsh=MWNpZmFpNDM2MGFhZg==

**Key Design Patterns:**
- Card-based sectioned layout
- Prominent status badges and CTAs
- Quick action buttons with icons
- Clean typography hierarchy
- Better visual separation between sections
- Enhanced activity timeline

## Requirements

### Layout Structure (Top to Bottom)

1. **Header (Flat, No Card)**
   - Task ID badge
   - Task title
   - Task status badge

2. **CTA Buttons Row (3 buttons)**
   - Status transition button (disabled if completed, shows "Hoàn thành")
   - Open map button (disabled if no location)
   - Call customer button (disabled if no phone)

3. **Work Location Card**
   - Location name (if available)
   - Address

4. **Customer Info Card**
   - Customer name
   - Phone number

5. **Task Description Card**
   - Description text

6. **Assignee Card**
   - Admin: Can edit assignees
   - Worker: Read-only view

7. **Attachments Card**
   - Attachment list
   - Upload button

8. **Activities Card**
   - Comment box at top
   - Activity feed below

### Key Changes from Current Implementation

- ✅ Remove bottom sheet for comments
- ✅ Move comment box to Activities card
- ✅ Convert all sections to Card components
- ✅ Add role-based editing for assignees
- ✅ Implement 3-button CTA row with proper disabled states
- ✅ Keep header flat (no Card wrapper)

## Implementation Plan

### Phase 1: Refactor TaskDetails Component

**File:** `apps/mobile/components/task-details.tsx`

#### Step 1.1: Implement Flat Header
```tsx
{/* Header - Flat outside any card */}
<View className="gap-2">
  <Badge variant="outline" className="self-start">
    <Text>#{formatTaskId(task.id)}</Text>
  </Badge>
  <Text className="font-sans-bold text-2xl">
    {task.title || 'Chưa có tiêu đề'}
  </Text>
  <TaskStatusBadge status={task.status} />
</View>
```

#### Step 1.2: Create CTA Buttons Row
```tsx
<View className="flex-row gap-2">
  {/* Status Transition Button */}
  <Button
    className="flex-1"
    disabled={task.status === TaskStatus.COMPLETED}
    onPress={handleStatusTransition}
  >
    <Icon as={getStatusIcon(task.status)} />
    <Text>
      {task.status === TaskStatus.COMPLETED
        ? 'Hoàn thành'
        : getNextActionLabel(task.status)}
    </Text>
  </Button>

  {/* Open Map Button */}
  <Button
    variant="outline"
    disabled={!task.geoLocation}
    onPress={() => {
      if (task.geoLocation) {
        const url = `https://www.google.com/maps/search/?api=1&query=${task.geoLocation.lat},${task.geoLocation.lng}`
        Linking.openURL(url)
      }
    }}
  >
    <Icon as={MapPinnedIcon} />
  </Button>

  {/* Call Customer Button */}
  <Button
    variant="outline"
    disabled={!task.customer?.phone}
    onPress={() => {
      if (task.customer?.phone) {
        Linking.openURL(`tel:${task.customer.phone}`)
      }
    }}
  >
    <Icon as={PhoneCallIcon} />
  </Button>
</View>
```

#### Step 1.3: Convert Sections to Cards

**Work Location Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Địa chỉ làm việc</CardTitle>
  </CardHeader>
  <CardContent>
    {task.geoLocation ? (
      <>
        {task.geoLocation.name && (
          <Text className="font-sans-medium">{task.geoLocation.name}</Text>
        )}
        {task.geoLocation.address && (
          <Text className="text-muted-foreground text-sm">
            {task.geoLocation.address}
          </Text>
        )}
      </>
    ) : (
      <Text className="text-muted-foreground">Chưa có địa chỉ</Text>
    )}
  </CardContent>
</Card>
```

**Customer Info Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Thông tin khách hàng</CardTitle>
  </CardHeader>
  <CardContent>
    <Text className="font-sans-medium">
      {task.customer?.name || 'Không có tên'}
    </Text>
    <Text className="text-muted-foreground">
      {task.customer?.phone || 'Không có số điện thoại'}
    </Text>
  </CardContent>
</Card>
```

**Description Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Mô tả công việc</CardTitle>
  </CardHeader>
  <CardContent>
    <Text>{task.description || 'Chưa có mô tả'}</Text>
  </CardContent>
</Card>
```

**Assignee Card (Role-based):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Nhân viên thực hiện</CardTitle>
  </CardHeader>
  <CardContent>
    {appRole === 'admin' ? (
      <InlineEditableBottomSheet
        bottomSheetContent={
          <UserSelectBottomSheetModal
            onChangeSelectedUserIds={setAssigneeIds}
            selectedUserIds={assigneeIds}
          />
        }
        onClose={saveAssignees}
        trigger={
          <View>
            {assigneeIds.length === 0 ? (
              <Text className="text-muted-foreground">
                Chưa có nhân viên được giao
              </Text>
            ) : (
              assigneeIds.map((userId) => (
                <UserFullName key={userId} userId={userId} />
              ))
            )}
          </View>
        }
      />
    ) : (
      <View>
        {task.assigneeIds.length === 0 ? (
          <Text className="text-muted-foreground">
            Chưa có nhân viên được giao
          </Text>
        ) : (
          task.assigneeIds.map((userId) => (
            <UserFullName key={userId} userId={userId} />
          ))
        )}
      </View>
    )}
  </CardContent>
</Card>
```

**Attachments Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Tệp đính kèm</CardTitle>
  </CardHeader>
  <CardContent className="gap-3">
    <AttachmentList attachments={task.attachments || []} />
    <AttachmentUploader
      assigneeIds={task.assigneeIds}
      taskId={task.id}
    />
  </CardContent>
</Card>
```

### Phase 2: Create Comment Component

**New File:** `apps/mobile/components/task-comment-box.tsx`

```tsx
import { ArrowUpIcon, ImagePlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'

export type TaskCommentBoxProps = {
  taskId: number
  onCommentSent?: () => void
}

export const TaskCommentBox = ({ taskId, onCommentSent }: TaskCommentBoxProps) => {
  const [commentText, setCommentText] = useState('')

  const handleSendComment = async () => {
    // TODO: Implement comment sending logic
    console.log('Sending comment:', commentText, 'for task:', taskId)
    setCommentText('')
    onCommentSent?.()
  }

  const handleAddPhoto = () => {
    // TODO: Implement photo attachment
    console.log('Add photo to comment')
  }

  return (
    <View className="gap-2">
      <Textarea
        placeholder="Viết bình luận..."
        value={commentText}
        onChangeText={setCommentText}
        multiline
        numberOfLines={3}
      />
      <View className="flex-row gap-2 justify-end">
        <Button variant="outline" size="sm" onPress={handleAddPhoto}>
          <Icon as={ImagePlusIcon} />
          <Text>Thêm ảnh</Text>
        </Button>
        <Button
          size="sm"
          onPress={handleSendComment}
          disabled={!commentText.trim()}
        >
          <Icon as={ArrowUpIcon} />
          <Text>Gửi</Text>
        </Button>
      </View>
    </View>
  )
}
```

### Phase 3: Update View Screens

**File:** `apps/mobile/app/worker/tasks/[taskId]/view.tsx`

Changes:
- Remove `TaskBottomActions` import and usage
- Update layout spacing
- Wrap ActivityFeed in Card with comment box

```tsx
<ScrollView
  contentContainerClassName="gap-3 p-4 pb-safe"
  refreshControl={
    <RefreshControl
      onRefresh={handleRefetch}
      refreshing={isRefetching}
    />
  }
>
  {task && <TaskDetails task={task} />}

  {/* Activities Card with Comment Box */}
  <Card>
    <CardHeader>
      <CardTitle>Hoạt động</CardTitle>
    </CardHeader>
    <CardContent className="gap-4">
      <TaskCommentBox taskId={task.id} onCommentSent={handleRefetch} />
      <Separator />
      <ActivityFeed topic={`TASK_${taskId}`} />
    </CardContent>
  </Card>
</ScrollView>
```

**File:** `apps/mobile/app/admin/tasks/[taskId]/view.tsx`

Similar changes as worker view:
- Remove `TaskAction` from bottom (now in TaskDetails CTA row)
- Remove `TaskAssignees` component (now in TaskDetails assignee card)
- Add Activities Card with comment box

### Phase 4: Update TaskAction Component

**File:** `apps/mobile/components/task-action.tsx`

Simplify to return just the status transition logic that can be used in the CTA row.

### Phase 5: Deprecate TaskBottomActions

**File:** `apps/mobile/components/task-bottom-actions.tsx`

- Add deprecation comment
- This component is no longer used

## Testing Scenarios

### Worker View
- [ ] Header displays correctly (ID badge, title, status badge)
- [ ] Status transition button works (Bắt đầu → Hoàn thành)
- [ ] Status transition button disabled when task completed
- [ ] Map button opens Google Maps when location available
- [ ] Map button disabled when no location
- [ ] Call button initiates phone call when phone available
- [ ] Call button disabled when no phone
- [ ] All cards render correctly
- [ ] Assignee section is read-only
- [ ] Comment box sends comments
- [ ] Comment box clears after sending
- [ ] Activity feed updates after comment

### Admin View
- [ ] Same as worker view PLUS:
- [ ] Can edit assignees in assignee card
- [ ] Assignee bottom sheet works
- [ ] Assignee changes save correctly

### General
- [ ] Pull-to-refresh works
- [ ] Loading states display correctly
- [ ] Empty states handled
- [ ] Card spacing and layout looks good
- [ ] Icons display correctly
- [ ] All Vietnamese text displays correctly

## Files Modified

### Modified Files
1. `apps/mobile/components/task-details.tsx` - Main redesign
2. `apps/mobile/components/task-action.tsx` - Simplified for CTA row
3. `apps/mobile/app/worker/tasks/[taskId]/view.tsx` - Layout updates
4. `apps/mobile/app/admin/tasks/[taskId]/view.tsx` - Layout updates
5. `apps/mobile/components/task-bottom-actions.tsx` - Deprecated

### New Files
1. `apps/mobile/components/task-comment-box.tsx` - Comment box component

## Notes

### Design Decisions

**Why flat header?**
- User specifically requested header to be flat (no Card wrapper)
- Makes task title and status more prominent
- Reduces visual nesting

**Why 3 CTA buttons?**
- Primary action (status transition) gets most space (flex-1)
- Secondary actions (map, call) are icon-only for compactness
- All buttons in one row for quick access

**Why comment box in Activities card?**
- Better context - comments are activities
- Removes bottom sheet complexity
- More intuitive UX - write comment where you see activities

**Why role-based assignee editing?**
- Admins need to assign tasks
- Workers should see who's assigned but not change it
- Maintains proper access control

### React Native Reusables Components Used

- `Card` (with CardHeader, CardTitle, CardContent)
- `Badge` (outline variant for task ID)
- `Button` (default and outline variants)
- `Icon` (lucide-react-native)
- `Text` (various variants)
- `Separator`
- `Textarea` (for comment box)

### TODO for Comment Box Implementation

- [ ] Implement actual comment sending API call
- [ ] Implement photo attachment for comments
- [ ] Add error handling
- [ ] Add success feedback (toast?)
- [ ] Consider character limit/validation
