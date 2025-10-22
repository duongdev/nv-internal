# NV Internal v1 Development Plan

**Last Updated:** 2025-10-23
**Project:** Air Conditioning Service Task Management Application
**Target Users:** <50 users (Admin & Field Workers)

---

## Executive Summary

This document outlines the development plan for NV Internal v1, a task management application for an air conditioning service company in Vietnam. The system consists of a REST API (Hono + PostgreSQL) and a React Native mobile app (Expo + Clerk Auth), designed to manage field worker tasks, check-ins/check-outs with GPS verification, and payment tracking.

---

## Contract Requirements Analysis

### Admin Features (Chéc nng dành cho Admin)

#### 1. Authentication & Account Management
-  **Login system** - Clerk authentication with username/password
-  **Admin account management** - Change password via Clerk
- ó **Admin profile updates** - Partially implemented (needs UI)

#### 2. Employee Account Management
-  **Create employee accounts** - `POST /v1/user/` endpoint implemented
-  **Edit employee accounts** - `PUT /v1/user/:id/roles` endpoint implemented
-  **Ban/disable accounts** - `PUT /v1/user/:id/ban` endpoint implemented
-  **View all employees** - `GET /v1/user/` endpoint implemented
-  **Role management** - Admin vs Worker roles (nvInternalAdmin, nvInternalWorker)
- ó **Delete employee accounts** - Missing endpoint (need to add)

#### 3. Task Assignment & Management
-  **Create tasks** - `POST /v1/task/` endpoint with customer & location
-  **View task list** - `GET /v1/task/` with pagination & status filtering
- âŒ **Edit/Update tasks** - Missing `PUT /v1/task/:id` endpoint for updating title, description, customer, location
-  **View task details** - `GET /v1/task/:id` endpoint
-  **Assign workers** - `PUT /v1/task/:id/assignees` endpoint
-  **Multiple workers per task** - Array of assigneeIds supported
-  **Task status tracking** - Full lifecycle: PREPARING ’ READY ’ IN_PROGRESS ’ COMPLETED
-  **Task locations** - GeoLocation model with lat/lng coordinates
-  **Customer information** - Customer model with name & phone
- âŒ **Delete tasks** - Missing `DELETE /v1/task/:id` endpoint

#### 4. Check-in/Check-out Monitoring
-  **GPS tracking** - GeoLocation model stores coordinates
-  **Photo attachments** - Attachment model with image/video support
-  **Activity logging** - Activity model tracks all state changes
- L **Check-in/Check-out specific endpoints** - Missing dedicated check-in/out API
- L **GPS verification on check-in/out** - Need to implement location validation
- L **Mandatory photo on check-in/out** - Need to enforce photo requirement

#### 5. Payment Tracking & Reports
- L **Payment status tracking** - No payment fields in Task model
- L **Invoice photo upload** - Can upload attachments but no payment linkage
- L **Monthly reports per employee** - No reporting endpoints
- L **Days worked calculation** - No time tracking logic
- L **Tasks completed count** - Can query but no dedicated endpoint
- L **Revenue tracking** - No revenue/payment fields
- L **Revenue splitting** - No logic for multi-worker revenue distribution

### Worker Features (Chéc nng dành cho Nhân viên)

#### 1. Authentication
-  **Login system** - Clerk authentication implemented
-  **Worker role** - nvInternalWorker role exists
-  **Secure access** - JWT-based authentication via Clerk

#### 2. Task Management
-  **View assigned tasks** - `GET /v1/task/?assignedOnly=true` endpoint
-  **View task details** - Workers can view tasks they're assigned to
-  **Filter by status** - Query parameter supported
-  **Task information** - Customer, location, description all available
-  **Task timeline** - createdAt, startedAt, completedAt timestamps

#### 3. Check-in/Check-out Workflow
- ó **Update task status** - `PUT /v1/task/:id/status` endpoint exists
- ó **Status transitions** - READY ’ IN_PROGRESS ’ COMPLETED implemented
- L **Dedicated check-in endpoint** - Missing `/task/:id/check-in`
- L **Dedicated check-out endpoint** - Missing `/task/:id/check-out`
- L **GPS requirement** - Not enforced on status change
- L **Photo requirement** - Not enforced on check-in/out
- ó **Upload photos** - `POST /v1/task/:id/attachments` exists but not tied to check-in/out

