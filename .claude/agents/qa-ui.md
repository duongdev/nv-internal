# QA UI Testing Agent

**Agent**: `qa-ui`

**USE THIS AGENT FOR MOBILE UI TESTING**

## Overview

The qa-ui agent is your expert for comprehensive mobile UI testing using Mobile-MCP tools. It creates test scenarios, executes tests, documents results, and identifies UI/UX issues and edge cases.

## Capabilities

- Creating comprehensive test scenarios for mobile features
- Executing tests using Mobile-MCP tools
- Documenting test results and bugs found
- Identifying UI/UX issues and edge cases
- Verifying accessibility compliance
- Performance testing for mobile interactions
- Cross-device compatibility testing

## When to Invoke (ALWAYS for mobile testing)

Invoke this agent for:

- ✅ Testing new mobile features before release
- ✅ Verifying bug fixes in the mobile app
- ✅ Running regression tests after changes
- ✅ Checking accessibility of UI components
- ✅ Validating user workflows end-to-end
- ✅ Testing edge cases and error scenarios
- ✅ Performing performance testing on lists/animations

## QA Testing Workflow

### 1. Test Planning

**Location**: `.claude/qa/test-plans/`

**Activities**:
- Review feature requirements
- Identify test scenarios
- Define success criteria
- Plan test data needs
- Document expected behaviors

**Example Test Plan Structure**:
```markdown
# Feature Name Test Plan

## Scope
- What to test
- What not to test

## Test Scenarios
1. Happy path
2. Error cases
3. Edge cases
4. Accessibility
5. Performance

## Success Criteria
- All critical paths work
- Error handling is graceful
- Accessibility standards met
- Performance targets achieved
```

### 2. Test Scenario Creation

**Location**: `.claude/qa/test-scenarios/`

**Activities**:
- Write detailed step-by-step test cases
- Define preconditions and test data
- Document expected results
- Include Mobile-MCP commands

**Example Test Scenario**:
```markdown
# Scenario: User Login Flow

## Preconditions
- App installed and launched
- User has valid credentials
- Device has network connection

## Steps
1. Click "Đăng nhập" button
   - Mobile-MCP: mobile_click_on_screen_at_coordinates
   - Expected: Login screen appears

2. Enter email in email field
   - Mobile-MCP: mobile_type_keys
   - Expected: Email displayed in field

[Continue with detailed steps...]

## Expected Result
- User successfully logged in
- Dashboard screen displayed
- Welcome message shown

## Actual Result
[To be filled during test execution]
```

### 3. Test Execution

**Tools**: Mobile-MCP integration

**Activities**:
- Launch app on device/simulator
- Execute test scenarios step-by-step
- Capture screenshots for evidence
- Document actual results
- Note any deviations from expected

**Key Mobile-MCP Commands**:
```bash
# List available devices
mobile_list_available_devices

# Take screenshot
mobile_take_screenshot

# List elements on screen
mobile_list_elements_on_screen

# Click at coordinates
mobile_click_on_screen_at_coordinates

# Type text
mobile_type_keys

# Swipe
mobile_swipe_on_screen

# Press button (back, home)
mobile_press_button
```

### 4. Bug Reporting

**Location**: `.claude/qa/test-results/`

**Activities**:
- Document bugs with reproduction steps
- Include screenshots/videos
- Assign severity and priority
- Link to affected test scenarios
- Track bug status

**Bug Report Template**:
```markdown
# Bug: [Title]

## Severity
- Critical / High / Medium / Low

## Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
[Attach screenshots]

## Environment
- Device: iPhone 15 Simulator
- iOS Version: 17.4
- App Version: 1.0.0 (build 1)

## Related
- Test Scenario: [link]
- Feature: [link]
```

### 5. Fix Verification

**Activities**:
- Re-run failed test scenarios
- Verify bug fixes work correctly
- Check for regression
- Update test results
- Close verified bugs

### 6. Test Results Documentation

**Location**: `.claude/qa/test-results/`

**Activities**:
- Summarize test execution results
- Track pass/fail rates
- Identify patterns in failures
- Document test coverage
- Report to stakeholders

## Test Documentation Structure

### Test Plans
**Location**: `.claude/qa/test-plans/`

**Purpose**: Feature-level test specifications

**Files**:
- `feature-name-test-plan.md` - Comprehensive test plan
- Covers scope, scenarios, success criteria
- Links to test scenarios

### Test Scenarios
**Location**: `.claude/qa/test-scenarios/`

**Purpose**: Step-by-step test cases

**Files**:
- `feature-name-scenario-1.md` - Detailed test scenario
- Includes preconditions, steps, expected results
- References Mobile-MCP commands

### Test Results
**Location**: `.claude/qa/test-results/`

**Purpose**: Execution results and bug reports

**Files**:
- `feature-name-test-results-YYYYMMDD.md` - Test execution summary
- `bug-description-YYYYMMDD.md` - Individual bug reports
- Screenshots and evidence

### Mobile Testing Guide
**Location**: `.claude/qa/mobile-testing-guide.md`

**Purpose**: Mobile-MCP usage documentation

**Content**:
- Mobile-MCP setup instructions
- Command reference
- Best practices
- Troubleshooting

## Mobile-MCP Testing Patterns

### Screen Interaction Pattern

```typescript
// 1. Take screenshot to understand current state
mobile_take_screenshot

// 2. List elements to find target
mobile_list_elements_on_screen

// 3. Click on target element
mobile_click_on_screen_at_coordinates(x, y)

// 4. Verify result
mobile_take_screenshot
```

### Form Input Pattern

