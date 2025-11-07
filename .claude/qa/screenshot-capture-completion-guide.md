# Screenshot Capture Completion Guide

**Version**: 1.0
**Created**: 2025-11-07
**Session Progress**: 13/29 screenshots (45% complete)
**Remaining**: 16 screenshots
**Estimated Time**: 30-45 minutes

---

## Current Status

### Completed (13 screenshots)

1. ✅ User settings screen
2. ✅ Admin tasks list (empty state)
3. ✅ Task creation form
4. ✅ Task details (4 different tasks created)
5. ✅ Assignee selection bottom sheet
6. ✅ Task with assignees view
7. ✅ Task status update to READY
8. ✅ Admin task list with one READY task
9. ✅ Multiple maintenance/repair/cleaning tasks

### Database State

**Current Tasks in Database**: 4 tasks
- Task 1: Lắp đặt điều hòa tại Văn phòng (STATUS: READY)
- Task 2: Bảo dưỡng điều hòa (STATUS: PREPARING)
- Task 3: Sửa chữa điều hòa (STATUS: PREPARING)
- Task 4: Vệ sinh điều hòa (STATUS: PREPARING)

**Customers**: 8 (preserved from original)
**Locations**: 8 (preserved from original)
**Users**: All intact (admin + workers)

---

## Remaining Screenshots (16)

### Admin Workflow (8 screenshots)

**13. Admin Task List - Populated** (PRIORITY: HIGH)
- **Path**: `/admin/tasks`
- **Description**: Task list showing all 4 tasks with different statuses
- **Prerequisites**: Already have 4 tasks created
- **Actions**: Navigate to tasks tab, capture list view
- **File**: `13-admin-tasks-populated.png`
- **Time**: 2 minutes

**14. Task Filter - By Status** (PRIORITY: HIGH)
- **Path**: `/admin/tasks` → Filter button → Status filter
- **Description**: Filter panel with status chips selected
- **Actions**: Click filter button, select status (e.g., READY), show filtered results
- **File**: `14-task-filter-status.png`
- **Time**: 3 minutes

**15. Task Filter - By Assignee**
- **Path**: `/admin/tasks` → Filter button → Assignee filter
- **Description**: Filter panel with assignee selection
- **Actions**: Click filter button, select assignee from bottom sheet
- **File**: `15-task-filter-assignee.png`
- **Time**: 3 minutes

**16. Task Filter - By Date Range**
- **Path**: `/admin/tasks` → Filter button → Date range picker
- **Description**: Date range selection for filtering tasks
- **Actions**: Click filter button, open date picker, select range
- **File**: `16-task-filter-date-range.png`
- **Time**: 3 minutes

**17. Task Details - With Comments**
- **Path**: `/admin/tasks/[taskId]` → Add comment
- **Description**: Task with multiple comments visible
- **Prerequisites**: Add 2-3 comments to a task
- **Actions**: Navigate to task, add comments, scroll to show comment section
- **File**: `17-task-with-comments.png`
- **Time**: 5 minutes

**18. Task Details - With Attachments**
- **Path**: `/admin/tasks/[taskId]` → Add attachments
- **Description**: Task with photo attachments grid
- **Prerequisites**: Upload 2-3 photos to a task
- **Actions**: Navigate to task, upload photos, show attachment section
- **File**: `18-task-with-attachments.png`
- **Time**: 5 minutes

**19. Employee Management Screen**
- **Path**: `/admin/employees` (or similar)
- **Description**: Employee list with photos and roles
- **Actions**: Navigate to employee management, show list
- **File**: `19-employee-list.png`
- **Time**: 2 minutes

**20. Reports - Monthly Summary**
- **Path**: `/admin/reports` (or similar)
- **Description**: Monthly performance report view
- **Actions**: Navigate to reports, show summary
- **File**: `20-monthly-reports.png`
- **Time**: 3 minutes

---

### Worker Workflow (8 screenshots)

**21. Worker Task List**
- **Path**: `/worker/tasks`
- **Description**: Worker's assigned tasks view
- **Prerequisites**: Log out and log in as worker account
- **Actions**: Switch to worker role, navigate to tasks tab
- **File**: `21-worker-tasks-list.png`
- **Time**: 3 minutes

**22. Worker Task Details - Ready to Check-In**
- **Path**: `/worker/tasks/[taskId]`
- **Description**: Task details with prominent check-in button
- **Prerequisites**: Task status must be READY, worker assigned
- **Actions**: Navigate to READY task, show check-in button
- **File**: `22-worker-task-ready-checkin.png`
- **Time**: 2 minutes

**23. Check-In - GPS Verification**
- **Path**: Check-in flow → GPS verification
- **Description**: GPS verification screen with map
- **Prerequisites**: Start check-in process
- **Actions**: Click check-in, allow location access, show GPS screen
- **File**: `23-checkin-gps-verification.png`
- **Time**: 4 minutes
- **Note**: May require location permissions setup

