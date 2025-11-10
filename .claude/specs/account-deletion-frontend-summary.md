# Account Deletion Frontend - Linear PSN-13 Summary

**Quick Reference for Linear Issue Update**

---

## Overview

Frontend implementation for account deletion feature (Apple App Store Guideline 5.1.1(v) compliance).

**Platform**: React Native (iOS/Android)
**Estimate**: 10-12 hours (~1.5 days)
**Complexity**: Medium
**Priority**: High (required for App Store approval)

---

## Key Features

1. **Feature Flag Controlled** - PostHog flag `account-deletion-enabled`
2. **Two-Step Confirmation** - Prevent accidental deletion
3. **Text Input Validation** - User must type "XÓA TÀI KHOẢN"
4. **Vietnamese Language** - All UI text in Vietnamese
5. **Full Accessibility** - 4 required props on all interactive elements
6. **Clean User Flow** - Loading → Success → Auto-redirect
7. **Error Handling** - Network, auth, and server errors

---

## User Flow

```
Settings
  ↓ Tap "Xóa tài khoản" (red button, feature flag controlled)
First Confirmation Dialog
  - Warning message
  - List of data to delete
  - Cancel | Continue
  ↓ Tap "Tiếp tục"
Final Confirmation Dialog
  - Text input: "XÓA TÀI KHOẢN"
  - Button disabled until phrase matches
  - Cancel | Xóa tài khoản vĩnh viễn
  ↓ Tap "Xóa tài khoản vĩnh viễn"
Deleting State
  - API call: DELETE /v1/account
  - Loading spinner
  ↓ Success
Success Screen
  - Green checkmark
  - "Tài khoản đã được xóa"
  - Auto-redirect after 3 seconds
  ↓
Sign-In Screen
```

---

## Files to Create (9)

### API Integration
- `apps/mobile/api/account/use-delete-account.ts` - TanStack Query mutation

### Components
- `apps/mobile/components/user-settings/delete-account-dialog.tsx` - First confirmation
- `apps/mobile/components/user-settings/delete-account-final.tsx` - Final confirmation with input
- `apps/mobile/components/user-settings/delete-account-success.tsx` - Success screen

### Hooks
- `apps/mobile/hooks/use-delete-account-flow.ts` - Flow coordinator (step management)

### Tests
- `apps/mobile/components/user-settings/__tests__/delete-account-dialog.test.tsx`
- `apps/mobile/components/user-settings/__tests__/delete-account-final.test.tsx`
- `apps/mobile/hooks/__tests__/use-delete-account-flow.test.ts`
- `apps/mobile/api/account/__tests__/use-delete-account.test.ts`

---

## Files to Modify (2)

### Add Feature Flag
- `apps/mobile/hooks/use-feature-flag.ts` - Add `ACCOUNT_DELETION_ENABLED` constant

### Add Delete Button
- `apps/mobile/components/user-settings/user-settings-screen.tsx` - Add button + integrate dialogs

---

## Technical Stack

| Technology | Usage |
|------------|-------|
| **React Native** | UI components |
| **TanStack Query** | API mutation |
| **PostHog** | Feature flag |
| **Clerk** | Sign-out after deletion |
| **AlertDialog** | Existing UI component (reuse) |
| **Input** | Text validation component (reuse) |
| **AsyncStorage** | Clear local data |
| **SecureStore** | Clear auth tokens |

---

## Implementation Steps

### Phase 1: Feature Flag & Entry Point (1h)
- Add feature flag constant
- Add delete button to Settings with feature flag check
- Button only shows when flag is `true`

### Phase 2: First Confirmation Dialog (2h)
- Create warning dialog component
- List data to be deleted
- Cancel/Continue buttons
- Accessibility props

### Phase 3: Final Confirmation (2h)
- Create final confirmation component
- Text input validation ("XÓA TÀI KHOẢN")
- Button disabled until phrase matches
- Loading state during API call

### Phase 4: API Integration (2h)
- Create `useDeleteAccount` hook (TanStack Query)
- Call `DELETE /v1/account` endpoint
- Handle success/error responses
- Clear TanStack Query cache

### Phase 5: Success Screen (1h)
- Success overlay component
- Green checkmark icon
- Vietnamese success message
- Auto-redirect timer (3 seconds)

### Phase 6: Integration & Flow (2h)
- Create flow coordinator hook (`useDeleteAccountFlow`)
- Wire up all dialogs
- Step management (initial → first-confirm → final-confirm → deleting → success)
- Local data cleanup (AsyncStorage, SecureStore)
- Clerk sign-out

### Phase 7: Error Handling (1h)
- Network errors
- Auth errors (expired session)
- Server errors
- User-friendly Vietnamese error messages

### Phase 8: Accessibility & Polish (1h)
- Verify all 4 required props on interactive elements
- Test with VoiceOver (iOS)
- Test with TalkBack (Android)
- Haptic feedback (optional)

---

## Accessibility Requirements

**All interactive elements MUST have 4 props**:
1. `accessibilityLabel` - Vietnamese description
2. `accessibilityHint` - What happens when activated
3. `accessibilityRole` - Element type (button, text, etc.)
4. `testID` - Unique identifier for testing

**Example**:
```typescript
<Button
  accessibilityLabel="Xóa tài khoản vĩnh viễn"
  accessibilityHint="Mở hộp thoại xác nhận xóa tài khoản"
  accessibilityRole="button"
  testID="settings-delete-account-button"
/>
```

