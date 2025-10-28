# Mobile-MCP Testing Guide for NV Internal

This guide provides comprehensive information for testing the NV Internal mobile app using mobile-mcp tools.

## Overview

The NV Internal mobile app is now optimized for automated testing with mobile-mcp. All interactive elements have been enhanced with:
- **Accessibility labels** for semantic identification
- **testID props** for reliable element targeting
- **Accessibility hints** for context understanding
- **Proper touch targets** (minimum 44x44pt as per platform guidelines)

## Prerequisites

1. **Expo Go** installed on device or simulator
2. **mobile-mcp** tools configured
3. **Environment variables** set:
   ```
   EXPO_PUBLIC_API_URL=<API_URL>
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<CLERK_KEY>
   ```

## Test Account Requirements

You need test accounts with different roles:
- **Worker account**: For task list, check-in/out testing
- **Admin account**: For task management, payment testing

## Element Selector Reference

### Authentication Screen

**File**: `app/(auth)/sign-in.tsx`

| Element | testID | accessibilityLabel | Purpose |
|---------|--------|-------------------|---------|
| Username input | `sign-in-username-input` | "Tên đăng nhập" | Enter username |
| Password input | `sign-in-password-input` | "Mật khẩu" | Enter password |
| Submit button | `sign-in-submit-button` | "Đăng nhập" | Submit login form |

### Task List Screen (Worker)

**File**: `app/worker/(tabs)/index.tsx`

| Element | testID | accessibilityLabel | Purpose |
|---------|--------|-------------------|---------|
| Section header (On-going) | `task-list-section-việc-đang-làm` | (header role) | Section indicator |
| Section header (Next) | `task-list-section-việc-tiếp-theo` | (header role) | Section indicator |
| Section header (Completed) | `task-list-section-việc-đã-hoàn-thành` | (header role) | Section indicator |
| Task list item | `task-list-item-{taskId}` | "Công việc {title}, trạng thái {status}" | Navigate to task details |
| Refresh control | N/A | "Làm mới danh sách công việc" | Pull-to-refresh |

### Task Details Screen

**File**: `app/worker/tasks/[taskId]/view.tsx`

| Element | testID | accessibilityLabel | Purpose |
|---------|--------|-------------------|---------|
| Check-in button | `task-action-check-in-button` | "Bắt đầu làm việc" | Navigate to check-in |
| Check-out button | `task-action-check-out-button` | "Hoàn thành công việc" | Navigate to check-out |
| Open map button | `task-details-open-map-button` | "Mở bản đồ" | Open Google Maps |
| Call customer button | `task-details-call-customer-button` | "Gọi khách hàng" | Initiate phone call |
| Assign button (admin) | `task-details-assign-button` | "Phân công nhân viên" | Open assignee modal |
| Set revenue button (admin) | `task-details-set-revenue-button` | "Đặt giá dịch vụ" / "Chỉnh sửa giá dịch vụ" | Open revenue modal |
| Edit payment button (admin) | `task-details-edit-payment-button` | "Chỉnh sửa thanh toán" | Edit payment details |

### Check-In Screen

**File**: `app/worker/tasks/[taskId]/check-in.tsx`

| Element | testID | accessibilityLabel | Purpose |
|---------|--------|-------------------|---------|
| Camera button | `check-in-camera-button` | "Chụp ảnh từ camera" | Open camera |
| Library button | `check-in-library-button` | "Chọn từ thư viện ảnh" | Open photo library |
| Files button | `check-in-files-button` | "Chọn tệp tin" | Open file picker |
| Notes input | `check-in-notes-input` | "Ghi chú" | Enter optional notes |
| Submit button | `check-in-submit-button` | "Xác nhận bắt đầu" | Submit check-in |

### Check-Out Screen

**File**: `app/worker/tasks/[taskId]/check-out.tsx`

| Element | testID | accessibilityLabel | Purpose |
|---------|--------|-------------------|---------|
| Camera button | `check-out-camera-button` | "Chụp ảnh từ camera" | Open camera |
| Library button | `check-out-library-button` | "Chọn từ thư viện ảnh" | Open photo library |
| Files button | `check-out-files-button` | "Chọn tệp tin" | Open file picker |
| Notes input | `check-out-notes-input` | "Ghi chú" | Enter optional notes |
| Submit button | `check-out-submit-button` | "Xác nhận hoàn thành" | Submit check-out |

## Testing Workflows

### Flow 1: Authentication

```typescript
// 1. List available devices
mobile_list_available_devices()

// 2. Take screenshot to see sign-in screen
mobile_take_screenshot(device: "device_id")

// 3. List elements to find inputs
mobile_list_elements_on_screen(device: "device_id")

// 4. Click username input (by label)
// Find element with label "Tên đăng nhập" from list

// 5. Type username
mobile_type_keys(device: "device_id", text: "test_worker", submit: false)

// 6. Click password input
// Find element with label "Mật khẩu" from list

// 7. Type password
mobile_type_keys(device: "device_id", text: "password123", submit: false)

// 8. Click submit button
// Find element with label "Đăng nhập" from list and click

// 9. Verify success - should navigate to task list
mobile_take_screenshot(device: "device_id")
```

### Flow 2: Task List Navigation

