# Mobile-MCP Testing Cheatsheet

## 🚀 Quick Commands

```bash
# Essential commands
mobile_list_available_devices()              # Get device ID
mobile_take_screenshot(device: "ID")         # See current screen
mobile_list_elements_on_screen(device: "ID") # Find elements
mobile_click_on_screen_at_coordinates(device: "ID", x: X, y: Y)
mobile_type_keys(device: "ID", text: "text", submit: false)
mobile_swipe_on_screen(device: "ID", direction: "up|down|left|right")
```

## 🎯 Element Selectors by Screen

### Sign-In
| Element | testID | Vietnamese Label |
|---------|--------|-----------------|
| Username | `sign-in-username-input` | "Tên đăng nhập" |
| Password | `sign-in-password-input` | "Mật khẩu" |
| Submit | `sign-in-submit-button` | "Đăng nhập" |

### Task List
| Element | testID Pattern | Description |
|---------|---------------|-------------|
| Task Card | `task-list-item-{ID}` | Click to view details |
| Sections | `task-list-section-*` | Headers for grouping |

### Task Details (All Buttons)
| Action | testID | Vietnamese Label |
|--------|--------|-----------------|
| Check-In | `task-action-check-in-button` | "Bắt đầu làm việc" |
| Check-Out | `task-action-check-out-button` | "Hoàn thành công việc" |
| Map | `task-details-open-map-button` | "Mở bản đồ" |
| Call | `task-details-call-customer-button` | "Gọi khách hàng" |
| Assign | `task-details-assign-button` | "Phân công nhân viên" |
| Revenue | `task-details-set-revenue-button` | "Đặt giá dịch vụ" |
| Payment | `task-details-edit-payment-button` | "Chỉnh sửa thanh toán" |

### Check-In/Out Screens
| Element | testID Pattern | Purpose |
|---------|---------------|---------|
| Camera | `{event}-camera-button` | Take photo |
| Library | `{event}-library-button` | Choose from gallery |
| Files | `{event}-files-button` | Pick documents |
| Notes | `{event}-notes-input` | Add text notes |
| Submit | `{event}-submit-button` | Complete action |

*Replace `{event}` with `check-in` or `check-out`*

## ⏱️ Expected Wait Times

| Action | Wait | Why |
|--------|------|-----|
| Login → Task List | 2s | Auth + fetch |
| Navigation | 500ms | Screen transition |
| GPS Location | 5-10s | Platform service |
| Submit Form | 3s | API + uploads |
| Pull Refresh | 2s | Data refetch |

## 🔍 Finding Elements Strategy

```python
# 1. List all elements
elements = mobile_list_elements_on_screen(device)

# 2. Find by accessibilityLabel (Vietnamese)
target = [e for e in elements if e['label'] == "Bắt đầu làm việc"]

# 3. Find by testID
target = [e for e in elements if e['testID'] == "task-action-check-in-button"]

# 4. Get coordinates and click
x, y = target[0]['x'], target[0]['y']
mobile_click_on_screen_at_coordinates(device, x, y)
```

## 🌀 Common Workflows

### Login Flow
```
1. Find "Tên đăng nhập" → Click → Type username
2. Find "Mật khẩu" → Click → Type password
3. Find "Đăng nhập" → Click
4. Wait 2s → Verify task list
```

### Check-In Flow
```
1. Find & click task card (task-list-item-*)
2. Find "Bắt đầu làm việc" → Click
3. Wait for GPS (5-10s)
4. Optional: Add photo/notes
5. Find submit button → Click
6. Wait 3s → Verify success
```

### Check-Out with Payment
```
1. Find "Hoàn thành công việc" → Click
2. Wait for GPS
3. Handle payment if expectedRevenue set
4. Optional: Add attachments
5. Submit → Wait → Verify
```

## 🐛 Troubleshooting

### Click Misses
✓ List elements to verify coordinates
✓ Check if disabled
✓ Scroll to make visible
✓ Wait for animations

### Element Not Found
✓ Take screenshot
✓ Check loading state
✓ Scroll up/down
✓ Wait longer

### Permission Dialogs
✓ Press BACK to dismiss
✓ Check device settings
✓ Reinstall to reset

## 📱 Screen States

**Loading**: Look for skeleton loaders
**Success**: Toast message + navigation
**Error**: Red error text appears

## 🔗 Full Documentation

- Comprehensive Guide: `MOBILE-MCP-TESTING.md`
- Quick Reference: `QUICK-TEST-REFERENCE.md`
- Implementation: `.claude/tasks/20251028-mobile-mcp-accessibility-optimization.md`