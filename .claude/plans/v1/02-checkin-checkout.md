# Phase 2: Check-in/Check-out System

**Timeline:** Week 3-4
**Priority:** 🔴 Critical
**Status:** ⏳ Not Started

---

## 📋 Implementation Summary (Read This First!)

**What we're building:** GPS-verified check-in/out with photos when workers start/finish tasks.

**How we're building it:** Reuse existing Activity system - NO new database models needed!

### Quick Reference

**Database:** No changes! Uses existing Activity + Attachment models

**Service Layer:**
```typescript
// Check-in flow:
1. uploadTaskAttachments() → creates Attachment records with taskId
2. createActivity() → action='TASK_CHECKED_IN', payload has GPS + attachment summaries
3. Update task.status = 'IN_PROGRESS'

// Check-out flow: Same but validates IN_PROGRESS, creates CHECK_OUT activity
```

**Activity Payload Structure:**
```typescript
{
  type: 'CHECK_IN' | 'CHECK_OUT',
  geoLocation: { id, lat, lng },
  distanceFromTask: 15.3,
  attachments: [{ id, mimeType, originalFilename }],  // Summary for UI
  notes: "Optional worker notes"
}
```

**Key Files to Create:**
- `apps/api/src/lib/geo.ts` - GPS utilities
- `apps/api/src/v1/task-events/task-event.service.ts` - Check-in/out logic
- `apps/api/src/v1/task-events/route.ts` - API endpoints
- `packages/validation/src/check-in.zod.ts` - Input validation
- Mobile UI components (see Phase 2 checklist)

**Result:**
- ✅ Activity feed shows all events: status changes, attachments, check-ins/outs
- ✅ Attachments appear in task.attachments (they have taskId)
- ✅ GPS data and metadata stored in activity payload
- ✅ No migration risk, simple rollback if needed

---

## Overview

Implement GPS-verified check-in/check-out system with **multiple attachment support** when workers start and finish tasks. This is a core contract requirement to ensure workers are physically present at job locations.

### Key Features
- ✅ **Multiple Attachments**: Support 1-10 files per check-in/out (photos, videos, documents)
- ✅ **Multiple Sources**: Camera, photo library, or file picker
- ✅ **GPS Verification**: Distance calculation with configurable threshold
- ✅ **Abstracted Architecture**: 43% code reduction through shared logic
- ✅ **Reuses Existing Infrastructure**: Same attachment system as task attachments

### 🔴 Critical Requirements

**1. Attachments MUST appear in task.attachments**
- All check-in/out photos automatically visible in task attachments list
- Achieved by uploading to task (sets taskId on attachment)
- No separate attachment storage needed

**2. Events MUST appear in Activity feed**
- Check-ins and check-outs appear in unified activity feed
- Activity payload contains GPS data, distance, attachment summaries
- Feed shows chronological history: status changes → attachments → check-in → check-out

**Benefits:**
- ✅ Single source of truth for all task-related files
- ✅ Complete activity history in one chronological feed
- ✅ Can show attachment thumbnails inline with check-in/out events
- ✅ Maintains traceability while simplifying UX

## Contract Requirements

From the contract:
- **Admin:** Monitor worker check-ins/check-outs with GPS and photos
- **Worker:** Check-in when starting work with GPS + photo
- **Worker:** Check-out when finishing work with GPS + photo

## Current State

- ⏳ Basic status updates exist (`PUT /v1/task/:id/status`)
- ⏳ GPS location model exists (GeoLocation)
- ⏳ Photo upload exists (Attachment)
- ❌ No dedicated check-in/out endpoints
- ❌ No GPS verification logic
- ❌ No photo requirement enforcement
- ❌ Status change not tied to location/photo

---

## Architecture Decision: Activity-Based Events (Following Existing Pattern)

**Decision:** Implement check-in and check-out using the **existing Activity pattern**:
1. **Upload attachments to task** using existing `uploadTaskAttachments` service
2. **Create Activity** with rich JSON payload containing attachment IDs (just like `TASK_ATTACHMENTS_UPLOADED`)
3. **No schema changes needed** - Reuse existing models completely!
4. **Shared service logic** via configuration objects
5. **Shared UI components** with behavior driven by props