#### 4. Payment Updates
- ó **Upload invoice photos** - Can upload attachments but no payment context
- L **Payment status updates** - No payment tracking system
- L **Payment notifications** - No notification system

---

## Database Schema Status

###  Implemented Models

1. **Task** - Core task entity with status lifecycle
   - Fields: id, title, description, status, assigneeIds, customerId, geoLocationId
   - Timestamps: createdAt, updatedAt, startedAt, completedAt
   - Relations: Customer, GeoLocation, Attachments

2. **Customer** - Customer information
   - Fields: id, name, phone
   - Relations: Tasks

3. **GeoLocation** - Location tracking
   - Fields: id, address, name, lat, lng
   - Relations: Tasks
   - Indexes: (lat, lng) for geospatial queries

4. **Activity** - Audit log for all actions
   - Fields: id, userId, topic, action, payload
   - Indexes: userId, createdAt, topic

5. **Attachment** - File storage (images, videos, PDFs)
   - Fields: id, taskId, provider, url, pathname, size, mimeType
   - Features: Soft delete, thumbnails, blurhash, dimensions
   - Storage: Vercel Blob or Local Disk

### L Missing Models/Fields

1. **Payment** - Need dedicated payment tracking
   ```prisma
   model Payment {
     id            String   @id @default(cuid())
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt

     taskId        Int
     task          Task     @relation(fields: [taskId], references: [id])

     amount        Decimal
     status        PaymentStatus @default(PENDING)
     paidAt        DateTime?

     // Invoice attachments
     invoiceAttachmentId String?
     invoiceAttachment   Attachment? @relation(fields: [invoiceAttachmentId])

     notes         String?
   }

   enum PaymentStatus {
     PENDING
     PARTIAL
     COMPLETED
     CANCELLED
   }
   ```

2. **TaskCheckIn/TaskCheckOut** - Dedicated check-in/out tracking
   ```prisma
   model TaskCheckIn {
     id            String      @id @default(cuid())
     createdAt     DateTime    @default(now())

     taskId        Int
     task          Task        @relation(fields: [taskId], references: [id])
     userId        String

     geoLocationId String
     geoLocation   GeoLocation @relation(fields: [geoLocationId], references: [id])

     photoAttachmentId String?
     photoAttachment   Attachment? @relation(fields: [photoAttachmentId])

     notes         String?
   }

   model TaskCheckOut {
     id            String      @id @default(cuid())
     createdAt     DateTime    @default(now())

     taskId        Int
     task          Task        @relation(fields: [taskId], references: [id])
     userId        String

     geoLocationId String
     geoLocation   GeoLocation @relation(fields: [geoLocationId], references: [id])

     photoAttachmentId String?
     photoAttachment   Attachment? @relation(fields: [photoAttachmentId])

     notes         String?
   }
   ```

3. **Task Model Extensions** - Add payment fields
   ```prisma
   model Task {
     // ... existing fields ...

     // Payment tracking
     expectedRevenue  Decimal?
     actualRevenue    Decimal?
     payments         Payment[]

     // Check-in/out tracking
     checkIns         TaskCheckIn[]
     checkOuts        TaskCheckOut[]
   }
   ```

---

## API Endpoints Status

###  Implemented Endpoints

#### Authentication & Users
- `GET /v1/user/me` - Get current user
- `POST /v1/user/` - Create new employee
- `GET /v1/user/` - List all employees
- `GET /v1/user/:id/public-info` - Get employee public info
- `PUT /v1/user/:id/ban` - Ban/unban employee
- `PUT /v1/user/:id/roles` - Update employee roles

#### Tasks
- `GET /v1/task/` - List tasks (with pagination, filtering, assignedOnly)
- `POST /v1/task/` - Create new task
- `GET /v1/task/:id` - Get task details
- `PUT /v1/task/:id/assignees` - Update task assignees
- `PUT /v1/task/:id/status` - Update task status
- `POST /v1/task/:id/attachments` - Upload attachments to task

