# Phase 1: Payment System

**Timeline:** Week 1-2
**Priority:** 🔴 Critical
**Status:** ⏳ Not Started

---

## Overview

Implement comprehensive payment tracking system to allow admin to track payment status per task and workers to upload invoice photos. This addresses a critical gap in the contract requirements.

## Contract Requirements

From the contract:
- **Admin:** Track payment status per task, view revenue reports
- **Worker:** Upload invoice photos to update payment progress

## Current State

- ❌ No Payment model in database
- ❌ No payment tracking endpoints
- ⏳ Can upload attachments but no payment context
- ❌ No payment status tracking
- ❌ No revenue fields on Task model

---

## Database Changes

### New Payment Model

```prisma
model Payment {
  id            String        @id @default(cuid())
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  taskId        Int
  task          Task          @relation(fields: [taskId], references: [id])

  amount        Decimal       @db.Decimal(12, 2)
  status        PaymentStatus @default(PENDING)
  paidAt        DateTime?

  // Invoice attachments
  invoiceAttachmentId String?
  invoiceAttachment   Attachment? @relation(fields: [invoiceAttachmentId], references: [id])

  notes         String?
  createdBy     String        // Clerk userId

  @@index([taskId])
  @@index([status])
}

enum PaymentStatus {
  PENDING       // Payment not yet received
  PARTIAL       // Partial payment received
  COMPLETED     // Full payment received
  CANCELLED     // Payment cancelled
}
```

### Task Model Extensions

```prisma
model Task {
  // ... existing fields ...

  // Payment tracking
  expectedRevenue  Decimal?  @db.Decimal(12, 2)
  actualRevenue    Decimal?  @db.Decimal(12, 2)
  payments         Payment[]
}
```

### Migration Steps

1. Create migration file: `npx prisma migrate dev --name add_payment_system`
2. Test migration on staging database first
3. Backup production database before applying
4. Apply migration: `npx prisma migrate deploy`

---

## API Endpoints

### 1. Create Payment

**Endpoint:** `POST /v1/task/:id/payments`

**Request Body:**
```typescript
{
  amount: number         // Required
  status: PaymentStatus  // Optional, defaults to PENDING
  notes?: string         // Optional
  paidAt?: string       // ISO date, optional
}
```

**Response:**
```typescript
{
  id: string
  taskId: number
  amount: number
  status: PaymentStatus
  paidAt: string | null
  invoiceAttachmentId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}
```

**Business Logic:**
- Validate user is admin
- Validate task exists
- Create payment record
- Update task actualRevenue (sum of all completed payments)
- Log activity: `PAYMENT_CREATED`

**Validation:**
```typescript
const zCreatePayment = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  status: z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().trim().optional(),
  paidAt: z.string().datetime().optional(),
})
```

---

### 2. Update Payment Status

**Endpoint:** `PUT /v1/payment/:id`

**Request Body:**
```typescript
{
  status: PaymentStatus  // Required
  amount?: number        // Optional, update amount
  notes?: string         // Optional
  paidAt?: string       // ISO date, optional
}
```

**Response:** Same as create payment

**Business Logic:**
- Validate user is admin
- Validate payment exists
- Update payment record
- If status changed to COMPLETED, set paidAt to now if not provided
- Recalculate task actualRevenue
- Log activity: `PAYMENT_UPDATED`

---

### 3. List Task Payments

**Endpoint:** `GET /v1/task/:id/payments`

**Query Parameters:**
```typescript
{
  status?: PaymentStatus  // Optional filter
}
```

**Response:**
```typescript
{
  payments: Payment[]
  summary: {
    totalExpected: number
    totalReceived: number
    totalPending: number
  }
}
```

**Business Logic:**
- Validate user can view task (admin or assigned worker)
- Return all payments for task
- Calculate summary totals

---

### 4. Upload Invoice

**Endpoint:** `POST /v1/payment/:id/invoice`

**Request:** multipart/form-data with file

**Response:**
```typescript
{
  payment: Payment        // Updated payment with invoiceAttachmentId
  attachment: Attachment  // The uploaded invoice
}
```

**Business Logic:**
- Validate user is assigned to task or is admin
- Validate payment exists
- Upload file to storage
- Create Attachment record
- Link attachment to payment
- Log activity: `INVOICE_UPLOADED`