**Rationale:**
- ✅ **100% reuses existing patterns** - Follows exact same flow as `TASK_ATTACHMENTS_UPLOADED`
- ✅ **Zero schema changes** - No new models, no new fields!
- ✅ **Unified activity feed** - All task events appear in one chronological feed
- ✅ **Flexible payload** - JSON field stores event-specific data (location, distance, attachmentIds)
- ✅ Abstraction reduces code by ~50% (from ~1,150 to ~575 lines)
- ✅ **Simpler than any alternative** - Uses what already exists and works
- ✅ **Future-proof** - Easy to add BREAK, PAUSE, or any event type
- ✅ **Built-in querying** - Activity already indexed by topic, userId, createdAt

**Pattern:** Upload to task → Create activity with payload (exactly like existing attachment upload)

**Activity Actions:**
- `TASK_CHECKED_IN` - Worker checked in to task
- `TASK_CHECKED_OUT` - Worker checked out from task

**Activity Payload Schema** (mirrors existing `TASK_ATTACHMENTS_UPLOADED` pattern):
```typescript
{
  type: 'CHECK_IN' | 'CHECK_OUT',
  geoLocation: {
    id: string,
    lat: number,
    lng: number,
    address?: string
  },
  distanceFromTask: number,  // meters
  attachments: Array<{       // Summary of attachments (like TASK_ATTACHMENTS_UPLOADED)
    id: string,
    mimeType: string,
    originalFilename: string
  }>,
  notes?: string,
  warnings?: string[]
}
```

---

## Database Changes

### 🎉 ZERO Schema Changes Required!

**Architecture Decision:** Use existing models exactly as they are. Follow the same pattern as `TASK_ATTACHMENTS_UPLOADED`.

**Why This Approach:**
- ✅ **No migration needed** - Uses existing Activity and Attachment models as-is
- ✅ **Proven pattern** - Follows exact same flow as attachment uploads
- ✅ **Unified feed** - All task activities (status changes, check-ins, attachments) in one place
- ✅ **Already indexed** - Activity has indexes on userId, topic, createdAt
- ✅ **Flexible** - JSON payload can evolve without migrations
- ✅ **Consistent** - Follows existing patterns in the codebase

**How It Works (Exact Same Pattern as TASK_ATTACHMENTS_UPLOADED):**

1. **Upload attachments using existing service**:
   ```typescript
   const attachments = await uploadTaskAttachments({
     taskId,
     files,
     user,
     storage
   })
   // Returns attachments with taskId set, already persisted to DB
   ```

2. **Create activity with attachment summary in payload**:
   ```typescript
   const attachmentSummary = attachments.map(att => ({
     id: att.id,
     mimeType: att.mimeType,
     originalFilename: att.originalFilename
   }))

   await createActivity({
     action: 'TASK_CHECKED_IN',
     userId: user.id,
     topic: { entityType: 'TASK', entityId: taskId },
     payload: {
       type: 'CHECK_IN',
       geoLocation: { id, lat, lng },
       distanceFromTask: 15.3,
       attachments: attachmentSummary,  // Same as TASK_ATTACHMENTS_UPLOADED!
       notes: 'Starting work'
     }
   })
   ```

3. **Query in UI**:
   ```typescript
   // Get all activities for task
   const activities = await prisma.activity.findMany({
     where: { topic: 'TASK_123' },
     orderBy: { createdAt: 'desc' }
   })

   // Check-in/out activities have payload.attachments array
   // Can fetch full attachment details by IDs if needed
   ```

