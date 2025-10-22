# Check-in/Check-out System - Frontend/Mobile Implementation

**Parent Plan:** [02-checkin-checkout.md](./02-checkin-checkout.md)
**Related:** [Common Specifications](./02-checkin-checkout-common.md) | [Backend Implementation](./02-checkin-checkout-backend.md)

---

## Mobile UI Architecture (Abstracted)

### Shared Component: TaskEventScreen

**Location:** `apps/mobile/components/task-event/TaskEventScreen.tsx`

**Design:** Single generic component handles both check-in and check-out, with behavior driven by props.

```tsx
import { useTaskEvent } from '@/hooks/useTaskEvent'
import type { TaskStatus } from '@prisma/client'

interface TaskEventScreenProps {
  taskId: number
  eventType: 'check-in' | 'check-out'
  config: {
    title: string
    buttonLabel: string
    requiredStatus: TaskStatus
    successMessage: string
  }
}

export function TaskEventScreen({
  taskId,
  eventType,
  config
}: TaskEventScreenProps) {
  const {
    task,
    location,
    distance,
    attachments,        // Changed from photoUri
    notes,
    isSubmitting,
    warnings,
    addAttachment,      // New: add from camera/library/picker
    removeAttachment,   // New: remove attachment
    setNotes,
    handleSubmit,
  } = useTaskEvent(taskId, eventType)

  return (
    <Screen>
      <Header title={config.title} />

      <TaskInfoCard task={task} />

      <LocationVerification
        taskLocation={task.geoLocation}
        currentLocation={location}
        distance={distance}
        warnings={warnings}
      />

      {/* Multiple attachments support */}
      <AttachmentManager
        attachments={attachments}
        onAddFromCamera={() => addAttachment('camera')}
        onAddFromLibrary={() => addAttachment('library')}
        onAddFromFiles={() => addAttachment('files')}
        onRemove={removeAttachment}
        minRequired={1}
        eventType={eventType}
      />

      <NotesInput
        value={notes}
        onChange={setNotes}
        placeholder="Ghi chú (tùy chọn)"
      />

      <SubmitButton
        disabled={attachments.length === 0 || !location || isSubmitting}
        onPress={handleSubmit}
        loading={isSubmitting}
      >
        {config.buttonLabel}
      </SubmitButton>
    </Screen>
  )
}
```

---

## Shared Hook: useTaskEvent

**Location:** `apps/mobile/hooks/useTaskEvent.ts`

**Design:** All business logic centralized in a single hook.

