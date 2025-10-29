# QA Documentation Quick Start

**Quick reference guide for getting started with QA testing documentation**

## 5-Minute Quick Start

### For Developers

#### Before You Code
```bash
# 1. Ask qa-ui agent to create test plan
"Create test plan for [feature name]"

# 2. Review test scenarios in .claude/qa/test-scenarios/
# 3. Note acceptance criteria and edge cases
# 4. Add testID, accessibilityLabel to all interactive elements
```

#### After You Code
```bash
# 1. Ask qa-ui agent to test your feature
"Test [feature name] implementation"

# 2. Review results in .claude/qa/test-results/
# 3. Fix any bugs found
# 4. Ask qa-ui to run regression tests
```

### For QA Engineers

#### Testing a Feature
```bash
# 1. Find test documentation
cd .claude/qa/
ls test-plans/        # Find test plan
ls test-scenarios/    # Find test scenarios

# 2. Connect to device
mobile_list_available_devices()

# 3. Execute tests
# Follow test scenarios step by step
# Use Mobile-MCP tools

# 4. Document results
# Create file in test-results/
# Format: YYYYMMDD-HHMMSS-feature-test-results.md
```

### For qa-ui Agent

#### When Asked to Test
```bash
# 1. Locate or create test plan
# Check .claude/qa/test-plans/

# 2. Locate or create test scenarios
# Check .claude/qa/test-scenarios/

# 3. Execute tests with Mobile-MCP
mobile_list_available_devices()
mobile_take_screenshot(device)
mobile_list_elements_on_screen(device)
# ... follow testing pattern

# 4. Document results
# Create file in .claude/qa/test-results/
# Include pass/fail, bugs, screenshots
```

## File Structure at a Glance

```
.claude/qa/
├── README.md                     # Read first for overview
├── SUMMARY.md                    # Complete setup summary
├── IMPLEMENTATION-GUIDE.md       # Detailed how-to guide
├── QUICK-START.md                # This file
├── QA-AGENT-INSTRUCTIONS...md    # For CLAUDE.md update
│
├── test-plans/                   # Test planning docs
│   ├── README.md                # Template here
│   └── 20251030-*.md            # Actual plans
│
├── test-scenarios/               # Detailed test cases
│   ├── README.md                # Template here
│   └── 20251030-*.md            # Actual scenarios
│
└── test-results/                 # Test execution results
    ├── README.md                # Template here
    └── 20251030-*.md            # Actual results
```

## Essential Commands

### Mobile-MCP Testing Pattern
```typescript
// 1. List devices
mobile_list_available_devices()

// 2. Screenshot current state
mobile_take_screenshot(device: "device_id")

// 3. List all elements
mobile_list_elements_on_screen(device: "device_id")

// 4. Click element (use coords from step 3)
mobile_click_on_screen_at_coordinates(device: "device_id", x: X, y: Y)

// 5. Type text
mobile_type_keys(device: "device_id", text: "input", submit: false)

// 6. Swipe/scroll
mobile_swipe_on_screen(device: "device_id", direction: "up", distance: 200)

// 7. Verify result
mobile_take_screenshot(device: "device_id")
```

## Naming Conventions

### File Names
```
Format: YYYYMMDD-HHMMSS-descriptive-name.md
Example: 20251030-120000-payment-collection-test-plan.md
```

### testID Values
```
Format: {screen}-{component}-{action}
Examples:
  sign-in-username-input
  sign-in-submit-button
  task-details-check-in-button
  check-in-camera-button
```

## Priority Classification

```
Test Priority:
  Critical → Core functionality (test first)
  High     → Important features
  Medium   → Secondary features
  Low      → Rare scenarios

Bug Severity:
  Critical → Crash/data loss     [P0: 24h]
  Major    → Feature broken      [P1: sprint]
  Minor    → Edge case          [P2: next sprint]
  Trivial  → Cosmetic           [P3: later]
```

## Common Test Scenarios

### Authentication
```
- Valid login (admin/worker)
- Invalid credentials
- Session timeout
- Logout flow
```

