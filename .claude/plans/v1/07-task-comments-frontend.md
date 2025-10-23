# Task Comments System - Frontend Implementation

**Parent Plan:** [07-task-comments.md](./07-task-comments.md)
**Related:** [Common Specifications](./07-task-comments-common.md) | [Backend Implementation](./07-task-comments-backend.md)

---

## Overview

Frontend implementation for task comments in the React Native mobile app. The UI component (`TaskCommentBox`) already exists - we just need to wire it up to the API and add photo selection.

### Implementation Strategy
- **Phase 1**: Wire existing component to API (1 hour, ~30 lines)
- **Phase 2**: Add photo selection (2 hours, ~70 lines)
- **Total**: 3 hours, ~100 lines of frontend code

---

## Existing Component: TaskCommentBox

**Current State:** The component exists but is not connected to the backend.

**File:** `apps/mobile/components/task-comment-box.tsx`

```tsx
// Current component (simplified)
export const TaskCommentBox: FC<TaskCommentBoxProps> = ({
  taskId,
  onCommentSent,
}) => {
  const [commentText, setCommentText] = useState('')

  const handleSendComment = async () => {
    // TODO: Implement comment sending logic
    console.log('Sending comment:', commentText, 'for task:', taskId)
    setCommentText('')
    onCommentSent?.()
  }

  const handleAddPhoto = () => {
    // TODO: Implement photo attachment for comments
    console.log('Add photo to comment')
  }

  return (
    <View className="gap-2">
      <Textarea
        placeholder="Viết bình luận..."
        value={commentText}
        onChangeText={setCommentText}
      />
      <View className="flex-row justify-end gap-2">
        <Button onPress={handleAddPhoto}>
          <Icon as={ImagePlusIcon} />
          <Text>Thêm ảnh</Text>
        </Button>
        <Button onPress={handleSendComment} disabled={!commentText.trim()}>
          <Icon as={ArrowUpIcon} />
          <Text>Gửi</Text>
        </Button>
      </View>
    </View>
  )
}
```

---

## Phase 1: Connect to API

### Step 1: Create API Hook

**File:** `apps/mobile/hooks/useTaskComment.ts` (NEW)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface CommentData {
  taskId: number
  comment: string
  files?: File[]
}

