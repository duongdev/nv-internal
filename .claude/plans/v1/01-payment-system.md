# Phase 1: Payment System

**Timeline:** Week 1-2 (8 days total)
**Priority:** 🔴 Critical
**Status:** ✅ Completed (2025-10-24)

---

## Overview

Implement simplified checkout-based payment collection system where workers confirm payment received during task checkout. This streamlined approach focuses on core payment tracking needs while maintaining extensibility for future enhancements.

**Key Design Principles:**
- **Worker Trust**: Trust workers to collect payment correctly - invoice photo is OPTIONAL
- **Progressive Disclosure**: Payment fields only appear when needed
- **Mobile-Optimized**: Radio cards, inline camera, clear visual hierarchy
- **Extensible Architecture**: Schema supports v2+ features without migrations

## Contract Requirements

From the contract:
- **Admin:** Track payment status per task, set expected revenue for tasks
- **Worker:** Confirm payment collection at checkout, upload invoice photos as proof

## Current State

- ❌ No Payment model in database
- ✅ Checkout system exists (can extend with payment collection)
- ✅ Attachment upload system works (can use for invoices)
- ❌ No expectedRevenue field on Task model
- ❌ No payment confirmation at checkout

---

## Database Changes

### New Payment Model (GAAP-Compliant Precision)

```prisma
model Payment {
  id                  String      @id @default(cuid())
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relations
  taskId              Int
  task                Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)

  // Financial data - GAAP compliant precision
  amount              Decimal     @db.Decimal(15, 4)  // Supports up to 999,999,999,999.9999
  currency            String      @default("VND")     // ISO 4217 currency code

  // Collection metadata
  collectedAt         DateTime    @default(now())
  collectedBy         String      // Clerk userId (worker)

  // Invoice attachment (OPTIONAL - trust workers)
  invoiceAttachmentId String?
  invoiceAttachment   Attachment? @relation(fields: [invoiceAttachmentId], references: [id], onDelete: SetNull)

  notes               String?     @db.Text

  @@index([taskId])
  @@index([collectedBy])
  @@index([collectedAt])
  @@index([currency])
}

// No enum needed for v1 - payments are either created (collected) or not
```

### Task Model Extensions

```prisma
model Task {
  // ... existing fields ...

  // Payment tracking (GAAP-compliant)
  expectedRevenue  Decimal?  @db.Decimal(15, 4)  // Set by admin
  expectedCurrency String    @default("VND")     // Support for future multi-currency
  payments         Payment[]                      // Auto-created at checkout
}
```

**Key Schema Improvements:**
- `Decimal(15, 4)` for GAAP compliance - handles large amounts with precision
- Added `currency` field with default "VND" for future multi-currency support
- Added `onDelete: Cascade` for Payment → Task (cleanup on task deletion)
- Added `onDelete: SetNull` for Payment → Attachment (preserve payment if invoice deleted)
- Invoice attachment is **nullable** - completely optional

### Migration Steps

1. Create migration file: `npx prisma migrate dev --name add_payment_system`
2. Test migration on staging database first
3. Backup production database before applying
4. Apply migration: `npx prisma migrate deploy`

---

## API Endpoints

### 1. Modified Checkout with Payment Collection

**Endpoint:** `POST /v1/task/:id/checkout` (MODIFIED)

**Request Body (extended):**
```typescript
{
  // ... existing checkout fields ...

  // New payment fields (if task.expectedRevenue exists)
  paymentCollected?: boolean      // Did worker collect payment?
  paymentAmount?: number           // Actual amount collected (defaults to expectedRevenue)
  paymentNotes?: string           // Optional notes about payment
  invoiceFile?: File              // Invoice photo (OPTIONAL - multipart/form-data)
}
```

**Response:**
```typescript
{
  task: Task                      // Updated task
  activity: Activity              // Checkout activity
  payment?: Payment               // Auto-created payment record (if collected)
}
```

**Critical Implementation Notes:**
- **Upload files BEFORE transaction** to prevent serverless timeout (10s limit)
- **Atomic task status update** prevents race conditions (concurrent checkouts)
- **Invoice photo is OPTIONAL** - worker can skip it entirely
- **Transaction timeout configuration**: 10s for serverless environment