**24. Worker Task - In Progress**
- **Path**: `/worker/tasks/[taskId]` (after check-in)
- **Description**: Task view after successful check-in
- **Prerequisites**: Successfully check in to task
- **Actions**: Complete check-in, view task details
- **File**: `24-worker-task-in-progress.png`
- **Time**: 2 minutes

**25. Photo Upload - Camera/Gallery Options**
- **Path**: Task details → Add attachment → Photo picker
- **Description**: Bottom sheet with camera/gallery options
- **Actions**: Click add attachment, show photo picker options
- **File**: `25-photo-upload-options.png`
- **Time**: 2 minutes

**26. Photo Upload - Preview**
- **Path**: Attachment upload → After capturing photos
- **Description**: Photo preview with upload button
- **Actions**: Capture/select photos, show preview screen
- **File**: `26-photo-upload-preview.png`
- **Time**: 3 minutes

**27. Payment Collection Form**
- **Path**: Task details → Add payment
- **Description**: Payment recording interface
- **Actions**: Click add payment, show payment form
- **File**: `27-payment-collection.png`
- **Time**: 3 minutes

**28. Worker Task - Completed**
- **Path**: `/worker/tasks/[taskId]` (after check-out)
- **Description**: Completed task with timeline and payment
- **Prerequisites**: Complete full workflow (check-in → work → payment → check-out)
- **Actions**: Check out from task, view completed task
- **File**: `28-worker-task-completed.png`
- **Time**: 2 minutes

---

## Recommended Approach

### Option 1: Quick Completion (30-45 min) - RECOMMENDED

**Strategy**: Forward-only navigation with Expo Go

