# Mobile Testing Guide with Mobile-MCP

This guide explains how to use Mobile-MCP tools for testing the NV Internal mobile application.

## 🛠 Mobile-MCP Tools Overview

Mobile-MCP provides programmatic access to mobile devices (simulators and physical) for automated testing.

### Available Tools

#### Device Management
- `mobile_list_available_devices` - List all connected devices/simulators
- `mobile_list_apps` - List installed apps on device
- `mobile_launch_app` - Launch the NV Internal app
- `mobile_terminate_app` - Close the app
- `mobile_install_app` - Install app from .apk/.ipa file
- `mobile_uninstall_app` - Remove app from device

#### Screen Interaction
- `mobile_take_screenshot` - Capture current screen
- `mobile_save_screenshot` - Save screenshot to file
- `mobile_list_elements_on_screen` - Get all UI elements and coordinates
- `mobile_get_screen_size` - Get device screen dimensions

#### User Actions
- `mobile_click_on_screen_at_coordinates` - Tap at specific location
- `mobile_double_tap_on_screen` - Double tap gesture
- `mobile_long_press_on_screen_at_coordinates` - Long press gesture
- `mobile_swipe_on_screen` - Swipe in direction
- `mobile_type_keys` - Enter text in focused field
- `mobile_press_button` - Press hardware buttons (HOME, BACK, etc.)

#### Navigation
- `mobile_open_url` - Open URL in browser
- `mobile_set_orientation` - Change to portrait/landscape
- `mobile_get_orientation` - Check current orientation

## 📱 Setting Up for Testing

### 1. Select Device

```
# List available devices
mobile_list_available_devices

# Typical output:
- iPhone 15 Pro (Simulator) - device: "iPhone-15-Pro"
- Pixel 6 (Emulator) - device: "emulator-5554"
```

### 2. Launch App

```
# Check if app is installed
mobile_list_apps
device: "iPhone-15-Pro"

# Launch the app
mobile_launch_app
device: "iPhone-15-Pro"
packageName: "com.nvinternal.app"  # iOS bundle ID or Android package
```

### 3. Verify App State

```
# Take screenshot to see current state
mobile_take_screenshot
device: "iPhone-15-Pro"

# List elements to understand UI structure
mobile_list_elements_on_screen
device: "iPhone-15-Pro"
```

## 🧪 Common Test Patterns

### Pattern 1: Login Flow Testing

```
1. Launch app
2. Take screenshot of login screen
3. List elements to find email/password fields
4. Click on email field coordinates
5. Type email address
6. Click on password field coordinates
7. Type password
8. Find and click login button
9. Wait and verify successful login
10. Take screenshot of home screen
```

### Pattern 2: Form Input Testing

```
1. Navigate to form screen
2. List elements to find input fields
3. For each field:
   - Click on field coordinates
   - Type test data
   - Verify input accepted
4. Submit form
5. Verify success/error handling
```

### Pattern 3: List Scrolling Testing

```
1. Navigate to list view
2. Take initial screenshot
3. Swipe up to scroll down
4. Take screenshot after scroll
5. Check for new elements
6. Test pull-to-refresh:
   - Swipe down from top
   - Verify refresh indicator
   - Verify data reload
```

### Pattern 4: Photo Attachment Testing

```
1. Navigate to task details
2. Find and click add photo button
3. Handle permission dialog if needed
4. Select photo from gallery
5. Verify photo appears in task
6. Take screenshot of result
```

## 📋 Test Execution Workflow

### Step-by-Step Process

#### 1. Pre-Test Setup
```
# Select device
device = "iPhone-15-Pro"

# Clear previous state (optional)
mobile_terminate_app(device, "com.nvinternal.app")

# Launch fresh instance
mobile_launch_app(device, "com.nvinternal.app")
```

#### 2. Navigate to Test Area
```
# Take screenshot to see current state
mobile_take_screenshot(device)

# Find navigation elements
elements = mobile_list_elements_on_screen(device)
# Look for tab bar, menu items, etc.

# Click to navigate
mobile_click_on_screen_at_coordinates(device, x, y)
```

#### 3. Execute Test Steps
```
# For each test step:
1. Perform action (click, type, swipe)
2. Wait for UI to update (if needed)
3. Verify expected result
4. Take screenshot for evidence
5. Document actual vs expected
```

#### 4. Handle Errors
```
# If test fails:
1. Take screenshot of failure state
2. List elements to understand issue
3. Try to recover or restart app
4. Document error details
```

