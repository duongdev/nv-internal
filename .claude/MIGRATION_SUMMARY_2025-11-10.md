# Selective Spec Migration to Linear

**Date**: 2025-11-10
**Type**: Selective Migration (High-Priority Active Work Only)
**Source**: NV Internal `.claude/` directory
**Destination**: Linear (Personal Team, NV Internal Project)

---

## Migration Summary

**Strategy**: Selective migration of high-priority incomplete features only, skipping completed work and low-priority enhancements.

**Total Files Migrated**: 5 spec files
**Linear Issues Created**: 5 features
**Breadcrumb Files Created**: 5 `.migrated.txt` files

---

## Migrated Linear Issues

### V1 Incomplete Features (3 issues)

#### 1. PSN-3: Task CRUD Enhancements - Edit and Delete Tasks
- **URL**: https://linear.app/withdustin/issue/PSN-3/task-crud-enhancements-edit-and-delete-tasks
- **Original File**: `.claude/plans/v1/04-task-crud.md`
- **Status**: Planned
- **Priority**: High
- **Estimated Effort**: 2-3 days
- **Description**: Allow admin to edit and delete tasks. Critical for fixing errors and managing task lifecycle.

**Key Requirements**:
- PUT /v1/task/:id - Update task details (admin only)
- DELETE /v1/task/:id - Soft delete task (admin only)
- Admin edit task screen
- Soft delete implementation with deletedAt field
- Activity logging for all changes

---

#### 2. PSN-4: Employee Management Enhancements - Profile Updates and Deletion
- **URL**: https://linear.app/withdustin/issue/PSN-4/employee-management-enhancements-profile-updates-and-deletion
- **Original File**: `.claude/plans/v1/05-employee-management.md`
- **Status**: Planned
- **Priority**: High
- **Estimated Effort**: 2 days
- **Description**: Complete employee management with profile updates and account deletion.

**Key Requirements**:
- PUT /v1/user/:id/profile - Update employee profile
- DELETE /v1/user/:id - Delete employee account (Clerk ban)
- Admin edit employee screen
- Admin employee details screen
- Cannot delete employees with active tasks
- Activity logging

---

#### 3. PSN-5: Admin Dashboard - Mobile-First Stats and Metrics
- **URL**: https://linear.app/withdustin/issue/PSN-5/admin-dashboard-mobile-first-stats-and-metrics
- **Original File**: `.claude/plans/v1/06-admin-dashboard.md`
- **Supporting Docs**: `06-admin-dashboard-backend.md`, `06-admin-dashboard-frontend.md`, `06-admin-dashboard-common.md`
- **Status**: Planned
- **Priority**: High
- **Estimated Effort**: 5-7 days
- **Description**: Build a mobile-first admin dashboard that displays meaningful metrics and insights.

**Key Features**:
- Today's Overview (tasks, active workers, in-progress, overdue)
- Task Distribution (status breakdown)
- Recent Activity (last 10 activities)
- Worker Performance (assigned/completed tasks)
- Quick Actions (create task, view all, manage employees)

**API Endpoints**:
- GET /v1/dashboard/stats
- GET /v1/dashboard/activities

---

### High-Priority Enhancements (2 issues)

#### 4. PSN-6: PostHog Observability - Analytics, Feature Flags & Error Tracking
- **URL**: https://linear.app/withdustin/issue/PSN-6/posthog-observability-analytics-feature-flags-error-tracking
- **Original File**: `.claude/enhancements/20251031-posthog-observability-implementation.md`
- **Status**: Planned
- **Priority**: Urgent (P1)
- **Estimated Effort**: 2-3 days
- **Cost**: $0/month (free tier)
- **Description**: Implement PostHog for comprehensive observability, replacing Sentry.

**Key Features**:
- Remove Sentry
- Mobile implementation (posthog-react-native)
  - Feature flags with caching
  - User analytics
  - Error tracking with full context
  - Performance monitoring
  - Offline support
- API implementation (posthog-node)
  - Error tracking
  - Performance metrics
  - Request/response sanitization
  - Serverless optimization
- Shared configuration via POSTHOG_API_KEY
- Expo Go compatible (no dev builds required)

**Implementation Phases**:
1. Setup & Configuration (Day 1)
2. Mobile Error Tracking (Day 1-2)
3. API Error Tracking (Day 2)
4. Feature Flags (Day 2-3)
5. Analytics Events (Day 3)

---

#### 5. PSN-7: Task Search and Filter System - Essential for Scalability
- **URL**: https://linear.app/withdustin/issue/PSN-7/task-search-and-filter-system-essential-for-scalability
- **Original File**: `.claude/enhancements/20251024-120100-search-and-filter-system.md` (443 lines)
- **Status**: Planned
- **Priority**: Urgent (P1)
- **Estimated Effort**: 7-8 days
- **Description**: Comprehensive search and filtering for tasks - essential for scalability.

**Problem**:
- No search capability (users must scroll through all tasks)
- No filtering by status, date, worker, payment, location
- As task count grows, findability becomes critical

**Solution**:
- Backend: GET /v1/tasks/search with comprehensive query parameters
- Search Bar with debouncing
- Filter Chips (quick filters)
- Advanced Filter Modal (status, date range, worker, payment, location)
- PostgreSQL full-text search
- Proper database indexing

**Success Criteria**:
- Search results in <500ms
- Users can find any task in <10 seconds
- 90% search success rate on first try

**Implementation Phases**:
1. Backend API (2 days)
2. Basic Search UI (1 day)
3. Quick Filters (1 day)
4. Advanced Filters (2 days)
5. Polish & Optimization (1-2 days)