**Business Logic:**
```typescript
// Step 1: Upload files BEFORE transaction (prevent timeout)
const attachments = await uploadTaskAttachments(...)
const invoiceAttachment = invoiceFile ? await uploadTaskAttachments(...) : null

// Step 2: Atomic transaction with timeout
await prisma.$transaction(async (tx) => {
  // Atomic status update - prevents race conditions
  const task = await tx.task.update({
    where: { id: taskId, status: 'IN_PROGRESS' },
    data: { status: 'COMPLETED' }
  })

  if (!task) {
    throw new HTTPException(409, {
      message: 'Công việc đã được checkout bởi người khác'
    })
  }

  // Create payment if collected
  if (paymentCollected) {
    await tx.payment.create({...})
  }

  // Log activities
  await createActivity({...}, tx)
}, { timeout: 10000, maxWait: 5000 })
```

**Validation:**
```typescript
const zCheckoutWithPayment = z.object({
  // ... existing checkout fields ...
  paymentCollected: z.boolean().default(false),
  paymentAmount: z.coerce
    .number({ invalid_type_error: 'Số tiền phải là số' })
    .positive('Số tiền phải lớn hơn 0')
    .int('Đồng Việt Nam không có xu')
    .max(10_000_000_000, 'Số tiền quá lớn (tối đa 10 tỷ VND)')
    .optional(),
  paymentNotes: z.string().trim().max(500).optional(),
  // invoiceFile handled via multipart/form-data - OPTIONAL
})
.refine(
  (data) => !data.paymentCollected || data.paymentAmount !== undefined,
  {
    message: 'Vui lòng nhập số tiền đã thu',
    path: ['paymentAmount']
  }
)
```

---

### 2. List Task Payments

**Endpoint:** `GET /v1/task/:id/payments`

**Response:**
```typescript
{
  payments: Payment[]      // All payments for this task (usually 0 or 1 in v1)
  summary: {
    expectedRevenue: number    // From task.expectedRevenue
    totalCollected: number     // Sum of all payment amounts
    hasPayment: boolean        // Whether any payment exists
  }
}
```

**Business Logic:**
- Validate user can view task (admin or assigned worker)
- Return all payments for task (usually 0 or 1 in v1)
- Calculate summary from task.expectedRevenue and payment amounts

---

### 3. Admin Edit Payment (Audited Corrections)

**Endpoint:** `PUT /v1/payment/:id`

**Request Body:**
```typescript
{
  amount?: number           // Correct the amount if needed
  notes?: string           // Update notes
  editReason: string       // REQUIRED - why is this edit needed? (min 10 chars)
  invoiceFile?: File       // Replace invoice (OPTIONAL - multipart/form-data)
}
```

**Response:**
```typescript
{
  payment: Payment         // Updated payment record
}
```

**Business Logic:**
- Validate user is admin (workers cannot edit)
- **Require editReason** for audit trail (minimum 10 characters)
- Update payment fields as needed
- If new invoice provided, replace old one (OPTIONAL)
- **Log detailed activity**: `PAYMENT_UPDATED` with change history

**Activity Logging Example:**
```typescript
await createActivity({
  action: 'PAYMENT_UPDATED',
  userId: adminId,
  topic: { entityType: 'TASK', entityId: taskId },
  payload: {
    paymentId: payment.id,
    editReason: data.editReason,  // Required audit reason
    changes: {
      amount: { old: oldAmount, new: newAmount },
      notes: { old: oldNotes, new: newNotes },
      invoiceReplaced: !!newInvoiceFile
    }
  }
})
```

**Validation:**
```typescript
export const zUpdatePayment = z.object({
  amount: z.coerce.number().positive().int().max(10_000_000_000).optional(),
  notes: z.string().trim().max(500).optional(),
  editReason: z.string()  // REQUIRED for audit trail
    .trim()
    .min(10, 'Lý do chỉnh sửa phải có ít nhất 10 ký tự')
    .max(500, 'Lý do chỉnh sửa quá dài'),
})
.refine(
  (data) => data.amount !== undefined || data.notes !== undefined,
  'Vui lòng chỉnh sửa ít nhất một trường'
)
```

**Use Cases:**
- Fix incorrect amount entered at checkout
- Add/update notes after the fact
- Replace blurry invoice photo
- All changes tracked with reason for accountability

---

## Mobile UI

### Worker: Modified Checkout Screen

**Location:** `apps/mobile/app/(authenticated)/tasks/[taskId]/checkout.tsx` (MODIFIED)

