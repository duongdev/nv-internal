# Feature: Account Deletion

**Status**: 🟡 Draft
**Epic**: N/A (Compliance requirement)
**Owner**: Dương Đỗ (duongdev)
**Created**: 2025-11-10

---

## 📋 Requirements

### Background: Apple App Store Requirement

This feature is **mandatory for App Store approval** under Apple's App Store Review Guideline 5.1.1(v). Since our app creates user accounts (via Clerk), we must provide users the ability to delete their accounts within the app.

**Guideline 5.1.1(v) Summary:**
- Apps that support account creation must offer account deletion
- The option must be easy to find (typically in account settings)
- Must delete the entire account and associated personal data (not just deactivation)
- Effective since June 30, 2022
- No exemption for enterprise/B2B apps unless using externally-managed SSO accounts

### Functional Requirements

**FR1**: Users shall be able to initiate account deletion from within the mobile app
- Location: User Profile or Settings screen
- Clear labeling: "Delete Account" or "Delete My Account"
- Easily discoverable (within 2 taps from main settings)

**FR2**: System shall require user confirmation before deletion
- Two-step confirmation process to prevent accidental deletion
- Display clear warning about consequences (data loss, irreversible action)
- Option to cancel at any point before final confirmation

**FR3**: System shall re-authenticate user before allowing deletion
- Require recent authentication (Clerk session verification)
- If session is stale (>15 minutes), require re-login
- Supports Face ID/Touch ID re-authentication if enabled

**FR4**: System shall delete all user-associated data
- User profile information (name, email, phone)
- Task assignments and history
- Check-in/check-out records
- Photo attachments uploaded by user
- Activity logs related to the user
- Geolocation history
- Payment-related personal data

**FR5**: System shall handle data retention requirements
- Retain business-critical data required by law/company policy
- Anonymize retained data (remove PII)
- Keep audit trail for compliance (without PII)

**FR6**: System shall revoke all authentication tokens
- Invalidate Clerk session tokens
- Log user out of all devices
- Revoke API access tokens

**FR7**: System shall provide feedback on deletion status
- Display progress indicator during deletion
- Show success confirmation when complete
- Handle errors gracefully with retry options

**FR8**: System shall support admin override (optional)
- Admins can review/approve deletion requests if needed
- Pending deletion grace period (optional: 7-30 days)

### Non-Functional Requirements

**NFR1**: **Performance**
- Account deletion process completes within 30 seconds for typical user data
- Background jobs for large data cleanup (photos, activity logs)
- User sees immediate confirmation, cleanup happens asynchronously

**NFR2**: **Security**
- All deletion operations logged for audit
- Secure deletion of sensitive data (not just soft delete)
- Prevent unauthorized deletion attempts

**NFR3**: **Compliance**
- GDPR compliance (right to erasure)
- Apple App Store guideline 5.1.1(v) compliance
- Vietnamese data protection law compliance

**NFR4**: **Reliability**
- Atomic transaction for critical deletion steps
- Rollback capability if deletion fails
- Idempotent deletion endpoint (safe to retry)

**NFR5**: **Usability**
- Clear Vietnamese language labels and warnings
- Accessible to users with disabilities
- Works offline (queues request for when online)

### Acceptance Criteria

- [x] User can find "Delete Account" option in Settings
- [ ] Tapping "Delete Account" shows confirmation dialog with consequences
- [ ] System requires re-authentication if session is stale
- [ ] System shows second confirmation before final deletion
- [ ] All user personal data is deleted from database
- [ ] User is logged out and redirected to login screen
- [ ] Deleted user cannot log in again with same credentials
- [ ] Activity logs show anonymized audit trail (no PII)
- [ ] Admin dashboard shows deletion events (optional)
- [ ] Feature works on both iOS and Android
- [ ] Accessibility labels present for screen readers
- [ ] Error handling for network failures
- [ ] App Store reviewers can successfully test account deletion

---

## 🎨 User Experience

### User Flow: Happy Path

1. **Entry Point**
   - User opens app → Profile/Settings tab
   - Scrolls to bottom → Taps "Account Settings"
   - Sees "Delete Account" button (red/destructive styling)

