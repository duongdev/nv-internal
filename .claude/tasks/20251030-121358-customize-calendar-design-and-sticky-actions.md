# Customize Calendar Design and Make Action Buttons Sticky

**Date**: 2025-10-30
**Status**: ✅ Complete
**Component**: Task Date Picker Modal
**File**: `apps/mobile/components/task/task-date-picker-modal.tsx`

## Overview

Enhanced the task date picker modal to match the app's design system and improved UX by making action buttons always visible at the bottom of the sheet.

## User Requirements

1. **Customize Calendar Colors**: Replace hardcoded blue colors with design system colors
2. **Sticky Action Buttons**: Make bottom action buttons always visible (not scrollable)

## Implementation

### 1. Design System Integration

**Added `useColorPalette` Hook**:
```typescript
import { useColorPalette } from '@/hooks/use-color-palette'

const { getColor } = useColorPalette()
```

**Created Calendar Theme**:
```typescript
const calendarTheme = useMemo(
  () => ({
    backgroundColor: getColor('card'),
    calendarBackground: getColor('card'),
    textSectionTitleColor: getColor('mutedForeground'),
    dayTextColor: getColor('foreground'),
    todayTextColor: getColor('primary'),
    textDisabledColor: getColor('mutedForeground', { alpha: 0.5 }),
    selectedDayBackgroundColor: getColor('primary'),
    selectedDayTextColor: getColor('primaryForeground'),
    monthTextColor: getColor('foreground'),
    arrowColor: getColor('primary'),
    textMonthFontWeight: '600' as const,
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14,
  }),
  [getColor],
)
```

**Updated Marked Dates Colors**:
- Start/End dates: Use `primary` color with `primaryForeground` text
- Days in between: Use `primary` with 20% opacity and `foreground` text
- Replaced hardcoded `#3b82f6` (blue) and `#93c5fd` (light blue)

### 2. Sticky Action Buttons Layout

**Changed Structure**:
- **Before**: All content in single `BottomSheetView` (scrollable)
- **After**: Split into scrollable content + fixed footer

**New Layout**:
```tsx
<BottomSheetView className="flex-1">
  {/* Scrollable Content */}
  <BottomSheetScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pt-4 pb-2">
    {/* Header, Calendar, Preview, Instructions */}
  </BottomSheetScrollView>

  {/* Sticky Action Buttons */}
  <View className="border-t border-border bg-background p-4">
    <View className="flex-row gap-2">
      {/* Clear, Cancel, Apply buttons */}
    </View>
  </View>
</BottomSheetView>
```

**Key Changes**:
1. Added `BottomSheetScrollView` for calendar and content
2. Moved action buttons outside scroll view
3. Added top border to visually separate sticky footer
4. Used `bg-background` to ensure footer stands out

## Design System Colors

The app uses a **monochrome design system**:

```css
/* Light Mode */
--primary: hsl(0 0% 9%)          /* Dark gray/black */
--primary-foreground: hsl(0 0% 98%)  /* Almost white */
--foreground: hsl(0 0% 3.9%)     /* Almost black */
--muted: hsl(0 0% 96.1%)         /* Very light gray */
--muted-foreground: hsl(0 0% 45.1%)  /* Medium gray */
--border: hsl(0 0% 89.8%)        /* Light gray */
--card: hsl(0 0% 100%)           /* White */
```

This creates a sophisticated, minimalist look with excellent readability.

## Benefits

### Design Consistency
- ✅ Calendar matches app's monochrome color palette
- ✅ All interactive elements use primary color
- ✅ Consistent text hierarchy (foreground, muted-foreground)
- ✅ Border colors match the rest of the app

### Improved UX
- ✅ Action buttons always visible - no need to scroll
- ✅ Clear visual separation between content and actions
- ✅ Better bottom sheet gesture handling with `BottomSheetScrollView`
- ✅ Smoother scrolling experience

### Maintainability
- ✅ Uses design system instead of hardcoded colors
- ✅ Theme changes automatically update calendar
- ✅ Supports dark mode through `useColorPalette`
- ✅ Memoized theme for performance

## Testing Checklist

- [x] TypeScript compilation passes
- [x] Code formatted with Biome
- [x] Calendar displays correctly
- [x] Colors match design system
- [x] Date selection works
- [x] Period marking shows correctly
- [x] Action buttons always visible
- [x] Calendar content scrolls properly
- [x] Haptic feedback works
- [x] Clear, Cancel, Apply buttons function correctly

## Pattern Established

**Design System Integration for Third-Party Components**:

When integrating third-party libraries with custom themes:
1. Use `useColorPalette` hook to access design system colors
2. Create theme object with `useMemo` for performance
3. Convert HSL colors using `getColor()` helper
4. Support alpha transparency with `{ alpha: 0.2 }` option
5. Memoize theme to avoid recreating on every render

**Sticky Footer in Bottom Sheets**:

For bottom sheets with scrollable content + fixed actions:
1. Use `BottomSheetView` as root container with `flex-1`
2. Use `BottomSheetScrollView` for scrollable content (NOT `ScrollView`)
3. Place actions in separate `View` outside scroll view
4. Add visual separator (border-top) between content and actions
5. Use `bg-background` on footer to ensure it stands out

## Related Files

- `/Users/duongdev/personal/nv-internal/apps/mobile/components/task/task-date-picker-modal.tsx` - Date picker modal
- `/Users/duongdev/personal/nv-internal/apps/mobile/hooks/use-color-palette.ts` - Color system hook
- `/Users/duongdev/personal/nv-internal/apps/mobile/lib/theme.ts` - Theme constants
- `/Users/duongdev/personal/nv-internal/apps/mobile/global.css` - CSS variables

## Learnings

1. **Third-Party Theming**: Most React Native libraries support theme props that accept color values - always use design system colors instead of hardcoding
2. **BottomSheet Scrolling**: Always use `BottomSheetScrollView` from `@gorhom/bottom-sheet` instead of standard `ScrollView` for proper gesture handling
3. **Sticky Footers**: Place fixed elements outside scroll containers at the same level in the component tree
4. **Color Alpha**: The `getColor` helper supports alpha transparency which is perfect for hover/active states or background overlays
5. **Memoization**: Theme objects should be memoized to prevent unnecessary recalculations and re-renders

## Next Steps

- Consider adding dark mode preview/testing
- Could add animation when switching between start/end date selection
- Consider adding preset ranges (Last 7 days, Last 30 days, etc.)