**Benefits:**
- ✅ No new database fields
- ✅ No new models
- ✅ No migration
- ✅ Attachments automatically appear in task.attachments (they have taskId)
- ✅ Activity feed shows attachment summaries in payload
- ✅ Can fetch full attachment details when viewing activity details

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Worker uploads 3 photos during check-in                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ uploadTaskAttachments() service (EXISTING)                  │
│ - Creates 3 Attachment records                              │
│ - Sets taskId = 123 (all 3 attachments)                     │
│ - Returns [att1, att2, att3]                                │
│ - Already creates TASK_ATTACHMENTS_UPLOADED activity        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Create GeoLocation record                                   │
│ - lat, lng, address (optional)                              │
│ - id = geo_xyz789                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Create Activity record (TASK_CHECKED_IN)                    │
│ - userId = worker123                                        │
│ - topic = "TASK_123"                                        │
│ - action = "TASK_CHECKED_IN"                                │
│ - payload = {                                               │
│     type: 'CHECK_IN',                                       │
│     geoLocation: { id, lat, lng },                          │
│     distanceFromTask: 15.3,                                 │
│     attachments: [                                          │
│       { id: att1.id, mimeType, originalFilename },         │
│       { id: att2.id, mimeType, originalFilename },         │
│       { id: att3.id, mimeType, originalFilename }          │
│     ],                                                       │
│     notes: "Starting work"                                  │
│   }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Update task status                                          │
│ - status = IN_PROGRESS                                      │
│ - startedAt = now()                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Result: Activity feed with rich event data                  │
│                                                              │
│ Attachments:                                                 │
│ - taskId = 123 → appears in task.attachments ✓              │
│                                                              │
│ Activities:                                                  │
│ - TASK_ATTACHMENTS_UPLOADED (from uploadTaskAttachments)    │
│ - TASK_CHECKED_IN (with GPS + attachment refs in payload)   │
│                                                              │
│ Query: task.attachments → Returns all 3 attachments ✓       │
│ Query: activities for TASK_123 → Shows full history ✓       │
│ Activity payload → Has attachment IDs for thumbnails ✓      │
└─────────────────────────────────────────────────────────────┘
```

### Migration Steps

**NO MIGRATION NEEDED! 🎉**

Since we're using existing models and patterns, there are no database schema changes required. We can start implementing immediately with zero risk to the existing database.

**Deployment Steps:**
1. **Deploy code** - New check-in/out endpoints and services
2. **Test on production** - Create a test task and try check-in/out
3. **Monitor** - Watch activity feed to ensure events appear correctly
4. **Rollback if needed** - Simple code rollback, no schema changes to revert

---

## API Endpoints

### 1. Check-in to Task

**Endpoint:** `POST /v1/task/:id/check-in`

**Request Body (using multipart/form-data):**
```typescript
{
  latitude: number          // Required
  longitude: number         // Required
  files: File[]            // Multiple files (photos/videos/documents), At least 1 required
  notes?: string           // Optional
}
```

**Alternative: Base64 Upload (for compatibility)**
```typescript
{
  latitude: number          // Required
  longitude: number         // Required
  attachments: Array<{      // At least 1 required
    data: string           // Base64 encoded
    filename: string       // e.g., "photo.jpg"
    mimeType: string       // e.g., "image/jpeg"
  }>
  notes?: string           // Optional
}
```

**Response:**
```typescript
{
  checkIn: {
    id: string
    taskId: number
    userId: string
    geoLocation: {
      id: string
      lat: number
      lng: number
    }
    attachments: Array<{
      id: string
      url: string
      thumbnailUrl?: string
      type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
      filename: string
      size: number
    }>
    attachmentIds: string[]
    distanceFromTask: number
    createdAt: string
  }
  task: {
    // Updated task with status = IN_PROGRESS
    // task.attachments now includes check-in attachments
  }
  warnings?: string[]  // e.g., "GPS accuracy low", "Far from location"
}
```

**Implementation Steps:**

```typescript
// 1. Validate permissions and status
const task = await prisma.task.findUnique({ where: { id: taskId } })
if (!task) throw new Error('TASK_NOT_FOUND')
if (task.status !== 'READY') throw new Error('TASK_NOT_READY')
if (!task.assigneeIds.includes(userId)) throw new Error('NOT_ASSIGNED')

// 2. Validate files provided
if (!files || files.length === 0) throw new Error('ATTACHMENTS_REQUIRED')

// 3. Upload attachments using existing service
const attachments = await uploadTaskAttachments({
  taskId,
  files,  // From camera/library/file picker
  user,
  storage,
})
// This already creates Attachment records with taskId set
// And creates TASK_ATTACHMENTS_UPLOADED activity

// 4. Calculate GPS distance
const distance = calculateDistance(
  task.geoLocation.lat, task.geoLocation.lng,
  latitude, longitude
)
const warnings = distance > 100 ? ['Far from location'] : []

// 5. Create GeoLocation record
const geoLocation = await prisma.geoLocation.create({
  data: { lat: latitude, lng: longitude }
})

// 6. Create Activity with check-in data
const attachmentSummary = attachments.map(a => ({
  id: a.id,
  mimeType: a.mimeType,
  originalFilename: a.originalFilename
}))