2. **First Confirmation**
   - User taps "Delete Account"
   - Modal appears with:
     - ⚠️ Warning icon
     - Title: "Xóa tài khoản?" (Delete Account?)
     - Description: "Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn."
     - List of what will be deleted:
       - ❌ Thông tin cá nhân
       - ❌ Lịch sử công việc
       - ❌ Hình ảnh đã tải lên
       - ❌ Lịch sử chấm công
     - Buttons: "Hủy" (Cancel) | "Tiếp tục" (Continue)

3. **Re-authentication** (if needed)
   - If session > 15 minutes old:
     - Show Clerk re-authentication screen
     - Support Face ID/Touch ID
     - If fails → Return to Settings (no deletion)

4. **Final Confirmation**
   - User authenticated → Shows final confirmation
   - Title: "Xác nhận xóa tài khoản"
   - Input field: "Nhập 'XÓA TÀI KHOẢN' để xác nhận"
   - User must type exact phrase (case-insensitive)
   - Buttons: "Hủy" | "Xóa tài khoản vĩnh viễn" (red, disabled until phrase entered)

5. **Deletion Process**
   - User taps final "Xóa tài khoản vĩnh viễn"
   - Loading spinner with message: "Đang xóa tài khoản..."
   - Progress: 2-5 seconds (API call + token revocation)

6. **Success**
   - Success screen:
     - ✅ Icon
     - "Tài khoản đã được xóa"
     - "Cảm ơn bạn đã sử dụng NV Internal"
   - Auto-redirect to login screen after 3 seconds
   - All local data cleared

### Edge Cases & Error Handling

**Case 1: Network Failure**
- Show error: "Không thể kết nối. Vui lòng thử lại."
- Retry button
- Cancel button (returns to Settings)

**Case 2: Server Error**
- Show error: "Đã xảy ra lỗi. Vui lòng thử lại sau."
- Error code for support
- Retry button

**Case 3: User Has Pending Tasks**
- (Optional) Warn user about incomplete tasks
- Require admin approval (alternative)
- OR allow immediate deletion (simpler)

**Case 4: Concurrent Deletion Requests**
- Server prevents duplicate deletions
- Returns "already deleted" if user retries

### Wireframes / Designs

```
┌─────────────────────────┐
│   Settings Screen       │
│                         │
│  Profile Info           │
│  Notifications          │
│  Language               │
│  ...                    │
│                         │
│  ───────────────────    │
│  [Delete Account] (red) │
│                         │
└─────────────────────────┘

         ↓ Tap

┌─────────────────────────┐
│   ⚠️ Delete Account?    │
│                         │
│  This action cannot be  │
│  undone. All your data  │
│  will be permanently    │
│  deleted:               │
│                         │
│  ❌ Personal info       │
│  ❌ Task history        │
│  ❌ Photos              │
│  ❌ Check-in records    │
│                         │
│  [Cancel]  [Continue]   │
│                         │
└─────────────────────────┘

         ↓ Continue

┌─────────────────────────┐
│  Confirm Account Delete │
│                         │
│  Type 'DELETE ACCOUNT'  │
│  to confirm:            │
│                         │
│  [________________]     │
│                         │
│  [Cancel]               │
│  [Delete Forever] (🔴)  │
│                         │
└─────────────────────────┘
```

---

## 🏗️ Technical Design

### Architecture Overview

```
Mobile App (React Native)
    ↓
Clerk Auth (Re-authentication)
    ↓
API Endpoint: DELETE /api/v1/account
    ↓
Service Layer (AccountService)
    ↓
Database Transactions (Prisma)
    ↓
Background Jobs (Photo cleanup, etc.)
```

### API Design

#### Endpoint: Delete Account

