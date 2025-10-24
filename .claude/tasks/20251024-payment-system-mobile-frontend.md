# Payment System Mobile Frontend Implementation

## Overview

Implement complete mobile frontend for the payment collection system as specified in `.claude/plans/v1/01-payment-system.md`.

## Implementation Status

✅ **Phase 1: Core Components (COMPLETED)**
✅ **Phase 2: Worker Screens (COMPLETED)**
✅ **Phase 3: Task Details Integration (COMPLETED)**
✅ **Phase 4: Admin Edit Modal (COMPLETED)**
✅ **Phase 5: Activity Feed Integration (COMPLETED)**
🧪 **Phase 6: Testing & Validation (PARTIAL)**

---

## Phase 1: Core Components ✅

### 1. CurrencyInput Component
**File**: `apps/mobile/components/ui/currency-input.tsx`

**Features**:
- ✅ Auto-format with thousand separators (1,000,000 VNĐ)
- ✅ Numeric keyboard on mobile
- ✅ VNĐ suffix display
- ✅ Integer-only validation (no decimals)
- ✅ Max 10 billion VND validation
- ✅ NativeWind styling with proper theming

**Key Functions**:
- `formatCurrency(value)` - Adds thousand separators
- `parseCurrency(text)` - Removes separators, returns number
- `formatCurrencyDisplay(value)` - Full display with "VNĐ" suffix

### 2. RadioCard Component
**File**: `apps/mobile/components/ui/radio-card.tsx`

**Features**:
- ✅ Large touch targets for mobile (full card pressable)
- ✅ Icon + title + description layout
- ✅ Selected state with visual feedback
- ✅ Accessible with proper ARIA attributes
- ✅ Animation on selection

**Usage**:
```tsx
<RadioGroup>
  <RadioCard
    selected={paymentCollected}
    onPress={() => setPaymentCollected(true)}
    icon={<CheckCircle />}
    title="Đã thu đủ tiền"
    description="Tôi đã thu tiền từ khách hàng"
  />
</RadioGroup>
```

### 3. InvoicePhotoCapture Component
**File**: `apps/mobile/components/payment/invoice-photo-capture.tsx`

**Features**:
- ✅ **CRITICAL**: Invoice is OPTIONAL - shows "Tùy chọn" label
- ✅ Inline camera preview (NOT modal)
- ✅ Camera or gallery selection
- ✅ Preview/retake/remove functionality
- ✅ Image compression (quality: 0.8, aspect: [4, 3])
- ✅ Support for existing attachment display (edit mode)

**Key Points**:
- Uses Expo ImagePicker with `allowsEditing: true`
- Handles permissions gracefully with toast messages
- Displays current attachment from API when available

### 4. PaymentStatusBadge Component
**File**: `apps/mobile/components/payment/payment-status-badge.tsx`

**Features**:
- ✅ Green "Đã thu tiền" - payment collected
- ✅ Gray "Chưa thu tiền" - no payment
- ✅ Amber "Chênh lệch" - amount mismatch
- ✅ Two sizes: `inline` (for lists) and `card` (for details)

**Auto-detection**:
- Compares `expectedAmount` vs `actualAmount`
- Shows mismatch status when amounts differ

### 5. PaymentCard Component
**File**: `apps/mobile/components/payment/payment-card.tsx`

**Features**:
- ✅ Amount comparison display (expected vs actual)
- ✅ Difference alert (amber) if mismatch
- ✅ Collector info with timestamp
- ✅ Invoice preview (if exists)
- ✅ Edit button (admin only)
- ✅ Notes display

**Empty State**:
- `PaymentCardEmpty` component for tasks without payment

---

## Phase 2: Worker Screens ✅

### Enhanced Checkout Hook
**File**: `apps/mobile/hooks/use-checkout-with-payment.ts`

**Extends**: `useTaskEvent` hook with payment-specific functionality

**Features**:
- ✅ Payment state management
- ✅ Auto-fills expected revenue when "Đã thu đủ tiền" selected
- ✅ Amount mismatch detection (>10% difference)
- ✅ Confirmation dialog for amount mismatch
- ✅ Type-safe FormData submission
- ✅ Proper cache invalidation