await createActivity({
  action: 'TASK_CHECKED_IN',
  userId: user.id,
  topic: { entityType: 'TASK', entityId: taskId },
  payload: {
    type: 'CHECK_IN',
    geoLocation: { id: geoLocation.id, lat: latitude, lng: longitude },
    distanceFromTask: distance,
    attachments: attachmentSummary,
    notes
  }
})

// 7. Update task status
await prisma.task.update({
  where: { id: taskId },
  data: { status: 'IN_PROGRESS', startedAt: new Date() }
})
```

**GPS Verification:**
```typescript
const DISTANCE_THRESHOLD_METERS = 100 // Configurable via env
const GPS_ACCURACY_THRESHOLD = 50     // Meters

function calculateDistance(lat1, lon1, lat2, lon2): number {
  // Haversine formula implementation
}

function verifyLocation(taskLocation, checkInLocation): {
  distance: number
  warnings: string[]
} {
  const distance = calculateDistance(...)
  const warnings = []

  if (distance > DISTANCE_THRESHOLD_METERS) {
    warnings.push('Bạn đang ở xa vị trí công việc')
  }

  return { distance, warnings }
}
```

**Attachment Sources:**
- 📷 **Camera**: Capture photos/videos directly
- 🖼️ **Photo Library**: Select existing photos/videos
- 📁 **File Picker**: Upload documents (PDF, etc.)

**Attachment Validation (reuses existing logic):**
- Max size per file: 10MB
- Allowed types:
  - Images: image/jpeg, image/png, image/webp
  - Videos: video/mp4, video/quicktime
  - Documents: application/pdf
- Generate thumbnails for images/videos
- Calculate blurhash for images
- Extract EXIF data if available (GPS, timestamp)

---

### 2. Check-out from Task

**Endpoint:** `POST /v1/task/:id/check-out`

**Request Body:** Same as check-in (supports multiple attachments)
```typescript
{
  latitude: number          // Required
  longitude: number         // Required
  files: File[]            // Multiple files, At least 1 required
  notes?: string           // Optional
}
```

**Response:** Similar to check-in response structure

**Implementation Steps:** (Same as check-in, but different validations/status)

```typescript
// 1. Validate permissions and status
const task = await prisma.task.findUnique({ where: { id: taskId } })
if (!task) throw new Error('TASK_NOT_FOUND')
if (task.status !== 'IN_PROGRESS') throw new Error('TASK_NOT_IN_PROGRESS')
if (!task.assigneeIds.includes(userId)) throw new Error('NOT_ASSIGNED')

// 2. Verify user has checked in
const checkInActivity = await prisma.activity.findFirst({
  where: {
    topic: `TASK_${taskId}`,
    action: 'TASK_CHECKED_IN',
    userId: user.id
  }
})
if (!checkInActivity) throw new Error('NOT_CHECKED_IN')

// 3-7. Same as check-in:
// - Validate & upload attachments
// - Calculate GPS distance
// - Create GeoLocation
// - Create Activity with TASK_CHECKED_OUT action
// - Update task status to COMPLETED, set completedAt
```

---

### 3. List Events

**Endpoint:** `GET /v1/task/:id/events`

**Query Parameters:**
```typescript
{
  userId?: string          // Optional, filter by user
  type?: TaskEventType     // Optional, filter by type (CHECK_IN, CHECK_OUT)
}
```

**Response:**
```typescript
{
  events: TaskEvent[]
}
```

**Business Logic:**
- Validate user can view task (admin or assigned)
- Return all events (or filtered by type) with user info, location, attachments
- Ordered by createdAt (most recent first)

**Alternative Endpoints (for convenience):**
- `GET /v1/task/:id/check-ins` - Alias for `?type=CHECK_IN`
- `GET /v1/task/:id/check-outs` - Alias for `?type=CHECK_OUT`

---

## Mobile UI (Abstracted Architecture)

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

### Shared Hook: useTaskEvent

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

### Worker: Check-in Screen (Thin Wrapper)

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

### Worker: Check-out Screen (Thin Wrapper)

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

### New Component: AttachmentManager

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

### Worker: Task Details Enhancements

**Action Buttons** based on task status:
- READY status → Show "Check-in" button
- IN_PROGRESS status → Show "Check-out" button
- COMPLETED status → Show check-in/out history

**Attachments Section** (Critical Requirement):

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

**Event History with Multiple Attachments:**
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

### Admin: Task Details Enhancements

**Features:**
- View all events (check-ins/check-outs) for task
- See photos and GPS locations
- View distance from task location
- See which workers performed events
- View timestamps
- Map view showing event locations

**Map View:**
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

## Service Layer (Abstracted Architecture)

### task-event.service.ts

**Key Design:** Single `recordTaskEvent()` function handles all shared logic. Configuration objects define the differences.

```typescript
import { calculateDistance, verifyLocation } from '@/lib/geo'
import { uploadTaskAttachments } from '@/v1/attachment/attachment.service'
import { createActivity } from '@/v1/activity/activity.service'
import type { TaskStatus } from '@prisma/client'