```typescript
DELETE /api/v1/account
Authorization: Bearer <clerk-token>
Content-Type: application/json

Request Body: (none)

Response (200 OK):
{
  "success": true,
  "message": "Account deleted successfully",
  "deletedAt": "2025-11-10T12:45:00Z"
}

Response (400 Bad Request):
{
  "success": false,
  "error": "INVALID_SESSION",
  "message": "Session expired. Please re-authenticate."
}

Response (500 Internal Server Error):
{
  "success": false,
  "error": "DELETION_FAILED",
  "message": "Failed to delete account",
  "errorCode": "ERR_DB_TRANSACTION"
}
```

#### Endpoint: Check Deletion Eligibility (Optional)

```typescript
GET /api/v1/account/deletion-eligibility
Authorization: Bearer <clerk-token>

Response (200 OK):
{
  "eligible": true,
  "warnings": [
    "You have 3 pending tasks assigned to you",
    "You have 12 photos that will be deleted"
  ],
  "dataToDelete": {
    "tasks": 15,
    "photos": 12,
    "checkIns": 45,
    "activities": 120
  }
}
```

### Data Model Changes

#### User Table (Existing - Prisma Schema)

No schema changes needed. Use `DELETE` operation.

#### Activity Table (Audit Trail)

```prisma
model Activity {
  id          String   @id @default(cuid())
  type        String   // Add new type: "ACCOUNT_DELETED"
  description String?  // "User account deleted (anonymized)"
  userId      String?  // NULL for deleted users
  metadata    Json?    // Store anonymized info for audit
  createdAt   DateTime @default(now())

  @@index([type, createdAt])
}
```

### Service Layer: AccountService

```typescript
// apps/api/src/services/account-service.ts

export class AccountService {
  /**
   * Delete user account and all associated data
   * Complies with Apple App Store Guideline 5.1.1(v)
   */
  async deleteAccount(userId: string): Promise<void> {
    // 1. Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    // 2. Start transaction
    await prisma.$transaction(async (tx) => {
      // 3. Log deletion activity (anonymized)
      await tx.activity.create({
        data: {
          type: 'ACCOUNT_DELETED',
          description: 'User account deleted (anonymized)',
          userId: null, // Anonymized
          metadata: {
            deletedAt: new Date().toISOString(),
            reason: 'user_requested',
            // No PII stored here
          }
        }
      })

      // 4. Delete user-generated content
      await tx.task.deleteMany({ where: { assignedToId: userId } })
      await tx.checkIn.deleteMany({ where: { userId } })

      // 5. Delete photos (mark for background cleanup)
      const photos = await tx.attachment.findMany({
        where: { uploadedById: userId },
        select: { id: true, url: true }
      })

      // Queue background job for photo deletion
      await queuePhotoCleanup(photos)

      await tx.attachment.deleteMany({ where: { uploadedById: userId } })

      // 6. Delete activity logs (anonymize instead of delete)
      await tx.activity.updateMany({
        where: { userId },
        data: {
          userId: null, // Remove PII link
          metadata: { anonymized: true }
        }
      })

      // 7. Delete user record
      await tx.user.delete({ where: { id: userId } })
    })

    // 8. Revoke Clerk tokens (async, non-blocking)
    await this.revokeClerkTokens(userId)
  }

  private async revokeClerkTokens(userId: string): Promise<void> {
    // Call Clerk API to delete user
    // https://clerk.com/docs/users/deleting-users
    await clerkClient.users.deleteUser(userId)
  }
}
```

### Component Structure (Frontend)

```
apps/mobile/app/
├── (authenticated)/
│   └── settings/
│       ├── index.tsx              # Settings screen
│       └── delete-account.tsx     # Delete account flow
│
├── components/
│   └── delete-account/
│       ├── DeleteAccountButton.tsx
│       ├── ConfirmationDialog.tsx
│       ├── FinalConfirmation.tsx
│       ├── DeletionProgress.tsx
│       └── SuccessScreen.tsx
│
└── hooks/
    └── useDeleteAccount.ts        # Account deletion logic
```

### Mobile Implementation (React Native)

