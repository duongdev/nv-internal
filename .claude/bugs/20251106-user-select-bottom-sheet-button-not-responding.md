# Bug Report: Bottom Sheet Button Not Responding to Touch

**Date**: 2025-11-06
**Reporter**: Claude (during screenshot capture workflow)
**Severity**: CRITICAL - Blocks user interaction
**Status**: 🔴 OPEN

## Summary

The "Lưu" (Save) button in `UserSelectBottomSheetModal` component is not responding to touch events, making it impossible to confirm assignee selection in the mobile app.

## Environment

- **Device**: iPhone 17 Pro (Simulator)
- **Component**: `apps/mobile/components/user-select-bottom-sheet-modal.tsx`
- **Scenario**: Assigning workers to a task from task details screen

## Steps to Reproduce

1. Open task details screen for any task
2. Tap "Phân công" button to open assignee selection sheet
3. Bottom sheet opens successfully showing user list
4. Scroll through user list (works fine)
5. Try to tap "Lưu" button at the bottom
6. **RESULT**: Button does not respond to touch events

## Expected Behavior

- Button should respond to touch/press events
- Sheet should close and save selected assignees
- Task details screen should update with new assignees

## Actual Behavior

- Button is visible but completely unresponsive
- Multiple tap attempts (single tap, double tap, different coordinates) all fail
- Sheet remains open and cannot be dismissed via button
- Only backdrop tap works to close sheet (but doesn't save changes)

## Technical Analysis

### Component Structure

The button is implemented in `ListFooterComponent` of `BottomSheetFlatList`:

```tsx
<BottomSheetFlatList
  contentContainerStyle={{ paddingBottom: 16 }}
  data={users}
  ListFooterComponent={
    (onCancel || onSave) && (
      <View className="flex-row gap-2 pt-4 pb-6">
        {onSave && (
          <Button
            accessibilityHint={`Lưu ${selectedUserIds.length} nhân viên đã chọn`}
            accessibilityLabel="Xác nhận phân công"
            accessibilityRole="button"
            className="flex-1"
            onPress={onSave}
            testID="assignee-confirm-button"
          >
            <Text>Lưu</Text>
          </Button>
        )}
      </View>
    )
  }
  // ... rest of props
/>
```

### Accessibility Properties

✅ Button HAS all required accessibility properties:
- `testID="assignee-confirm-button"`
- `accessibilityLabel="Xác nhận phân công"`
- `accessibilityHint="Lưu X nhân viên đã chọn"`
- `accessibilityRole="button"`

### MobileMCP Detection

❌ MobileMCP's `list_elements_on_screen` does NOT detect the button:
- Only detects: `assignee-search-input` (TextField)
- Button is not in the accessibility tree despite having proper properties

### Touch Event Testing

All attempts failed:
- Single tap at (201, 796) ❌
- Single tap at (335, 796) ❌
- Single tap at (335, 822) ❌
- Double tap at (201, 796) ❌

## Root Cause Hypothesis

### Possible Causes

1. **Touch Event Propagation Issue**
   - `BottomSheetFlatList` may be intercepting touch events
   - Footer component might be outside the gesture-enabled area
   - Possible z-index or pointer-events issue

2. **Bottom Sheet Gesture Handler Conflict**
   - @gorhom/bottom-sheet uses gesture handlers
   - Button gestures may be blocked by sheet's pan gesture
   - Need to use `BottomSheetView` or proper gesture handling

3. **ListFooterComponent Rendering Issue**
   - Footer might not be properly rendered in the gesture-enabled area
   - Possible need to use `waitFor` or gesture boundary

4. **Button Component Implementation**
   - Custom Button component may have gesture issues within bottom sheet
   - Might need to use TouchableOpacity or Pressable directly

## Recommended Solutions

### Solution 1: Move Buttons Outside FlatList (PREFERRED)

Instead of `ListFooterComponent`, render buttons outside the FlatList:

```tsx
<BottomSheetView className="gap-2 px-4">
  <SearchBox {...props} />

  <BottomSheetFlatList
    data={users}
    renderItem={...}
    // NO ListFooterComponent
  />

  {/* Buttons outside FlatList */}
  {(onCancel || onSave) && (
    <View className="flex-row gap-2 pt-4 pb-6">
      {/* Cancel and Save buttons */}
    </View>
  )}
</BottomSheetView>
```

**Pros**:
- Cleaner gesture handling
- Buttons always visible
- No scroll required to access actions
- Better UX (fixed action bar)

**Cons**:
- Buttons don't scroll with content (actually a pro!)

### Solution 2: Use BottomSheetView for Footer

Wrap footer content in `BottomSheetView`:

```tsx
ListFooterComponent={
  (onCancel || onSave) && (
    <BottomSheetView>
      <View className="flex-row gap-2 pt-4 pb-6">
        {/* buttons */}
      </View>
    </BottomSheetView>
  )
}
```

### Solution 3: Use waitFor from RNGH

Wrap buttons with `waitFor` to enable gestures:

```tsx
import { TouchableOpacity } from 'react-native-gesture-handler'

ListFooterComponent={
  (onCancel || onSave) && (
    <TouchableOpacity>
      <View className="flex-row gap-2 pt-4 pb-6">
        {/* buttons */}
      </View>
    </TouchableOpacity>
  )
}
```

## Impact

**User Impact**: HIGH
- Users cannot complete assignee selection workflow
- Feature is completely broken
- No workaround available (backdrop closes without saving)

**Development Impact**: HIGH
- Blocks screenshot capture workflow
- Blocks App Store submission
- Blocks QA testing of assignee features

## Related Components

- `apps/mobile/components/user-select-bottom-sheet-modal.tsx`
- `apps/mobile/components/ui/button.tsx`
- `apps/mobile/components/ui/bottom-sheet.tsx`

## Testing Checklist

After fix:
- [ ] Button responds to single tap
- [ ] Button is detected by MobileMCP's list_elements_on_screen
- [ ] onSave callback is triggered
- [ ] Sheet closes after save
- [ ] Selected users are properly saved
- [ ] Haptic feedback works (if applicable)
- [ ] Works on both iOS and Android
- [ ] Accessibility labels are announced by screen readers

## Related Issues

- Mobile Accessibility Pattern: `docs/architecture/patterns/mobile-accessibility.md`
- Bottom Sheet implementation: Reference task filter bottom sheet for working pattern
- Previous accessibility fixes: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`

## Notes

This is a critical blocker for:
1. Screenshot capture workflow (Phase 1, Step 5)
2. App Store submission preparation
3. QA testing with MobileMCP
4. User acceptance testing

**Priority**: P0 - Fix immediately