**UI Design - Progressive Disclosure Pattern:**

1. **Radio-Style Card Selection** (NOT toggle/switch):
   ```tsx
   <RadioGroup value={paymentCollected} onValueChange={setPaymentCollected}>
     <RadioCard
       value="collected"
       icon={<CheckCircle />}
       title="Đã thu đủ tiền"
       description="Tôi đã thu tiền từ khách hàng"
     />
     <RadioCard
       value="not_collected"
       icon={<XCircle />}
       title="Chưa thu tiền"
       description="Khách hàng chưa thanh toán"
     />
   </RadioGroup>
   ```

2. **Progressive Disclosure** - Payment fields only appear when "Đã thu đủ tiền" selected:
   - **CurrencyInput** with VND thousand separators (pre-filled with expectedRevenue)
   - Notes textarea (optional)
   - **Inline Camera Preview** for invoice (NOT modal) - clearly labeled "Tùy chọn"

3. **Confirmation Dialog** if amount differs >10% from expected:
   ```tsx
   if (Math.abs(paymentAmount - expectedRevenue) / expectedRevenue > 0.1) {
     showConfirmation({
       title: "Số tiền khác với dự kiến",
       message: `Dự kiến: ${formatCurrency(expectedRevenue)}\nThực thu: ${formatCurrency(paymentAmount)}`,
       confirmText: "Xác nhận đúng"
     })
   }
   ```

**Key UX Elements:**
- **Invoice is OPTIONAL** - show "Tùy chọn" label clearly
- **CurrencyInput** component auto-formats with thousand separators
- **Inline camera preview** - no modal, immediate visual feedback
- **Clear visual hierarchy** with progressive disclosure

**Component Structure:**
```tsx
{task.expectedRevenue && (
  <PaymentCollectionSection>
    <RadioGroup>...</RadioGroup>

    {paymentCollected === 'collected' && (
      <AnimatedExpansion>
        <CurrencyInput
          value={paymentAmount}
          placeholder={formatCurrency(task.expectedRevenue)}
          label="Số tiền đã thu"
        />

        <TextArea
          value={paymentNotes}
          label="Ghi chú (tùy chọn)"
          placeholder="Ví dụ: Khách trả bằng chuyển khoản"
        />

        <InvoicePhotoCapture
          label="Ảnh hóa đơn (Tùy chọn)"
          value={invoiceFile}
          onChange={setInvoiceFile}
          inline={true}  // Inline preview, not modal
        />
      </AnimatedExpansion>
    )}
  </PaymentCollectionSection>
)}
```

---

### Admin: Task Details Payment Display

**Location:** `apps/mobile/app/admin/tasks/[taskId]/index.tsx` (MODIFIED)

**Payment Display Locations:**

1. **Task List Badge**:
   ```tsx
   <PaymentStatusBadge status={task.paymentStatus}>
     {task.hasPayment ? "Đã thu tiền" : "Chưa thu tiền"}
   </PaymentStatusBadge>
   ```

2. **Payment Card in Task Details**:
   ```tsx
   <PaymentCard>
     <PaymentHeader>
       <Text>Thanh toán</Text>
       {isAdmin && <EditButton onPress={() => openEditModal(payment)} />}
     </PaymentHeader>

     {/* Amount Comparison with Alert */}
     <AmountComparison>
       <Row label="Dự kiến" value={formatCurrency(task.expectedRevenue)} />
       <Row label="Thực thu" value={formatCurrency(payment.amount)} highlight />
       {difference > 0 && (
         <Alert variant="amber">
           Chênh lệch: {formatCurrency(difference)}
         </Alert>
       )}
     </AmountComparison>

     {/* Collection Details */}
     <CollectionInfo>
       <Text>Thu bởi: {payment.collectorName}</Text>
       <Text>Thời gian: {formatDateTime(payment.collectedAt)}</Text>
       {payment.notes && <Text>Ghi chú: {payment.notes}</Text>}
     </CollectionInfo>

     {/* Invoice Preview (if exists) */}
     {payment.invoiceAttachmentId && (
       <InvoicePreview
         attachmentId={payment.invoiceAttachmentId}
         label="Hóa đơn"
         onPress={() => openInvoiceViewer(payment.invoiceAttachmentId)}
       />
     )}
   </PaymentCard>
   ```