// Shared data structure
interface TaskEventData {
  taskId: number
  userId: string
  latitude: number
  longitude: number
  files: File[]         // Multiple files from camera/library/picker
  notes?: string
}

// Configuration defines behavior differences
interface TaskEventConfig {
  type: TaskEventType        // CHECK_IN or CHECK_OUT
  requiredStatus: TaskStatus
  targetStatus: TaskStatus
  timestampField: 'startedAt' | 'completedAt'
  activityAction: string
  errorMessages: {
    invalidStatus: string
    alreadyRecorded: string
    notAssigned: string
  }
}

/**
 * Generic task event handler - eliminates code duplication
 * Used by both check-in and check-out
 */
export async function recordTaskEvent(
  data: TaskEventData,
  config: TaskEventConfig,
  storage: any
) {
  const prisma = getPrisma()

  // 1. Get task with validation
  const task = await prisma.task.findUnique({
    where: { id: data.taskId },
    include: {
      geoLocation: true,
      events: {
        where: {
          userId: data.userId,
          type: config.type,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!task) {
    throw new HTTPException(404, { message: 'Không tìm thấy công việc' })
  }

  // 2. Authorization check
  if (!task.assigneeIds.includes(data.userId)) {
    throw new HTTPException(403, { message: config.errorMessages.notAssigned })
  }

  // 3. Status validation (different for check-in vs check-out)
  if (task.status !== config.requiredStatus) {
    throw new HTTPException(400, { message: config.errorMessages.invalidStatus })
  }

  // 4. Validate attachments
  if (!data.files || data.files.length === 0) {
    throw new HTTPException(400, { message: 'Cần ít nhất một tệp đính kèm' })
  }

  // 5. GPS verification (shared logic)
  const { distance, warnings } = verifyLocation(
    task.geoLocation,
    { lat: data.latitude, lng: data.longitude }
  )

  // 6. Upload all attachments (shared logic - reuse existing service)
  const attachments = await uploadTaskAttachments({
    taskId: data.taskId,
    files: data.files,  // Multiple files: photos, videos, documents
    user: { id: data.userId },
    storage,
  })

  const attachmentIds = attachments.map(a => a.id)

  // 7. Create event in transaction (shared structure, different models)
  const result = await prisma.$transaction(async (tx) => {
    // Create event location
    const geoLocation = await tx.geoLocation.create({
      data: {
        lat: data.latitude,
        lng: data.longitude,
        address: undefined, // Could reverse geocode in future
      },
    })

    // Create event record with multiple attachment IDs
    const event = await tx.taskEvent.create({
      data: {
        type: config.type,      // CHECK_IN or CHECK_OUT
        taskId: data.taskId,
        userId: data.userId,
        geoLocationId: geoLocation.id,
        attachmentIds,          // Array of attachment IDs
        notes: data.notes,
        distanceFromTask: distance,
      },
      include: {
        geoLocation: true,
      },
    })

    // 8. Link attachments to this event (dual linking)
    // This enables:
    // - Attachments appear in task.attachments (via taskId)
    // - Attachments appear in event.attachments (via taskEventId)
    await tx.attachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { taskEventId: event.id },
    })

    // Update task status and timestamp (different for check-in vs check-out)
    const updatedTask = await tx.task.update({
      where: { id: data.taskId },
      data: {
        status: config.targetStatus,
        [config.timestampField]: new Date(),
      },
    })

    return { event, task: updatedTask }
  })

  // 8. Log activity (different action name from config)
  await createActivity({
    userId: data.userId,
    topic: `TASK_${data.taskId}`,
    action: config.activityAction,
    payload: {
      eventId: result.event.id,
      type: config.type,
      distance,
      warnings,
      attachmentCount: attachments.length,  // Track how many attachments
    },
  })

  // 9. Return event with populated attachments
  return {
    event: {
      ...result.event,
      attachments,  // Include full attachment objects
    },
    task: result.task,
    warnings,
  }
}

/**
 * Check-in implementation - thin wrapper with configuration
 */
export async function checkInToTask(
  data: TaskEventData,
  storage: any
) {
  return recordTaskEvent(data, {
    type: TaskEventType.CHECK_IN,
    requiredStatus: 'READY',
    targetStatus: 'IN_PROGRESS',
    timestampField: 'startedAt',
    activityAction: 'TASK_CHECKED_IN',
    errorMessages: {
      invalidStatus: 'Công việc chưa sẵn sàng để check-in',
      alreadyRecorded: 'Bạn đã check-in rồi',
      notAssigned: 'Bạn không được phân công vào công việc này',
    },
  }, storage)
}

/**
 * Check-out implementation - thin wrapper with different configuration
 */
export async function checkOutFromTask(
  data: TaskEventData,
  storage: any
) {
  return recordTaskEvent(data, {
    type: TaskEventType.CHECK_OUT,
    requiredStatus: 'IN_PROGRESS',
    targetStatus: 'COMPLETED',
    timestampField: 'completedAt',
    activityAction: 'TASK_CHECKED_OUT',
    errorMessages: {
      invalidStatus: 'Công việc chưa bắt đầu hoặc đã hoàn thành',
      alreadyRecorded: 'Bạn đã check-out rồi',
      notAssigned: 'Bạn không được phân công vào công việc này',
    },
  }, storage)
}
```

**Benefits of this approach:**
- ✅ Zero code duplication in service layer
- ✅ Type-safe with unified model and enum
- ✅ Easy to add validation or features (change once, applies to all event types)
- ✅ Clear separation of "what's different" (config) vs "what's shared" (logic)
- ✅ Future-proof: Add new event types by extending the enum
- ✅ Simpler database queries: `task.events.where({ type: 'CHECK_IN' })`

---

## GPS Utilities

### lib/geo.ts

```typescript
/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Verify if check-in location is within acceptable range
 */
export function verifyLocation(
  taskLocation: { lat: number; lng: number },
  checkInLocation: { lat: number; lng: number },
  thresholdMeters: number = 100
): {
  distance: number
  withinRange: boolean
  warnings: string[]
} {
  const distance = calculateDistance(
    taskLocation.lat,
    taskLocation.lng,
    checkInLocation.lat,
    checkInLocation.lng
  )

  const warnings: string[] = []
  const withinRange = distance <= thresholdMeters

  if (!withinRange) {
    warnings.push(
      `Bạn đang ở cách vị trí công việc ${Math.round(distance)}m`
    )
  }

  return { distance, withinRange, warnings }
}
```

---

## Validation Schemas (Shared)

### packages/validation/src/task-event.zod.ts

**Design:** Single shared schema since validation is identical for both events.

```typescript
import { z } from 'zod'

/**
 * Shared validation schema for both check-in and check-out
 * Supports multiple attachments from various sources
 */
export const zTaskEvent = z.object({
  latitude: z
    .number()
    .min(-90, 'Vĩ độ không hợp lệ')
    .max(90, 'Vĩ độ không hợp lệ'),
  longitude: z
    .number()
    .min(-180, 'Kinh độ không hợp lệ')
    .max(180, 'Kinh độ không hợp lệ'),

  // Multipart/form-data uploads (preferred)
  files: z
    .array(z.instanceof(File))
    .min(1, 'Cần ít nhất một tệp đính kèm')
    .max(10, 'Tối đa 10 tệp đính kèm')
    .optional(),

  // Alternative: Base64 uploads (for compatibility)
  attachments: z
    .array(z.object({
      data: z.string().min(1),
      filename: z.string().min(1),
      mimeType: z.string().min(1),
    }))
    .min(1, 'Cần ít nhất một tệp đính kèm')
    .max(10, 'Tối đa 10 tệp đính kèm')
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú quá dài')
    .optional(),
})
  .refine(
    (data) => data.files || data.attachments,
    { message: 'Cần ít nhất một tệp đính kèm (files hoặc attachments)' }
  )

// Export with semantic aliases if needed
export const zCheckIn = zTaskEvent
export const zCheckOut = zTaskEvent

export type TaskEventInput = z.infer<typeof zTaskEvent>
```

**Benefits:**
- ✅ Single schema definition
- ✅ DRY principle applied
- ✅ Semantic aliases for clarity
- ✅ Easy to extend for all events at once

---

## Testing Strategy

### Unit Tests

**File:** `apps/api/src/v1/checkin/__tests__/checkin.service.test.ts`

- ✅ Calculate distance correctly (known coordinates)
- ✅ Verify location within threshold
- ✅ Verify location outside threshold with warning
- ✅ Worker can check-in if assigned and status=READY
- ✅ Worker cannot check-in if not assigned
- ✅ Worker cannot check-in if status != READY
- ✅ Check-in updates task status to IN_PROGRESS
- ✅ Check-in sets startedAt timestamp
- ✅ Check-out updates task status to COMPLETED
- ✅ Check-out sets completedAt timestamp
- ✅ Activity logged on check-in/out

### Integration Tests

**File:** `apps/api/src/v1/checkin/__tests__/checkin.route.test.ts`

- ✅ POST /v1/task/:id/check-in returns 201
- ✅ POST /v1/task/:id/check-in validates photo required
- ✅ POST /v1/task/:id/check-in validates GPS required
- ✅ POST /v1/task/:id/check-in returns warnings if far
- ✅ POST /v1/task/:id/check-out returns 201
- ✅ GET /v1/task/:id/check-ins returns list
- ✅ Worker sees own check-ins
- ✅ Admin sees all check-ins

### E2E Tests

- Worker check-in flow → task status changes → worker can check-out
- Multiple workers on same task → separate check-ins
- GPS verification with mock locations
- Photo upload in check-in flow

---

## Error Handling

Common errors:
- `TASK_NOT_READY` - Cannot check-in, task not ready
- `ALREADY_CHECKED_IN` - Worker already checked in
- `NOT_CHECKED_IN` - Cannot check-out without check-in
- `PHOTO_REQUIRED` - Must provide photo
- `GPS_REQUIRED` - Must provide GPS coordinates
- `NOT_ASSIGNED` - Worker not assigned to task

Vietnamese messages:
- "Công việc chưa sẵn sàng để check-in"
- "Bạn đã check-in rồi"
- "Bạn phải check-in trước khi check-out"
- "Ảnh check-in là bắt buộc"
- "Vị trí GPS là bắt buộc"
- "Bạn không được phân công vào công việc này"

---

## Success Criteria

- ✅ Worker can check-in with GPS + photo
- ✅ Worker can check-out with GPS + photo
- ✅ GPS distance calculated and validated
- ✅ Photos required and uploaded
- ✅ Task status automatically updated
- ✅ Admin can view check-in/out history
- ✅ Map view shows locations
- ✅ Warnings shown if GPS distance exceeds threshold
- ✅ All actions logged to activity
- ✅ Unit test coverage >80%

---

## Configuration

Environment variables:
```bash
# Distance threshold in meters for GPS verification
CHECKIN_DISTANCE_THRESHOLD=100

# GPS accuracy threshold in meters
GPS_ACCURACY_THRESHOLD=50

# Photo max size in bytes
CHECKIN_PHOTO_MAX_SIZE=5242880  # 5MB
```

---

## Related Files (Updated for Abstraction)

### Backend (API)
- Database: `apps/api/prisma/schema.prisma`
- **Service (Shared):** `apps/api/src/v1/task-events/task-event.service.ts`
- **Routes (Unified):** `apps/api/src/v1/task-events/task-event.route.ts`
- GPS Utils: `apps/api/src/lib/geo.ts`
- **Validation (Shared):** `packages/validation/src/task-event.zod.ts`
- **Tests:** `apps/api/src/v1/task-events/__tests__/task-event.service.test.ts`

### Frontend (Mobile)
- **Shared Component:** `apps/mobile/components/task-event/TaskEventScreen.tsx`
- **Shared Hook:** `apps/mobile/hooks/useTaskEvent.ts`
- Check-in Screen (wrapper): `apps/mobile/app/worker/tasks/[taskId]/check-in.tsx`
- Check-out Screen (wrapper): `apps/mobile/app/worker/tasks/[taskId]/check-out.tsx`
- **Shared UI Components:**
  - `apps/mobile/components/task-event/LocationVerification.tsx`
  - **`apps/mobile/components/task-event/AttachmentManager.tsx`** (NEW)
  - `apps/mobile/components/task-event/DistanceIndicator.tsx`
  - Reuses: `apps/mobile/components/ui/AttachmentThumbnail.tsx` (existing)

---

## Code Reuse Summary

### Before Abstraction (Original Plan)
```
Database:        2 models × 25 lines = 50 lines
Service Layer:   2 files × 150 lines = 300 lines
Routes:          2 files × 80 lines = 160 lines
Mobile UI:       2 screens × 200 lines = 400 lines
Hooks:           2 hooks × 100 lines = 200 lines
Validation:      2 schemas × 20 lines = 40 lines
──────────────────────────────────────────────
TOTAL:                               1,150 lines
```

### After Abstraction (This Plan)
```
Database:        1 unified model + 1 enum = 30 lines (40% reduction)
Service Layer:   1 shared + 2 wrappers = 180 lines (40% reduction)
Routes:          1 unified = 60 lines (63% reduction)
Mobile UI:       1 shared + 2 wrappers = 250 lines (38% reduction)
Hooks:           1 shared = 100 lines (50% reduction)
Validation:      1 shared = 20 lines (50% reduction)
──────────────────────────────────────────────
TOTAL:                                 640 lines
```

**Savings: 510 lines (44% less code) with ZERO functional trade-offs**

### Maintainability Benefits
- 🔧 **Bug fixes:** Change once, fixes both check-in and check-out
- ✨ **New features:** Add GPS accuracy threshold → applies to both automatically
- 🧪 **Testing:** Test shared logic once, applies to both flows
- 📖 **Onboarding:** New developers learn one pattern, understand both features
- 🚀 **Future events:** Adding "break" or "pause" events = ~50 lines instead of ~575 lines

---

## Implementation Checklist

### Phase 1: Backend (Week 3, Days 1-3)

**NO Schema Changes Needed - Just New Code!**

- [ ] Create GPS utilities in `apps/api/src/lib/geo.ts`
  - [ ] `calculateDistance(lat1, lon1, lat2, lon2): number` - Haversine formula
  - [ ] `verifyLocation(taskLoc, checkInLoc): { distance, warnings }` - Distance + threshold check

- [ ] Create check-in/out service in `apps/api/src/v1/task-events/task-event.service.ts`
  - [ ] `checkInToTask({ taskId, files, user, latitude, longitude, notes?, storage })`
    - [ ] Validate task.status === 'READY' and user assigned
    - [ ] Call existing `uploadTaskAttachments()`
    - [ ] Create GeoLocation record
    - [ ] Create Activity with action='TASK_CHECKED_IN', payload has GPS + attachments
    - [ ] Update task: status='IN_PROGRESS', startedAt=now()
  - [ ] `checkOutFromTask({ ... })` - Same logic but different validations
    - [ ] Validate task.status === 'IN_PROGRESS'
    - [ ] Verify TASK_CHECKED_IN activity exists for user
    - [ ] Update task: status='COMPLETED', completedAt=now()

- [ ] Add validation schemas to `packages/validation/src/check-in.zod.ts`
  - [ ] `zCheckInInput` with latitude, longitude, files (1-10), notes?
  - [ ] `zCheckOutInput` (same schema)

- [ ] Create API routes in `apps/api/src/v1/task-events/route.ts`
  - [ ] `POST /v1/task/:id/check-in` - Calls checkInToTask()
  - [ ] `POST /v1/task/:id/check-out` - Calls checkOutFromTask()
  - [ ] `GET /v1/task/:id/events` - Lists activities for task (filtered by action)

- [ ] Write tests
  - [ ] Unit tests for GPS calculations
  - [ ] Unit tests for check-in/out service logic
  - [ ] Integration tests for API endpoints
  - [ ] **Verify attachments appear in task.attachments query**
  - [ ] **Verify activities appear in activity feed**

### Phase 2: Mobile UI (Week 3, Days 4-5)
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

### Phase 3: Admin Features (Week 4, Days 1-2)
- [ ] Add check-in/out history to task details
  - [ ] Display multiple attachments in grid
  - [ ] Attachment count badge
- [ ] Create timeline view component
- [ ] Add map view with markers
- [ ] Show distance indicators in history
- [ ] Test viewing multiple events with multiple attachments
- [ ] Add attachment viewer (lightbox for images/videos)

### Phase 4: Testing & Polish (Week 4, Days 3-5)
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