```typescript
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api'
import { calculateDistance } from '@/lib/geo'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'

const DISTANCE_THRESHOLD = 100 // meters

interface Attachment {
  uri: string
  type: 'image' | 'video' | 'document'
  filename: string
  mimeType: string
}

export function useTaskEvent(
  taskId: number,
  eventType: 'check-in' | 'check-out'
) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState<Location | null>(null)

  // Fetch task data
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  // Mutation handles both check-in and check-out
  const mutation = useMutation({
    mutationFn: async (data: TaskEventData) => {
      // Convert attachments to File objects
      const files = await Promise.all(
        attachments.map(async (att) => {
          const response = await fetch(att.uri)
          const blob = await response.blob()
          return new File([blob], att.filename, { type: att.mimeType })
        })
      )

      return eventType === 'check-in'
        ? callHonoApi.task.checkIn(taskId, { ...data, files })
        : callHonoApi.task.checkOut(taskId, { ...data, files })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', taskId])
      showToast('success', `${eventType} thành công`)
      router.back()
    },
    onError: (error) => {
      showToast('error', error.message)
    },
  })

  // Get GPS location on mount
  useEffect(() => {
    requestLocationPermission().then(() => {
      getCurrentLocation().then(setLocation)
    })
  }, [])

  // Calculate distance
  const distance = useMemo(() => {
    if (!location || !task?.geoLocation) return null
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      task.geoLocation.lat,
      task.geoLocation.lng
    )
  }, [location, task])

  // Generate warnings
  const warnings = useMemo(() => {
    const w: string[] = []
    if (distance && distance > DISTANCE_THRESHOLD) {
      w.push(`Bạn đang ở cách vị trí công việc ${Math.round(distance)}m`)
    }
    return w
  }, [distance])

  // Add attachment from different sources
  const addAttachment = async (source: 'camera' | 'library' | 'files') => {
    try {
      if (source === 'camera') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,
          quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0]
          setAttachments(prev => [...prev, {
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            filename: `${eventType}-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
            mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          }])
        }
      } else if (source === 'library') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,
          allowsMultipleSelection: true,
          quality: 0.8,
        })

        if (!result.canceled) {
          const newAttachments = result.assets.map((asset, idx) => ({
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            filename: `${eventType}-${Date.now()}-${idx}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
            mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          }))
          setAttachments(prev => [...prev, ...newAttachments])
        }
      } else if (source === 'files') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*', 'video/*'],
          multiple: true,
        })

        if (!result.canceled) {
          const newAttachments = result.assets.map((asset) => ({
            uri: asset.uri,
            type: asset.mimeType?.startsWith('image/') ? 'image' :
                  asset.mimeType?.startsWith('video/') ? 'video' : 'document',
            filename: asset.name,
            mimeType: asset.mimeType || 'application/octet-stream',
          }))
          setAttachments(prev => [...prev, ...newAttachments])
        }
      }
    } catch (error) {
      showToast('error', 'Không thể thêm tệp đính kèm')
    }
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!location || attachments.length === 0) return

    mutation.mutate({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      notes: notes || undefined,
    })
  }

  return {
    task,
    location,
    distance,
    attachments,        // Changed from photoUri
    notes,
    isSubmitting: mutation.isPending,
    warnings,
    addAttachment,      // New
    removeAttachment,   // New
    setNotes,
    handleSubmit,
  }
}
```

**Key Changes:**
- ✅ Multiple attachments support via array
- ✅ Three attachment sources: camera, library, files
- ✅ Supports images, videos, and documents
- ✅ Reuses Expo's ImagePicker and DocumentPicker
- ✅ Converts URIs to File objects for upload
- ✅ Add/remove attachment management

---

## New Component: AttachmentManager

**Location:** `apps/mobile/components/task-event/AttachmentManager.tsx`

**Design:** Reusable component for managing multiple attachments (similar to task attachments).

```tsx
interface AttachmentManagerProps {
  attachments: Attachment[]
  onAddFromCamera: () => void
  onAddFromLibrary: () => void
  onAddFromFiles: () => void
  onRemove: (index: number) => void
  minRequired?: number
  maxAllowed?: number
  eventType: 'check-in' | 'check-out'
}

export function AttachmentManager({
  attachments,
  onAddFromCamera,
  onAddFromLibrary,
  onAddFromFiles,
  onRemove,
  minRequired = 1,
  maxAllowed = 10,
  eventType,
}: AttachmentManagerProps) {
  const canAddMore = attachments.length < maxAllowed

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">
          Tệp đính kèm {eventType === 'check-in' ? 'check-in' : 'check-out'}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {attachments.length}/{maxAllowed}
          {minRequired > 0 && ` (tối thiểu ${minRequired})`}
        </Text>
      </View>

      {/* Attachment Grid */}
      {attachments.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {attachments.map((attachment, index) => (
              <AttachmentThumbnail
                key={index}
                attachment={attachment}
                onRemove={() => onRemove(index)}
                showRemoveButton
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Buttons */}
      {canAddMore && (
        <View className="flex-row gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onPress={onAddFromCamera}
            className="flex-1 min-w-[100px]"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            Chụp ảnh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={onAddFromLibrary}
            className="flex-1 min-w-[100px]"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Thư viện
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={onAddFromFiles}
            className="flex-1 min-w-[100px]"
          >
            <FileIcon className="w-4 h-4 mr-2" />
            Tệp tin
          </Button>
        </View>
      )}

      {/* Validation Message */}
      {attachments.length < minRequired && (
        <Text className="text-sm text-destructive">
          Cần ít nhất {minRequired} tệp đính kèm
        </Text>
      )}
    </View>
  )
}
```

**Features:**
- ✅ Three upload sources: Camera, Library, Files
- ✅ Multiple selection support
- ✅ Thumbnail grid display
- ✅ Remove individual attachments
- ✅ Min/max validation with visual feedback
- ✅ Reuses existing `AttachmentThumbnail` component
- ✅ Similar UX to task attachments

---

## Worker Screens (Thin Wrappers)

### Check-in Screen

**Location:** `apps/mobile/app/worker/tasks/[taskId]/check-in.tsx`

```tsx
import { TaskEventScreen } from '@/components/task-event/TaskEventScreen'

export default function CheckInScreen() {
  const { taskId } = useLocalSearchParams()

  return (
    <TaskEventScreen
      taskId={Number(taskId)}
      eventType="check-in"
      config={{
        title: 'Check-in',
        buttonLabel: 'Check-in',
        requiredStatus: 'READY',
        successMessage: 'Check-in thành công',
      }}
    />
  )
}
```

### Check-out Screen

**Location:** `apps/mobile/app/worker/tasks/[taskId]/check-out.tsx`

```tsx
import { TaskEventScreen } from '@/components/task-event/TaskEventScreen'

export default function CheckOutScreen() {
  const { taskId } = useLocalSearchParams()

  return (
    <TaskEventScreen
      taskId={Number(taskId)}
      eventType="check-out"
      config={{
        title: 'Check-out',
        buttonLabel: 'Check-out',
        requiredStatus: 'IN_PROGRESS',
        successMessage: 'Check-out thành công',
      }}
    />
  )
}
```

**Benefits:**
- ✅ Single source of truth for UI logic
- ✅ ~95% code reuse between screens
- ✅ Easy to maintain and update
- ✅ Consistent UX between check-in and check-out
- ✅ Simple to add new event types (breaks, pauses)

---

## Task Details Enhancements

### Worker: Task Details Actions

**Action Buttons** based on task status:
- READY status → Show "Check-in" button
- IN_PROGRESS status → Show "Check-out" button
- COMPLETED status → Show check-in/out history

### Attachments Section (Critical Requirement)

```tsx
// Task details screen
<TaskDetailsScreen>
  {/* ... other sections ... */}

  {/* Attachments Section - Shows ALL attachments */}
  <AttachmentsSection>
    <SectionHeader>
      Tệp đính kèm ({task.attachments.length})
    </SectionHeader>

    {/* All attachments: regular + event-based */}
    <AttachmentGrid>
      {task.attachments.map(attachment => (
        <AttachmentThumbnail
          key={attachment.id}
          attachment={attachment}
          onPress={() => viewAttachment(attachment)}
          // Show badge indicating source
          badge={
            attachment.taskEvent?.type === 'CHECK_IN' ? 'Check-in' :
            attachment.taskEvent?.type === 'CHECK_OUT' ? 'Check-out' :
            null
          }
        />
      ))}
    </AttachmentGrid>
  </AttachmentsSection>
</TaskDetailsScreen>
```

**How It Works:**

1. **Upload During Check-in/out**:
   - Worker uploads 3 photos during check-in
   - `uploadTaskAttachments()` creates Attachment records with `taskId`
   - Transaction links attachments to event: `attachment.taskEventId = event.id`

2. **Query in Task Details**:
   ```typescript
   const task = await prisma.task.findUnique({
     where: { id: taskId },
     include: {
       attachments: {
         where: { deletedAt: null },
         orderBy: { createdAt: 'desc' },
       },
     },
   })
   // task.attachments includes:
   // - Regular task attachments (taskEventId = null)
   // - Event attachments (taskEventId = some_event_id)
   //   - Can check event.type to see if CHECK_IN or CHECK_OUT
   ```

3. **Display in UI**:
   - All attachments appear in task attachments section
   - Optional badge shows if from event (and which type: check-in/check-out)
   - No separation needed - unified view
   - Clicking attachment opens viewer with full metadata

**Benefits:**
- ✅ Single source of truth for all task-related files
- ✅ No need to switch between sections
- ✅ Chronological timeline of all uploads
- ✅ Can still filter by event type if needed
- ✅ Automatic - no extra code required

### Event History with Multiple Attachments

```tsx
<TaskEventHistory>
  {task.events.map(event => (
    <HistoryItem key={event.id} type={event.type}>
      <EventTypeBadge>{event.type === 'CHECK_IN' ? 'Check-in' : 'Check-out'}</EventTypeBadge>
      <Avatar userId={event.userId} />
      <Time>{event.createdAt}</Time>
      <Location>{event.geoLocation}</Location>

      {/* Multiple attachments display */}
      <AttachmentGrid>
        {event.attachments.map(attachment => (
          <AttachmentThumbnail
            key={attachment.id}
            attachment={attachment}
            onPress={() => viewAttachment(attachment)}
          />
        ))}
        <AttachmentCount>{event.attachments.length} files</AttachmentCount>
      </AttachmentGrid>

      <Distance>{event.distanceFromTask}m</Distance>
    </HistoryItem>
  ))}
</TaskEventHistory>
```

---

## Admin Features

### Task Details Enhancements

**Features:**
- View all events (check-ins/check-outs) for task
- See photos and GPS locations
- View distance from task location
- See which workers performed events
- View timestamps
- Map view showing event locations

### Map View

```tsx
<MapView>
  <Marker
    coordinate={task.geoLocation}
    title="Task Location"
    pinColor="blue"
  />

  {task.events.map(event => (
    <Marker
      key={event.id}
      coordinate={event.geoLocation}
      title={`${event.type === 'CHECK_IN' ? 'Check-in' : 'Check-out'}: ${event.user.name}`}
      pinColor={event.type === 'CHECK_IN' ? 'green' : 'red'}
    />
  ))}
</MapView>
```

---

## E2E Testing

- Worker check-in flow → task status changes → worker can check-out
- Multiple workers on same task → separate check-ins
- GPS verification with mock locations
- Photo upload in check-in flow

---

## Implementation Checklist

### Mobile UI Implementation (Week 3, Days 4-5)

- [ ] Create shared `TaskEventScreen` component
- [ ] Create shared `useTaskEvent` hook
  - [ ] Multiple attachment state management
  - [ ] Camera, library, and file picker integration
  - [ ] Add/remove attachment methods
- [ ] Create shared UI components:
  - [ ] `LocationVerification`
  - [ ] **`AttachmentManager`** (NEW - supports multiple sources)
  - [ ] `DistanceIndicator`
  - [ ] Reuse existing `AttachmentThumbnail`
- [ ] Create thin wrapper screens for check-in and check-out
- [ ] **Integrate with existing task details screen**
  - [ ] **Verify task.attachments includes check-in/out attachments**
  - [ ] Add optional badges for attachment source (check-in/check-out)
  - [ ] Update history to show multiple attachments per event
  - [ ] Test unified view works correctly
- [ ] Add API client methods for check-in/out
- [ ] Test GPS permission flow
- [ ] Test camera integration (single photo/video)
- [ ] Test library picker (multiple selection)
- [ ] Test file picker (documents)
- [ ] Test attachment upload flow (multiple files)

### Admin Features (Week 4, Days 1-2)

- [ ] Add check-in/out history to task details
  - [ ] Display multiple attachments in grid
  - [ ] Attachment count badge
- [ ] Create timeline view component
- [ ] Add map view with markers
- [ ] Show distance indicators in history
- [ ] Test viewing multiple events with multiple attachments
- [ ] Add attachment viewer (lightbox for images/videos)

### Testing & Polish (Week 4, Days 3-5)

- [ ] E2E test: Complete check-in → check-out flow
  - [ ] With single attachment
  - [ ] With multiple attachments (images + videos + docs)
- [ ] Test error scenarios
  - [ ] No GPS
  - [ ] No attachments
  - [ ] Wrong status
  - [ ] Exceeds max attachments (10+)
- [ ] Test multiple workers on same task
- [ ] Field test with actual devices and poor GPS
- [ ] Test attachment uploads on slow network
  - [ ] Progress indicators
  - [ ] Retry logic
  - [ ] Queue multiple uploads
- [ ] Add loading states and error messages
- [ ] Vietnamese language review
- [ ] Performance testing
  - [ ] Multiple large files
  - [ ] Thumbnail generation
- [ ] Security review
  - [ ] Attachment type validation
  - [ ] File size limits

### Success Metrics

- [ ] All automated tests passing (>80% coverage)
- [ ] Check-in/out completes in <10 seconds on 4G (with 3 photos)
- [ ] GPS accuracy within 50m in urban areas
- [ ] Attachment uploads succeed >95% of the time
- [ ] Zero code duplication between check-in and check-out
- [ ] Successfully field tested with 3+ workers
- [ ] Support 1-10 attachments per event
- [ ] **🔴 CRITICAL: Check-in/out attachments appear in task.attachments**
- [ ] **🔴 CRITICAL: Check-in/out events appear in activity feed with GPS data**
- [ ] **🔴 CRITICAL: Activity payload contains attachment summaries for UI**
- [ ] Activity feed shows chronological history: attachments → check-in → check-out
- [ ] Can fetch full attachment details using IDs from activity payload