```typescript
// 1. Verify on task list screen
mobile_list_elements_on_screen(device: "device_id")
// Should see section headers and task items

// 2. Pull to refresh
mobile_swipe_on_screen(device: "device_id", direction: "down", distance: 200)

// 3. Click first task item
// Find element with testID pattern "task-list-item-*"
// Get coordinates and click

// 4. Verify task details loaded
mobile_take_screenshot(device: "device_id")
mobile_list_elements_on_screen(device: "device_id")
// Should see task title, buttons, cards
```

### Flow 3: Check-In

```typescript
// Prerequisites: On task details screen, task status = READY

// 1. Click check-in button
// Find element with label "Bắt đầu làm việc"

// 2. Wait for GPS location (may take 2-5 seconds)
mobile_take_screenshot(device: "device_id")

// 3. Optionally add photo from camera
// Find element with label "Chụp ảnh từ camera" and click
// (Note: Camera requires physical device or simulator setup)

// 4. Add notes
// Find element with label "Ghi chú"
mobile_type_keys(device: "device_id", text: "Đã đến địa điểm", submit: false)

// 5. Submit check-in
// Find element with label "Xác nhận bắt đầu" and click

// 6. Verify success toast and navigation back
mobile_take_screenshot(device: "device_id")
```

### Flow 4: Check-Out with Payment

```typescript
// Prerequisites: On task details screen, task status = IN_PROGRESS

// 1. Click check-out button
// Find element with label "Hoàn thành công việc"

// 2. Wait for GPS location
mobile_take_screenshot(device: "device_id")

// 3. Scroll to payment section (if task has expectedRevenue)
mobile_swipe_on_screen(device: "device_id", direction: "up", distance: 200)

// 4. Select "Collected" payment option
// (This is implemented in check-out hook, not visible in check-in screen)

// 5. Add attachments if needed
// Find element with label "Chụp ảnh từ camera"

// 6. Submit check-out
// Find element with label "Xác nhận hoàn thành" and click

// 7. Verify task completed
mobile_take_screenshot(device: "device_id")
```

## Tips for Reliable Testing

### 1. Wait for Element Visibility

Always list elements before clicking to ensure they're loaded:
```typescript
mobile_list_elements_on_screen(device: "device_id")
```

### 2. Handle Loading States

Screens may show loading skeletons. Wait for actual content:
- Task list: Wait for section headers to appear
- Task details: Wait for task title to appear
- Check-in/out: Wait for location verification card

### 3. Scroll to Reveal Elements

Some buttons may be below the fold:
```typescript
mobile_swipe_on_screen(device: "device_id", direction: "up", distance: 300)
```

### 4. GPS Coordinates

Check-in/out requires GPS location. If testing in simulator:
- iOS: Use Xcode Debug > Location > Custom Location
- Android: Use emulator location override

### 5. File Uploads

Camera and file pickers require permissions:
- First time: Permission dialog will appear
- Grant access before testing upload flows

### 6. Vietnamese Language

All labels and text are in Vietnamese. Use exact Vietnamese strings when searching:
- "Tên đăng nhập" (Username)
- "Mật khẩu" (Password)
- "Đăng nhập" (Sign in)
- "Bắt đầu làm việc" (Start work)

## Troubleshooting

### Click Misses Target

**Problem**: mobile-mcp clicks but doesn't activate element

**Solutions**:
1. List elements to verify correct coordinates
2. Ensure element is not disabled (check `disabled` state)
3. Verify element is visible (not scrolled off-screen)
4. Wait for animations to complete
5. Use accessibility label instead of coordinates if available

### Element Not Found

**Problem**: Expected element doesn't appear in list

**Solutions**:
1. Take screenshot to verify screen state
2. Check if screen is still loading (look for skeleton/spinner)
3. Scroll to reveal element if below fold
4. Verify navigation completed (check for screen title)

### Permission Denied

**Problem**: Camera/location permissions denied

**Solutions**:
1. On iOS simulator: Settings > Privacy > Location/Camera
2. On Android emulator: Settings > Apps > Permissions
3. Uninstall/reinstall app to reset permissions
4. Use `mobile_press_button(device, button: "BACK")` to dismiss dialog

### GPS Location Timeout

**Problem**: Check-in/out stuck waiting for location

**Solutions**:
1. Verify location services enabled on device
2. Set custom location in simulator/emulator
3. Wait longer (up to 10 seconds for first fix)
4. Check for location permission dialog

## Screen Transition Timing

Typical wait times between actions:

| Action | Expected Delay | Reason |
|--------|---------------|--------|
| Login submit → Task list | 1-2s | Auth + data fetch |
| Task list item → Details | 500ms | Navigation + prefetch |
| Check-in button → Check-in screen | 300ms | Navigation |
| Submit check-in → Back to details | 2-4s | Upload + API call |
| Pull-to-refresh | 1-2s | Data refetch |
| GPS location acquisition | 2-10s | Platform location service |

## Complete Test Suite Example

See `.claude/tasks/mobile-mcp-test-suite.md` for a complete end-to-end test suite covering:
- Authentication flow
- Task list operations
- Task details viewing
- Check-in with attachments
- Check-out with payment
- Activity feed verification
- Admin operations

## Related Documentation

- **Mobile App Structure**: See `CLAUDE.md` section on Mobile App Structure
- **API Integration**: See `apps/mobile/lib/api-client.ts`
- **Component Library**: See `apps/mobile/components/ui/`
- **Expo Documentation**: https://docs.expo.dev/
- **mobile-mcp Documentation**: (Link to mobile-mcp docs)