3. **Activity Feed Entry**:
   ```tsx
   <ActivityItem type="PAYMENT_COLLECTED">
     <Icon name="currency-dollar" />
     <Text>{user.name} đã thu {formatCurrency(amount)}</Text>
     {hasInvoice && <Badge>Có hóa đơn</Badge>}
   </ActivityItem>
   ```

---

### Admin: Edit Payment Modal

**Location:** `apps/mobile/app/admin/payments/[paymentId]/edit.tsx`

**Modal Design (NOT full screen):**

```tsx
<Modal presentationStyle="pageSheet" animationType="slide">
  {/* Warning Banner */}
  <WarningBanner>
    <Text>Thay đổi thanh toán sẽ được ghi lại trong lịch sử</Text>
  </WarningBanner>

  {/* Audit Info Section (read-only) */}
  <AuditSection>
    <Text>Thu bởi: {payment.collectorName}</Text>
    <Text>Thời gian gốc: {formatDateTime(payment.collectedAt)}</Text>
    <Text>Số tiền gốc: {formatCurrency(originalAmount)}</Text>
  </AuditSection>

  {/* Edit Form */}
  <Form>
    <CurrencyInput
      label="Số tiền mới"
      value={amount}
      placeholder={formatCurrency(payment.amount)}
    />

    <TextArea
      label="Ghi chú"
      value={notes}
      placeholder="Thêm ghi chú..."
    />

    <TextArea
      label="Lý do chỉnh sửa *"
      value={editReason}
      placeholder="Ví dụ: Khách hàng đưa nhầm số tiền"
      required
      minLength={10}
      error={editReasonError}
    />

    <InvoicePhotoCapture
      label="Thay thế hóa đơn (Tùy chọn)"
      value={newInvoiceFile}
      onChange={setNewInvoiceFile}
      currentAttachmentId={payment.invoiceAttachmentId}
    />
  </Form>

  {/* Action Buttons */}
  <ButtonGroup>
    <Button variant="outline" onPress={onCancel}>Hủy</Button>
    <Button variant="primary" onPress={onSave}>Lưu thay đổi</Button>
  </ButtonGroup>
</Modal>
```

**Key Features:**
- **Modal presentation** (not full screen) for quick edits
- **Warning banner** about audit trail
- **Required edit reason** textarea (min 10 chars)
- **Audit info section** showing original data (read-only)
- **Optional invoice replacement**

---

## Service Layer

### Transaction Handling Pattern

**CRITICAL**: Upload files BEFORE transaction to prevent serverless timeout