#### 5. Clean Up
```
# After test completion:
mobile_terminate_app(device, "com.nvinternal.app")
# Or navigate to neutral state for next test
```

## 🔍 Element Identification Strategies

### Finding Elements

When using `mobile_list_elements_on_screen`, look for:

1. **By Text**: Match visible text content
2. **By Accessibility Label**: More reliable for buttons/icons
3. **By Type**: Filter by element type (button, textfield, etc.)
4. **By Position**: Use coordinates when unique identifiers unavailable

### Example Element Search

```
elements = mobile_list_elements_on_screen(device)

# Find login button by text
login_button = find_element_by_text(elements, "Đăng nhập")

# Find by accessibility label
menu_button = find_element_by_label(elements, "Menu")

# Find text input fields
text_fields = filter_elements_by_type(elements, "textfield")
```

## 📊 Test Data Management

### Test User Accounts
```
# Development/Testing accounts
test_admin@nvinternal.com - Admin role
test_employee@nvinternal.com - Employee role
test_manager@nvinternal.com - Manager role
```

### Test Data Sets
- **Valid inputs**: Normal business data
- **Edge cases**: Maximum lengths, special characters
- **Invalid inputs**: Empty, malformed data
- **Vietnamese text**: Ensure proper encoding

## 🐛 Debugging Failed Tests

### When Tests Fail

1. **Screenshot Analysis**
   - Take screenshot at failure point
   - Compare with expected screen
   - Check for unexpected dialogs/errors

2. **Element Inspection**
   - List all elements on screen
   - Verify expected elements present
   - Check coordinates haven't changed

3. **State Verification**
   - Ensure app in expected state
   - Check network connectivity
   - Verify test data exists

4. **Recovery Steps**
   - Try pressing BACK button
   - Navigate to home screen
   - Restart app if needed

## 🎯 Best Practices

### Do's
- ✅ Always take screenshots at key points
- ✅ List elements before interacting
- ✅ Wait after actions for UI updates
- ✅ Handle permission dialogs
- ✅ Test both portrait and landscape
- ✅ Verify text in Vietnamese
- ✅ Clean up test data after tests

### Don'ts
- ❌ Don't hardcode coordinates without verification
- ❌ Don't assume element positions are fixed
- ❌ Don't skip error handling
- ❌ Don't test on single device size only
- ❌ Don't ignore accessibility labels

## 📝 Test Result Documentation

### Screenshot Naming
```
YYYYMMDD-HHMMSS-[feature]-[step]-[status].png
Example: 20251030-143000-login-submit-success.png
```

### Result Structure
```markdown
## Test: [Test Name]
- **Date**: YYYY-MM-DD HH:MM:SS UTC
- **Device**: [Device name and ID]
- **App Version**: [Version number]
- **Status**: ✅ Passed / ❌ Failed

### Steps Executed
1. [Step description] - ✅ Passed
   - Screenshot: [filename]
   - Notes: [any observations]

### Issues Found
- [Issue description]
- Severity: Critical/High/Medium/Low
- Reproduction steps
```

## 🔄 Continuous Testing

### Regression Test Suite

Core tests to run before each release:
1. Login/Logout flow
2. Task creation and assignment
3. Check-in with GPS verification
4. Photo attachment upload
5. Payment record creation
6. Report generation
7. Navigation between all screens

### Performance Monitoring

Track during tests:
- App launch time
- Screen transition speed
- List scrolling smoothness
- Image loading time
- API response times

## 🆘 Troubleshooting

### Common Issues and Solutions

**Issue**: Cannot find element
- **Solution**: Use `list_elements` to get current UI structure, element may have different text/label

**Issue**: Click not working
- **Solution**: Verify coordinates are correct, element may be disabled or covered

**Issue**: Text input failing
- **Solution**: Ensure field is focused first, may need to dismiss keyboard between fields

**Issue**: Screenshot is black
- **Solution**: Wait longer after navigation, some screens take time to render

**Issue**: App crashes during test
- **Solution**: Check device logs, may be memory issue or unhandled exception

## 🔗 Integration with QA Workflow

1. **Test Planning**: Use test plans in `test-plans/` as guide
2. **Test Execution**: Follow scenarios in `test-scenarios/`
3. **Result Documentation**: Save results in `test-results/`
4. **Bug Reporting**: Create tasks in `.claude/tasks/` for issues
5. **Verification**: Re-run tests after fixes

---

*This guide enables systematic and thorough testing of the NV Internal mobile application using Mobile-MCP tools.*