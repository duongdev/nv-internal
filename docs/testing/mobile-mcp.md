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