**File Validation:**
- Max size: 10MB
- Allowed types: image/*, application/pdf
- Generate thumbnail for images
- Calculate blurhash for preview

---

## Mobile UI

### Admin: Payment Tracking Screen

**Location:** `apps/mobile/app/admin/tasks/[taskId]/payments.tsx`

**Features:**
- List all payments for task
- Payment summary card (expected, received, pending)
- Create payment button → modal
- Edit payment status → modal
- View invoice photos
- Payment history timeline

**UI Components:**
```tsx
<PaymentSummaryCard
  expectedRevenue={task.expectedRevenue}
  actualRevenue={task.actualRevenue}
  payments={payments}
/>

<PaymentList payments={payments}>
  <PaymentItem
    payment={payment}
    onEdit={handleEdit}
    onViewInvoice={handleViewInvoice}
  />
</PaymentList>

<CreatePaymentModal
  taskId={task.id}
  onSuccess={refetchPayments}
/>
```

**Validation:**
- Form validation with react-hook-form + Zod
- Amount must be positive number
- Status selection
- Optional notes textarea

---

### Admin: Payment Status Update Modal

**Features:**
- Update payment status dropdown
- Update amount input
- Update notes
- Set paid date
- View invoice if exists
- Save button

---

### Worker: Invoice Upload Screen

**Location:** `apps/mobile/app/worker/tasks/[taskId]/upload-invoice.tsx`

**Features:**
- Camera integration for invoice photo
- Photo gallery selection
- Preview before upload
- Upload progress indicator
- Success feedback
- Link to payment if exists

**UI Flow:**
1. Worker navigates from task details
2. Selects payment (if multiple)
3. Takes photo or selects from gallery
4. Previews photo
5. Uploads with loading state
6. Shows success message
7. Returns to task details

**Components:**
```tsx
<InvoiceCamera
  onCapture={handleCapture}
/>

<InvoicePreview
  imageUri={imageUri}
  onConfirm={handleUpload}
  onRetake={handleRetake}
/>

<UploadProgress
  progress={uploadProgress}
/>
```

---

### Worker: Payment Status View

**Location:** Part of task details screen

**Features:**
- Payment status badge
- Amount display
- Invoice thumbnail (if uploaded)
- Upload invoice button (if no invoice)

---

## Service Layer

### payment.service.ts

```typescript
// Permission checks
export async function canUserCreatePayment({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserUpdatePayment({ user }: { user: User }) {
  return isUserAdmin({ user })
}

export async function canUserUploadInvoice({
  user,
  payment,
}: {
  user: User
  payment: Payment & { task: Task }
}) {
  const isAdmin = await isUserAdmin({ user })
  const isAssigned = payment.task.assigneeIds.includes(user.id)
  return isAdmin || isAssigned
}

// CRUD operations
export async function createPayment({
  taskId,
  data,
  user,
}: {
  taskId: number
  data: CreatePaymentValues
  user: User
}) {
  // Implementation
}

export async function updatePayment({
  paymentId,
  data,
  user,
}: {
  paymentId: string
  data: UpdatePaymentValues
  user: User
}) {
  // Implementation
}

export async function uploadInvoice({
  paymentId,
  file,
  user,
  storage,
}: {
  paymentId: string
  file: File
  user: User
  storage: StorageProvider
}) {
  // Implementation
}

export async function getTaskPayments({
  taskId,
  status,
}: {
  taskId: number
  status?: PaymentStatus
}) {
  // Implementation with summary calculation
}
```

---

## Validation Schemas

### packages/validation/src/payment.zod.ts

```typescript
import { z } from './zod'

export const PaymentStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const zCreatePayment = z.object({
  amount: z
    .number()
    .positive('Số tiền phải lớn hơn 0')
    .max(1000000000, 'Số tiền quá lớn'),
  status: z.enum(Object.values(PaymentStatus) as [string, ...string[]]).optional(),
  notes: z.string().trim().max(500, 'Ghi chú quá dài').optional(),
  paidAt: z.string().datetime().optional(),
})

export const zUpdatePayment = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0').optional(),
  status: z.enum(Object.values(PaymentStatus) as [string, ...string[]]),
  notes: z.string().trim().max(500, 'Ghi chú quá dài').optional(),
  paidAt: z.string().datetime().optional(),
})

export type CreatePaymentValues = z.infer<typeof zCreatePayment>
export type UpdatePaymentValues = z.infer<typeof zUpdatePayment>
```

---

## Testing Strategy

### Unit Tests

**File:** `apps/api/src/v1/payment/__tests__/payment.service.test.ts`

Test cases:
- ✅ Admin can create payment
- ✅ Worker cannot create payment
- ✅ Creating payment updates task actualRevenue
- ✅ Updating payment to COMPLETED sets paidAt
- ✅ Recalculate actualRevenue when payment updated
- ✅ Activity logged on payment create/update
- ✅ Worker can upload invoice if assigned to task
- ✅ Worker cannot upload invoice if not assigned

### Integration Tests

**File:** `apps/api/src/v1/payment/__tests__/payment.route.test.ts`

Test cases:
- ✅ POST /v1/task/:id/payments returns 201
- ✅ POST /v1/task/:id/payments validates amount
- ✅ PUT /v1/payment/:id updates status
- ✅ GET /v1/task/:id/payments returns all payments
- ✅ GET /v1/task/:id/payments calculates summary correctly
- ✅ POST /v1/payment/:id/invoice uploads file
- ✅ POST /v1/payment/:id/invoice validates file type

### E2E Tests

Test workflows:
1. Admin creates task → adds payment → worker uploads invoice → admin marks completed
2. Task with multiple payments → total revenue calculation
3. Worker uploads invoice without payment → system handles gracefully

---

## Activity Logging

Log these activities:
- `PAYMENT_CREATED` - Admin creates payment
- `PAYMENT_UPDATED` - Admin updates payment status/amount
- `PAYMENT_COMPLETED` - Payment marked as completed
- `INVOICE_UPLOADED` - Worker uploads invoice photo
- `INVOICE_DELETED` - Invoice removed (admin only)

---

## Error Handling

Common errors:
- `PAYMENT_NOT_FOUND` - 404
- `TASK_NOT_FOUND` - 404
- `INSUFFICIENT_PERMISSIONS` - 403
- `INVALID_AMOUNT` - 400
- `INVALID_FILE_TYPE` - 400
- `FILE_TOO_LARGE` - 400

Vietnamese error messages:
- "Không tìm thấy thông tin thanh toán"
- "Bạn không có quyền tạo thanh toán"
- "Số tiền không hợp lệ"
- "Loại tệp không được hỗ trợ"
- "Kích thước tệp quá lớn (tối đa 10MB)"

---

## Success Criteria

- ✅ Admin can create payments for tasks
- ✅ Admin can update payment status
- ✅ Admin can view payment history and summary
- ✅ Worker can upload invoice photos
- ✅ Task actualRevenue automatically calculated
- ✅ All actions logged to activity feed
- ✅ Unit test coverage >80%
- ✅ All integration tests passing
- ✅ Vietnamese error messages

---

## Open Questions

1. **Multiple Payments:** Can a task have multiple partial payments before completion?
   - **Recommendation:** Yes, allow multiple payments to track installments

2. **Payment Validation:** Should sum of payments match expectedRevenue?
   - **Recommendation:** No, allow flexibility. Show warning if mismatch.

3. **Invoice Required:** Must worker upload invoice to mark payment complete?
   - **Recommendation:** No, make optional. Admin can complete without invoice.

4. **Payment Deletion:** Can admin delete payments?
   - **Recommendation:** Phase 2 feature. For now, use CANCELLED status.

5. **Currency:** Always VND or multi-currency?
   - **Recommendation:** Always VND for v1. Add currency field in future.

---

## Dependencies

- Prisma client regeneration
- Attachment upload system (already exists)
- Activity logging system (already exists)
- Admin/worker permission checks (already exists)

---

## Rollout Plan

1. **Week 1 - Backend**
   - Day 1-2: Database migration + Payment model
   - Day 3-4: API endpoints (create, update, list)
   - Day 5: Invoice upload endpoint
   - Testing throughout

2. **Week 2 - Frontend**
   - Day 1-2: Admin payment tracking UI
   - Day 3-4: Worker invoice upload UI
   - Day 5: Integration testing + bug fixes

---

## Related Files

- Database: `apps/api/prisma/schema.prisma`
- API Routes: `apps/api/src/v1/payment/payment.route.ts`
- Service: `apps/api/src/v1/payment/payment.service.ts`
- Validation: `packages/validation/src/payment.zod.ts`
- Admin UI: `apps/mobile/app/admin/tasks/[taskId]/payments.tsx`
- Worker UI: `apps/mobile/app/worker/tasks/[taskId]/upload-invoice.tsx`