```typescript
export async function checkOutWithPayment({
  taskId,
  userId,
  checkoutData,
  paymentData,
  files,
  invoiceFile,
  storage,
}: CheckoutWithPaymentParams) {

  // Step 1: Upload files BEFORE transaction (prevents timeout)
  const checkoutAttachments = files
    ? await uploadTaskAttachments({
        taskId,
        files,
        storage,
        userId,
        category: 'CHECKOUT'
      })
    : []

  const invoiceAttachment = invoiceFile
    ? (await uploadTaskAttachments({
        taskId,
        files: [invoiceFile],
        storage,
        userId,
        category: 'INVOICE'
      }))[0]
    : null  // Invoice is OPTIONAL

  // Step 2: Atomic transaction with timeout
  const result = await prisma.$transaction(async (tx) => {
    // Atomic status update - prevents race conditions
    const task = await tx.task.update({
      where: {
        id: taskId,
        status: 'IN_PROGRESS'  // Condition prevents concurrent checkout
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    if (!task) {
      throw new HTTPException(409, {
        message: 'Công việc đã được checkout bởi người khác',
        cause: 'CONCURRENT_CHECKOUT'
      })
    }

    let payment = null

    // Create payment if collected
    if (paymentData.paymentCollected && paymentData.paymentAmount) {
      payment = await tx.payment.create({
        data: {
          taskId,
          amount: paymentData.paymentAmount,
          currency: 'VND',
          collectedBy: userId,
          collectedAt: new Date(),
          invoiceAttachmentId: invoiceAttachment?.id ?? null, // OPTIONAL
          notes: paymentData.paymentNotes,
        }
      })

      // Log payment activity
      await createActivity({
        action: 'PAYMENT_COLLECTED',
        userId,
        topic: { entityType: 'TASK', entityId: taskId },
        payload: {
          paymentId: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          hasInvoice: !!invoiceAttachment,  // Track if optional invoice provided
          notes: payment.notes,
        }
      }, tx)
    }

    // Create checkout activity
    await createActivity({
      action: 'TASK_CHECKED_OUT',
      userId,
      topic: { entityType: 'TASK', entityId: taskId },
      payload: {
        geoLocation: checkoutData.geoLocation,
        notes: checkoutData.notes,
        attachments: checkoutAttachments.map(a => ({
          id: a.id,
          mimeType: a.mimeType,
          originalFilename: a.originalFilename
        })),
        paymentCollected: !!payment,
      }
    }, tx)

    return { task, payment }
  }, {
    timeout: 10000,   // 10s for serverless environment
    maxWait: 5000,    // Max 5s wait for lock
  })

  return result
}

// Get payments for task (for reports)
export async function getTaskPayments({ taskId }: { taskId: number }) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { payments: true },
  })

  return {
    payments: task.payments,
    summary: {
      expectedRevenue: task.expectedRevenue || 0,
      totalCollected: task.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      hasPayment: task.payments.length > 0,
    },
  }
}

// Admin-only payment editing with audit trail
export async function updatePayment({
  paymentId,
  data,
  editReason,  // REQUIRED for audit
  invoiceFile,
  storage,
  userId,
}: {
  paymentId: string
  data: { amount?: number; notes?: string }
  editReason: string  // Required audit reason
  invoiceFile?: File
  storage: StorageProvider
  userId: string
}) {
  // Only admin can edit
  const user = await clerkClient.users.getUser(userId)
  if (!isUserAdmin({ user })) {
    throw new HTTPException(403, {
      message: 'Chỉ admin mới có thể chỉnh sửa thanh toán'
    })
  }

  // Get original payment for audit
  const originalPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { task: true }
  })

  if (!originalPayment) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy thông tin thanh toán'
    })
  }

  // Upload new invoice if provided (OPTIONAL)
  let newInvoiceAttachment = null
  if (invoiceFile) {
    newInvoiceAttachment = (await uploadTaskAttachments({
      taskId: originalPayment.taskId,
      files: [invoiceFile],
      storage,
      userId,
      category: 'INVOICE'
    }))[0]
  }

  // Update payment with audit trail
  const updatedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        amount: data.amount ?? originalPayment.amount,
        notes: data.notes ?? originalPayment.notes,
        invoiceAttachmentId: newInvoiceAttachment?.id ?? originalPayment.invoiceAttachmentId,
      }
    })

    // Log detailed audit activity
    await createActivity({
      action: 'PAYMENT_UPDATED',
      userId,
      topic: { entityType: 'TASK', entityId: originalPayment.taskId },
      payload: {
        paymentId: payment.id,
        editReason,  // Required audit reason
        changes: {
          amount: data.amount ? {
            old: Number(originalPayment.amount),
            new: Number(payment.amount)
          } : undefined,
          notes: data.notes !== undefined ? {
            old: originalPayment.notes,
            new: payment.notes
          } : undefined,
          invoiceReplaced: !!newInvoiceAttachment
        }
      }
    }, tx)

    return payment
  })

  return updatedPayment
}
```

---

## Validation Schemas

### packages/validation/src/payment.zod.ts