#### Attachments
- `GET /v1/attachments?ids=` - Get attachments by IDs with signed URLs
- `GET /v1/attachments/view/:token` - Stream file (no auth, token-based)
- `DELETE /v1/attachments/:id` - Soft delete attachment

#### Activity
- `GET /v1/activity` - Get activity feed (with topic filtering)
- `POST /v1/activity` - Create activity log entry

### L Missing Endpoints

#### Check-in/Check-out

#### Task Management
- `PUT /v1/task/:id` - Update task details (title, description, customer, location)
- `DELETE /v1/task/:id` - Delete task (soft delete recommended)
- `POST /v1/task/:id/duplicate` - Duplicate existing task
- `POST /v1/task/:id/check-in` - Check in with GPS + photo
- `POST /v1/task/:id/check-out` - Check out with GPS + photo
- `GET /v1/task/:id/check-ins` - List check-in history
- `GET /v1/task/:id/check-outs` - List check-out history

#### Payments
- `POST /v1/task/:id/payments` - Create payment record
- `PUT /v1/payment/:id` - Update payment status
- `GET /v1/payment/:id` - Get payment details
- `POST /v1/payment/:id/invoice` - Upload invoice photo

#### Reports
- `GET /v1/reports/employee/:userId/monthly?month=YYYY-MM` - Monthly employee report
  - Days worked
  - Tasks completed
  - Total revenue
  - Revenue breakdown per task
- `GET /v1/reports/task/:id/revenue` - Task revenue details with splits
- `GET /v1/reports/overview?from=&to=` - Overall business reports

#### User Management Extensions
- `DELETE /v1/user/:id` - Delete employee account
- `PUT /v1/user/:id/profile` - Update employee profile

---

## Mobile App Status

###  Implemented Screens

#### Authentication Screens (`/app/(auth)/`)
- `sign-in.tsx` - Login screen
- `sign-up/index.tsx` - Registration screen
- `sign-up/verify-email.tsx` - Email verification
- `forgot-password.tsx` - Password reset request
- `reset-password.tsx` - Password reset confirmation

#### Admin Screens (`/app/admin/`)
- `(tabs)/index.tsx` - Admin dashboard
- `(tabs)/tasks.tsx` - Task list
- `(tabs)/users.tsx` - Employee list
- `(tabs)/settings.tsx` - Admin settings
- `tasks/create.tsx` - Create new task
- `tasks/[taskId]/view.tsx` - Task details
- `users/create.tsx` - Create new employee

#### Worker Screens (`/app/worker/`)
- `(tabs)/index.tsx` - Worker dashboard
- `(tabs)/settings.tsx` - Worker settings
- `tasks/[taskId]/view.tsx` - Task details

#### Shared Screens
- `(inputs)/location-picker/` - Location picker with map
- `(user-settings)/change-password.tsx` - Change password
- `(user-settings)/theme-switcher.tsx` - Theme settings

###  Implemented Components

Based on codebase analysis:
- `TaskDetails` - Card-based task details display
- `TaskDetailsSkeleton` - Loading skeleton
- `ActivityFeed` - Activity timeline
- `TaskCommentBox` - Comment input
- `AttachmentViewer` - Image/video/PDF viewer
- UI components from shadcn/ui (Button, Card, Form, etc.)

### L Missing Screens & Features

#### Admin Missing Features
1. **Employee Management**
   - Edit employee profile screen
   - Delete employee confirmation
   - Employee details screen with task history

2. **Task Management**
   - Edit task screen
   - Bulk task assignment
   - Task calendar view
   - Map view of all tasks

3. **Payment Management**
   - Payment tracking screen per task
   - Invoice upload/view screen
   - Payment status update screen

4. **Reports & Analytics**
   - Monthly employee reports screen
   - Revenue dashboard
   - Task completion statistics
   - Worker performance metrics

#### Worker Missing Features
1. **Check-in/Check-out**
   - Dedicated check-in screen with GPS + camera
   - Dedicated check-out screen with GPS + camera
   - GPS verification UI
   - Photo capture enforcement