---

## Files Not Migrated (Rationale)

### Completed Features (Not Migrated)
- ✅ Payment System (Phase 1) - Completed 2025-10-24
- ✅ Check-in/Check-out (Backend & Frontend) - Completed 2025-10-23
- ✅ Monthly Reports (Phase 3) - Completed 2025-10-29
- ✅ Task Comments (Phase 6) - Completed 2025-10-31

**Rationale**: These are already implemented and working in production. Keeping as reference documentation in `.claude/plans/v1/` is sufficient.

### Research Documents (Not Migrated)
- `.claude/research/QUICK-REFERENCE-bug-tracking.md`
- `.claude/research/QUICK-REFERENCE-performance-monitoring.md`
- `.claude/research/CRITIQUE-bug-tracking-mobile-perspective.md`
- `.claude/research/PERFORMANCE-ANALYSIS-bug-tracking.md`
- `.claude/research/PERFORMANCE-REVIEW-SUMMARY.md`
- `.claude/research/20251024-220000-production-bug-tracking-solutions.md`

**Rationale**: Static research/analysis docs with no action items. Keep as reference in `.claude/research/`.

### Lower Priority Enhancements (Not Migrated)
- Location Prefetch Optimization
- Pull-to-Refresh Improvements
- E2E Testing Strategy
- Client-Side Direct Upload Optimization
- Task Comment Enhancements (follow-up)
- Employee Summary Report (already completed)

**Rationale**: These can be migrated later if/when they become high priority. Focus on MVP blockers first.

---

## Breadcrumb Files Created

To help track what was migrated, breadcrumb files were created:

1. `.claude/plans/v1/04-task-crud.md.migrated.txt` → PSN-3
2. `.claude/plans/v1/05-employee-management.md.migrated.txt` → PSN-4
3. `.claude/plans/v1/06-admin-dashboard.md.migrated.txt` → PSN-5
4. `.claude/enhancements/20251031-posthog-observability-implementation.md.migrated.txt` → PSN-6
5. `.claude/enhancements/20251024-120100-search-and-filter-system.md.migrated.txt` → PSN-7

Each breadcrumb file contains:
- Linear issue ID and title
- Direct URL to Linear issue
- Migration date
- Original file location

---

## Next Steps

### Immediate Actions (This Week)

1. **Review Linear Issues**: Open each issue in Linear and verify all details are correct
2. **Prioritize Work**: Decide which of the 5 features to tackle first
3. **Update CLAUDE.md**: Reference new Linear issues in project documentation

### Recommended Priority Order

Based on MVP requirements from the task-doc-tracker analysis:

**Week 1 (MVP Blockers)**:
1. **PSN-3** (Task CRUD) - 2-3 days - CRITICAL for admins to fix errors
2. **PSN-4** (Employee Management) - 2 days - Complete CRUD operations
3. **PSN-5** (Admin Dashboard) - 5-7 days - Operational visibility

**Week 2 (Quality & Scale)**:
4. **PSN-6** (PostHog) - 2-3 days - Error tracking and feature flags BEFORE production
5. **PSN-7** (Search & Filter) - 7-8 days - Essential for scale, can start parallel

**Alternative Priority** (If focusing on observability first):
1. **PSN-6** (PostHog) - Set up observability FIRST
2. **PSN-3** (Task CRUD) - Critical admin functionality
3. **PSN-7** (Search & Filter) - Parallel with dashboard
4. **PSN-4** (Employee Management)
5. **PSN-5** (Admin Dashboard)

---

## Migration Statistics

| Category | Count |
|----------|-------|
| **Linear Issues Created** | 5 |
| **V1 Features** | 3 |
| **High-Priority Enhancements** | 2 |
| **Breadcrumb Files** | 5 |
| **Original Files Preserved** | 5 |
| **Supporting Docs Referenced** | 3 |

**Total Estimated Effort**: 18-23 days across 5 features

---

## Linear Workspace Organization

**Team**: Personal
**Project**: NV Internal
**Issue Range**: PSN-3 through PSN-7

**Labels Applied**:
- `feature` - All 5 issues
- `migrated` - All 5 issues (indicates migrated from .claude/)
- `v1` - 3 V1 plan features
- `enhancement` - 2 enhancement features
- `admin`, `crud`, `employee`, `dashboard`, `observability`, `posthog`, `search`, `scalability` - Specific tags

**Priorities**:
- P1 (Urgent): PSN-6 (PostHog), PSN-7 (Search & Filter)
- P2 (High): PSN-3 (Task CRUD), PSN-4 (Employee), PSN-5 (Dashboard)

---

## Success Criteria for This Migration

✅ **All 5 high-priority features migrated to Linear**
✅ **Breadcrumb files created for tracking**
✅ **Original files preserved in .claude/**
✅ **Clear Linear issue descriptions with all requirements**
✅ **Proper labeling and prioritization**
✅ **Supporting documentation referenced**

---

## Notes

- This was a **selective migration**, not a full migration of all 37 files
- Original markdown files remain in `.claude/` for reference
- Completed features (Payment, Check-in/out, Reports, Comments) were NOT migrated
- Research documents remain as static reference
- Additional enhancements can be migrated later if needed
- All 5 features are ready for implementation planning

---

## Contact

For questions about this migration:
- Migration performed by: Claude Code (task-doc-tracker agent)
- Project: NV Internal
- Linear Workspace: https://linear.app/withdustin
- Date: 2025-11-10

---

**End of Migration Summary**