```typescript
import { z } from './zod'

// Extended checkout validation with payment
export const zCheckoutWithPayment = z.object({
  // Existing checkout fields (location, notes, etc.)
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  notes: z.string().trim().max(1000).optional(),

  // Payment collection fields
  paymentCollected: z.boolean().default(false),
  paymentAmount: z.coerce
    .number({ invalid_type_error: 'Số tiền phải là số' })
    .positive('Số tiền phải lớn hơn 0')
    .int('Đồng Việt Nam không có xu')
    .max(10_000_000_000, 'Số tiền quá lớn (tối đa 10 tỷ VND)')
    .optional(),
  paymentNotes: z.string().trim().max(500).optional(),
  // invoiceFile: handled separately as File in multipart/form-data
})
.refine(
  (data) => !data.paymentCollected || data.paymentAmount !== undefined,
  {
    message: 'Vui lòng nhập số tiền đã thu',
    path: ['paymentAmount']
  }
)

// Admin payment edit validation with required audit reason
export const zUpdatePayment = z.object({
  amount: z.coerce
    .number()
    .positive('Số tiền phải lớn hơn 0')
    .int('Đồng Việt Nam không có xu')
    .max(10_000_000_000, 'Số tiền quá lớn')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú quá dài')
    .optional(),
  editReason: z.string()  // REQUIRED for audit trail
    .trim()
    .min(10, 'Lý do chỉnh sửa phải có ít nhất 10 ký tự')
    .max(500, 'Lý do chỉnh sửa quá dài'),
})
.refine(
  (data) => data.amount !== undefined || data.notes !== undefined,
  {
    message: 'Vui lòng chỉnh sửa ít nhất một trường',
    path: ['_form']
  }
)

// Task expected revenue validation
export const zTaskExpectedRevenue = z.object({
  expectedRevenue: z.coerce
    .number()
    .positive('Số tiền phải lớn hơn 0')
    .int('Đồng Việt Nam không có xu')
    .max(10_000_000_000, 'Số tiền quá lớn')
    .nullable(),
  expectedCurrency: z.string().default('VND').optional(),
})

// FormData validation helpers (for multipart/form-data)
export const zPaymentFormData = z.object({
  paymentCollected: z.enum(['true', 'false']).transform(val => val === 'true'),
  paymentAmount: z.string().regex(/^\d+$/).transform(Number).optional(),
  paymentNotes: z.string().optional(),
  // Files handled separately via FormData.getAll('files')
})

export type CheckoutWithPaymentValues = z.infer<typeof zCheckoutWithPayment>
export type UpdatePaymentValues = z.infer<typeof zUpdatePayment>
export type TaskExpectedRevenueValues = z.infer<typeof zTaskExpectedRevenue>
```

---

## New Components

### 1. CurrencyInput Component

**Location:** `apps/mobile/components/ui/currency-input.tsx`

**Features:**
- Auto-formatting with thousand separators (1,000,000 VNĐ)
- Numeric keyboard on mobile
- VNĐ suffix display
- Handles large amounts (up to 10 billion)
- Prevents decimal input (VND has no cents)

```tsx
interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}

export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  // Format: 1000000 → "1,000,000"
  // Parse: "1,000,000" → 1000000
  // Display: "1,000,000 VNĐ"
}
```

### 2. InvoicePhotoCapture Component

**Location:** `apps/mobile/components/payment/invoice-photo-capture.tsx`

**Features:**
- **Inline camera preview** (not modal)
- Camera or gallery selection
- Preview captured image
- Retake/Remove options
- **Clear "Tùy chọn" (Optional) label**
- Compress image before upload

```tsx
interface InvoicePhotoCaptureProps {
  value?: File | null
  onChange: (file: File | null) => void
  label?: string
  currentAttachmentId?: string  // For showing existing invoice
  inline?: boolean  // Default true for inline preview
}
```

### 3. PaymentStatusBadge Component

**Location:** `apps/mobile/components/payment/payment-status-badge.tsx`

**Variants:**
- Green "Đã thu tiền" - payment collected
- Gray "Chưa thu tiền" - no payment
- Amber "Chênh lệch" - amount mismatch

```tsx
interface PaymentStatusBadgeProps {
  hasPayment: boolean
  expectedAmount?: number
  actualAmount?: number
  variant?: 'inline' | 'card'  // Different sizes for list vs detail
}
```

### 4. PaymentCard Component

**Location:** `apps/mobile/components/payment/payment-card.tsx`

**Features:**
- Amount comparison display
- Difference alert (if mismatch)
- Collector info
- Invoice preview
- Edit button (admin only)

### 5. RadioCard Component

**Location:** `apps/mobile/components/ui/radio-card.tsx`

**Features:**
- Large touch target for mobile
- Icon support
- Title and description
- Selected state animation
- Accessible for screen readers

---

## Testing Strategy

### Backend Unit Tests

**File:** `apps/api/src/v1/task/__tests__/checkout.test.ts` (EXTENDED)

**Critical Test Cases:**
- ✅ **Atomic task status update prevents race conditions** - concurrent checkout attempts
- ✅ **File upload before transaction** - no timeout on large files
- ✅ **Payment created only if paymentCollected=true** - no payment if false
- ✅ **Invoice attachment is optional** - checkout succeeds without invoice
- ✅ **Admin edit requires editReason** - validation fails without reason
- ✅ **Activity logged with change history** - audit trail complete
- ✅ Transaction rollback on failure - all-or-nothing
- ✅ Amount validation - no negative or invalid amounts