export function useTaskComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ taskId, comment, files }: CommentData) => {
      const formData = new FormData()
      formData.append('comment', comment)

      // Add files if provided
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`files[${index}]`, file)
        })
      }

      const response = await callHonoApi(
        `/v1/tasks/${taskId}/comment`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to add comment')
      }

      return response.activity
    },
    onSuccess: (_, { taskId }) => {
      // Invalidate task activities to show new comment
      queryClient.invalidateQueries({
        queryKey: ['task-activities', taskId],
      })

      // Invalidate task details to update attachment count
      queryClient.invalidateQueries({
        queryKey: ['task', taskId],
      })

      toast({
        title: 'Bình luận đã được gửi',
        variant: 'default',
      })
    },
    onError: (error) => {
      toast({
        title: 'Không thể gửi bình luận',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
```

### Step 2: Wire Component to Hook

**File:** `apps/mobile/components/task-comment-box.tsx` (UPDATE)

```tsx
import { ArrowUpIcon, ImagePlusIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'
import { useTaskComment } from '@/hooks/useTaskComment'

export type TaskCommentBoxProps = {
  taskId: number
  onCommentSent?: () => void
}

export const TaskCommentBox: FC<TaskCommentBoxProps> = ({
  taskId,
  onCommentSent,
}) => {
  const [commentText, setCommentText] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])

  const addComment = useTaskComment()

  const handleSendComment = async () => {
    if (!commentText.trim()) return

    try {
      await addComment.mutateAsync({
        taskId,
        comment: commentText,
        files: selectedPhotos,
      })

      // Clear form on success
      setCommentText('')
      setSelectedPhotos([])
      onCommentSent?.()
    } catch (error) {
      // Error handled by hook
      console.error('Failed to send comment:', error)
    }
  }

  const handleAddPhoto = () => {
    // Phase 2: Will implement photo selection
    console.log('Photo selection coming in Phase 2')
  }

  const isLoading = addComment.isPending
  const hasContent = commentText.trim().length > 0 || selectedPhotos.length > 0

  return (
    <View className="gap-2">
      <Textarea
        className="!rounded-md !bg-background dark:!border-white/20"
        multiline
        numberOfLines={3}
        onChangeText={setCommentText}
        placeholder="Viết bình luận..."
        value={commentText}
        editable={!isLoading}
      />

      {selectedPhotos.length > 0 && (
        <View className="flex-row gap-1">
          <Text className="text-sm text-muted-foreground">
            {selectedPhotos.length} ảnh đã chọn
          </Text>
        </View>
      )}

      <View className="flex-row justify-end gap-2">
        <Button
          className="dark:border-white/20"
          onPress={handleAddPhoto}
          size="sm"
          variant="outline"
          disabled={isLoading || selectedPhotos.length >= 5}
        >
          <Icon as={ImagePlusIcon} />
          <Text>Thêm ảnh</Text>
        </Button>

        <Button
          disabled={!hasContent || isLoading}
          onPress={handleSendComment}
          size="sm"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon as={ArrowUpIcon} className="text-primary-foreground" />
          )}
          <Text>{isLoading ? 'Đang gửi...' : 'Gửi'}</Text>
        </Button>
      </View>
    </View>
  )
}
```

---

## Phase 2: Photo Attachments

### Step 1: Create Photo Selector Component

**File:** `apps/mobile/components/comment-photo-selector.tsx` (NEW)

```tsx
import { useState } from 'react'
import { View, Image, TouchableOpacity, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { X, Camera, Images } from 'lucide-react-native'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

interface CommentPhotoSelectorProps {
  photos: ImagePicker.ImagePickerAsset[]
  onPhotosChange: (photos: ImagePicker.ImagePickerAsset[]) => void
  maxPhotos?: number
  disabled?: boolean
}

export function CommentPhotoSelector({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}: CommentPhotoSelectorProps) {
  const [loading, setLoading] = useState(false)

  const pickFromCamera = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Giới hạn', `Chỉ được chọn tối đa ${maxPhotos} ảnh`)
      return
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera')
      return
    }

    setLoading(true)
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      })

      if (!result.canceled && result.assets[0]) {
        onPhotosChange([...photos, result.assets[0]])
      }
    } finally {
      setLoading(false)
    }
  }

  const pickFromLibrary = async () => {
    const remaining = maxPhotos - photos.length
    if (remaining <= 0) {
      Alert.alert('Giới hạn', `Chỉ được chọn tối đa ${maxPhotos} ảnh`)
      return
    }

    setLoading(true)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      })

      if (!result.canceled && result.assets.length > 0) {
        onPhotosChange([...photos, ...result.assets])
      }
    } finally {
      setLoading(false)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    onPhotosChange(newPhotos)
  }

  return (
    <View className="gap-2">
      {/* Photo preview */}
      {photos.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {photos.map((photo, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: photo.uri }}
                className="h-20 w-20 rounded-lg"
              />
              <TouchableOpacity
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-1"
                onPress={() => removePhoto(index)}
              >
                <Icon as={X} className="text-white" size={12} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add photo buttons */}
      <View className="flex-row gap-2">
        <Button
          size="sm"
          variant="outline"
          onPress={pickFromCamera}
          disabled={disabled || loading || photos.length >= maxPhotos}
        >
          <Icon as={Camera} />
          <Text>Camera</Text>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onPress={pickFromLibrary}
          disabled={disabled || loading || photos.length >= maxPhotos}
        >
          <Icon as={Images} />
          <Text>Thư viện</Text>
        </Button>

        {photos.length > 0 && (
          <Text className="ml-auto self-center text-sm text-muted-foreground">
            {photos.length}/{maxPhotos} ảnh
          </Text>
        )}
      </View>
    </View>
  )
}
```

### Step 2: Integrate Photo Selector with Comment Box

**File:** `apps/mobile/components/task-comment-box.tsx` (UPDATE)

```tsx
import { ArrowUpIcon, ImagePlusIcon, X } from 'lucide-react-native'
import { type FC, useState } from 'react'
import { View, ActivityIndicator, ScrollView, Image, TouchableOpacity } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'
import { useTaskComment } from '@/hooks/useTaskComment'
import { CommentPhotoSelector } from './comment-photo-selector'

