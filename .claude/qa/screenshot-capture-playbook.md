# App Store Screenshot Capture Playbook

**Version**: 1.0
**Last Updated**: 2025-11-06
**Status**: Production Ready

This playbook provides a complete, step-by-step guide for capturing professional app store screenshots for the NV Internal mobile application. Follow this guide for every app store submission to ensure consistency and quality.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Database Preparation](#phase-1-database-preparation)
3. [Phase 2: Accessibility Verification](#phase-2-accessibility-verification)
4. [Phase 3: Screenshot Capture](#phase-3-screenshot-capture)
5. [Phase 4: Post-Processing](#phase-4-post-processing)
6. [Quality Assurance Checklist](#quality-assurance-checklist)
7. [Troubleshooting](#troubleshooting)
8. [File Organization](#file-organization)

---

## Prerequisites

### Required Tools

- [x] **MobileMCP**: Installed and configured
- [x] **Device Simulator**: iOS Simulator or Android Emulator
- [x] **NV Internal App**: Latest build installed
- [x] **Database Access**: Ability to run cleanup scripts
- [x] **Test Accounts**: Admin and worker accounts ready

### Required Knowledge

- Basic understanding of MobileMCP tools
- Familiarity with app navigation
- Understanding of app features
- Vietnamese language proficiency (for verification)

### Recommended Setup

**Device**: iPhone 15 Pro Simulator (6.1" display)
- **Resolution**: 393 x 852 pixels
- **Orientation**: Portrait
- **iOS Version**: Latest stable
- **Rationale**: Most common device size, App Store preferred

**Alternative Devices**:
- iPhone 15 Pro Max (6.7" display) - For larger screens
- iPhone 13 mini (5.4" display) - For compact screens
- iPad Pro 12.9" - For tablet screenshots (optional)

---

## Phase 1: Database Preparation

### Step 1.1: Backup Current Database (Optional but Recommended)

```bash
# If you want to restore data later
cd apps/api
npx tsx scripts/backup-database.ts --output backup-$(date +%Y%m%d).json
```

### Step 1.2: Run Database Cleanup Dry Run

```bash
cd apps/api
npx tsx scripts/clean-task-data.ts --dry-run
```

**Expected Output**:
```
═══════════════════════════════════════════════════════
  TASK DATA CLEANUP SCRIPT
═══════════════════════════════════════════════════════

🔍 DRY RUN MODE - No data will be deleted

📊 Analyzing database...

Records to be deleted:
  📝 Activities:  X
  📎 Attachments: X
  💰 Payments:    X
  ✅ Tasks:       X

📊 Total records: X

Records to be PRESERVED:
  👤 Customers:     X
  📍 GeoLocations:  X

💡 Run with --confirm to actually delete this data
```

**Verification Checklist**:
- [ ] Review counts - do they match expectations?
- [ ] Confirm customers and geolocations will be preserved
- [ ] Confirm users will be preserved
- [ ] No unexpected data in deletion list

### Step 1.3: Execute Database Cleanup

```bash
npx tsx scripts/clean-task-data.ts --confirm
```

**Expected Output**:
```
═══════════════════════════════════════════════════════
  ✅ CLEANUP COMPLETE
═══════════════════════════════════════════════════════

Deletion Summary:
  ✅ Activities:  X
  ✅ Attachments: X
  ✅ Payments:    X
  ✅ Tasks:       X

Preserved Data:
  ✓ Customers:    X
  ✓ GeoLocations: X
  ✓ Users:        (unchanged)

🎉 Database is ready for fresh screenshot data!
```

**Verification**:
- [ ] Deletion completed successfully
- [ ] No errors in output
- [ ] Preserved data counts match expectations

### Step 1.4: Create Fresh Test Data

**Via Mobile UI** (Recommended for realistic screenshots):

1. **Log in as Admin**
2. **Create 8-10 Tasks** with realistic data:
   - Vietnamese titles (e.g., "Lắp đặt điều hòa tại Quận 1")
   - Various statuses (PREPARING, READY, IN_PROGRESS, COMPLETED)
   - Assign to different workers
   - Link to actual customers and locations
   - Add realistic descriptions

3. **Log in as Worker**
4. **Execute Task Workflows**:
   - Check in to 2-3 tasks
   - Add photos to 1-2 tasks
   - Add comments to tasks
   - Check out from tasks
   - Record payments for completed tasks

**Data Quality Standards**:
- ✅ Use realistic Vietnamese names and addresses
- ✅ Use proper business terminology
- ✅ Avoid test/dummy data markers (e.g., "Test Task 1")
- ✅ Use realistic monetary values
- ✅ Use actual company customer names (if permissible)
- ❌ No profanity or inappropriate content
- ❌ No personal/sensitive real data
- ❌ No obvious test patterns

---

## Phase 2: Accessibility Verification

### Step 2.1: Check Accessibility Implementation

Verify all interactive elements have the required accessibility properties:

```typescript
// Required properties for all buttons/interactive elements:
{
  accessibilityLabel: string,    // Vietnamese label
  accessibilityHint: string,     // What happens when activated
  accessibilityRole: string,     // "button", "text", etc.
  testID: string                 // Follows naming convention
}
```

### Step 2.2: testID Naming Convention Verification

**Format**: `{screen}-{action}-{type}`

**Examples to Verify**:
- `tasks-filter-button` ✅
- `tasks-create-button` ✅
- `comment-send-button` ✅
- `attachment-camera-button` ✅
- `filter-apply-button` ✅

**Check Files**:
- [ ] `apps/mobile/app/admin/(tabs)/tasks/index.tsx`
- [ ] `apps/mobile/app/admin/tasks/create.tsx`
- [ ] `apps/mobile/app/worker/(tabs)/index.tsx`
- [ ] `apps/mobile/components/admin-task-list.tsx`
- [ ] `apps/mobile/components/attachment-upload-sheet.tsx`
- [ ] `apps/mobile/components/task-comment-box.tsx`
- [ ] `apps/mobile/components/task/task-filter-bottom-sheet.tsx`

### Step 2.3: MobileMCP Compatibility Test

**Quick Test**:
```bash
# Launch app
mobile_launch_app
device: "{device-id}"
packageName: "com.duongdev.nvinternal"

# List elements on first screen
mobile_list_elements_on_screen
device: "{device-id}"

# Verify testIDs appear in output
# Verify accessibilityLabels are in Vietnamese
# Verify all interactive elements discovered
```

**Verification Checklist**:
- [ ] All buttons have testID in element list
- [ ] All labels are in Vietnamese
- [ ] All interactive elements discoverable
- [ ] Can click buttons by coordinates successfully

---

## Phase 3: Screenshot Capture

### Step 3.1: Device Setup

**Select Device**:
```bash
mobile_list_available_devices
```

**Launch App**:
```bash
mobile_launch_app
device: "{device-id}"
packageName: "com.duongdev.nvinternal"
```

**Verify Screen Size**:
```bash
mobile_get_screen_size
device: "{device-id}"

# Expected: 393 x 852 (iPhone 15 Pro)
```

### Step 3.2: Screenshot Workflow

#### A. Authentication & Settings (3 screenshots)

**01. Login Screen**
- Description: Initial login screen with Clerk authentication
- Path: `/sign-in`
- Elements: Logo, "Đăng nhập" button
- File: `01-login-screen.png`

**02. Role Selection**
- Description: User selects Admin or Worker role
- Path: After sign-in
- Elements: Admin card, Worker card
- File: `02-role-selection.png`

**03. User Settings**
- Description: Settings screen with profile info and version
- Path: Admin or Worker settings tab
- Elements: Profile info, version display, logout button
- File: `03-user-settings.png`

#### B. Admin Workflow (10 screenshots)

**04. Admin Tasks List - Empty**
- Description: Empty task list with filter and create buttons
- Path: `/admin/tasks`
- Elements: Empty state, filter button, create button
- File: `04-admin-tasks-empty.png`

**05. Task Creation Form**
- Description: Complete task creation form
- Path: `/admin/tasks/create`
- Elements: All input fields, customer selector, location selector, assignee selector
- File: `05-task-creation-form.png`

**06. Customer Selection Bottom Sheet**
- Description: Customer selection with search
- Path: Task creation → Customer field
- Elements: Search bar, customer list with search results
- File: `06-customer-selection.png`

**07. Location Selection Bottom Sheet**
- Description: Location selection with search
- Path: Task creation → Location field
- Elements: Search bar, location list with addresses
- File: `07-location-selection.png`

**08. Assignee Selection Bottom Sheet**
- Description: Employee selection with search
- Path: Task creation → Assignee field
- Elements: Search bar, employee list with photos
- File: `08-assignee-selection.png`

**09. Admin Tasks List - Populated**
- Description: Task list with 8-10 tasks, various statuses
- Path: `/admin/tasks`
- Elements: Task cards with status badges, customer names, assignees
- File: `09-admin-tasks-populated.png`

**10. Task Details - Admin View**
- Description: Full task details from admin perspective
- Path: `/admin/tasks/{id}`
- Elements: Task info, status, customer, location, assignees, action buttons
- File: `10-task-details-admin.png`

**11. Task Filter Bottom Sheet**
- Description: Filter panel with all options
- Path: Tasks list → Filter button
- Elements: Status chips, assignee selector, date range picker
- File: `11-task-filter-panel.png`

**12. Task Details with Comments**
- Description: Task with multiple comments
- Path: Task details → Comments section
- Elements: Comment list, comment input, photo attachments
- File: `12-task-comments.png`

**13. Task Details with Attachments**
- Description: Task with photo attachments
- Path: Task details → Attachments section
- Elements: Photo grid, attachment count, upload button
- File: `13-task-attachments.png`

#### C. Worker Workflow (10 screenshots)

**14. Worker Tasks List**
- Description: Worker's assigned tasks
- Path: `/worker/tasks`
- Elements: Task cards, filter button, assigned tasks only
- File: `14-worker-tasks-list.png`

**15. Worker Task Details - Ready**
- Description: Task details with check-in button
- Path: `/worker/tasks/{id}` (status: READY)
- Elements: Task info, "Check-In" button prominent
- File: `15-worker-task-ready.png`

**16. Check-In GPS Verification**
- Description: GPS verification during check-in
- Path: Check-in flow
- Elements: Map view, distance indicator, location accuracy
- File: `16-checkin-gps-verification.png`

**17. Worker Task Details - In Progress**
- Description: Task after check-in, showing action buttons
- Path: `/worker/tasks/{id}` (status: IN_PROGRESS)
- Elements: Add photos, add comments, status update, check-out button
- File: `17-worker-task-in-progress.png`

**18. Attachment Upload Bottom Sheet**
- Description: Photo capture/upload options
- Path: Task details → Add attachment button
- Elements: Camera, gallery, files buttons
- File: `18-attachment-upload-options.png`

**19. Attachment Upload - Photo Preview**
- Description: Captured photos with upload button
- Path: Attachment upload → After capturing
- Elements: Photo thumbnails, remove buttons, upload button
- File: `19-attachment-photo-preview.png`

**20. Task Comment Input**
- Description: Adding comment with photos
- Path: Task details → Comment section
- Elements: Text input, camera button, gallery button, send button
- File: `20-task-comment-input.png`

**21. Check-Out Flow**
- Description: Check-out confirmation
- Path: Task details → Check-out button
- Elements: Confirmation dialog, check-out button
- File: `21-checkout-confirmation.png`

**22. Payment Collection**
- Description: Payment recording form
- Path: Task details → Add payment
- Elements: Amount input, payment method, notes
- File: `22-payment-collection.png`

**23. Worker Task Details - Completed**
- Description: Completed task view
- Path: `/worker/tasks/{id}` (status: COMPLETED)
- Elements: Completed badge, timeline, payment info, photos
- File: `23-worker-task-completed.png`

#### D. Employee Management (2 screenshots)

**24. Employee List**
- Description: All employees with search
- Path: Admin → Employee management
- Elements: Employee cards with photos, roles, search bar
- File: `24-employee-list.png`

**25. Employee Details**
- Description: Individual employee details
- Path: Employee list → Employee card
- Elements: Profile info, assigned tasks, performance metrics
- File: `25-employee-details.png`

#### E. Reports & Analytics (3 screenshots)

**26. Monthly Reports List**
- Description: Reports overview
- Path: Admin → Reports
- Elements: Month selector, report cards, metrics
- File: `26-reports-overview.png`

**27. Employee Monthly Report**
- Description: Individual employee performance report
- Path: Reports → Employee report
- Elements: Task counts, revenue, ratings, charts
- File: `27-employee-monthly-report.png`

**28. Company Analytics**
- Description: Overall company performance
- Path: Reports → Company analytics
- Elements: Total tasks, revenue trends, top performers
- File: `28-company-analytics.png`

### Step 3.3: Capture Commands

**Template for Each Screenshot**:

```bash
# 1. Navigate to screen (if needed)
mobile_click_on_screen_at_coordinates
device: "{device-id}"
x: {x-coordinate}
y: {y-coordinate}

# 2. Wait for render (1-2 seconds)
mobile_wait
device: "{device-id}"
time: 1

# 3. Take screenshot
mobile_save_screenshot
device: "{device-id}"
saveTo: "/path/to/screenshots/{filename}.png"

# 4. Verify screenshot quality
# - Check file exists
# - Check file size (should be > 100KB)
# - Verify image is not blank/black
```

**Example Workflow for Task Creation**:

```bash
# Navigate to admin tasks
mobile_click_on_screen_at_coordinates
device: "9C48A787-DDE7-421F-AE4D-8E2E58EFD45C"
x: 70
y: 770

# Wait for tasks screen to load
mobile_wait
device: "9C48A787-DDE7-421F-AE4D-8E2E58EFD45C"
time: 1

# Click create button
mobile_click_on_screen_at_coordinates
device: "9C48A787-DDE7-421F-AE4D-8E2E58EFD45C"
x: 360
y: 100

# Wait for form to load
mobile_wait
device: "9C48A787-DDE7-421F-AE4D-8E2E58EFD45C"
time: 1

# Capture screenshot
mobile_save_screenshot
device: "9C48A787-DDE7-421F-AE4D-8E2E58EFD45C"
saveTo: "/Users/duongdev/personal/nv-internal/screenshots/05-task-creation-form.png"
```

### Step 3.4: Screenshot Verification

**After Each Screenshot**:
- [ ] File created successfully
- [ ] File size > 100KB (reasonable quality)
- [ ] Image not blank/black
- [ ] All UI elements visible
- [ ] Text is legible
- [ ] Vietnamese text correct
- [ ] No debug overlays visible
- [ ] No test data visible

**Review Screenshot**:
```bash
# Open screenshot to verify
open /Users/duongdev/personal/nv-internal/screenshots/{filename}.png
```

---

## Phase 4: Post-Processing

### Step 4.1: Screenshot Organization

**Directory Structure**:
```
screenshots/
├── ios/
│   ├── 6.5-inch/          # iPhone 15 Pro Max
│   ├── 6.1-inch/          # iPhone 15 Pro (primary)
│   └── 5.5-inch/          # iPhone 13 mini
├── android/
│   ├── phone/
│   └── tablet/
└── raw/                   # Original captures
```

### Step 4.2: App Store Connect Sizes

**iOS App Store Requirements**:
- 6.5" Display (1284 x 2778) - iPhone 15 Pro Max
- 6.1" Display (1170 x 2532) - iPhone 15 Pro
- 5.5" Display (1242 x 2208) - iPhone 8 Plus
- iPad Pro 12.9" (2048 x 2732)

**Google Play Requirements**:
- Phone (1080 x 1920 or higher)
- 7" Tablet (1024 x 1768)
- 10" Tablet (1920 x 1200)

### Step 4.3: Image Optimization

**Resize for Different Devices** (if needed):
```bash
# Using ImageMagick or similar tool
convert screenshot.png -resize 1284x2778 screenshot-6.5inch.png
```

**Optimize File Size**:
```bash
# Reduce file size without quality loss
pngquant --quality=85-95 screenshot.png
```

### Step 4.4: Add Captions

**Vietnamese Captions** (for Vietnamese App Store):
- 01-03: "Đăng nhập và cài đặt dễ dàng"
- 04-08: "Quản lý công việc hiệu quả"
- 09-13: "Theo dõi tiến độ thời gian thực"
- 14-18: "Thực hiện công việc nhanh chóng"
- 19-23: "Tích hợp GPS và báo cáo chi tiết"
- 24-28: "Phân tích và báo cáo toàn diện"

**English Captions** (for international markets):
- 01-03: "Simple login and settings"
- 04-08: "Efficient task management"
- 09-13: "Real-time progress tracking"
- 14-18: "Quick task execution"
- 19-23: "GPS integration and detailed reports"
- 24-28: "Comprehensive analytics"

---

## Quality Assurance Checklist

### Pre-Capture Checklist

- [ ] Database cleaned successfully
- [ ] Fresh test data created (8-10 tasks)
- [ ] Realistic Vietnamese data used
- [ ] No test/dummy data markers
- [ ] All accounts working (admin, worker)
- [ ] App running smoothly on simulator
- [ ] Device orientation set to Portrait
- [ ] Screen size verified (393 x 852)

### During Capture Checklist

- [ ] Screenshot naming convention followed
- [ ] All 28 screenshots captured
- [ ] Each screenshot verified immediately after capture
- [ ] Navigation flow logical and complete
- [ ] All key features represented
- [ ] Vietnamese text visible and correct
- [ ] No UI glitches visible
- [ ] Status indicators appropriate

### Post-Capture Checklist

- [ ] All 28 screenshots present
- [ ] File sizes reasonable (>100KB each)
- [ ] No duplicate screenshots
- [ ] Images not blank/black
- [ ] Organized in proper directory structure
- [ ] Resized for different devices (if needed)
- [ ] Optimized for file size
- [ ] Captions prepared (Vietnamese & English)
- [ ] Final review by product owner
- [ ] Ready for App Store Connect upload

---

## Troubleshooting

### Issue: Screenshot is Black/Blank

**Possible Causes**:
- Screen not fully loaded
- Render delay
- Graphics issue

**Solutions**:
1. Increase wait time to 2-3 seconds
2. Check if screen actually loaded visually
3. Restart simulator and try again
4. Use `mobile_take_screenshot` first to verify before saving

### Issue: Cannot Find Element

**Possible Causes**:
- Screen state different than expected
- Element not visible (scrolled off-screen)
- Element coordinates changed

**Solutions**:
1. Use `mobile_list_elements_on_screen` to see current UI
2. Verify navigation reached correct screen
3. Check if element needs scrolling to be visible
4. Use testID to find element reliably

### Issue: Click Not Working

**Possible Causes**:
- Incorrect coordinates
- Element disabled
- Element covered by another view

**Solutions**:
1. List elements and get correct coordinates
2. Verify element state (enabled/disabled)
3. Check z-index and overlays
4. Try clicking with slight offset

### Issue: Vietnamese Text Not Displaying

**Possible Causes**:
- Font not loaded
- Encoding issue
- Missing translations

**Solutions**:
1. Restart app to reload fonts
2. Check language settings
3. Verify translation strings exist
4. Check console for errors

### Issue: Low Quality Screenshot

**Possible Causes**:
- Simulator resolution too low
- Compression too aggressive
- Device screen size not optimal

**Solutions**:
1. Use iPhone 15 Pro simulator (high resolution)
2. Don't compress screenshots before verification
3. Check simulator scale setting (100% recommended)
4. Save as PNG (not JPEG) for quality

---

## File Organization

### Naming Convention

**Format**: `{number}-{screen-name}-{variant}.png`

**Examples**:
- `01-login-screen.png`
- `02-role-selection.png`
- `05-task-creation-form.png`
- `14-worker-tasks-list.png`

**Rationale**:
- Numbers provide natural sorting order
- Descriptive names aid identification
- Lowercase with hyphens (URL-friendly)
- Variant suffix for multiple versions

### Version Control

**Track Screenshots in Git**:
```bash
# Add screenshots directory
git add screenshots/

# Commit with descriptive message
git commit -m "docs(screenshots): add app store screenshots v1.0"
```

**Benefits**:
- Track changes between submissions
- Compare screenshots across versions
- Rollback if needed
- Team collaboration

### Storage Locations

**Development**:
```
/Users/duongdev/personal/nv-internal/screenshots/
```

**Cloud Backup** (Recommended):
- Google Drive: `NV Internal/App Store/Screenshots/`
- iCloud: `Projects/NV Internal/Screenshots/`
- Dropbox: `Work/NV Internal/App Store Assets/`

---

## Success Metrics

### Capture Efficiency

- **Target Time**: 2-3 hours for all 28 screenshots
- **Success Rate**: 95%+ screenshots usable on first attempt
- **Quality Pass Rate**: 100% screenshots pass quality review

### Quality Standards

- **Resolution**: Native device resolution (393 x 852)
- **File Size**: 100-500KB per screenshot (PNG)
- **Clarity**: All text legible, no blur
- **Completeness**: All 28 screenshots captured
- **Accuracy**: Data realistic, Vietnamese correct

---

## Maintenance

### Update Frequency

- **Major Updates**: Capture new screenshots for significant UI changes
- **Minor Updates**: Update affected screenshots only
- **Regular Review**: Every 3-6 months for freshness

### Version Tracking

**Changelog**:
- v1.0 (2025-11-06): Initial screenshot set captured
- v1.1 (Future): Updated [specific features]

---

## Lessons Learned (2025-11-07 Session)

### Critical Discovery: Keyboard Handling

**Issue**: Text inputs don't register changes without pressing ENTER.

**Impact**: Form state doesn't update, validation fails silently.

**Solution**: Always press ENTER after typing in each text field.

**Pattern**:
```typescript
// After typing text in any input:
mobile_type_keys(device, "text content", submit: false)
mobile_press_key(device, "Enter")  // Critical for form state update
```

### Location Selection Workflow

**Discovery**: Direct location tapping unreliable in MobileMCP.

**Reliable Workflow**:
1. Click location field
2. Wait for location picker to open
3. Click search box
4. Type search query (e.g., "Nguyen Thi Minh")
5. Press ENTER to trigger search
6. Click first result from search results
7. Verify location selected
8. Return to form

**Anti-pattern**: Don't try to tap addresses directly from list.

### Navigation Limitations in Expo Go

**Discovery**: Back button from task details causes navigation freeze.

**Impact**: Cannot go back after viewing task details.

**Workaround**: Use forward-only navigation for screenshots:
- Capture all screenshots in linear sequence
- Restart app to reset navigation state
- Avoid back navigation during screenshot capture

**Future**: Consider using development build instead of Expo Go for better stability.

### Form Validation Silent Failures

**Discovery**: Invalid forms block submission without showing errors.

**Symptoms**: Button appears unresponsive, no error messages visible.

**Root Cause**: Zod validation failures not surfaced to UI.

**Solution Applied**:
- Fixed validation schemas (phone number `.refine()`)
- Added console error logging
- Added try-catch in submit handlers

**Pattern**: Always check console logs when buttons seem unresponsive.

### Location Parameter Types

**Discovery**: Navigation parameters must be strings, not numbers.

**Issue**: Passing numbers for latitude/longitude caused parsing errors.

**Solution**: Always convert to strings:
```typescript
params: {
  latitude: String(location.lat),
  longitude: String(location.lng),
}
```

### MobileMCP Click Success Patterns

**What Works Well** (95%+ success):
- Click by testID (most reliable)
- Click by accessibilityLabel (very reliable)
- Click on elements with all 4 accessibility properties
- Forward navigation workflows

**What Doesn't Work Well** (50% success):
- Back navigation in Expo Go
- Coordinate-based clicks without accessibility
- Elements without testID or accessibilityLabel
- Complex gestures in bottom sheets

---

## Troubleshooting Additions

### Issue: Button Appears Unresponsive

**New Causes**:
- Form validation failing silently
- Missing ENTER keypress after text input
- Invalid phone number format
- Navigation state corrupted

**New Solutions**:
1. Check console for validation errors
2. Press ENTER after all text inputs
3. Verify form field values are correct
4. Restart app to reset navigation state
5. Check Zod schema for broken validation logic

### Issue: Location Not Saving

**Cause**: Direct tapping doesn't trigger selection properly.

**Solution**:
1. Use search-based selection workflow
2. Press ENTER after search query
3. Click first search result
4. Verify location field shows selected address
5. Press ENTER in location field if needed

### Issue: Form Submit Button Disabled

**Possible Causes**:
- Validation errors (check console)
- Required fields missing
- Phone number format invalid
- Form state not updated

**Solutions**:
1. Check all required fields filled
2. Press ENTER after each input
3. Check console for validation errors
4. Verify phone number format (10 digits, starts with 0)
5. Try clicking submit button again after 1-2 seconds

---

## Appendix

### Quick Reference Commands

```bash
# List devices
mobile_list_available_devices

# Launch app
mobile_launch_app
device: "{device-id}"
packageName: "com.duongdev.nvinternal"

# List elements
mobile_list_elements_on_screen
device: "{device-id}"

# Click
mobile_click_on_screen_at_coordinates
device: "{device-id}"
x: {x}
y: {y}

# Wait
mobile_wait
device: "{device-id}"
time: 1

# Screenshot
mobile_save_screenshot
device: "{device-id}"
saveTo: "/path/to/screenshot.png"
```

### Useful Resources

- **MobileMCP Documentation**: `.claude/qa/mobile-testing-guide.md`
- **Accessibility Patterns**: `docs/testing/mobile-mcp.md`
- **Database Scripts**: `apps/api/scripts/README.md`
- **Task Documentation**: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`

---

**Last Updated**: 2025-11-06
**Next Review**: 2026-02-06 (3 months)
**Maintained By**: Development Team
