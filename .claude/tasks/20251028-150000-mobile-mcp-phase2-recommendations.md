# Mobile-MCP Phase 2: Additional Accessibility Recommendations

**Date**: 2025-10-28
**Status**: 📋 Planned

## Overview

After completing Phase 1 accessibility optimization for core worker flows (~30+ elements), this document identifies additional screens and components that would benefit from accessibility enhancements for comprehensive mobile-mcp testing coverage.

## Screens Requiring Accessibility (Phase 2)

### 1. Admin Task Management

**Files to enhance**:
- `apps/mobile/app/admin/tasks/create.tsx` - Task creation form
- `apps/mobile/app/admin/tasks/[taskId]/view.tsx` - Admin task view
- `apps/mobile/app/admin/(tabs)/tasks/index.tsx` - Admin task list

**Key elements needing testID**:
- Customer name input
- Phone number input
- Address input
- Map picker button
- Task description textarea
- Assignee selector
- Expected revenue input
- Create/Save button

### 2. User Management

**Files to enhance**:
- `apps/mobile/app/admin/(tabs)/users/index.tsx` - User list
- User profile edit screens (if exist)

**Key elements needing testID**:
- User list items
- Role badges
- Edit user buttons
- Delete user buttons (with confirmations)

### 3. Payment Management

**Files to enhance**:
- `apps/mobile/app/admin/payments/[paymentId]/edit.tsx` - Payment editing

**Key elements needing testID**:
- Amount input
- Invoice upload button
- Payment status selector
- Save changes button

### 4. User Settings

**Files to enhance**:
- `apps/mobile/app/(user-settings)/change-password.tsx` - Password change
- `apps/mobile/app/(user-settings)/theme-switcher.tsx` - Theme selection
- `apps/mobile/app/admin/(tabs)/settings.tsx` - Admin settings

**Key elements needing testID**:
- Current password input
- New password input
- Confirm password input
- Theme toggle buttons
- Logout button
- Settings options

## Implementation Guidelines

### Naming Convention
Continue using the established pattern:
```
{screen}-{component}-{action}
```

Examples for admin screens:
- `admin-task-create-customer-name-input`
- `admin-task-create-submit-button`
- `admin-users-list-item-{userId}`
- `admin-payment-edit-amount-input`
- `settings-change-password-button`
- `settings-theme-toggle-dark`

### Accessibility Properties Template

```tsx
<Input
  accessibilityLabel="[Vietnamese label]"
  accessibilityHint="[What happens in Vietnamese]"
  testID="admin-task-create-customer-name-input"
  placeholder="Tên khách hàng"
  value={customerName}
  onChangeText={setCustomerName}
/>

<Button
  accessibilityLabel="Tạo công việc"
  accessibilityHint="Tạo công việc mới với thông tin đã nhập"
  testID="admin-task-create-submit-button"
  onPress={handleSubmit}
>
  <Text>Tạo công việc</Text>
</Button>
```

## Priority Assessment

### High Priority (Frequently Used)
1. Admin task creation - Used daily for new jobs
2. Admin task list - Main admin dashboard
3. User settings/logout - Essential navigation

### Medium Priority (Occasional Use)
1. Payment editing - Used for corrections
2. User management - Less frequent admin task
3. Theme switcher - One-time setup

### Low Priority (Rarely Used)
1. Profile editing - Infrequent changes
2. Advanced settings - Rarely accessed

## Estimated Effort

**Phase 2 Complete Implementation**: 4-6 hours

### Breakdown
- Admin task screens: 2 hours (most complex forms)
- User management: 1 hour
- Payment screens: 1 hour
- Settings screens: 1 hour
- Testing & verification: 1 hour

## Benefits of Phase 2

1. **Complete E2E Coverage**: Enable testing of full admin workflows
2. **Admin Automation**: Allow automated testing of management features
3. **Settings Testing**: Verify user preferences and account management
4. **Full App Testing**: No blind spots in test coverage

## Testing Scenarios Enabled

After Phase 2 completion:

### Admin Task Management Flow
```
1. Login as admin
2. Navigate to create task
3. Fill all fields (testable with testIDs)
4. Assign to workers
5. Set expected revenue
6. Create and verify
```

### User Management Flow
```
1. View user list
2. Edit user roles
3. Update user information
4. Verify changes reflected
```

### Settings Flow
```
1. Navigate to settings
2. Change theme
3. Update password
4. Logout and re-login
```

## Implementation Checklist

When implementing Phase 2:

- [ ] Review each screen for all interactive elements
- [ ] Add accessibility props to inputs, buttons, and touchables
- [ ] Use Vietnamese labels consistently
- [ ] Follow established testID naming pattern
- [ ] Test with mobile-mcp after implementation
- [ ] Update MOBILE-MCP-TESTING.md with new selectors
- [ ] Add new workflows to testing guide

## Notes

- Phase 1 covered ~30+ elements in worker flows
- Phase 2 would add ~40-50 additional elements
- Total coverage would reach ~80+ testable elements
- Consider implementing Phase 2 before v1 launch for comprehensive testing
- Can be implemented incrementally as screens are modified

## Related Documentation

- Phase 1 Implementation: `.claude/tasks/20251028-mobile-mcp-accessibility-optimization.md`
- Testing Guide: `apps/mobile/MOBILE-MCP-TESTING.md`
- Quick Reference: `apps/mobile/QUICK-TEST-REFERENCE.md`
- Cheatsheet: `apps/mobile/MOBILE-MCP-CHEATSHEET.md`