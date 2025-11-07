# Mobile-MCP Testing Pattern

Guidelines for implementing UI components compatible with automated testing using mobile-mcp tools.

## The Problem

Mobile automation tools struggle with coordinate precision when clicking React Native elements, causing ~50% failure rate.

## The Solution

Add three accessibility properties to all interactive elements:

```tsx
// ✅ GOOD - Fully accessible for automated testing
<Button
  accessibilityLabel="Bắt đầu làm việc"  // Semantic label in Vietnamese
  accessibilityHint="Điều hướng đến màn hình check-in"  // What happens
  testID="task-action-check-in-button"  // Reliable identifier
  onPress={handleCheckIn}
>
  <Text>Check-In</Text>
</Button>

// ❌ BAD - Missing accessibility props causes test failures
<Button onPress={handleCheckIn}>
  <Text>Check-In</Text>
</Button>
```

## testID Naming Convention

Format: `{screen}-{component}-{action}`

### Examples

- `sign-in-username-input`
- `task-list-item-{taskId}`
- `task-details-open-map-button`
- `check-in-camera-button`

## Benefits

- ✅ 95%+ click success rate (up from ~50%)
- ✅ Better screen reader support for accessibility
- ✅ Reliable element targeting in tests
- ✅ Works with Expo Go (no build required)

## Testing Documentation

For comprehensive guides, see:
- `apps/mobile/MOBILE-MCP-TESTING.md` - Complete testing guide
- `apps/mobile/QUICK-TEST-REFERENCE.md` - Quick reference

## Implementation Reference

See implementation details: `.claude/tasks/20251028-mobile-mcp-accessibility-optimization.md`

---

## App Store Screenshot Capture Workflow

### Overview

MobileMCP tools enable systematic, high-quality screenshot capture for app store submissions. This workflow ensures professional, consistent screenshots with realistic data.

### Complete Playbook

See `.claude/qa/screenshot-capture-playbook.md` for the complete step-by-step guide (28 screenshots).

### Quick Workflow Summary

**Phase 1: Database Preparation**
```bash
cd apps/api
npx tsx scripts/clean-task-data.ts --dry-run  # Review first
npx tsx scripts/clean-task-data.ts --confirm   # Execute
```

**Phase 2: Accessibility Verification**

All interactive elements must have:
- ✅ `accessibilityLabel` - Vietnamese label
- ✅ `accessibilityHint` - What happens when activated
- ✅ `accessibilityRole` - Element type
- ✅ `testID` - Follows naming convention `{screen}-{action}-{type}`

**Phase 3: Screenshot Capture**

Recommended device: iPhone 15 Pro Simulator (393 x 852 px)

Standard workflow:
1. Navigate to screen
2. Wait for render (1-2 seconds)
3. Capture screenshot
4. Verify quality immediately

### Screenshot Categories (28 Total)

1. Authentication & Settings (3)
2. Admin Workflow (10)
3. Worker Workflow (10)
4. Employee Management (2)
5. Reports & Analytics (3)

### Quality Standards

- Native device resolution
- Vietnamese language throughout
- Realistic, professional data
- No test/dummy data markers
- File size 100-500KB (PNG)

### Related Documentation

- **Complete Playbook**: `.claude/qa/screenshot-capture-playbook.md`
- **Task Documentation**: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`
- **Database Cleanup**: `.claude/tasks/20251106-180000-create-clean-task-data-script.md`
