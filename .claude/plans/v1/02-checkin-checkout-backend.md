# Check-in/Check-out System - Backend Implementation

**Parent Plan:** [02-checkin-checkout.md](./02-checkin-checkout.md)
**Related:** [Common Specifications](./02-checkin-checkout-common.md) | [Frontend Implementation](./02-checkin-checkout-frontend.md)
**Status:** ✅ **COMPLETED** (2025-10-22) - See `.claude/tasks/20251022-211855-implement-checkin-checkout-system.md`

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

## Validation Schemas

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

## GPS Verification

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

## Implementation Checklist

### Backend Implementation (Week 3, Days 1-3)

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