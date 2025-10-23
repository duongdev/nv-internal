# Admin Dashboard - Common Specifications

**Related**: [Main Plan](./06-admin-dashboard.md) | [Backend Plan](./06-admin-dashboard-backend.md) | [Frontend Plan](./06-admin-dashboard-frontend.md)

---

## Overview

Common specifications and architecture for the admin dashboard feature. This document contains business requirements, data flow, design specifications, and success criteria shared between backend and frontend implementations.

## Business Requirements

### Purpose
Provide administrators with real-time visibility into:
- Daily operations and task status
- Worker performance and activity
- System health and bottlenecks
- Quick access to common admin actions

### Target Users
- Business owners
- Operations managers
- Admin staff

### User Stories

1. As an admin, I want to see today's task summary so I can understand daily operations at a glance
2. As an admin, I want to see task status distribution so I can identify bottlenecks
3. As an admin, I want to see recent activities so I can monitor what's happening in real-time
4. As an admin, I want to see worker performance so I can identify top performers and those needing support
5. As an admin, I want quick access to common actions so I can manage tasks efficiently

## Implementation Phases

### Phase 1: Core Dashboard (Start Immediately)
**Timeline**: 7 days
**Dependencies**: None

#### Features
1. Today's Overview Card
   - Tasks created/scheduled today
   - Active workers count
   - Tasks in progress
   - Overdue tasks

2. Task Status Distribution Card
   - Count and percentage for each status (PREPARING, READY, IN_PROGRESS, ON_HOLD, COMPLETED)
   - Visual breakdown

3. Recent Activity Feed Card
   - Last 10 activities
   - Compact view with task references
   - Tap to navigate to task details

4. Worker Overview Card (Limited)
   - List of workers
   - Assigned tasks per worker
   - Tasks completed today

5. Quick Actions Card
   - Create Task button
   - View All Tasks button
   - Manage Employees button

#### Data Sources
- Task model (status, assignee, dates)
- Activity model (recent events)
- Customer model (task relationships)
- User data from Clerk

### Phase 2: Enhanced Metrics
**Timeline**: After check-in/out mobile UI implementation
**Dependencies**: Check-in/out mobile UI (backend exists)

#### Additional Metrics
- Check-in compliance rate
- Average time on site
- GPS verification success rate
- Location-based insights

#### Data Sources
- GeoLocation model
- Activity model (CHECK_IN/CHECK_OUT events)

### Phase 3: Financial Dashboard
**Timeline**: After v1 Payment System
**Dependencies**: `.claude/plans/v1/01-payment-system.md`

#### New Features
- Payment Tracking Card
  - Pending payments count
  - Monthly revenue
  - Overdue invoices
  - Payment completion rate

#### Data Sources
- Payment model (to be created in v1)
- Invoice model (to be created in v1)
- Task model (payment relationships)

### Phase 4: Advanced Analytics
**Timeline**: After v1 Monthly Reports
**Dependencies**: `.claude/plans/v1/03-monthly-reports.md`

#### New Features
- Monthly Performance Card
  - Days worked per employee
  - Revenue per employee
  - Month-over-month comparison
  - Export capabilities

#### Data Sources
- MonthlyReport model (to be created in v1)
- Aggregated historical data

## Technical Requirements

### Performance
- Dashboard loads in < 2 seconds
- API responses < 500ms for aggregations
- Efficient database queries with proper indexing
- Client-side caching with TanStack Query

### Security
- Admin-only access (role-based authorization)
- All endpoints require authentication via Clerk
- No sensitive data exposure in client-side cache

### Data Accuracy
- Real-time data (max 5-minute cache)
- Accurate aggregations using Prisma
- Proper handling of timezones (UTC storage, local display)

### Scalability
- Support up to 50 users (current scale)
- Pagination for large datasets
- Efficient aggregation queries

### User Experience
- Pull-to-refresh functionality
- Loading states for all cards
- Error handling with user-friendly messages
- Dark mode support
- Vietnamese language throughout