---

## Vietnamese Translations

| Key | Vietnamese |
|-----|-----------|
| Delete Account | Xóa tài khoản |
| Delete Account? | Xóa tài khoản? |
| This action cannot be undone | Hành động này không thể hoàn tác |
| All your data will be permanently deleted | Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn |
| Personal information | Thông tin cá nhân |
| Task history | Lịch sử công việc |
| Uploaded photos | Hình ảnh đã tải lên |
| Check-in history | Lịch sử check-in/check-out |
| Cancel | Hủy |
| Continue | Tiếp tục |
| Confirm Account Deletion | Xác nhận xóa tài khoản |
| Type "DELETE ACCOUNT" to confirm | Nhập "XÓA TÀI KHOẢN" để xác nhận |
| Deleting... | Đang xóa... |
| Delete Account Permanently | Xóa tài khoản vĩnh viễn |
| Account has been deleted | Tài khoản đã được xóa |
| Thank you for using NV Internal | Cảm ơn bạn đã sử dụng NV Internal |
| Redirecting... | Đang chuyển hướng... |

---

## Testing Checklist

### Unit Tests
- [ ] `useDeleteAccountFlow` hook transitions between steps correctly
- [ ] API mutation calls endpoint with correct parameters
- [ ] Error handling works for network/auth/server errors
- [ ] Component rendering tests pass

### Component Tests
- [ ] Delete button shows only when feature flag enabled
- [ ] First dialog opens/closes correctly
- [ ] Final dialog validates input correctly
- [ ] Success screen displays and auto-redirects

### Manual QA
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test network error scenario (Airplane Mode)
- [ ] Test cancel at each step
- [ ] Test feature flag on/off

---

## Dependencies

### Backend (Required)
- **PSN-12**: Account Deletion Backend - `DELETE /v1/account` endpoint
  - Must be completed before frontend testing
  - API should delete user data and revoke Clerk tokens

### Infrastructure
- **PostHog**: Feature flag `account-deletion-enabled` created
- **Clerk**: Account deletion API access (already configured)

---

## Error Handling

### Network Errors
- **Message**: "Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại."
- **Action**: Allow retry, keep user on confirmation dialog

### Auth Errors (401/403)
- **Message**: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
- **Action**: Return to confirmation, suggest re-login

### Server Errors (500)
- **Message**: "Không thể xóa tài khoản. Vui lòng thử lại."
- **Action**: Allow retry, log error to Sentry

---

## Security Considerations

1. **Feature Flag Gate** - Only show button when flag enabled
2. **Two-Step Confirmation** - Prevent accidental deletion
3. **Text Validation** - User must type exact phrase
4. **Token Cleanup** - Clear all auth tokens after deletion
5. **Local Data Cleanup** - Clear AsyncStorage and SecureStore
6. **API Auth** - All requests use Clerk Bearer token

---

## Performance

- **Bundle Size**: +2-3 KB (minimal impact)
- **API Response Time**: 2-5 seconds typical
- **Auto-redirect Delay**: 3 seconds (user can read message)
- **Query Cache Clear**: Immediate (reduce memory usage)

---

## Deployment Plan

### Development
1. Create feature branch: `feature/account-deletion-ui`
2. Implement all files as per plan
3. Run tests: `pnpm test`
4. Run lint: `pnpm biome:check --write .`
5. Test locally on iOS/Android simulators

### Staging
1. Merge to `develop` branch
2. Create TestFlight build
3. Set feature flag to `true` for internal testers
4. Manual QA with real devices
5. Test account deletion with demo account

### Production
1. Merge to `main` after approval
2. Set feature flag to `false` initially
3. Enable gradually: 10% → 50% → 100%
4. Monitor PostHog analytics
5. Monitor Sentry for errors

---

## Definition of Done

- [ ] All 9 new files created
- [ ] All 2 files modified correctly
- [ ] Feature flag check works
- [ ] Two-step confirmation flow works
- [ ] Text input validation works
- [ ] API integration successful (after PSN-12)
- [ ] Local data cleanup works
- [ ] Success screen + auto-redirect works
- [ ] Error handling covers all scenarios
- [ ] All interactive elements have 4 accessibility props
- [ ] VoiceOver/TalkBack tested
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Works on physical devices
- [ ] Unit tests pass (>=80% coverage)
- [ ] Component tests pass
- [ ] TypeScript compiles with no errors
- [ ] Biome lint/format passes
- [ ] Code reviewed
- [ ] Documentation updated

---

## References

- **Detailed Plan**: `.claude/specs/account-deletion-frontend-plan.md`
- **Backend Spec**: `.claude/specs/account-deletion-feature.md`
- **Linear Issues**:
  - [PSN-13](https://linear.app/withdustin/issue/PSN-13/account-deletion) (Frontend - this)
  - [PSN-12](https://linear.app/withdustin/issue/PSN-12/account-deletion-backend) (Backend - required)
- **Apple Guideline**: [5.1.1(v) Account Deletion](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- **Accessibility Pattern**: `docs/architecture/patterns/mobile-accessibility.md`
- **Feature Flags**: `.claude/docs/feature-flags-guide.md`

---

**Created**: 2025-11-10
**Status**: 🟢 Ready for Implementation
**Blockers**: PSN-12 (Backend) must be completed first
