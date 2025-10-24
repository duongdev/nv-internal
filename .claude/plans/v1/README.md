# NV Internal v1 Master Plan

**Last Updated:** 2025-10-23
**Project:** Air Conditioning Service Task Management Application
**Target Users:** <50 users (Admin & Field Workers)

---

## Quick Navigation

📋 **Feature Plans:**
1. [Payment System](./01-payment-system.md) - Week 1-2 ✅ **COMPLETED**
2. [Check-in/Check-out](./02-checkin-checkout.md) - Week 3-4 🔄 **Phase 1 Backend ✅**
3. [Monthly Reports](./03-monthly-reports.md) - Week 5 🔴
4. [Task CRUD Enhancements](./04-task-crud.md) - Week 5 🟡
5. [Employee Management](./05-employee-management.md) - Week 6 🟡
6. [Admin Dashboard](./06-admin-dashboard.md) - Week 7 🟡
7. [Task Comments](./07-task-comments.md) - Week 5 (Parallel) 🟡 **Ready to implement**

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

The plan addresses gaps between current implementation and contract requirements, organized into 7 phases over 6-7 weeks.

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

**Payment System (v1 Phase 1 - Completed 2025-10-24):**
- Payment collection at checkout with progressive disclosure UI
- Invoice photo upload (optional, inline camera)
- Expected revenue management for admins
- Payment editing with audit trail
- Payment status badges (collected/not collected/mismatch)
- Activity feed events (PAYMENT_COLLECTED, PAYMENT_UPDATED)
- Currency input with VNĐ formatting
- Amount mismatch detection and confirmation

### ⏳ In Progress

**Check-in/Check-out System (Phase 1/4):**
- ✅ Backend API completed (2025-10-22)
  - GPS utilities with Haversine formula
  - Check-in/out endpoints with multipart uploads
  - Activity-based event logging
  - 22 tests all passing
- ⏳ Phase 2: Mobile UI implementation (next)
- ⏳ Phase 3: Admin features
- ⏳ Phase 4: Testing & polish

### ❌ Critical Gaps (Blockers for v1)

1. **Payment Tracking** ✅ **COMPLETED (2025-10-24)**
   - ✅ Payment model with GAAP-compliant precision
   - ✅ Payment collection at checkout
   - ✅ Invoice photo upload (optional)
   - ✅ Admin payment management
   - ✅ Activity feed integration
   - [→ See Payment System Plan](./01-payment-system.md)

2. **Check-in/Check-out System** 🔄 **Backend Complete**
   - ✅ Backend API with GPS verification (Phase 1 done)
   - ⏳ Mobile UI not yet implemented (Phase 2)
   - ⏳ Admin monitoring features pending (Phase 3)
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
| **Admin: Track check-ins** | 🔄 25% | Phase 2 | 🔴 |
| **Admin: Track payments** | ✅ 100% | Phase 1 | ✅ |
| **Admin: Monthly reports** | ❌ 0% | Phase 3 | 🔴 |
| **Admin: Dashboard view** | ❌ 0% | Phase 5 | 🟡 |
| **Worker: View tasks** | ✅ 100% | - | - |
| **Worker: Check-in** | 🔄 25% | Phase 2 | 🔴 |
| **Worker: Check-out** | 🔄 25% | Phase 2 | 🔴 |
| **Worker: Upload invoices** | ✅ 100% | Phase 1 | ✅ |
| **Worker: Update task status** | ✅ 100% | - | - |

**Overall Progress:** 60% complete

---

## Phase Overview

### Phase 1: Payment System (Weeks 1-2) ✅ **COMPLETED**

**Goal:** Track payments and invoices

**Deliverables Completed:**
- ✅ Payment database model with GAAP-compliant precision
- ✅ Payment CRUD API endpoints with checkout integration
- ✅ Admin payment management UI with edit modal
- ✅ Worker invoice upload UI (optional, inline camera)
- ✅ Expected revenue management
- ✅ Activity feed integration (PAYMENT_COLLECTED, PAYMENT_UPDATED)
- ✅ Progressive disclosure UI pattern for mobile

**Implementation Highlights:**
- Checkout-based payment collection (trust workers)
- Invoice photo is optional (encourages but doesn't block)
- Admin can edit payments with audit trail
- Full TypeScript type safety
- Comprehensive test coverage (106+ tests passing)

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

### Phase 5: Admin Dashboard (Week 7) 🟡

**Goal:** Provide real-time visibility into operations

**Deliverables:**
- Dashboard statistics API endpoints
- Card-based mobile UI with 5 cards
- Pull-to-refresh functionality
- Admin role enforcement
- Performance metrics and insights

[→ Full Admin Dashboard Plan](./06-admin-dashboard.md)

---

### Phase 6: Task Comments (Week 5 - Parallel) 🟡

**Goal:** Enable collaborative communication on tasks

**Deliverables:**
- Comment API endpoint with text and photos
- Wire existing TaskCommentBox component
- Comments in activity feed
- Photo attachments (1-5 per comment)
- Zero database changes (Activity-based)

[→ Full Task Comments Plan](./07-task-comments.md)

---

## Timeline

```
Week 1-2: Payment System (Phase 1)
Week 3-4: Check-in/Check-out (Phase 2)
Week 5:   Monthly Reports (Phase 3) + Task CRUD (Phase 3b) + Task Comments (Phase 6)
Week 6:   Employee Management (Phase 4)
Week 7:   Admin Dashboard (Phase 5)
Week 8:   Testing, Polish, Documentation
```

**Total Duration:** 8 weeks
**Go-live Target:** Week 9

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
                   ├─→ Phase 3 (Reports) ─→ Phase 5 (Dashboard - Phase 3+4)
Phase 2 (Check-in) ┘                    ─→ Phase 5 (Dashboard - Phase 2)

Phase 3b (Task CRUD) ─→ Independent, can run parallel

Phase 4 (Employee) ─→ Independent

Phase 6 (Task Comments) ─→ Independent, can run parallel
                          Uses existing Activity/Attachment models
                          TaskCommentBox UI component already exists

Phase 5 (Dashboard):
  Phase 1: Independent (uses existing Task/Activity models)
  Phase 2: Requires Check-in/out mobile UI
  Phase 3: Requires Payment System
  Phase 4: Requires Monthly Reports
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 5 (full features)
**Fast Track Features:** Phase 3b (Task CRUD), Phase 6 (Comments) - can start immediately

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
- [x] Phase 3b: Task CRUD
- [x] Phase 4: Employee Management
- [x] Phase 5: Admin Dashboard
- [x] Phase 6: Task Comments
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