### Check-in/Check-out
```
- Check-in with GPS
- Check-in without GPS (error case)
- Check-in with photo
- Check-out with payment
- GPS accuracy validation
```

### Task Management
```
- List tasks (filtering, sorting)
- View task details
- Navigate to map
- Call customer
- Assign employees
```

## Vietnamese Test Strings

```
Common UI text (use exact strings):
  "Tên đăng nhập"              → Username
  "Mật khẩu"                   → Password
  "Đăng nhập"                  → Sign in
  "Bắt đầu làm việc"           → Start work
  "Hoàn thành công việc"       → Complete work
  "Xác nhận bắt đầu"           → Confirm start
  "Xác nhận hoàn thành"        → Confirm complete
  "Không thể xác định vị trí"  → Cannot determine location
  "Chụp ảnh từ camera"         → Take photo from camera
  "Ghi chú"                    → Notes
```

## Typical Timing

```
Wait times for async operations:
  Login → Task list:     1-2 seconds
  Screen navigation:     300-500ms
  GPS acquisition:       2-10 seconds
  Photo upload:          1-3 seconds
  API calls:             1-2 seconds
  Pull-to-refresh:       1-2 seconds
```

## Element Targeting Priority

```
1. testID (most reliable)
   Find: testID="task-action-check-in-button"

2. accessibilityLabel (semantic)
   Find: label="Bắt đầu làm việc"

3. Coordinates (last resort)
   Get from: mobile_list_elements_on_screen()
```

## Templates Location

```
Test Plan:      .claude/qa/test-plans/README.md
Test Scenario:  .claude/qa/test-scenarios/README.md
Test Results:   .claude/qa/test-results/README.md
```

## Workflow Diagram

```
Feature Implementation with QA:

1. task-doc-tracker  → Create task
2. qa-ui            → Create test plan & scenarios
3. frontend/backend → Implement feature
4. code-quality     → Verify code
5. qa-ui            → Execute tests
6. qa-ui            → Document results
7. task-doc-tracker → Update & extract learnings

If bugs found:
  → frontend/backend fixes
  → code-quality verifies
  → qa-ui regression tests
  → Loop until pass
```

## Troubleshooting Quick Fixes

```
Element not found:
  1. Take screenshot
  2. List elements
  3. Check if scrolled off-screen
  4. Verify screen loaded

Click misses:
  1. List elements for coords
  2. Check element not disabled
  3. Wait for animations
  4. Use testID/label if available

GPS issues:
  1. Enable location services
  2. Set custom location in simulator
  3. Wait up to 10 seconds
  4. Check permissions

Performance issues:
  1. Test on multiple devices
  2. Check network conditions
  3. Profile app performance
  4. Test with realistic data
```

## Next Actions

```
☐ Read SUMMARY.md for complete overview
☐ Review IMPLEMENTATION-GUIDE.md for details
☐ Update CLAUDE.md with QA agent instructions
☐ Create first test plan for a critical feature
☐ Practice Mobile-MCP testing pattern
☐ Share with team
```

## Need Help?

```
1. IMPLEMENTATION-GUIDE.md → Detailed how-to
2. Template README files   → Structure guidance
3. qa-ui agent            → Testing assistance
4. /apps/mobile/MOBILE-MCP-TESTING.md → Element reference
```

## Key Principles

```
✅ Document before you code (test plan)
✅ Test after you code (execute tests)
✅ Use exact Vietnamese strings
✅ Target with testID first
✅ Wait for async operations
✅ Screenshot everything
✅ Document objectively
✅ Link to task documentation
```

---

**Remember**: Good testing documentation is the foundation of quality software. Take time to document thoroughly, and the payoff will be fewer bugs, faster development, and happier users.

---

**Quick Links**:
- Overview: [README.md](./README.md)
- Complete Guide: [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)
- Summary: [SUMMARY.md](./SUMMARY.md)
- Element Reference: [/apps/mobile/MOBILE-MCP-TESTING.md](/apps/mobile/MOBILE-MCP-TESTING.md)
