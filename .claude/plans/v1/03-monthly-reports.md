# Phase 3: Monthly Reports

**Timeline:** Week 5
**Priority:** 🔴 Critical
**Status:** ⏳ Not Started

---

## Overview

Build reporting system for admin to view monthly employee performance including days worked, tasks completed, and revenue earned. Essential for payroll and performance tracking.

## Contract Requirements

Admin needs to see per employee, per month:
- Days worked in the month
- Tasks completed count
- Total revenue generated
- Revenue split if multiple workers on same task

## API Endpoints

### GET /v1/reports/employee/:userId/monthly

**Query:** `?month=YYYY-MM`

**Response:**
```typescript
{
  employee: { id, name, ... }
  month: "2025-01"
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

**Logic:**
- Days worked = unique dates from TaskCheckIn where userId matches
- Tasks completed = count tasks where status=COMPLETED, assigneeIds includes userId, completedAt in month
- Revenue = sum of (task.actualRevenue / assigneeIds.length) for completed tasks
- Requires Payment system (Phase 1) and CheckIn system (Phase 2)

---

## Mobile UI

**Screen:** `apps/mobile/app/admin/reports/monthly.tsx`

**Features:**
- Month picker (default: current month)
- Employee selector (dropdown of all employees)
- Metrics cards: Days Worked, Tasks, Revenue
- Task list with revenue breakdown
- Export button (future)

---

## Service Layer

```typescript
export async function getMonthlyEmployeeReport({
  userId,
  month,  // "YYYY-MM"
}: {
  userId: string
  month: string
}) {
  const [year, monthNum] = month.split('-').map(Number)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0, 23, 59, 59)

  // Days worked from check-ins
  const checkIns = await prisma.taskCheckIn.findMany({
    where: {
      userId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true },
  })

  const uniqueDays = new Set(
    checkIns.map(c => c.createdAt.toISOString().split('T')[0])
  )
  const daysWorked = uniqueDays.size

  // Tasks completed
  const completedTasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
      assigneeIds: { has: userId },
      completedAt: { gte: startDate, lte: endDate },
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

---

## Testing

- Calculate days worked from check-ins
- Calculate tasks completed in date range
- Split revenue correctly for multi-worker tasks
- Handle tasks with no revenue (null)
- Handle employees with no activity

---

## Success Criteria

- ✅ Admin can select employee and month
- ✅ Days worked calculated from check-ins
- ✅ Tasks completed count accurate
- ✅ Revenue split correctly for multi-worker tasks
- ✅ Report loads in <2 seconds

---

## Dependencies

- Phase 1 (Payment system) for revenue data
- Phase 2 (Check-in/out) for days worked calculation