2. **Payment Features**
   - Invoice upload screen
   - Payment status view
   - Task revenue information

3. **Task Filters**
   - Filter by date range
   - Filter by location proximity
   - Search tasks

---

## Technical Debt & Improvements

### High Priority

1. **Check-in/Check-out System** =4
   - Create dedicated check-in/out endpoints
   - Implement GPS verification (distance threshold)
   - Enforce photo attachment requirement
   - Create mobile UI for check-in/out flow

2. **Payment Tracking** =4
   - Add Payment model to database
   - Create payment CRUD endpoints
   - Implement revenue splitting logic
   - Build admin payment management UI
   - Build worker invoice upload UI

3. **Monthly Reports** =4
   - Build reporting endpoints
   - Calculate days worked from check-in/out data
   - Calculate completed tasks count
   - Calculate revenue per employee
   - Build admin reports dashboard UI

4. **Employee Management** =á
   - Add delete employee endpoint
   - Add update employee profile endpoint
   - Build edit employee screen
   - Build employee details screen

### Medium Priority

5. **Notifications** =á
   - Push notifications for task assignments
   - Notifications for payment updates
   - Notifications for task status changes

6. **Map Features** =á
   - Map view of all active tasks
   - Route optimization for workers
   - Location proximity search

7. **Offline Support** =á
   - Offline task viewing
   - Queue check-in/out when offline
   - Sync when back online

### Low Priority

8. **Analytics & Insights** =â
   - Worker performance dashboards
   - Task completion trends
   - Revenue forecasting
   - Customer analytics

9. **Advanced Features** =â
   - Task templates
   - Recurring tasks
   - Customer portal
   - SMS notifications

---

## v1 Milestone Definition

**Definition of Done for v1:**

### Must Have (Blocker for v1 Release) =4

1.  Admin can create/edit/ban employee accounts
2.  Admin can create tasks with customer & location
3.  Admin can assign multiple workers to tasks
2b. âŒ **Admin can edit/update existing tasks**
4.  Admin can view task list and details
5. ó Admin can track task status (PREPARING ’ READY ’ IN_PROGRESS ’ COMPLETED)
6. L **Admin can track payment status per task**
7. L **Admin can view monthly reports per employee**
8.  Worker can login and view assigned tasks
9. L **Worker can check-in with GPS + photo**
10. L **Worker can check-out with GPS + photo**
11. L **Worker can upload invoice photos**
12.  Worker can update task progress (IN_PROGRESS ’ COMPLETED)

### Should Have (Important but not blocking) =á

13. ó Task activity feed (partially implemented)
14. L Push notifications for task assignments
15. L Edit task information
16. L Delete employee accounts
17. L Revenue splitting for multi-worker tasks
18. L GPS verification on check-in (distance from task location)

### Nice to Have (Post-v1) =â

19. Map view of tasks
20. Offline support
21. Task templates
22. Advanced analytics
23. Customer portal

---

## Implementation Roadmap

### Phase 1: Payment System (Week 1-2)

**Priority:** =4 Critical

**Database Changes:**
1. Create Payment model with status enum
2. Add payment fields to Task model (expectedRevenue, actualRevenue)
3. Create migration

**API Endpoints:**
1. `POST /v1/task/:id/payments` - Create payment
2. `PUT /v1/payment/:id` - Update payment status
3. `GET /v1/task/:id/payments` - List task payments
4. `POST /v1/payment/:id/invoice` - Upload invoice

**Mobile UI:**
1. Admin: Payment tracking screen per task
2. Admin: Payment status update modal
3. Worker: Invoice upload screen
4. Worker: Payment status view in task details

**Validation:**
1. Zod schema for payment creation
2. Payment status enum validation
3. Invoice attachment validation

**Testing:**
1. Unit tests for payment service
2. Integration tests for payment endpoints
3. E2E tests for payment workflow

---

### Phase 2: Check-in/Check-out System (Week 3-4)

**Priority:** =4 Critical