```typescript
// apps/mobile/hooks/useDeleteAccount.ts

import { useAuth } from '@clerk/clerk-expo'
import { useMutation } from '@tanstack/react-query'

export function useDeleteAccount() {
  const { signOut } = useAuth()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      return response.json()
    },
    onSuccess: async () => {
      // Clear local data
      await clearAsyncStorage()

      // Sign out from Clerk
      await signOut()

      // Redirect to login handled by Clerk
    },
  })

  return mutation
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend (API)**
- `AccountService.deleteAccount()` successfully deletes user
- Transaction rollback on failure
- Activity log created with anonymized data
- Clerk token revocation called
- Photos queued for background cleanup

**Frontend (Mobile)**
- `useDeleteAccount` hook calls API correctly
- Loading states managed properly
- Error handling works
- Sign out called on success

### Integration Tests

**End-to-End Flow**
1. User navigates to Settings
2. Taps "Delete Account"
3. Confirms first dialog
4. Re-authenticates (mock Clerk)
5. Enters confirmation phrase
6. API call succeeds
7. User logged out
8. Redirected to login screen

**Database Validation**
- User record deleted
- Related tasks deleted/reassigned
- Check-ins deleted
- Activities anonymized
- Photos marked for cleanup

**Clerk Integration**
- User deleted from Clerk
- Tokens revoked
- Cannot log in after deletion

### Manual Testing Checklist

- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test with poor network (airplane mode on/off)
- [ ] Test re-authentication flow
- [ ] Test canceling at each step
- [ ] Test with user who has many tasks/photos
- [ ] Test with user who has no data
- [ ] Test accessibility with VoiceOver (iOS)
- [ ] Test accessibility with TalkBack (Android)
- [ ] Test in Vietnamese language
- [ ] Test with App Store reviewer flow (demo account)

---

## 🚀 Implementation Plan

### Task Breakdown

**Phase 1: Backend (Est: 6-8 hours)**
- [ ] **Task 1**: Create API endpoint `DELETE /api/v1/account` (2h)
  - Define route in `apps/api/src/v1/account/route.ts`
  - Add Clerk middleware for auth
  - Implement basic handler

- [ ] **Task 2**: Implement `AccountService.deleteAccount()` (3h)
  - Transaction logic
  - Data deletion (User, Task, CheckIn, Attachment)
  - Activity log anonymization
  - Error handling

- [ ] **Task 3**: Integrate Clerk user deletion (1h)
  - Call Clerk API to delete user
  - Handle Clerk errors

- [ ] **Task 4**: Write backend tests (2h)
  - Unit tests for AccountService
  - Integration tests for API endpoint
  - Mock Clerk calls

**Phase 2: Frontend (Est: 8-10 hours)**
- [ ] **Task 5**: Create Settings UI with "Delete Account" button (1h)
  - Add button to `apps/mobile/app/(authenticated)/settings/index.tsx`
  - Styling (red/destructive)
  - Accessibility props

- [ ] **Task 6**: Implement first confirmation dialog (2h)
  - Modal component
  - Warning message in Vietnamese
  - List of data to be deleted
  - Cancel/Continue buttons

- [ ] **Task 7**: Implement final confirmation with text input (2h)
  - Input validation ("XÓA TÀI KHOẢN")
  - Disable button until phrase entered
  - Case-insensitive matching

- [ ] **Task 8**: Implement `useDeleteAccount` hook (2h)
  - TanStack Query mutation
  - API call
  - Error handling
  - Loading states

- [ ] **Task 9**: Implement success screen and sign-out flow (1h)
  - Success message
  - Auto-redirect after 3 seconds
  - Clear AsyncStorage
  - Clerk sign out

- [ ] **Task 10**: Add re-authentication check (optional, 2h)
  - Check session age
  - Trigger Clerk re-auth if stale
  - Handle auth failure

**Phase 3: Testing & Polish (Est: 4-6 hours)**
- [ ] **Task 11**: Write mobile component tests (2h)
  - Component rendering tests
  - User interaction tests
  - Mock API responses

- [ ] **Task 12**: Manual QA testing (2h)
  - Test on iOS simulator/device
  - Test on Android emulator/device
  - Test all edge cases
  - Test accessibility

- [ ] **Task 13**: Create demo account for App Store review (1h)
  - Test account with sample data
  - Document deletion flow for reviewers
  - Add to app review notes

- [ ] **Task 14**: Update documentation (1h)
  - Add pattern to CLAUDE.md
  - Update API documentation
  - Privacy policy update (if applicable)

**Total Estimate**: 18-24 hours (~3 days for 1 developer)

---

## 🔒 Security Considerations

### Authentication & Authorization
- **Re-authentication required**: Verify user session is recent (<15 minutes)
- **Token-based auth**: Use Clerk JWT for API requests
- **No admin override**: Only user themselves can delete (unless admin dashboard added later)

### Data Protection
- **Secure deletion**: Use `DELETE` SQL operations (not soft delete with flag)
- **Audit trail**: Keep anonymized activity logs for compliance
- **Background cleanup**: Queue photo deletion jobs (don't block API response)

### Input Validation
- **API endpoint**: Validate Clerk token, check user exists
- **Mobile UI**: Validate confirmation phrase matches exactly (case-insensitive)

### Privacy Compliance
- **GDPR Article 17**: Right to erasure (compliant)
- **Apple Guideline 5.1.1(v)**: Account deletion within app (compliant)
- **Data retention**: Only retain what's legally required (anonymized)

### Error Handling
- **Transaction rollback**: If any deletion step fails, rollback entire transaction
- **Idempotent endpoint**: Safe to retry (check if user already deleted)
- **Graceful degradation**: If Clerk deletion fails, still delete from our DB

---

## 📊 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Accidental deletion by user** | Medium | High | Two-step confirmation + text input validation |
| **Data retention violations** | Low | High | Clear audit trail, anonymize retained data |
| **Clerk API failure** | Low | Medium | Delete from our DB regardless, log Clerk error |
| **Photo cleanup failure** | Medium | Low | Background job retries, monitor cleanup queue |
| **App Store rejection** | Low | High | Follow guidelines exactly, test with reviewers in mind |
| **User regret (wants to undo)** | Medium | Medium | (Optional) 7-day grace period before permanent deletion |
| **Database transaction timeout** | Low | Medium | Optimize queries, use background jobs for heavy cleanup |

---

## 🔗 References

**Linear Feature**: [PSN-13](https://linear.app/withdustin/issue/PSN-13/account-deletion)

**Apple Documentation**:
- [App Store Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)

**Clerk Documentation**:
- [Deleting users](https://clerk.com/docs/users/deleting-users)

**Codebase References**:
- Authentication: `apps/api/src/middleware/clerk.ts`
- User model: `apps/api/prisma/schema.prisma`
- Activity logging: `docs/architecture/patterns/activity-event.md`

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-10 | Implement full account deletion (not soft delete) | Apple guidelines require actual deletion, GDPR compliance |
| 2025-11-10 | Two-step confirmation with text input | Prevent accidental deletion, high-friction for safety |
| 2025-11-10 | Delete Clerk user via API | Single source of truth, complete account removal |
| 2025-11-10 | Anonymize activity logs instead of delete | Maintain audit trail for business/legal compliance |
| 2025-11-10 | Background job for photo cleanup | Don't block API response, handle large files asynchronously |
| 2025-11-10 | No grace period (immediate deletion) | Simpler implementation, can add later if needed |

---

## 🎯 Open Questions

1. **Grace period**: Should we implement a 7-30 day grace period before permanent deletion?
   - **Pro**: User can undo if they regret
   - **Con**: More complexity, data still exists during grace period
   - **Decision**: Start without, add if users request it

2. **Admin approval**: Should admins approve deletion requests?
   - **Pro**: Prevent data loss from accidents
   - **Con**: Delays deletion, may violate user's "right to erasure"
   - **Decision**: No admin approval (user has full control)

3. **Task reassignment**: What happens to tasks assigned to deleted user?
   - **Option A**: Delete tasks (current plan)
   - **Option B**: Reassign to admin/manager
   - **Decision**: Delete tasks (simpler, matches "delete all data" requirement)

4. **Export before delete**: Should we offer data export before deletion?
   - **Pro**: User can backup their data
   - **Con**: Additional complexity
   - **Decision**: Not required for MVP, can add later if needed
