# Phase 6: Admin Dashboard

**Timeline:** Week 7
**Priority:** 🟡 Important
**Status:** 🔴 Not Started

---

## 📋 Implementation Summary

Mobile-first admin dashboard with card-based UI showing meaningful metrics and insights for administrators managing field workers and tasks.

### Documentation Structure

This plan is organized into modular documents for easier navigation:

1. **[Common Specifications](./06-admin-dashboard-common.md)** - Business requirements, data flow, success criteria
2. **[Backend Implementation](./06-admin-dashboard-backend.md)** - API endpoints, services, aggregations, testing
3. **[Frontend Implementation](./06-admin-dashboard-frontend.md)** - Mobile UI, components, card layout

### Quick Links by Role

**Backend Developer:**
- Start with [Common Specifications](./06-admin-dashboard-common.md#data-requirements) for data requirements
- Review [Backend Implementation](./06-admin-dashboard-backend.md) for API details
- Check [Service Layer](./06-admin-dashboard-backend.md#service-layer-implementation) for aggregation logic

**Mobile Developer:**
- Review [Common Specifications](./06-admin-dashboard-common.md#ui-specifications) for design specs
- Follow [Frontend Implementation](./06-admin-dashboard-frontend.md) for UI components
- See [Card Components](./06-admin-dashboard-frontend.md#component-implementation) for implementation details

**Project Manager:**
- View [Success Criteria](./06-admin-dashboard-common.md#success-criteria) in Common Specifications
- Review [Implementation Phases](./06-admin-dashboard-common.md#implementation-phases) for timeline
- Check implementation checklists in each document

---

## Overview

Build a mobile-first admin dashboard that displays meaningful metrics and insights for administrators through a card-based interface similar to the task details screen.

### Key Features

- 📊 **Today's Overview**: Tasks today, active workers, in-progress, overdue
- 📈 **Task Distribution**: Status breakdown with percentages
- 🕐 **Recent Activity**: Last 10 activities with task references
- 👥 **Worker Performance**: Assigned/completed tasks per worker
- ⚡ **Quick Actions**: Create task, view all, manage employees

### Architecture Highlights

**No Database Changes:** Uses existing Task, Activity, Customer, and GeoLocation models.

**API Endpoints:**
```typescript
GET /v1/dashboard/stats       // Aggregated statistics
GET /v1/dashboard/activities  // Recent activity feed with pagination
```

**Card-Based UI:** Reuses existing card components from task details screen for consistency.

---

## Implementation Phases

### Phase 1: Core Dashboard (Week 7, Days 1-5)

See [Common Specifications](./06-admin-dashboard-common.md#implementation-phases) for complete phase breakdown.

**Days 1-2: Backend**
- Dashboard statistics API endpoint
- Recent activities API endpoint
- Service layer with Prisma aggregations
- Unit and integration tests

**Days 3-4: Mobile UI**
- Dashboard screen with pull-to-refresh
- 5 card components (overview, distribution, activity, workers, actions)
- TanStack Query hooks for data fetching
- Error handling and loading states

**Days 5-6: Testing & Polish**
- Integration testing
- Performance optimization
- Dark mode verification
- Vietnamese language review

**Day 7: Deployment**
- Staging deployment
- UAT testing
- Production deployment

### Phase 2: Enhanced Metrics (After Check-in/out Mobile UI)

Add to Worker Overview Card:
- Check-in compliance rate
- Average time on site
- GPS verification success rate

**Dependencies**: Check-in/out mobile UI (Phase 2 of Feature 2)

### Phase 3: Financial Dashboard (After Payment System)

New Payment Tracking Card:
- Pending payments count
- Monthly revenue
- Overdue invoices
- Payment completion rate

**Dependencies**: Payment System (Feature 1)

### Phase 4: Advanced Analytics (After Monthly Reports)

New Monthly Performance Card:
- Days worked per employee
- Revenue per employee
- Month-over-month comparison
- Export capabilities

**Dependencies**: Monthly Reports (Feature 3)

---

## Implementation Checklist

### Phase 1: Core Dashboard

**Backend (Days 1-2)**
- [ ] Create `apps/api/src/v1/dashboard/dashboard.service.ts`
- [ ] Create `apps/api/src/v1/dashboard/route.ts`
- [ ] Add database indexes for performance
- [ ] Write unit tests (service layer)
- [ ] Write integration tests (API endpoints)
- [ ] Test with production-like data volumes

**Frontend (Days 3-4)**
- [ ] Update `apps/mobile/app/admin/(tabs)/index.tsx`
- [ ] Create `TodayOverviewCard` component
- [ ] Create `TaskDistributionCard` component
- [ ] Create `RecentActivityCard` component
- [ ] Create `WorkerPerformanceCard` component
- [ ] Create `QuickActionsCard` component
- [ ] Create `MetricItem` reusable component
- [ ] Add TanStack Query hooks in `lib/api/dashboard.ts`
- [ ] Implement pull-to-refresh
- [ ] Add error boundaries

**Testing & Deployment (Days 5-7)**
- [ ] Component tests
- [ ] Integration tests
- [ ] Performance testing (< 2s load time)
- [ ] Dark mode verification
- [ ] Admin role enforcement check
- [ ] Staging deployment
- [ ] UAT with stakeholders
- [ ] Production deployment

---

## Dependencies

### Feature Dependencies

| Phase | Depends On | Status | Notes |
|-------|-----------|--------|-------|
| Phase 1 | None | ✅ Ready | Can start immediately |
| Phase 2 | Check-in/out UI (Feature 2) | ⏳ Backend done | Waiting for mobile UI |
| Phase 3 | Payment System (Feature 1) | 🔴 Not started | Payment model needed |
| Phase 4 | Monthly Reports (Feature 3) | 🔴 Not started | Reporting calculations needed |

### Database Models Used

- ✅ **Task**: Status, assignees, dates, completion
- ✅ **Activity**: Recent events, user actions
- ✅ **GeoLocation**: Location data (Phase 2)
- ⏳ **Payment**: Financial data (Phase 3)
- ⏳ **MonthlyReport**: Performance data (Phase 4)

---

## Critical Requirements

### 1. Admin-Only Access

- All endpoints require authentication via Clerk
- Admin role check via `isAdmin()` middleware
- 403 response for non-admin users

### 2. Real-Time Data

- Dashboard stats refresh on pull-to-refresh
- Cache invalidation after task/activity mutations
- Maximum 5-minute cache staleness

### 3. Performance

- Dashboard loads in < 2 seconds
- API responses < 500ms for aggregations
- Efficient Prisma queries with proper indexing

### 4. Mobile-First Design

- Card-based layout for consistency
- Pull-to-refresh functionality
- Dark mode support
- Vietnamese language throughout

---

## Success Metrics

### Phase 1 Completion Criteria

- ✅ Admin can view dashboard in < 2 seconds
- ✅ All 5 cards render correctly
- ✅ Pull-to-refresh updates data
- ✅ Navigation from cards works
- ✅ Dark mode displays correctly
- ✅ Admin role properly enforced
- ✅ Unit test coverage > 80%
- ✅ Integration tests pass

### Business Metrics

- Admin can access key metrics in 1 screen
- Admin can perform common actions in 1 tap
- Dashboard provides actionable insights
- Zero security incidents (admin access only)

---

## Key Files

### Backend

- `apps/api/src/v1/dashboard/route.ts` - API routes
- `apps/api/src/v1/dashboard/dashboard.service.ts` - Aggregation logic
- `apps/api/src/v1/dashboard/__tests__/dashboard.test.ts` - Service tests
- `apps/api/src/v1/dashboard/__tests__/route.test.ts` - Integration tests

### Frontend

- `apps/mobile/app/admin/(tabs)/index.tsx` - Dashboard screen
- `apps/mobile/components/dashboard/today-overview-card.tsx` - Today's metrics
- `apps/mobile/components/dashboard/task-distribution-card.tsx` - Status breakdown
- `apps/mobile/components/dashboard/recent-activity-card.tsx` - Activity feed
- `apps/mobile/components/dashboard/worker-performance-card.tsx` - Worker stats
- `apps/mobile/components/dashboard/quick-actions-card.tsx` - Action buttons
- `apps/mobile/components/dashboard/metric-item.tsx` - Reusable metric component
- `apps/mobile/lib/api/dashboard.ts` - API client and hooks

---

## Risk Assessment

### High Risk 🔴

None identified for Phase 1.

### Medium Risk 🟡

1. **Performance with Large Datasets**
   - Risk: Aggregation queries may be slow with >1000 tasks
   - Mitigation: Database indexing, pagination, caching

2. **Stale Data**
   - Risk: Dashboard shows outdated information
   - Mitigation: Appropriate cache times (5 min), manual refresh option

### Low Risk 🟢

3. **Admin Role Enforcement**
   - Risk: Non-admin users access dashboard
   - Mitigation: Middleware checks, backend validation

---

## Future Enhancements (Phase 2-4)

### Phase 2: Enhanced Metrics
- Check-in compliance tracking
- Location-based insights
- Time-on-site analytics

### Phase 3: Financial Dashboard
- Payment tracking card
- Revenue visualization
- Invoice status monitoring

### Phase 4: Advanced Analytics
- Performance trends
- Export to PDF/Excel
- Custom date range filters
- Month-over-month comparisons

---

## Related Documentation

- [Common Specifications](./06-admin-dashboard-common.md)
- [Backend Implementation](./06-admin-dashboard-backend.md)
- [Frontend Implementation](./06-admin-dashboard-frontend.md)
- [Check-in/out System](./02-checkin-checkout.md) - For Phase 2 metrics
- [Payment System](./01-payment-system.md) - For Phase 3 metrics
- [Monthly Reports](./03-monthly-reports.md) - For Phase 4 metrics