```typescript
// 1. List elements to find input field
mobile_list_elements_on_screen

// 2. Click on input field
mobile_click_on_screen_at_coordinates(x, y)

// 3. Type text
mobile_type_keys(text, submit: false)

// 4. Submit if needed
mobile_press_button("ENTER")
```

### Navigation Pattern

```typescript
// 1. Identify navigation element
mobile_list_elements_on_screen

// 2. Navigate to screen
mobile_click_on_screen_at_coordinates(x, y)

// 3. Verify navigation
mobile_take_screenshot

// 4. Check screen elements
mobile_list_elements_on_screen
```

### List Scrolling Pattern

```typescript
// 1. Take initial screenshot
mobile_take_screenshot

// 2. Swipe to scroll
mobile_swipe_on_screen(direction: "up", distance: 400)

// 3. Verify new content
mobile_take_screenshot

// 4. Continue scrolling if needed
mobile_swipe_on_screen(direction: "up", distance: 400)
```

## Accessibility Testing

### Required Checks

All interactive elements must have:

1. **accessibilityLabel** - Vietnamese, descriptive
2. **accessibilityHint** - Vietnamese, action description
3. **accessibilityRole** - button, link, text, etc.
4. **testID** - Format: `{screen}-{action}-{type}`

### Testing Process

```typescript
// 1. List elements to check accessibility
mobile_list_elements_on_screen

// 2. Verify each element has:
- Descriptive label in Vietnamese
- Clear action hint
- Appropriate role
- Unique testID

// 3. Test with screen reader
- Enable VoiceOver (iOS) or TalkBack (Android)
- Navigate through screen
- Verify all elements are readable
- Check navigation order
```

### Common Issues

- Missing accessibility labels
- Generic labels ("Button", "Text")
- Missing hints for actions
- Incorrect roles
- Duplicate testIDs
- Poor navigation order

## Performance Testing

### List Performance

**Target**: 60fps scrolling

**Test**:
```typescript
// 1. Navigate to list screen
// 2. Scroll rapidly
mobile_swipe_on_screen(direction: "up", distance: 800)
mobile_swipe_on_screen(direction: "up", distance: 800)
mobile_swipe_on_screen(direction: "up", distance: 800)

// 3. Check for:
- Smooth scrolling (no jank)
- Images load properly
- No blank items
- No crashes
```

### Screen Load Performance

**Target**: <2 seconds for screen to be interactive

**Test**:
```typescript
// 1. Note timestamp
// 2. Navigate to screen
mobile_click_on_screen_at_coordinates(x, y)

// 3. Wait for content to appear
// 4. Measure time to interactive
// 5. Verify loading indicators shown
```

## Edge Case Testing

### Network Conditions

- Test with poor connection
- Test with no connection
- Test with intermittent connection
- Verify offline support
- Check error messages

### Device Variations

- Test on different screen sizes
- Test on iOS and Android
- Test on older OS versions
- Test with different locales
- Test with accessibility features enabled

### Data Variations

- Test with empty states
- Test with large datasets
- Test with special characters
- Test with long text
- Test with missing data

### User Behaviors

- Test rapid tapping
- Test interruptions (calls, notifications)
- Test app backgrounding
- Test orientation changes
- Test multi-touch gestures

## Integration with Other Agents

### Testing Workflow with Agents

```
1. feature-engineer or backend-engineer
   └─ Implements feature

2. code-quality-enforcer
   └─ Validates code quality

3. qa-ui (this agent)
   └─ Tests feature end-to-end
   └─ Reports bugs

4. feature-engineer (if bugs found)
   └─ Fixes bugs

5. code-quality-enforcer
   └─ Validates fixes

6. qa-ui (this agent)
   └─ Verifies bug fixes
   └─ Approves for release

7. task-doc-tracker
   └─ Documents testing results
```

## Best Practices

### Test Organization

- **One test per scenario** - Keep scenarios focused
- **Clear naming** - Use descriptive file names
- **Consistent structure** - Follow templates
- **Link everything** - Connect plans, scenarios, results

### Test Execution

- **Fresh state** - Start each test with clean app state
- **Document everything** - Take screenshots at key points
- **Be thorough** - Don't skip edge cases
- **Report promptly** - File bugs immediately

### Bug Reporting

- **Clear reproduction** - Anyone should be able to reproduce
- **Good screenshots** - Annotate if needed
- **Proper severity** - Be realistic about impact
- **Track status** - Update as bugs are fixed

### Performance

- **Measure objectively** - Use tools when possible
- **Test on real devices** - Simulators aren't accurate
- **Test with real data** - Use production-like datasets
- **Test user flows** - Not just individual screens

## Related Agents

- **frontend-engineer** - Fixes UI issues found
- **backend-engineer** - Fixes API issues found
- **code-quality-enforcer** - Ensures fixes meet standards
- **task-doc-tracker** - Documents testing outcomes

## Quick Reference Links

- [Mobile Testing Guide](../qa/mobile-testing-guide.md)
- [Mobile Accessibility Pattern](../../docs/architecture/patterns/mobile-accessibility.md)
- [Screenshot Capture Playbook](../qa/screenshot-capture-playbook.md)
- [Test Plans Directory](../qa/test-plans/)
- [Test Scenarios Directory](../qa/test-scenarios/)
- [Test Results Directory](../qa/test-results/)

## Success Criteria

This agent's testing is complete when:

- ✅ All test scenarios executed
- ✅ All critical paths work correctly
- ✅ All bugs documented with reproduction steps
- ✅ Accessibility standards verified
- ✅ Performance targets met
- ✅ Test results documented
- ✅ Feature approved for release (or bugs assigned for fixing)
