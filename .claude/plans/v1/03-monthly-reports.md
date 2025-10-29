# Phase 3: Employee Reports (Dynamic Date Range)

**Timeline:** Week 5
**Priority:** 🔴 Critical
**Status:** ✅ Complete
**Completed:** 2025-10-29
**Task Documentation:** `.claude/tasks/20251029-105427-employee-reports-api-implementation.md`

---

## Overview

Build reporting system for admin to view employee performance with flexible date ranges including days worked, tasks completed, and revenue earned. Essential for payroll and performance tracking.

## Contract Requirements

Admin needs to see per employee, for any date range:
- Days worked in the period
- Tasks completed count
- Total revenue generated
- Revenue split if multiple workers on same task

## API Endpoints

### GET /v1/reports/employee/:userId

**Query Parameters:**
- `startDate` (required): ISO 8601 date string (YYYY-MM-DD)
- `endDate` (required): ISO 8601 date string (YYYY-MM-DD)
- `timezone` (optional): IANA timezone identifier (default: `Asia/Ho_Chi_Minh`)

**Examples:**
- `/v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31`
- `/v1/reports/employee/user_123?startDate=2025-01-01&endDate=2025-01-31&timezone=Asia/Bangkok`

**Response:**
```typescript
{
  employee: { id, name, ... }
  period: {
    startDate: "2025-01-01",
    endDate: "2025-01-31"
  }
  metrics: {
    daysWorked: 22
    tasksCompleted: 15
    totalRevenue: 45000000  // VND
  }
  tasks: [{
    id: 123
    title: "..."
    completedAt: "..."
    revenue: 3000000
    revenueShare: 1500000  // Split with 1 other worker
    workerCount: 2
  }]
}
```

**Validation:**
- Both `startDate` and `endDate` are required
- Dates must be valid ISO 8601 format (YYYY-MM-DD)
- `endDate` must be >= `startDate`
- `timezone` must be valid IANA timezone identifier if provided
- Date range should not exceed 1 year (optional constraint for performance)

**Logic:**
- Date boundaries calculated in specified timezone (default: Asia/Ho_Chi_Minh)
  - Start: `startDate` at 00:00:00 in timezone → converted to UTC
  - End: `endDate` at 23:59:59.999 in timezone → converted to UTC
- Days worked = unique dates from TaskCheckIn where userId matches and date in range
  - Dates extracted in the specified timezone for accurate day counting
- Tasks completed = count tasks where status=COMPLETED, assigneeIds includes userId, completedAt in range
- Revenue = sum of (task.actualRevenue / assigneeIds.length) for completed tasks in range
- All date comparisons inclusive of start and end dates
- Requires Payment system (Phase 1) and CheckIn system (Phase 2)

**Timezone Handling:**
- Uses `date-fns-tz` library for timezone conversions
- Ensures "January 1st" means January 1st in Vietnam time, not UTC
- Example: `2025-01-01 00:00:00 ICT` → `2024-12-31 17:00:00 UTC`

---

## Mobile UI

**Screen:** `apps/mobile/app/admin/reports/index.tsx`

**Features (V1 - Month Picker):**

- Month picker (default: current month)
- Employee selector (dropdown of all employees)
- Metrics cards: Days Worked, Tasks, Revenue
- Task list with revenue breakdown
- Export button (future)

**Implementation Notes:**

- Frontend converts selected month to date range for API call
- Example: User selects "January 2025" → API call with `startDate=2025-01-01&endDate=2025-01-31`
- Helper function to calculate first/last day of month

**Future Enhancement:**

- Custom date range picker with presets (This Month, Last Month, Custom Range)
- Backend already supports this via dynamic date range parameters

---

## Service Layer

```typescript
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'

export async function getEmployeeReport({
  userId,
  startDate,  // ISO 8601 date string "YYYY-MM-DD"
  endDate,    // ISO 8601 date string "YYYY-MM-DD"
  timezone = 'Asia/Ho_Chi_Minh',  // Default to Vietnam timezone
}: {
  userId: string
  startDate: string
  endDate: string
  timezone?: string
}) {
  // Convert date strings to timezone-aware Date objects
  // Start of day in specified timezone
  const startInTz = `${startDate}T00:00:00`
  const start = fromZonedTime(startInTz, timezone)

  // End of day in specified timezone
  const endInTz = `${endDate}T23:59:59.999`
  const end = fromZonedTime(endInTz, timezone)

  // Days worked from check-ins
  const checkIns = await prisma.taskCheckIn.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    select: { createdAt: true },
  })

  // Extract unique days in the specified timezone
  const uniqueDays = new Set(
    checkIns.map(c => {
      const zonedDate = toZonedTime(c.createdAt, timezone)
      return format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone })
    })
  )
  const daysWorked = uniqueDays.size

  // Tasks completed
  const completedTasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
      assigneeIds: { has: userId },
      completedAt: { gte: start, lte: end },
    },
    include: { payments: true },
  })

  // Calculate revenue
  const tasksWithRevenue = completedTasks.map(task => {
    const revenue = task.actualRevenue || 0
    const workerCount = task.assigneeIds.length
    const revenueShare = revenue / workerCount

    return {
      id: task.id,
      title: task.title,
      completedAt: task.completedAt,
      revenue,
      revenueShare,
      workerCount,
    }
  })

  const totalRevenue = tasksWithRevenue.reduce(
    (sum, t) => sum + t.revenueShare,
    0
  )

  return {
    daysWorked,
    tasksCompleted: completedTasks.length,
    totalRevenue,
    tasks: tasksWithRevenue,
  }
}
```