### Frontend Integration Tests

**File:** `apps/mobile/__tests__/checkout-payment.test.tsx`

**Critical Test Cases:**
- ✅ **Progressive disclosure works correctly** - fields appear/hide based on selection
- ✅ **Invoice photo is optional** - can submit without photo
- ✅ **Confirmation dialog appears on amount mismatch** - >10% difference triggers
- ✅ **Currency formatting displays correctly** - thousand separators work
- ✅ **Camera permission handling** - graceful fallback if denied
- ✅ Radio card selection state - correct visual feedback
- ✅ Form validation - required fields enforced

### E2E Test Scenarios

**Scenario 1: Happy Path**
1. Admin sets expectedRevenue: 5,000,000 VNĐ
2. Worker checks out, selects "Đã thu đủ tiền"
3. Amount auto-fills with 5,000,000
4. Worker optionally adds invoice photo
5. Checkout succeeds, payment recorded
6. Admin sees green "Đã thu tiền" badge

**Scenario 2: Amount Mismatch**
1. Admin sets expectedRevenue: 5,000,000 VNĐ
2. Worker collects only 4,000,000 VNĐ
3. Confirmation dialog appears (20% difference)
4. Worker confirms amount is correct
5. Admin sees amber alert for difference
6. Admin edits payment with reason "Khách hàng trả thiếu, sẽ thu sau"

**Scenario 3: Race Condition Prevention**
1. Two workers try to checkout same task simultaneously
2. First worker succeeds
3. Second worker gets 409 error "Công việc đã được checkout bởi người khác"
4. Task status correctly shows COMPLETED

**Scenario 4: Optional Invoice Flow**
1. Worker checks out without invoice
2. Checkout succeeds (invoice is optional)
3. Admin later adds invoice via edit modal
4. Activity log shows both events

---

## Activity Logging

Log these activities:
- `PAYMENT_COLLECTED` - Worker confirms payment collection at checkout
- `PAYMENT_UPDATED` - Admin edits payment amount/notes
- `INVOICE_UPLOADED` - Invoice photo added (at checkout or via edit)

---

## Error Handling

Common errors:
- `PAYMENT_NOT_FOUND` - 404
- `TASK_NOT_FOUND` - 404
- `INSUFFICIENT_PERMISSIONS` - 403 (only admin can edit)
- `INVALID_AMOUNT` - 400
- `INVALID_FILE_TYPE` - 400 (invoice must be image/pdf)
- `FILE_TOO_LARGE` - 400 (max 10MB)

Vietnamese error messages:
- "Không tìm thấy thông tin thanh toán"
- "Chỉ admin mới có thể chỉnh sửa thanh toán"
- "Số tiền không hợp lệ"
- "Loại tệp không được hỗ trợ (chỉ ảnh hoặc PDF)"
- "Kích thước tệp quá lớn (tối đa 10MB)"

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Serverless transaction timeout** | HIGH | Medium | Upload files before transaction, 10s timeout config |
| **Race condition (concurrent checkout)** | HIGH | Low | Atomic task status update with condition |
| **Network failure during checkout** | HIGH | Medium | Retry mechanism, clear error messages |
| **Worker confusion about amount** | MEDIUM | Medium | Confirmation dialog if >10% difference |
| **Invoice photo quality** | LOW | High | allowsEditing, quality check, optional field |
| **Large payment amounts** | MEDIUM | Low | Validation max 10 billion VND |
| **Missing audit trail** | HIGH | Low | Required editReason field |
| **Accidental payment deletion** | HIGH | Low | Soft delete, CASCADE protection |

---

## Success Criteria

- ✅ Admin can set expectedRevenue on task
- ✅ Worker can confirm payment collection at checkout
- ✅ Worker can upload invoice photo at checkout
- ✅ Payment record auto-created when collected
- ✅ Admin can view payment status and details
- ✅ Admin can edit payment for corrections
- ✅ Payment data ready for future reports
- ✅ All actions logged to activity feed
- ✅ Unit test coverage >80%
- ✅ Vietnamese error messages

---

## Open Questions (Resolved)