**Steps**:
1. **Admin Screenshots First** (15-20 min)
   - Capture populated task list (#13)
   - Capture 3 filter variations (#14-16)
   - Add comments and attachments (#17-18)
   - Employee list and reports (#19-20)

2. **Worker Screenshots Next** (15-25 min)
   - Switch to worker account
   - Complete full workflow: list → ready → check-in → work → payment → complete
   - Capture each step (#21-28)

**Advantages**:
- ✅ Fast completion (30-45 min)
- ✅ Leverages existing setup
- ✅ Known working patterns

**Disadvantages**:
- ⚠️ Expo Go navigation limitations (avoid back button)
- ⚠️ May need app restarts if stuck

---

### Option 2: Manual Testing (60-90 min)

**Strategy**: Manual device testing with comprehensive validation

**Steps**:
1. Deploy to physical device or development build
2. Test all navigation paths thoroughly
3. Capture screenshots using device screenshot function
4. Validate all workflows end-to-end

**Advantages**:
- ✅ More stable navigation
- ✅ Better testing coverage
- ✅ Real-world validation

**Disadvantages**:
- ⏱️ Takes longer (60-90 min)
- 🔧 Requires device setup or dev build

---

### Option 3: Automated Script (2-3 hours setup)

**Strategy**: Create MobileMCP automation script

**Steps**:
1. Write TypeScript script with MobileMCP
2. Parameterize test data
3. Automated screenshot capture sequence
4. Error handling and retries

**Advantages**:
- ✅ Repeatable for future releases
- ✅ Consistent quality
- ✅ Can run multiple device sizes

**Disadvantages**:
- ⏱️ High initial time investment (2-3 hours)
- 🛠️ Maintenance overhead

---

## Detailed Workflow for Option 1 (Recommended)

### Phase 1: Admin Screenshots (15-20 min)

**Setup**:
```bash
# Ensure app is running and logged in as admin
mobile_launch_app
device: "{device-id}"
packageName: "com.duongdev.nvinternal"
```

**Screenshot 13: Populated Task List**
```bash
# Navigate to admin tasks tab
# Capture list view with all 4 tasks
mobile_save_screenshot(device, "13-admin-tasks-populated.png")
```

**Screenshots 14-16: Filters**
```bash
# Click filter button
# Select status filter → Capture
# Reset → Select assignee filter → Capture
# Reset → Select date range → Capture
```

**Screenshot 17: Add Comments**
```bash
# Navigate to task 1
# Add comment: "Đã liên hệ khách hàng"
# Press ENTER to submit
# Add comment: "Đội ngũ sẵn sàng"
# Press ENTER to submit
# Scroll to show comment section
# Capture screenshot
```

**Screenshot 18: Add Attachments**
```bash
# Navigate to task 2 (different task)
# Click add attachment
# Select 2-3 photos (use gallery or camera)
# Wait for upload
# Scroll to show attachment section
# Capture screenshot
```

**Screenshots 19-20: Employees & Reports**
```bash
# Navigate to employee management
# Capture employee list
# Navigate to reports
# Capture monthly summary
```

---

### Phase 2: Worker Screenshots (15-25 min)

**Setup**:
```bash
# Log out from admin account
# Log in as worker account
# Select worker role
```

**Screenshot 21: Worker Task List**
```bash
# Navigate to worker tasks tab
# Capture task list
mobile_save_screenshot(device, "21-worker-tasks-list.png")
```

**Screenshot 22: Ready Task**
```bash
# Click on READY task (Task 1)
# Show check-in button prominent
# Capture
```

**Screenshot 23: GPS Verification**
```bash
# Click check-in button
# Allow location permissions if prompted
# GPS verification screen appears
# Capture map view with distance indicator
```

**Screenshot 24: In Progress**
```bash
# Complete check-in (if within range or test mode)
# Task status changes to IN_PROGRESS
# Capture task view with action buttons
```

**Screenshot 25-26: Photo Upload**
```bash
# Click add attachment button
# Capture photo picker options (camera/gallery)
# Select gallery or camera
# Capture 1-2 photos
# Show preview screen with upload button
# Capture preview
```

**Screenshot 27: Payment**
```bash
# Click add payment button
# Fill payment form:
#   - Amount: 1500000
#   - Method: Cash
#   - Notes: "Đã thu tiền mặt"
# Press ENTER after each field
# Capture payment form
```

**Screenshot 28: Completed**
```bash
# Click check-out button
# Confirm check-out
# Task status changes to COMPLETED
# Capture completed task view with timeline
```

---

## Critical Reminders

### Keyboard Handling
- ⚡ **ALWAYS press ENTER** after typing in text fields
- Without ENTER, form state doesn't update
- This caused 20+ minutes of debugging in previous session

### Location Selection
- 🗺️ **Use search-based selection** for locations
- Direct tapping on addresses is unreliable
- Search query → ENTER → Click first result

### Navigation
- ➡️ **Forward-only navigation** in Expo Go
- Avoid back button from task details
- Restart app if navigation gets stuck

### Form Submission
- ✅ **Check console** if button appears unresponsive
- Validate all required fields filled
- Verify phone number format (10 digits, starts with 0)

---

## Troubleshooting Guide

### Problem: App Gets Stuck

**Solution**:
1. Press device home button
2. Swipe up to close app
3. Restart app via MobileMCP
4. Resume from last successful screenshot

### Problem: Button Not Responding

**Solution**:
1. Check console for validation errors
2. Verify all text inputs have ENTER pressed
3. Wait 1-2 seconds and try again
4. If still stuck, restart app

### Problem: Photos Not Uploading

**Solution**:
1. Check camera/gallery permissions
2. Try selecting from gallery instead of camera
3. Reduce photo count (try 1 photo first)
4. Check network connection

### Problem: GPS Verification Failing

**Solution**:
1. Enable location services in simulator
2. Use test mode if available
3. Move simulator location closer to target
4. Skip GPS verification for screenshots (if possible)

---

## Quality Checklist

After completing all screenshots, verify:

- [ ] All 28 screenshots captured
- [ ] File sizes reasonable (100KB - 500KB each)
- [ ] No blank/black screenshots
- [ ] Vietnamese text visible and correct
- [ ] No UI glitches or errors visible
- [ ] Status indicators appropriate
- [ ] Realistic data shown (no "Test" markers)
- [ ] Screenshots in sequential order
- [ ] File naming convention followed
- [ ] High resolution (393 x 852)

---

## Next Steps After Completion

1. **Organize Screenshots**
   - Review all 28 screenshots
   - Remove any duplicates or low-quality
   - Rename if needed for clarity

2. **Create Device Variants** (Optional)
   - iPhone 15 Pro Max (6.5" - 1284 x 2778)
   - iPhone 13 mini (5.4" - 1080 x 2340)
   - iPad Pro (2048 x 2732)

3. **Prepare Captions**
   - Vietnamese captions for each screenshot
   - English translations for international markets
   - 30-50 words per caption

4. **App Store Connect Upload**
   - Log in to App Store Connect
   - Navigate to app version
   - Upload screenshots for each device size
   - Add captions and preview

5. **Final Review**
   - Product owner approval
   - Marketing team review
   - Legal/compliance check (if needed)

---

## Success Metrics

### Target Completion Time
- **Admin Screenshots**: 15-20 minutes (8 screenshots)
- **Worker Screenshots**: 15-25 minutes (8 screenshots)
- **Total**: 30-45 minutes

### Expected Quality
- **Capture Success Rate**: 95%+ (based on previous session)
- **Usability**: 100% (all screenshots clear and professional)
- **Data Quality**: Realistic Vietnamese data
- **Technical Quality**: High resolution, proper format

---

## Related Documentation

- **Main Task**: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`
- **Playbook**: `.claude/qa/screenshot-capture-playbook.md`
- **Bug Fixes**: `.claude/tasks/20251107-000000-fix-task-creation-button-unresponsive.md`
- **Accessibility**: `docs/architecture/patterns/mobile-accessibility.md`
- **Mobile Testing**: `docs/testing/mobile-mcp.md`

---

**Ready to complete the remaining 16 screenshots! Good luck!** 🚀