export type TaskCommentBoxProps = {
  taskId: number
  onCommentSent?: () => void
}

export const TaskCommentBox: FC<TaskCommentBoxProps> = ({
  taskId,
  onCommentSent,
}) => {
  const [commentText, setCommentText] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [showPhotoSelector, setShowPhotoSelector] = useState(false)

  const addComment = useTaskComment()

  const handleSendComment = async () => {
    if (!commentText.trim() && selectedPhotos.length === 0) return

    try {
      // Convert ImagePicker assets to Files for upload
      const files = await Promise.all(
        selectedPhotos.map(async (photo) => {
          const response = await fetch(photo.uri)
          const blob = await response.blob()
          return new File([blob], photo.fileName || 'photo.jpg', {
            type: photo.mimeType || 'image/jpeg',
          })
        })
      )

      await addComment.mutateAsync({
        taskId,
        comment: commentText,
        files,
      })

      // Clear form on success
      setCommentText('')
      setSelectedPhotos([])
      setShowPhotoSelector(false)
      onCommentSent?.()
    } catch (error) {
      console.error('Failed to send comment:', error)
    }
  }

  const isLoading = addComment.isPending
  const hasContent = commentText.trim().length > 0 || selectedPhotos.length > 0

  return (
    <View className="gap-2">
      <Textarea
        className="!rounded-md !bg-background dark:!border-white/20"
        multiline
        numberOfLines={3}
        onChangeText={setCommentText}
        placeholder="Viết bình luận..."
        value={commentText}
        editable={!isLoading}
      />

      {/* Photo selector */}
      {showPhotoSelector && (
        <CommentPhotoSelector
          photos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          maxPhotos={5}
          disabled={isLoading}
        />
      )}

      <View className="flex-row justify-end gap-2">
        <Button
          className="dark:border-white/20"
          onPress={() => setShowPhotoSelector(!showPhotoSelector)}
          size="sm"
          variant={showPhotoSelector ? "default" : "outline"}
          disabled={isLoading}
        >
          <Icon as={ImagePlusIcon} />
          <Text>
            {selectedPhotos.length > 0
              ? `${selectedPhotos.length} ảnh`
              : 'Thêm ảnh'
            }
          </Text>
        </Button>

        <Button
          disabled={!hasContent || isLoading}
          onPress={handleSendComment}
          size="sm"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon as={ArrowUpIcon} className="text-primary-foreground" />
          )}
          <Text>{isLoading ? 'Đang gửi...' : 'Gửi'}</Text>
        </Button>
      </View>
    </View>
  )
}
```

---

## Display Comments in Activity Feed

Comments automatically appear in the existing activity feed since they use the Activity model.

### Activity Item Rendering

**File:** `apps/mobile/components/activity-item.tsx` (UPDATE EXISTING)

```tsx
// Add to existing activity item component
function renderActivityContent(activity: Activity) {
  const payload = activity.payload as any

  switch (activity.action) {
    case 'TASK_COMMENTED':
      return (
        <View className="gap-2">
          <Text className="text-sm">{payload.comment}</Text>

          {payload.attachments && payload.attachments.length > 0 && (
            <View className="flex-row gap-1">
              {payload.attachments.map((att: any, idx: number) => (
                <TouchableOpacity
                  key={att.id}
                  onPress={() => openAttachment(att)}
                >
                  <Image
                    source={{ uri: getAttachmentUrl(att.id) }}
                    className="h-16 w-16 rounded"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )

    // ... other activity types ...
  }
}

// Activity action labels
function getActionLabel(action: string): string {
  switch (action) {
    case 'TASK_COMMENTED':
      return 'đã bình luận'
    // ... other actions ...
  }
}
```

---

## Implementation Checklist

### Phase 1: Basic Connection ⏳
- [ ] Create `useTaskComment` hook
- [ ] Wire TaskCommentBox to API
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test text comment submission
- [ ] Verify comments appear in feed

### Phase 2: Photo Attachments ⏳
- [ ] Create CommentPhotoSelector component
- [ ] Integrate photo selector with comment box
- [ ] Handle image-to-file conversion
- [ ] Add photo preview in comment box
- [ ] Test photo upload with comments
- [ ] Verify photos appear in task attachments

### UI Polish ⏳
- [ ] Add optimistic updates
- [ ] Add pull-to-refresh for activity feed
- [ ] Add comment count to task card
- [ ] Add keyboard avoiding view
- [ ] Test on iOS and Android

---

## Optimistic Updates

For better UX, show comment immediately while uploading:

```tsx
// In useTaskComment hook
return useMutation({
  mutationFn: async (data: CommentData) => {
    // ... existing code ...
  },
  onMutate: async ({ taskId, comment }) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['task-activities', taskId])

    // Snapshot previous value
    const previous = queryClient.getQueryData(['task-activities', taskId])

    // Optimistically update
    queryClient.setQueryData(['task-activities', taskId], (old: any) => {
      const optimisticActivity = {
        id: `temp-${Date.now()}`,
        action: 'TASK_COMMENTED',
        payload: { type: 'COMMENT', comment },
        userId: currentUserId,
        createdAt: new Date().toISOString(),
        user: { name: currentUserName },
      }
      return [...old, optimisticActivity]
    })

    return { previous }
  },
  onError: (err, variables, context) => {
    // Revert on error
    if (context?.previous) {
      queryClient.setQueryData(
        ['task-activities', variables.taskId],
        context.previous
      )
    }
  },
})
```

---

## Error Handling

### Network Errors
- Show toast with error message
- Keep form data for retry
- Disable buttons during submission

### Validation Errors
- Empty comment: Show inline error
- File too large: Show alert before upload
- Too many files: Disable add button at limit

### Permission Errors
- Camera permission: Show settings prompt
- Photo library permission: Show explanation

---

## Performance Optimizations

### Image Handling
- Compress images before upload (0.8 quality)
- Show thumbnails in preview (small size)
- Lazy load full images in feed
- Cache images with React Query

### State Management
- Use React Query for server state
- Invalidate only affected queries
- Use optimistic updates for instant feedback
- Debounce text input if needed

---

## Testing Scenarios

### Manual Testing Checklist
- [ ] Send text-only comment
- [ ] Send comment with 1 photo
- [ ] Send comment with 5 photos
- [ ] Try to add 6th photo (should block)
- [ ] Send empty comment (should block)
- [ ] Test on slow network
- [ ] Test camera permission flow
- [ ] Test library permission flow
- [ ] Verify comments appear in feed
- [ ] Verify photos appear in attachments
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test in dark mode
- [ ] Test with Vietnamese text

### Edge Cases
- Very long comment (5000 chars)
- Network failure during upload
- App backgrounded during upload
- Multiple rapid submissions
- Switching between tasks while commenting

---

## Integration Points

### Existing Hooks Used
- `useToast()` - For notifications
- `useAuth()` - For user context
- `useTaskActivities()` - For displaying feed

### Existing Components Used
- `Button`, `Icon`, `Text`, `Textarea` - UI components
- `ActivityItem` - For rendering in feed
- `AttachmentViewer` - For viewing photos

### API Integration
- `callHonoApi()` - API client
- FormData for multipart upload
- React Query for state management

---

## Future Enhancements

### v1.1 - Mentions
```tsx
// Add @mention autocomplete
<MentionInput
  value={commentText}
  onChange={setCommentText}
  users={taskAssignedUsers}
/>
```

### v1.2 - Rich Text
```tsx
// Support markdown formatting
<MarkdownEditor
  value={commentText}
  onChange={setCommentText}
/>
```

### v1.3 - Voice Notes
```tsx
// Add voice recording option
<VoiceRecorder
  onRecorded={(audioFile) => {
    setAudioAttachment(audioFile)
  }}
/>
```

### v1.4 - Reactions
```tsx
// Add emoji reactions to comments
<ReactionPicker
  activityId={comment.id}
  onReact={(emoji) => addReaction(emoji)}
/>
```

---

## Success Metrics

### Code Metrics
- ✅ <100 lines of new frontend code
- ✅ 80% component reuse
- ✅ 3 hours implementation time

### UX Metrics
- ✅ Comment submission <2 seconds
- ✅ Instant optimistic updates
- ✅ Clear loading states
- ✅ Helpful error messages

### Quality Metrics
- ✅ Works on iOS and Android
- ✅ Supports Vietnamese text
- ✅ Handles network errors gracefully
- ✅ Accessible UI components