**Database Changes:**
1. Create TaskCheckIn model
2. Create TaskCheckOut model
3. Add relations to Task, GeoLocation, Attachment
4. Create migration

**API Endpoints:**
1. `POST /v1/task/:id/check-in` - Check in with GPS + photo
   - Validate user is assigned to task
   - Validate task status is READY
   - Require GPS coordinates
   - Require photo attachment
   - Update task status to IN_PROGRESS
   - Set startedAt timestamp
   - Log activity

2. `POST /v1/task/:id/check-out` - Check out with GPS + photo
   - Validate user is assigned to task
   - Validate task status is IN_PROGRESS
   - Require GPS coordinates
   - Require photo attachment
   - Update task status to COMPLETED
   - Set completedAt timestamp
   - Log activity

3. `GET /v1/task/:id/check-ins` - List check-in history
4. `GET /v1/task/:id/check-outs` - List check-out history

**Mobile UI:**
1. Worker: Check-in screen
   - GPS location capture
   - Camera integration for photo
   - GPS verification indicator
   - Submit button

2. Worker: Check-out screen
   - GPS location capture
   - Camera integration for photo
   - GPS verification indicator
   - Submit button

3. Worker: Task details enhancements
   - Check-in button (when status = READY)
   - Check-out button (when status = IN_PROGRESS)
   - Check-in/out history display

4. Admin: Task details enhancements
   - View check-in/out history
   - View check-in/out photos
   - View GPS coordinates on map

**Business Logic:**
1. GPS verification
   - Calculate distance from task location
   - Allow check-in if within X meters (configurable, default 100m)
   - Warning if outside threshold

2. Photo requirements
   - Enforce photo on check-in
   - Enforce photo on check-out
   - Validate file is image type

3. Status transitions
   - READY ’ IN_PROGRESS on check-in
   - IN_PROGRESS ’ COMPLETED on check-out
   - Only assigned workers can check-in/out

**Validation:**
1. Zod schemas for check-in/out requests
2. GPS coordinate validation
3. Photo attachment validation

**Testing:**
1. Unit tests for check-in/out service
2. Integration tests for check-in/out endpoints
3. Test GPS distance calculation
4. Test photo requirement enforcement
5. E2E tests for check-in/out workflow

---

### Phase 3: Monthly Reports (Week 5)

**Priority:** =4 Critical

**API Endpoints:**
1. `GET /v1/reports/employee/:userId/monthly?month=YYYY-MM`
   - Days worked (unique days with check-ins)
   - Tasks completed count
   - Total revenue (sum of actualRevenue from completed tasks)
   - Revenue breakdown per task
   - Handle multi-worker revenue splits (divide equally)

2. `GET /v1/reports/task/:id/revenue`
   - Task revenue details
   - Worker splits
   - Payment history

**Mobile UI:**
1. Admin: Monthly reports screen
   - Month picker
   - Employee selector
   - Display metrics:
     - Days worked
     - Tasks completed
     - Total revenue
   - Task list with revenue per task
   - Export to PDF/CSV (future)

**Business Logic:**
1. Days worked calculation
   - Count unique dates from check-in records
   - Filter by employee and month

2. Tasks completed calculation
   - Count tasks with status=COMPLETED
   - Filter by assigneeIds contains userId
   - Filter by completedAt month

3. Revenue calculation
   - Sum actualRevenue from completed tasks
   - Divide by number of assignees for multi-worker tasks
   - Handle null/missing revenue values

**Testing:**
1. Unit tests for report calculation logic
2. Integration tests for report endpoints
3. Test multi-worker revenue splitting
4. Test date range filtering

---

### Phase 3b: Task CRUD Enhancements (Week 5 - Parallel with Reports)

**Priority:** ðŸŸ¡ Important

**API Endpoints:**
1. `PUT /v1/task/:id` - Update task details
   - Validate user is admin
   - Allow updating: title, description, customer info, location
   - Cannot update if task status is COMPLETED
   - Log activity for changes

2. `DELETE /v1/task/:id` - Delete task (soft delete)
   - Validate user is admin
   - Only allow deleting tasks in PREPARING or READY status
   - Soft delete by setting deletedAt timestamp
   - Log activity