**Payment State**:
```typescript
{
  paymentCollected: boolean
  paymentAmount: number | null
  paymentNotes: string
  invoiceFile: InvoiceFile | null
}
```

**Key Methods**:
- `setPaymentCollected(boolean)` - Toggle payment collection
- `setPaymentAmount(number)` - Update amount
- `setPaymentNotes(string)` - Update notes
- `setInvoiceFile(file)` - Update invoice photo
- `hasAmountMismatch()` - Check if >10% difference
- `handleSubmitWithPayment()` - Submit with payment data

### Modified Checkout Screen
**File**: `apps/mobile/app/worker/tasks/[taskId]/check-out.tsx`

**UI Pattern**: Progressive Disclosure

**Flow**:
1. Show payment section ONLY if `task.expectedRevenue` exists
2. Radio card selection:
   - "Đã thu đủ tiền" - Collected
   - "Chưa thu tiền" - Not collected
3. When "Đã thu đủ tiền" selected, reveal:
   - CurrencyInput (pre-filled with expectedRevenue)
   - Notes textarea (optional)
   - InvoicePhotoCapture (inline, clearly labeled "Tùy chọn")
4. Mismatch warning if amount differs >10%
5. Confirmation dialog before submit (if mismatch)

**Validation**:
- Location required
- Payment amount required IF paymentCollected is true
- Invoice completely optional

**API Integration**:
```typescript
// FormData submission to /v1/task/:id/check-out
formData.append('paymentCollected', 'true')
formData.append('paymentAmount', amount.toString())
formData.append('paymentNotes', notes)
formData.append('invoiceFile', file) // Optional
```

---

## Phase 3: Task Details Integration ✅

### Payment Data Hook
**File**: `apps/mobile/api/payment/use-task-payments.ts`

**Features**:
- ✅ Type-safe query with Hono RPC client
- ✅ Fetches payment list + summary
- ✅ Conditional query (only if task has expectedRevenue)
- ✅ Proper caching with query key `['task-payments', taskId]`

**Response Type**:
```typescript
{
  payments: TaskPayment[]
  summary: {
    expectedRevenue: number | null
    totalCollected: number
    hasPayment: boolean
  }
}
```

### Updated TaskDetails Component
**File**: `apps/mobile/components/task-details.tsx`

**Changes**:
- ✅ Added `useTaskPayments` hook
- ✅ Conditional payment card display (only if expectedRevenue exists)
- ✅ Shows `PaymentCard` if payment collected
- ✅ Shows `PaymentCardEmpty` if no payment
- ✅ Admin can see edit button in PaymentCard

**Placement**:
- Payment card appears AFTER assignee card, BEFORE attachments card

---

## Phase 4: Admin Edit Modal ✅ COMPLETED

### Implementation Summary

**File**: `apps/mobile/app/admin/payments/[paymentId]/edit.tsx`

**Modal Design** (pageSheet presentation):
- ✅ Warning banner about audit trail
- ✅ Audit info section showing original values
- ✅ Edit form with proper validation
- ✅ Action buttons: Cancel, Save

**Implemented Fields**:
1. **CurrencyInput** - New amount (optional)
2. **Textarea** - Notes (optional)
3. **Textarea** - editReason (REQUIRED, min 10 chars)
4. **InvoicePhotoCapture** - Replace invoice (optional)

**Validation**:
- ✅ At least one field must be edited
- ✅ editReason is REQUIRED (min 10 characters)
- ✅ Shows original data in read-only section

**API Integration Issues Fixed**:
- ❌ **Hono RPC doesn't support file uploads** - Cannot use `client.v1.payment[':id'].$put()`
- ✅ **Solution**: Use raw fetch API for FormData submission
- ✅ Proper authentication headers included
- ✅ Success/error handling with toast notifications

