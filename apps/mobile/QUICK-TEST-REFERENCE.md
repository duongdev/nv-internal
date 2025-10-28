# Quick Test Reference - Mobile-MCP

Fast reference guide for testing NV Internal mobile app with mobile-mcp.

## Quick Start

```bash
# 1. List devices
mobile_list_available_devices()

# 2. Take screenshot
mobile_take_screenshot(device: "DEVICE_ID")

# 3. List elements
mobile_list_elements_on_screen(device: "DEVICE_ID")

# 4. Click element
mobile_click_on_screen_at_coordinates(device: "DEVICE_ID", x: X, y: Y)

# 5. Type text
mobile_type_keys(device: "DEVICE_ID", text: "your text", submit: false)
```

## Essential Element Selectors

### Authentication
```
sign-in-username-input       → Username field
sign-in-password-input       → Password field
sign-in-submit-button        → Submit login
```

### Task List
```
task-list-item-{ID}          → Task card (click to view details)
task-list-section-*          → Section headers
```

### Task Details (All Buttons)
```
task-action-check-in-button          → "Bắt đầu làm việc"
task-action-check-out-button         → "Hoàn thành công việc"
task-details-open-map-button         → Open Google Maps
task-details-call-customer-button    → Call customer
task-details-assign-button           → Assign users (admin)
task-details-set-revenue-button      → Set expected revenue (admin)
task-details-edit-payment-button     → Edit payment (admin)
```

### Check-In Screen
```
check-in-camera-button       → Open camera
check-in-library-button      → Open photo library
check-in-files-button        → Open file picker
check-in-notes-input         → Notes textarea
check-in-submit-button       → Submit check-in
```

### Check-Out Screen
```
check-out-camera-button      → Open camera
check-out-library-button     → Open photo library
check-out-files-button       → Open file picker
check-out-notes-input        → Notes textarea
check-out-submit-button      → Submit check-out
```

## Search by Label (Vietnamese)

When using `list_elements_on_screen`, look for these Vietnamese labels:

| English | Vietnamese Label |
|---------|-----------------|
| Username | "Tên đăng nhập" |
| Password | "Mật khẩu" |
| Sign in | "Đăng nhập" |
| Start work | "Bắt đầu làm việc" |
| Complete work | "Hoàn thành công việc" |
| Open map | "Mở bản đồ" |
| Call customer | "Gọi khách hàng" |
| Assign staff | "Phân công nhân viên" |
| Take photo | "Chụp ảnh từ camera" |
| Library | "Chọn từ thư viện ảnh" |
| Files | "Chọn tệp tin" |
| Notes | "Ghi chú" |

## Common Workflows

### Login
```
1. List elements → Find username input
2. Click username → Type username
3. Click password → Type password
4. Click submit button
5. Wait 2s → Verify task list loaded
```

### View Task Details
```
1. List elements → Find task-list-item-*
2. Click task item
3. Wait 500ms → Verify task details loaded
```

### Check-In
```
1. Click "Bắt đầu làm việc" button
2. Wait 5s for GPS location
3. (Optional) Click camera/library button
4. (Optional) Type notes
5. Click submit button
6. Wait 3s → Verify returned to task details
```

### Check-Out
```
1. Click "Hoàn thành công việc" button
2. Wait 5s for GPS location
3. (Optional) Add attachments
4. (Optional) Type notes
5. Click submit button
6. Wait 3s → Verify task completed
```

## Wait Times

| Action | Wait Time | Why |
|--------|-----------|-----|
| After login | 2s | Auth + data fetch |
| After navigation | 500ms | Screen transition |
| GPS location | 5-10s | Platform location service |
| After submit | 3s | API call + upload |
| Pull-to-refresh | 2s | Data refetch |

## Troubleshooting Quick Fixes

### Click doesn't work
```
1. List elements again
2. Verify coordinates
3. Check if element is disabled
4. Scroll to make visible
5. Try clicking by label match
```

### Element not found
```
1. Take screenshot
2. Check loading state
3. Scroll down/up
4. Wait longer for screen load
```

### Permission issues
```
1. Press BACK button if dialog appears
2. Check device Settings > Privacy
3. Reinstall app to reset
```

## Screen States

### Loading State Indicators
- Task list: Shows skeleton loaders
- Task details: Shows loading text
- Check-in/out: Shows "Đang tải thông tin..."

### Success Indicators
- Toast message appears
- Navigation back to previous screen
- Element state changes (e.g., button disabled)

## Test Account Setup

Required test data:
- ✅ Worker account with assigned tasks
- ✅ Tasks in READY status (for check-in)
- ✅ Tasks in IN_PROGRESS status (for check-out)
- ✅ Tasks with GPS locations set
- ✅ Admin account (for admin features)

## Common Element Search Patterns

```bash
# Find by label (Vietnamese)
list → filter by accessibilityLabel → get coordinates

# Find by testID pattern
list → filter by testID → get coordinates

# Find by text content
list → filter by text/children → get coordinates
```

## Full Documentation

See `MOBILE-MCP-TESTING.md` for complete guide.