**Mobile UI:**
1. Admin: Edit task screen (admin/tasks/[taskId]/edit.tsx)
   - Reuse same form as create task
   - Pre-populate with existing task data
   - Save button updates task
   - Cannot edit if task is COMPLETED

2. Admin: Task details screen enhancements
   - Add "Edit" button (visible for PREPARING/READY status)
   - Add "Delete" button with confirmation dialog
   - Show edit history in activity feed

**Validation:**
1. Zod schema for task update (similar to zCreateTask)
2. Status-based edit restrictions
3. Permission checks

**Testing:**
1. Unit tests for update/delete task service
2. Integration tests for endpoints
3. Test status restrictions
4. Test activity logging


### Phase 4: Employee Management Enhancements (Week 6)

**Priority:** =á Important

**API Endpoints:**
1. `DELETE /v1/user/:id` - Delete employee
   - Check user is not assigned to active tasks
   - Soft delete or hard delete (decision needed)

2. `PUT /v1/user/:id/profile` - Update employee profile
   - Update firstName, lastName, phone, email

**Mobile UI:**
1. Admin: Edit employee screen
   - Form to update employee info
   - Save button

2. Admin: Employee details screen
   - Employee information
   - Task history
   - Performance metrics
   - Delete button with confirmation

**Testing:**
1. Unit tests for user update/delete service
2. Integration tests for endpoints
3. Test cascade delete behavior

---

### Phase 5: Polish & Testing (Week 7)

**Priority:** =á Important

**Tasks:**
1. End-to-end testing
   - Admin workflow: Create employee ’ Create task ’ Assign ’ Monitor
   - Worker workflow: Login ’ View tasks ’ Check-in ’ Check-out ’ Upload invoice
   - Payment workflow: Create payment ’ Upload invoice ’ Update status

2. Performance optimization
   - Database query optimization
   - Add necessary indexes
   - Implement caching where appropriate

3. Error handling improvements
   - Better error messages in Vietnamese
   - Proper HTTP status codes
   - Client-side error handling

4. UI/UX polish
   - Loading states
   - Empty states
   - Error states
   - Success feedback

5. Documentation
   - API documentation
   - Mobile app user guide
   - Admin guide
   - Deployment guide

---

### Phase 6: Nice-to-Have Features (Post-v1)

**Priority:** =â Optional

1. **Notifications**
   - Push notifications setup (Expo Notifications)
   - Task assignment notifications
   - Payment update notifications

2. **Map Features**
   - Map view of all tasks
   - Route optimization
   - Proximity search

3. **Offline Support**
   - TanStack Query persistence
   - Queue mutations when offline
   - Sync when online

4. **Advanced Analytics**
   - Performance dashboards
   - Trend analysis
   - Revenue forecasting

---

## Success Criteria

### v1 Launch Checklist

**Functionality:**
-  Admin can manage employees (create, edit, ban, view)
-  Admin can manage tasks (create, assign, view, track status)
- L Admin can track payments per task
- L Admin can view monthly employee reports
-  Worker can view assigned tasks
- L Worker can check-in/out with GPS + photo
- L Worker can upload invoices
-  Authentication & authorization working

**Quality:**
- L All critical paths have unit tests (target: >80% coverage)
- L All API endpoints have integration tests
- L E2E tests for main workflows
- ó No critical bugs
- ó Performance acceptable (<2s API response, <3s screen load)

**Documentation:**
- ó API documentation complete
- L User guides for admin and worker
-  Developer documentation (CLAUDE.md)
- L Deployment documentation

**Deployment:**
-  API deployed to Vercel
-  Database on Neon (PostgreSQL)
-  File storage on Vercel Blob
- L Mobile app ready for TestFlight/Play Store Beta
- L CI/CD pipeline setup

---

## Risk Assessment

### High Risk =4

1. **GPS Accuracy Issues**
   - **Risk:** GPS may be inaccurate in urban areas or indoors
   - **Mitigation:**
     - Allow manual override with reason
     - Admin can review flagged check-ins
     - Use higher accuracy GPS mode
     - Configurable distance threshold