**Working Implementation**:
```typescript
// Cannot use Hono RPC - it doesn't support file uploads
const formData = new FormData()
if (amount) formData.append('amount', amount.toString())
if (notes) formData.append('notes', notes)
formData.append('editReason', editReason)
if (invoiceFile) formData.append('invoiceFile', invoiceFile)

// Use raw fetch instead
const response = await fetch(`${API_URL}/v1/payment/${paymentId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

**Cache Invalidation**:
- ✅ Invalidates task query
- ✅ Invalidates task-payments query
- ✅ Invalidates activities query

**Fixed Issues**:
1. **400 Error on Update**: Switched from Hono RPC to raw fetch for file upload support
2. **Collector Name Display**: Updated to use `collectedBy` (Clerk ID) with `UserFullName` component
3. **Invoice Photo Display**: Fixed URL fetching using proper `useAttachments` hook instead of non-existent `/download` route

---

## Phase 5: Activity Feed Integration ✅ COMPLETED

### Implementation Summary

**File**: `apps/mobile/components/activity-feed.tsx`

**Payment Event Types Implemented**:
1. `PAYMENT_COLLECTED` - Worker confirms payment at checkout
2. `PAYMENT_UPDATED` - Admin edits payment

**Backend Activity Payload Updates**:
```typescript
// PAYMENT_COLLECTED - backend now includes attachment ID
{
  type: 'PAYMENT_COLLECTED',
  payload: {
    paymentId: string
    amount: number
    currency: string
    hasInvoice: boolean
    invoiceAttachmentId?: string  // NEW - for thumbnail display
    notes?: string
  }
}

// PAYMENT_UPDATED - backend now includes new invoice ID
{
  type: 'PAYMENT_UPDATED',
  payload: {
    paymentId: string
    editReason: string
    newInvoiceAttachmentId?: string  // NEW - for thumbnail display
    changes: {
      amount?: { old: number, new: number }
      notes?: { old: string, new: string }
      invoiceReplaced: boolean
    }
  }
}
```

**Frontend Display Implementation**:

### PAYMENT_COLLECTED Activity:
- ✅ Shows "Đã thu tiền" header with check icon
- ✅ Displays formatted amount (e.g., "1,500,000 VNĐ")
- ✅ Shows invoice attachment thumbnail if present (replaces badge)
- ✅ Displays notes in a bordered box (consistent with check-in/out)
- ✅ Shows collector name using `UserFullName` component

### PAYMENT_UPDATED Activity:
- ✅ Shows "Cập nhật thanh toán" header with edit icon
- ✅ Displays edit reason in main content
- ✅ Shows amount changes if modified
- ✅ Shows notes in bordered box if present
- ✅ Displays new invoice attachment thumbnail if replaced
- ✅ Shows "Hóa đơn đã được thay thế" text when invoice updated

**UI Consistency**:
- ✅ Notes always displayed in bordered boxes (matches check-in/out pattern)
- ✅ Invoice attachments shown as thumbnails (not badges)
- ✅ User names displayed with `UserFullName` component
- ✅ Currency formatting consistent across all displays

---

## Phase 6: Testing & Validation 🧪 PENDING

### TypeScript Compilation
- ✅ Fix all TypeScript errors
- ✅ Ensure type safety with Hono RPC client
- ✅ Validate prop types for all components

### Manual Testing Scenarios

**Worker Checkout Flow**:
1. ✅ Checkout without expected revenue (no payment section)
2. ⏳ Checkout with expected revenue (payment section appears)
3. ⏳ Select "Đã thu đủ tiền" (progressive disclosure works)
4. ⏳ Enter matching amount (no warning)
5. ⏳ Enter mismatched amount (confirmation dialog appears)
6. ⏳ Add invoice photo (optional, inline preview)
7. ⏳ Submit without invoice (should succeed)
8. ⏳ Submit with invoice (should succeed)

**Admin View Flow**:
1. ⏳ View task with no payment (shows empty state)
2. ⏳ View task with payment (shows payment card)
3. ⏳ View payment with amount mismatch (amber alert)
4. ⏳ Click edit button (modal opens)
5. ⏳ Edit amount without reason (validation error)
6. ⏳ Edit with reason (succeeds, activity logged)

**Activity Feed**:
1. ⏳ PAYMENT_COLLECTED event displays correctly
2. ⏳ PAYMENT_UPDATED event shows edit reason
3. ⏳ Events sorted chronologically

### Platform Testing
- ⏳ iOS - Test camera permissions, image picker
- ⏳ Android - Test camera permissions, image picker
- ⏳ Dark mode - Verify all components render correctly

---

## Key Architecture Decisions

### 1. Progressive Disclosure Pattern
**Why**: Mobile-optimized UX, reduces cognitive load
- Payment section only appears if `task.expectedRevenue` exists
- Payment fields only appear when "Đã thu đủ tiền" selected
- Clear visual hierarchy with animations

### 2. Radio Cards over Toggle/Switch
**Why**: More clear on mobile for yes/no selection
- Larger touch targets
- Explicit descriptions
- Better accessibility

### 3. Inline Camera Preview
**Why**: Faster workflow, immediate visual feedback
- No modal navigation
- Preview before submission
- Easy retake/remove

### 4. Optional Invoice Photo
**Why**: Trust workers, don't block workflow
- Clearly labeled "Tùy chọn"
- Can be added later via admin edit
- Encourages but doesn't require

### 5. Confirmation Dialog for Mismatch
**Why**: Prevent errors without blocking
- >10% difference triggers warning
- Worker can confirm if intentional
- Non-blocking (can proceed)

### 6. Required Edit Reason
**Why**: Audit trail for accountability
- Minimum 10 characters
- Logged to activity feed
- Shows in payment history

---

## API Endpoints Used

### Worker Endpoints
- `POST /v1/task/:id/check-out` - Extended with payment fields
  - `paymentCollected: boolean`
  - `paymentAmount?: number`
  - `paymentNotes?: string`
  - `invoiceFile?: File`

### Admin Endpoints
- `GET /v1/task/:id/payments` - List task payments with summary
- `PUT /v1/payment/:id` - Update payment (admin only)
- `PUT /v1/task/:id/expected-revenue` - Set expected revenue

### Response Types
All endpoints use Hono RPC client for type-safe calls:
```typescript
import type { AppType } from '@nv-internal/api'

const client = hc<AppType>(API_URL)
```

---

## File Structure

```
apps/mobile/
├── components/
│   ├── payment/
│   │   ├── invoice-photo-capture.tsx      ✅ Phase 1
│   │   ├── payment-status-badge.tsx       ✅ Phase 1
│   │   └── payment-card.tsx               ✅ Phase 1
│   ├── ui/
│   │   ├── currency-input.tsx             ✅ Phase 1
│   │   └── radio-card.tsx                 ✅ Phase 1
│   └── task-details.tsx                   ✅ Phase 3 (updated)
├── hooks/
│   └── use-checkout-with-payment.ts       ✅ Phase 2
├── api/
│   └── payment/
│       └── use-task-payments.ts           ✅ Phase 3
└── app/
    ├── worker/
    │   └── tasks/
    │       └── [taskId]/
    │           └── check-out.tsx          ✅ Phase 2 (updated)
    └── admin/
        └── payments/
            └── [paymentId]/
                └── edit.tsx               ⏳ Phase 4 (pending)
```

---

## Testing Checklist

### Component Tests
- [ ] CurrencyInput formats correctly
- [ ] CurrencyInput validates max amount
- [ ] RadioCard selection state works
- [ ] InvoicePhotoCapture permissions handling
- [ ] PaymentStatusBadge variants display correctly
- [ ] PaymentCard shows mismatch alert

### Integration Tests
- [ ] Checkout with payment collection
- [ ] Checkout without payment
- [ ] Checkout with amount mismatch
- [ ] Admin views payment details
- [ ] Admin edits payment
- [ ] Activity feed shows payment events

### E2E Tests
- [ ] Happy path: Collect payment at checkout
- [ ] Edge case: Mismatch amount with confirmation
- [ ] Edge case: No invoice photo (optional)
- [ ] Admin: Edit payment with audit reason
- [ ] Admin: Replace invoice photo

---

## Success Criteria

### Functional Requirements
- ✅ Worker can confirm payment collection at checkout
- ✅ Worker can upload invoice photo (optional)
- ✅ Payment amount pre-fills from expected revenue
- ✅ Confirmation dialog for amount mismatch (>10%)
- ✅ Admin can view payment status and details
- ⏳ Admin can edit payment with audit reason
- ⏳ All actions logged to activity feed

### Technical Requirements
- ✅ Type-safe API calls with Hono RPC client
- ✅ Proper cache invalidation (task, tasks, activities)
- ✅ NativeWind styling with dark mode support
- ✅ Progressive disclosure UX pattern
- ✅ Inline camera preview (not modal)
- ✅ Vietnamese UI labels and messages
- ⏳ TypeScript compilation with no errors

### Quality Requirements
- ⏳ Unit test coverage >80%
- ⏳ All components documented with JSDoc
- ⏳ Accessible with screen readers
- ⏳ Works on both iOS and Android
- ⏳ Proper error handling with user-friendly messages

---

## Next Steps

1. **Complete Admin Edit Modal** (Phase 4)
   - Create modal component with validation
   - Implement update mutation
   - Add audit info display
   - Test permission checks

2. **Activity Feed Integration** (Phase 5)
   - Add payment event renderers
   - Format currency in activity items
   - Add invoice badge
   - Test event sorting

3. **Testing & Validation** (Phase 6)
   - Run TypeScript compilation
   - Fix any type errors
   - Test on iOS device
   - Test on Android device
   - Verify dark mode
   - Test permissions handling

4. **Documentation**
   - Update v1 plan with completion status
   - Document any deviations from plan
   - Add screenshots of UI
   - Create demo video

---

## Related Files

### Planning
- `.claude/plans/v1/01-payment-system.md` - Original specification
- `.claude/plans/v1/README.md` - Master plan

### Backend (Already Implemented)
- `apps/api/src/v1/task-events/task-event.route.ts` - Check-out endpoint
- `apps/api/src/v1/payment/payment.route.ts` - Payment CRUD
- `apps/api/src/v1/payment/payment.service.ts` - Business logic
- `packages/validation/src/payment.zod.ts` - Validation schemas

### Frontend (This Implementation)
- All files listed in File Structure section above

---

## Notes

### Design Decisions
- **Invoice Optional**: Trust workers, don't block workflow
- **Radio Cards**: Better UX than toggle on mobile
- **Inline Preview**: Faster workflow, no modal navigation
- **Progressive Disclosure**: Show fields only when needed
- **10% Threshold**: Reasonable tolerance for amount mismatch

### Deviations from Plan
- None - implementation follows plan exactly
- Added confirmation dialog for better UX (not in original plan)
- Used `useCheckoutWithPayment` hook for better code organization

### Performance Considerations
- Payment query only runs if `task.expectedRevenue` exists
- Image compression (0.8 quality) before upload
- Proper cache invalidation to prevent stale data
- Query caching (1 week gcTime) per project standards

---

## Completion Date

**Started**: 2025-10-24
**Completed**: 2025-10-24 (Phases 1-5 complete, Phase 6 partial)

---

## Session 2 Bug Fixes and Improvements (2025-10-24)

### Critical Issues Resolved

#### 1. Payment Update 400 Error
**Problem**: Hono RPC client doesn't support file uploads (FormData)
**Solution**: Switched to raw fetch API for payment updates
```typescript
// ❌ Doesn't work - Hono RPC can't handle files
await client.v1.payment[':id'].$put({ form: formData })

// ✅ Works - Raw fetch with FormData
await fetch(`${API_URL}/v1/payment/${id}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

#### 2. Collector Name Field Issue
**Problem**: Frontend using non-existent `collectorName` field
**Root Cause**: Payment model uses `collectedBy` (Clerk user ID), not a name string
**Solution**: Updated all components to use `UserFullName` component with the ID
```tsx
// ❌ Wrong - field doesn't exist
<Text>{payment.collectorName}</Text>

// ✅ Correct - use UserFullName component
<UserFullName userId={payment.collectedBy} />
```

#### 3. Invoice Attachment URL Issue
**Problem**: Frontend trying to use non-existent `/download` route
**Solution**: Use existing `useAttachments` hook to fetch signed URLs
```typescript
// ❌ Wrong - no such route
`${API_URL}/v1/attachments/${attachmentId}/download`

// ✅ Correct - use hook
const { data: attachments } = useAttachments([attachmentId])
const url = attachments?.[0]?.url
```

### Activity Feed Enhancements

#### Backend Payload Updates
Added attachment IDs to activity payloads for direct thumbnail display:
- `PAYMENT_COLLECTED`: Added `invoiceAttachmentId` field
- `PAYMENT_UPDATED`: Added `newInvoiceAttachmentId` field

#### Frontend UI Improvements
- Invoice attachments now display as thumbnails (not badges)
- Payment notes displayed in bordered boxes (consistent with check-in/out)
- Both PAYMENT_COLLECTED and PAYMENT_UPDATED activities fully styled
- User names properly displayed with `UserFullName` component

### TypeScript Type Updates
Updated payment-related TypeScript interfaces across the mobile app:
- Removed `collectorName` references
- Added proper `collectedBy` field (string - Clerk user ID)
- Fixed activity payload types

---

## Additional Implementations (2025-10-24)

### UX Improvements ✅
1. **Animation Implementation**
   - Added smooth card expansion animation using `LinearTransition.duration(300)`
   - Payment fields slide down with `FadeInDown.duration(250).springify()`
   - Fade out animation on hide with `FadeOut.duration(200)`
   - Professional progressive disclosure experience

2. **Badge Reordering**
   - Payment badge now appears BEFORE status badge in task list
   - Height alignment fixed (`py-1` for consistent badge heights)
   - Visual hierarchy improved

3. **Button State Improvements**
   - Removed pending state on checkout button
   - Button remains enabled during submission
   - No more "Đang xử lý..." loading text

### Bug Fixes ✅
1. **FormData Validation Issue (400 Error)**
   - Fixed `paymentCollected` type mismatch (string vs boolean)
   - Updated validation schema to handle both FormData strings and JSON booleans
   - All checkout tests passing (100 tests)

2. **Cache Invalidation Fixes**
   - Added missing `task-payments` query invalidation in checkout mutation
   - Added payment query invalidation to pull-to-refresh handlers
   - Payment status now updates immediately after checkout
   - Pull-to-refresh properly updates payment data

### Expected Revenue Management ✅
1. **Backend API**
   - Comprehensive test coverage added (6 new tests)
   - All 106 tests passing
   - Admin-only authorization verified
   - Activity logging tested
   - Vietnamese error messages validated

2. **Mobile UI for Admins**
   - Created `ExpectedRevenueModal` component
   - Added "Doanh thu dự kiến" card in admin task details
   - Features:
     - Set/update expected revenue
     - Clear revenue with confirmation
     - Shows current value
     - Real-time updates via cache invalidation
     - Admin-only visibility
   - Files created:
     - `apps/mobile/api/payment/use-update-expected-revenue.ts`
     - `apps/mobile/components/payment/expected-revenue-modal.tsx`
   - Modified:
     - `apps/mobile/components/task-details.tsx`

### Testing Results ✅
- ✅ Backend: 106 tests passing (including 6 new expected revenue tests)
- ✅ TypeScript compilation: No errors
- ✅ Biome formatting/linting: All checks passed
- ✅ Visual verification in simulator: Badge order and animations confirmed
- ✅ Cache invalidation: Payment status updates properly

### Files Modified Summary
**Backend:**
- `packages/validation/src/payment.zod.ts` - Fixed boolean coercion
- `apps/api/src/v1/task/__tests__/task.service.test.ts` - Added expected revenue tests

**Mobile:**
- `apps/mobile/app/worker/tasks/[taskId]/check-out.tsx` - Animations, button state, badge order
- `apps/mobile/components/payment/payment-status-badge.tsx` - Height alignment
- `apps/mobile/components/task-list-item.tsx` - Badge reordering
- `apps/mobile/hooks/use-checkout-with-payment.ts` - Cache invalidation
- `apps/mobile/app/admin/tasks/[taskId]/view.tsx` - Pull-to-refresh fix
- `apps/mobile/app/worker/tasks/[taskId]/view.tsx` - Pull-to-refresh fix
- `apps/mobile/components/task-details.tsx` - Expected revenue card
- `apps/mobile/api/payment/use-update-expected-revenue.ts` - NEW
- `apps/mobile/components/payment/expected-revenue-modal.tsx` - NEW
