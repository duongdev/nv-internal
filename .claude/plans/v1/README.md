# NV Internal v1 Master Plan

**Last Updated:** 2025-10-23
**Project:** Air Conditioning Service Task Management Application
**Target Users:** <50 users (Admin & Field Workers)

---

## Quick Navigation

📋 **Feature Plans:**
1. [Payment System](./01-payment-system.md) - Week 1-2 🔴
2. [Check-in/Check-out](./02-checkin-checkout.md) - Week 3-4 🔴
3. [Monthly Reports](./03-monthly-reports.md) - Week 5 🔴
4. [Task CRUD Enhancements](./04-task-crud.md) - Week 5 🟡
5. [Employee Management](./05-employee-management.md) - Week 6 🟡

📊 **Status Tracking:**
- [Implementation Progress](#implementation-progress)
- [Gap Analysis](#gap-analysis)
- [Risk Assessment](#risk-assessment)

---

## Executive Summary

This is the master plan for NV Internal v1, a task management application for an air conditioning service company in Vietnam. The system consists of:

- **Backend:** Hono REST API + PostgreSQL (Neon serverless)
- **Frontend:** React Native mobile app (Expo)
- **Auth:** Clerk
- **Storage:** Vercel Blob

The plan addresses gaps between current implementation and contract requirements, organized into 5 phases over 6-7 weeks.

---

## Implementation Progress

### ✅ Completed Features

**Backend Infrastructure:**
- REST API with Hono framework
- PostgreSQL database with Prisma ORM
- Clerk authentication & authorization
- File upload system (images, videos, PDFs)
- Activity logging system
- Task CRUD (create, read, list)
- User management (create, list, ban, roles)

**Frontend:**
- Mobile app with Expo Router
- Authentication flows
- Task list & details screens
- Employee list & create screens
- Location picker with maps
- Attachment viewer
- Activity feed

### ⏳ In Progress

Nothing currently in progress.

### ❌ Critical Gaps (Blockers for v1)

1. **Payment Tracking** 🔴
   - No payment model or endpoints
   - Cannot track payment status
   - Cannot upload invoices
   - [→ See Payment System Plan](./01-payment-system.md)

2. **Check-in/Check-out System** 🔴
   - No GPS + photo verification
   - No dedicated check-in/out endpoints
   - Status updates not location-verified
   - [→ See Check-in/Check-out Plan](./02-checkin-checkout.md)

3. **Monthly Reports** 🔴
   - No reporting endpoints
   - Cannot calculate days worked
   - Cannot calculate revenue per employee
   - [→ See Monthly Reports Plan](./03-monthly-reports.md)

4. **Task Editing** 🟡
   - Cannot edit existing tasks
   - Cannot delete tasks
   - [→ See Task CRUD Plan](./04-task-crud.md)

---

## Gap Analysis

### Contract Requirements vs Implementation

| Requirement | Status | Phase | Priority |
|------------|--------|-------|----------|
| **Admin: Manage employees** | ✅ 90% | Phase 4 | 🟡 |
| **Admin: Create tasks** | ✅ 100% | - | - |
| **Admin: Edit tasks** | ❌ 0% | Phase 3b | 🟡 |
| **Admin: Assign workers** | ✅ 100% | - | - |
| **Admin: Track check-ins** | ❌ 0% | Phase 2 | 🔴 |
| **Admin: Track payments** | ❌ 0% | Phase 1 | 🔴 |
| **Admin: Monthly reports** | ❌ 0% | Phase 3 | 🔴 |
| **Worker: View tasks** | ✅ 100% | - | - |
| **Worker: Check-in** | ❌ 0% | Phase 2 | 🔴 |
| **Worker: Check-out** | ❌ 0% | Phase 2 | 🔴 |
| **Worker: Upload invoices** | ❌ 0% | Phase 1 | 🔴 |
| **Worker: Update task status** | ✅ 100% | - | - |

**Overall Progress:** 50% complete

---

## Phase Overview

### Phase 1: Payment System (Weeks 1-2) 🔴

**Goal:** Track payments and invoices

**Deliverables:**
- Payment database model
- Payment CRUD API endpoints
- Admin payment management UI
- Worker invoice upload UI
- Revenue calculation logic

[→ Full Payment System Plan](./01-payment-system.md)

---

### Phase 2: Check-in/Check-out (Weeks 3-4) 🔴

**Goal:** GPS-verified check-in/out with photos

**Deliverables:**
- Check-in/out database models
- Check-in/out API endpoints with GPS verification
- Worker check-in/out screens with camera
- Admin monitoring UI with map view
- GPS distance calculation utilities

[→ Full Check-in/Check-out Plan](./02-checkin-checkout.md)

---

### Phase 3: Monthly Reports (Week 5) 🔴

**Goal:** Employee performance reports

**Deliverables:**
- Reporting API endpoints
- Days worked calculation (from check-ins)
- Revenue calculation (split for multi-worker tasks)
- Admin reports dashboard UI

[→ Full Monthly Reports Plan](./03-monthly-reports.md)

---

### Phase 3b: Task CRUD (Week 5 - Parallel) 🟡

**Goal:** Edit and delete tasks

**Deliverables:**
- Update task API endpoint
- Delete task API endpoint (soft delete)
- Admin edit task screen
- Activity logging for changes

[→ Full Task CRUD Plan](./04-task-crud.md)

---

### Phase 4: Employee Management (Week 6) 🟡

**Goal:** Complete employee management

**Deliverables:**
- Update employee profile endpoint
- Delete employee endpoint
- Admin edit employee screen
- Admin employee details screen

[→ Full Employee Management Plan](./05-employee-management.md)

---

## Timeline

```
Week 1-2: Payment System (Phase 1)
Week 3-4: Check-in/Check-out (Phase 2)
Week 5:   Monthly Reports (Phase 3) + Task CRUD (Phase 3b)
Week 6:   Employee Management (Phase 4)
Week 7:   Testing, Polish, Documentation
```

**Total Duration:** 7 weeks
**Go-live Target:** Week 8

---

## Risk Assessment

### High Risk 🔴

1. **GPS Accuracy**
   - Risk: GPS may be inaccurate indoors
   - Mitigation: Allow manual override, configurable threshold, admin review

2. **Offline Functionality**
   - Risk: Poor network in field
   - Mitigation: Implement offline queue (Phase 6), cache data

3. **Data Migration**
   - Risk: Schema changes may fail
   - Mitigation: Test on staging, backup production, rollback plan

### Medium Risk 🟡

4. **Revenue Calculation**
   - Risk: Complex splitting logic
   - Mitigation: Start simple (equal split), allow manual override

5. **Photo Storage Costs**
   - Risk: Vercel Blob costs
   - Mitigation: Compress images, thumbnails, monitor usage

### Low Risk 🟢

6. **User Adoption**
   - Risk: Worker resistance
   - Mitigation: Simple UI, Vietnamese, training

---

## v1 Definition of Done

### Must Have 🔴

- [x] Admin can manage employees (create, ban, roles)
- [x] Admin can create tasks
- [ ] **Admin can edit tasks**
- [x] Admin can assign workers
- [x] Admin can view task list/details
- [ ] **Admin can track payments**
- [ ] **Admin can view monthly reports**
- [x] Worker can login and view tasks
- [ ] **Worker can check-in with GPS + photo**
- [ ] **Worker can check-out with GPS + photo**
- [ ] **Worker can upload invoices**
- [x] Worker can update task progress

**Completion:** 7/12 (58%)

### Should Have 🟡

- [ ] Task editing
- [ ] Employee profile updates
- [ ] Push notifications
- [ ] Revenue splitting for multi-worker tasks

### Nice to Have 🟢

- Map view of all tasks
- Offline support
- Task templates
- Advanced analytics

---

## Success Metrics

### Technical Metrics

- API response time: <2s (p95)
- Mobile app load time: <3s
- Unit test coverage: >80%
- Zero critical bugs
- Zero data loss incidents

### Business Metrics

- Admin can create task in <2 minutes
- Worker can check-in in <30 seconds
- Monthly report generation <5 seconds
- 100% of check-ins have GPS + photo
- 100% of completed tasks have payment status

---

## Technology Stack

### Backend
- **Framework:** Hono (lightweight HTTP)
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Prisma
- **Auth:** Clerk
- **Storage:** Vercel Blob
- **Deployment:** Vercel Functions
- **Testing:** Jest

### Frontend
- **Framework:** React Native (Expo)
- **Router:** Expo Router (file-based)
- **State:** TanStack Query
- **Styling:** NativeWind (Tailwind)
- **Forms:** React Hook Form + Zod
- **Maps:** React Native Maps
- **Camera:** Expo Camera

### DevOps
- **VCS:** Git + GitHub
- **Package Manager:** pnpm
- **Monorepo:** pnpm workspaces
- **Linter/Formatter:** Biome
- **CI/CD:** TBD (GitHub Actions)

---

## Dependencies Between Phases

```
Phase 1 (Payment) ─┐
                   ├─→ Phase 3 (Reports)
Phase 2 (Check-in) ┘

Phase 3b (Task CRUD) ─→ Independent, can run parallel

Phase 4 (Employee) ─→ Independent
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3

---

## Open Questions

### Payment System
1. Can task have multiple partial payments? **→ Yes**
2. Must sum of payments match expectedRevenue? **→ No, show warning**
3. Must invoice be uploaded to complete payment? **→ No, optional**
4. Can admin delete payments? **→ Phase 2, use CANCELLED status for v1**

### Check-in/Check-out
1. GPS accuracy threshold? **→ 100m (configurable)**
2. Can worker check-in offline? **→ Phase 6, require online for v1**
3. Can worker check-in early? **→ Yes, but show warning**

### Reports
1. Date range for reports? **→ Default current month, allow custom**
2. Export to PDF/Excel? **→ Phase 6**
3. Real-time or cached? **→ Real-time for v1, cache in Phase 6**

### Task Management
1. Soft or hard delete tasks? **→ Soft delete**
2. What happens to deleted employee's tasks? **→ Keep tasks, show deleted user**
3. Can workers see other workers? **→ Yes, public info only**

---

## Documentation Status

- [x] Master plan (this file)
- [x] Phase 1: Payment System
- [x] Phase 2: Check-in/Check-out
- [x] Phase 3: Monthly Reports
- [x] Phase 4: Task CRUD
- [x] Phase 5: Employee Management
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Mobile app user guide
- [ ] Admin user guide
- [ ] Deployment guide

---

## Next Steps

1. **Review and approve this plan** with stakeholders
2. **Set up project tracking** (GitHub Projects or Jira)
3. **Assign team members** to phases
4. **Begin Phase 1:** Payment System implementation
5. **Set up staging environment** for testing
6. **Schedule weekly check-ins** to track progress

---

## Contact

For questions about this plan, contact the development team or refer to:
- Project documentation: `/Users/duongdev/personal/nv-internal/CLAUDE.md`
- API source: `apps/api/`
- Mobile source: `apps/mobile/`

---

**Document Version:** 1.0
**Next Review:** After Phase 1 completion
