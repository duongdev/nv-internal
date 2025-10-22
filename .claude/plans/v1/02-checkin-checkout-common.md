# Check-in/Check-out System - Common Specifications

**Parent Plan:** [02-checkin-checkout.md](./02-checkin-checkout.md)
**Related:** [Backend Implementation](./02-checkin-checkout-backend.md) | [Frontend Implementation](./02-checkin-checkout-frontend.md)

---

## Overview

GPS-verified check-in/check-out system with **multiple attachment support** when workers start and finish tasks. This is a core contract requirement to ensure workers are physically present at job locations.

### Key Features
- ✅ **Multiple Attachments**: Support 1-10 files per check-in/out (photos, videos, documents)
- ✅ **Multiple Sources**: Camera, photo library, or file picker
- ✅ **GPS Verification**: Distance calculation with configurable threshold
- ✅ **Abstracted Architecture**: 43% code reduction through shared logic
- ✅ **Reuses Existing Infrastructure**: Same attachment system as task attachments

---

## Contract Requirements

From the contract:
- **Admin:** Monitor worker check-ins/check-outs with GPS and photos
- **Worker:** Check-in when starting work with GPS + photo
- **Worker:** Check-out when finishing work with GPS + photo

---

## Architecture Decision: Activity-Based Events

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

---

## Database Schema

### 🎉 ZERO Schema Changes Required!

**Architecture Decision:** Use existing models exactly as they are. Follow the same pattern as `TASK_ATTACHMENTS_UPLOADED`.

**Why This Approach:**
- ✅ **No migration needed** - Uses existing Activity and Attachment models as-is
- ✅ **Proven pattern** - Follows exact same flow as attachment uploads
- ✅ **Unified feed** - All task activities (status changes, check-ins, attachments) in one place
- ✅ **Already indexed** - Activity has indexes on userId, topic, createdAt
- ✅ **Flexible** - JSON payload can evolve without migrations
- ✅ **Consistent** - Follows existing patterns in the codebase

---

## Data Flow Diagram

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

---

## Activity Payload Structure

Mirrors existing `TASK_ATTACHMENTS_UPLOADED` pattern:

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

## Code Reuse Analysis

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

## Related Files

### Backend (API)
- Database: `apps/api/prisma/schema.prisma`
- Service (Shared): `apps/api/src/v1/task-events/task-event.service.ts`
- Routes (Unified): `apps/api/src/v1/task-events/task-event.route.ts`
- GPS Utils: `apps/api/src/lib/geo.ts`
- Validation (Shared): `packages/validation/src/task-event.zod.ts`
- Tests: `apps/api/src/v1/task-events/__tests__/task-event.service.test.ts`

### Frontend (Mobile)
- Shared Component: `apps/mobile/components/task-event/TaskEventScreen.tsx`
- Shared Hook: `apps/mobile/hooks/useTaskEvent.ts`
- Check-in Screen (wrapper): `apps/mobile/app/worker/tasks/[taskId]/check-in.tsx`
- Check-out Screen (wrapper): `apps/mobile/app/worker/tasks/[taskId]/check-out.tsx`
- Shared UI Components:
  - `apps/mobile/components/task-event/LocationVerification.tsx`
  - `apps/mobile/components/task-event/AttachmentManager.tsx` (NEW)
  - `apps/mobile/components/task-event/DistanceIndicator.tsx`
  - Reuses: `apps/mobile/components/ui/AttachmentThumbnail.tsx` (existing)