1. **Invoice Required?**
   - **Answer:** No, completely optional. Trust workers, encourage with UI but don't require.
   - **Implementation:** `invoiceAttachmentId` is nullable, UI shows "Tùy chọn" label clearly

2. **Multiple Payments per Task?**
   - **Answer:** v1 supports one payment per task for simplicity. Schema allows multiple for v2+.
   - **Implementation:** Database supports array, UI shows single payment

3. **Payment Edit Accountability?**
   - **Answer:** `editReason` required (min 10 chars), logged to Activity with full change history
   - **Implementation:** Audit trail shows who, what, when, why for all edits

4. **Currency Support?**
   - **Answer:** v1 VND only. Schema includes currency field for v2+ multi-currency.
   - **Implementation:** `currency` field defaults to "VND", ready for expansion

5. **Checkout Blocking if No Payment?**
   - **Answer:** No blocking. Allow checkout even if payment not collected (trust workers).
   - **Implementation:** Payment collection is optional during checkout

6. **Amount Mismatch Handling?**
   - **Answer:** Show confirmation dialog if >10% difference, but allow worker to proceed
   - **Implementation:** Warning dialog, not blocking error

---

## Future Extensions (v2+)

These features are intentionally excluded from v1 but the architecture supports them:

### Revenue Reports
- Worker performance reports (revenue collected by worker)
- Customer payment history (all payments by customer)
- Monthly/quarterly revenue summaries
- Payment collection rate analysis

### Advanced Payment Features
- Multiple partial payments per task
- Payment methods (cash, bank transfer, credit card)
- Payment verification workflow (pending → verified)
- Debt management (track unpaid amounts)
- Payment reminders and notifications
- Automatic invoice number generation

### Financial Integration
- Export to accounting software
- Tax calculation and reporting
- Commission calculation for workers
- Integration with payment gateways

### Enhanced UI
- Dedicated payment management dashboard
- Bulk payment operations
- Payment calendar view
- Mobile payment terminal integration

The simplified v1 implementation provides a solid foundation for these enhancements without over-engineering the initial solution.

---

## Dependencies

- Prisma client regeneration (for new Payment model)
- Existing checkout system (extend with payment collection)
- Attachment upload system (already exists, reuse for invoices)
- Activity logging system (already exists)
- Admin/worker permission checks (already exists)

---

## Implementation Timeline

### Week 1: Backend + Worker UX (5 days)

**Days 1-2: Backend Foundation**
- Database migration with GAAP-compliant schema
- Payment model with currency support
- Extend checkout service with atomic transactions
- File upload before transaction (timeout prevention)
- Payment CRUD endpoints
- Activity logging with audit trail

**Days 3-5: Mobile Worker Experience**
- CurrencyInput component with VND formatting
- InvoicePhotoCapture with inline preview
- RadioCard selection pattern
- Progressive disclosure checkout UI
- Confirmation dialog for amount mismatch
- Integration with checkout API

### Week 2: Admin UX + Polish (3 days)

**Days 1-2: Admin Features**
- PaymentStatusBadge for task lists
- PaymentCard for task details
- Payment edit modal with audit reason
- Activity feed integration
- Invoice viewer component

**Day 3: Testing & Polish**
- Unit tests for critical paths
- Integration tests for checkout flow
- E2E test scenarios
- UX polish and edge cases
- Performance optimization

**Total: 8 days (1.5 weeks)**

The extra 3 days vs original estimate are worth it for:
- Better UX with progressive disclosure
- Proper transaction handling
- Audit trail implementation
- Component reusability
- Comprehensive testing

---

## Related Files

### Backend

- Database: `apps/api/prisma/schema.prisma` (add Payment model)
- Checkout Service: `apps/api/src/v1/task/task.service.ts` (extend checkout)
- Payment Routes: `apps/api/src/v1/payment/payment.route.ts` (new)
- Payment Service: `apps/api/src/v1/payment/payment.service.ts` (new)
- Validation: `packages/validation/src/payment.zod.ts` (new)

### Frontend

- Worker Checkout: `apps/mobile/app/(authenticated)/tasks/[taskId]/checkout.tsx` (modify)
- Admin Task Details: `apps/mobile/app/admin/tasks/[taskId]/index.tsx` (modify)
- Admin Payment Edit: `apps/mobile/app/admin/payments/[paymentId]/edit.tsx` (new)
- Payment Components: `apps/mobile/components/payment/` (new)