2. **Offline Functionality**
   - **Risk:** Workers may have poor network in the field
   - **Mitigation:**
     - Implement offline support for Phase 6
     - Cache task details for offline viewing
     - Queue check-in/out when offline
     - Retry mechanism with exponential backoff

3. **Data Migration**
   - **Risk:** Schema changes may require data migration
   - **Mitigation:**
     - Use Prisma migrations properly
     - Test migrations on staging first
     - Backup database before migration
     - Have rollback plan

### Medium Risk =á

4. **Revenue Calculation Complexity**
   - **Risk:** Multi-worker revenue splits may be complex
   - **Mitigation:**
     - Start with simple equal split
     - Allow manual override by admin
     - Document calculation logic clearly

5. **Photo Storage Costs**
   - **Risk:** Vercel Blob costs may increase with many photos
   - **Mitigation:**
     - Compress images before upload
     - Generate thumbnails for previews
     - Monitor storage usage
     - Consider cheaper storage alternatives

### Low Risk =â

6. **User Adoption**
   - **Risk:** Workers may resist new technology
   - **Mitigation:**
     - Simple, intuitive UI
     - Vietnamese language support
     - In-person training
     - Admin can monitor usage

---

## Open Questions

1. **Payment Structure:**
   - How is revenue split for multi-worker tasks? (Equal split or configurable?)
   - Can a task have multiple partial payments?
   - Who determines when payment is complete - admin or system?

2. **Check-in/Check-out:**
   - What is the acceptable GPS accuracy threshold? (Recommend 100m)
   - Can workers check-in/out without network? (Recommend offline queue)
   - Can workers check-in early or check-out late?

3. **Employee Management:**
   - Should deleting an employee be soft delete or hard delete?
   - What happens to tasks when an employee is deleted/banned?
   - Can workers see other workers' information?

4. **Reports:**
   - What date range for reports? (Default current month)
   - Should reports be exportable? (PDF/Excel)
   - Real-time or cached reports?

5. **Business Rules:**
   - Can a task have zero assignees?
   - Can admin force-complete a task?
   - Can workers reject task assignments?

---

## Appendix: Technology Stack

### Backend (API)
- **Framework:** Hono (lightweight, fast)
- **Database:** PostgreSQL via Neon (serverless)
- **ORM:** Prisma
- **Authentication:** Clerk
- **Validation:** Zod
- **Storage:** Vercel Blob / Local Disk
- **Deployment:** Vercel (serverless functions)
- **Testing:** Jest
- **Logging:** Pino

### Frontend (Mobile)
- **Framework:** React Native (Expo)
- **Routing:** Expo Router (file-based)
- **State:** TanStack Query (React Query)
- **Styling:** NativeWind (Tailwind CSS)
- **Forms:** React Hook Form + Zod
- **Auth:** Clerk SDK
- **Maps:** React Native Maps
- **Camera:** Expo Camera
- **Location:** Expo Location

### DevOps
- **Version Control:** Git
- **Package Manager:** pnpm
- **Monorepo:** pnpm workspaces
- **CI/CD:** GitHub Actions (future)
- **Code Quality:** Biome (formatter + linter)
- **API Client:** Hono RPC (type-safe)

---

## Glossary

- **Admin (nvInternalAdmin):** Company administrator who manages employees and assigns tasks
- **Worker (nvInternalWorker):** Field technician who performs air conditioning service tasks
- **Check-in:** Worker arrives at task location, verified by GPS + photo
- **Check-out:** Worker completes task at location, verified by GPS + photo
- **Task Status Lifecycle:** PREPARING (draft) ’ READY (assigned) ’ IN_PROGRESS (worker started) ’ ON_HOLD (paused) ’ COMPLETED (finished)
- **Payment Status:** PENDING ’ PARTIAL ’ COMPLETED ’ CANCELLED
- **Soft Delete:** Record marked as deleted but kept in database (deletedAt timestamp)
- **Activity Log:** Audit trail of all actions in the system

---

**Document Version:** 1.0
**Next Review:** After Phase 1 completion