**Key Points:**
- Uses `date-fns-tz` for accurate timezone conversions
- `fromZonedTime`: Converts local time string in timezone → UTC Date
- `toZonedTime`: Converts UTC Date → local time in timezone
- Days counted in the specified timezone (so a check-in at 1 AM Vietnam time counts as the correct day)

---

## Testing

- Calculate days worked from check-ins with correct timezone
- Test timezone boundary cases (check-in at midnight, 11:59 PM)
- Verify check-in at 1 AM Vietnam = correct day (not previous day in UTC)
- Calculate tasks completed in date range
- Split revenue correctly for multi-worker tasks
- Handle tasks with no revenue (null)
- Handle employees with no activity
- Test with different timezones (Asia/Ho_Chi_Minh, Asia/Bangkok)
- Validate invalid timezone strings

---

## Success Criteria

- ✅ Admin can select employee and month
- ✅ Days worked calculated from check-ins (using Activity model)
- ✅ Tasks completed count accurate
- ✅ Revenue split correctly for multi-worker tasks
- ✅ Report loads in <2 seconds
- ✅ Comprehensive test coverage (18 tests passing)
- ✅ Mobile UI with loading and empty states
- ✅ Vietnamese localization

---

## Dependencies

- ✅ Phase 1 (Payment system) for revenue data - Complete
- ✅ Phase 2 (Check-in/out) for days worked calculation - Complete
- ✅ `date-fns-tz` library for timezone conversions - Installed

---

## Implementation Notes

### Key Decisions & Deviations

1. **Activity Model for Check-ins**: Used existing Activity model with `action='TASK_CHECKED_IN'` instead of creating a dedicated TaskCheckIn model. This provides a more flexible event log pattern.

2. **TZDate Usage**: Implemented using `@date-fns/tz` library's `TZDate` class for timezone-aware date handling, which is the modern approach in date-fns v4+.

3. **Month Picker UI**: V1 implementation uses a simple month picker instead of custom date ranges. The backend supports any date range, so custom ranges can be added as a future enhancement.

4. **Revenue Calculation**: Using `actualRevenue` from Task model with equal splits among assignees. Future versions can support unequal splits.

### Files Implemented

**Backend:**
- `/packages/validation/src/report.zod.ts`
- `/apps/api/src/v1/reports/report.service.ts`
- `/apps/api/src/v1/reports/report.route.ts`
- `/apps/api/src/v1/reports/__tests__/report.service.test.ts`

**Frontend:**
- `/apps/mobile/app/admin/reports/index.tsx`
- `/apps/mobile/api/reports/use-employee-report.ts`
- `/apps/mobile/lib/date-utils.ts`

### Future Enhancements

- ✅ **Monthly Summary View** (Implemented 2025-10-30): View all employees' metrics at once
  - Implementation: `.claude/tasks/20251029-145000-employee-report-monthly-summary-enhancement.md`
  - Batch query optimization reducing 100+ queries to 2-3
  - FlatList virtualization for mobile performance
  - Search and sort functionality
  - 80% time reduction for monthly reviews
- Custom date range picker in mobile UI
- Workers viewing their own reports
- Export to PDF/CSV
- Performance charts and graphs
- Comparison with previous periods

### Phase 3.1: Employee Summary Enhancement (Complete)

**Status**: ✅ Implemented (2025-10-30)
**Documentation**: `.claude/tasks/20251029-145000-employee-report-monthly-summary-enhancement.md`

This enhancement was implemented immediately after Phase 3 completion to address the critical UX issue of having to select employees one at a time. The summary view provides:

- All employees' metrics on one screen
- Batch query optimization (50x query reduction)
- Search and sort capabilities
- Tap-to-detail navigation
- <500ms response time for 50 employees

The enhancement established important patterns:
- Batch query pattern for aggregate reports
- FlatList optimization for large datasets
- Defensive programming with data fallbacks
- Tied ranking algorithm for equal values