## Design Specifications

### UI Pattern
- Card-based layout (consistent with task details screen)
- Spacing: 16px padding, 16px gap between cards
- Card styling: `bg-muted dark:border-white/20`
- Typography: CardTitle, CardContent components

### Color Scheme
- Follow existing NativeWind theme
- Status colors from task status badge system
- Neutral backgrounds for data cards

### Layout
- Vertical scroll layout
- Full-width cards
- Grid layouts within cards for metrics
- Responsive to different screen sizes

## Testing Requirements

### Backend Testing
- Unit tests for all service functions
- Integration tests for API endpoints
- Edge cases: empty data, large datasets, timezone handling
- Performance tests for aggregation queries

### Frontend Testing
- Component rendering tests
- Loading state tests
- Error boundary tests
- Navigation flow tests
- Dark mode visual tests

### End-to-End Testing
- Full dashboard load flow
- Pull-to-refresh functionality
- Navigation from cards to detail screens
- Admin role authorization

## Dependencies & Risks

### External Dependencies
- Clerk authentication (existing)
- Prisma ORM (existing)
- TanStack Query (existing)
- NativeWind styling (existing)

### Feature Dependencies
| Phase | Depends On | Status |
|-------|-----------|--------|
| Phase 1 | None | ✅ Ready |
| Phase 2 | Check-in/out mobile UI | ⏳ Backend done, UI pending |
| Phase 3 | v1 Payment System | ⏳ Planned |
| Phase 4 | v1 Monthly Reports | ⏳ Planned |

### Risks & Mitigations

**Risk**: Large datasets slow down aggregation queries
**Mitigation**: Implement pagination, indexing, and caching strategies

**Risk**: Real-time data becomes stale
**Mitigation**: Configure appropriate cache invalidation and refresh intervals

**Risk**: Admin role not properly enforced
**Mitigation**: Add middleware checks and backend role validation

**Risk**: UI performance degrades on older devices
**Mitigation**: Optimize rendering, use virtualized lists for large datasets

## Success Metrics

### Quantitative
- Page load time < 2 seconds
- API response time < 500ms
- 99.9% uptime
- Zero security incidents

### Qualitative
- Admins can access key metrics in 1 screen
- Admins can perform common actions in 1 tap
- Dashboard provides actionable insights
- UI is intuitive and requires no training

## Timeline

### Week 1 (Days 1-7): Phase 1 Implementation
- Days 1-2: Backend API development
- Days 3-4: Mobile UI development
- Days 5-6: Testing and polish
- Day 7: Deployment

### Future Phases
- Phase 2: Aligned with check-in/out mobile UI completion
- Phase 3: Weeks 1-2 of v1 implementation
- Phase 4: Week 5+ of v1 implementation

## Documentation & Knowledge Transfer

### Task Documentation
Create task file: `.claude/tasks/YYYYMMDD-HHMMSS-implement-admin-dashboard.md`

Track:
- Implementation progress
- Technical decisions
- Testing results
- Lessons learned

### Code Documentation
- JSDoc comments for all service functions
- README in dashboard feature directories
- API endpoint documentation in comments
- Component prop documentation

## Next Steps

1. Review this master plan and linked backend/frontend plans
2. Confirm Phase 1 scope and requirements
3. Begin backend implementation (see [backend.md](./backend.md))
4. Begin frontend implementation (see [frontend.md](./frontend.md))
5. Create task documentation file
6. Start development

## Related Documentation

- [Main Plan](./06-admin-dashboard.md)
- [Backend Implementation Plan](./06-admin-dashboard-backend.md)
- [Frontend Implementation Plan](./06-admin-dashboard-frontend.md)
- [v1 Payment System](./01-payment-system.md)
- [v1 Monthly Reports](./03-monthly-reports.md)
- [Check-in/out System](./02-checkin-checkout.md)
