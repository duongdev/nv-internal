# Fix Critical Date Picker Issues

**Date**: 2025-10-30
**Status**: ✅ Completed
**Related Files**:
- `apps/mobile/components/task/task-date-picker-modal.tsx`

## Problem

Three critical usability issues in the custom date range picker modal:

### 1. Actions Not Sticky (Critical)
**Symptom**: Action buttons (Xóa, Hủy, Áp dụng) were scrolling out of view when scrolling through calendar months.

**Root Cause**:
- Used `BottomSheetView className="flex-1"` as parent container
- This made the entire container scrollable including the footer
- Footer was correctly outside ScrollView but parent flex-1 made it scroll anyway

**Impact**: Users couldn't access buttons after scrolling → blocking UX issue

### 2. Sheet Height Issues
**Symptom**: Bottom sheet losing proper height, bottom buttons hidden below screen edge.

**Root Cause**: Dynamic sizing not working correctly with flex-1 container.

### 3. Date Text Invisible (Critical)
**Symptom**: Selected range dates (middle days) showed black text on semi-transparent black background → completely invisible.

**Root Cause**:
```typescript
// WRONG - 20% alpha of black is still dark
const primaryAlpha = getColor('primary', { alpha: 0.2 })
marked[dateString] = {
  color: primaryAlpha,      // Dark semi-transparent
  textColor: foregroundColor // Black text → INVISIBLE!
}
```

**Impact**: Users couldn't see which dates were in their selected range.

## Solution

### 1. Fixed Container Structure

**Before**:
```tsx
<BottomSheet enableDynamicSizing maxDynamicContentSize={700}>
  <BottomSheetView className="flex-1"> {/* ❌ Makes everything scroll */}
    <BottomSheetScrollView className="flex-1">
      {/* Content */}
    </BottomSheetScrollView>
    <View className="border-t p-4">
      {/* Footer - scrolls away! */}
    </View>
  </BottomSheetView>
</BottomSheet>
```

**After**:
```tsx
<BottomSheet enableDynamicSizing maxDynamicContentSize={700}>
  <View style={{ height: 650 }}> {/* ✅ Fixed height container */}
    <BottomSheetScrollView style={{ flex: 1 }}>
      {/* Content - takes remaining space */}
    </BottomSheetScrollView>
    <View className="border-t p-4">
      {/* Footer - FIXED at bottom! */}
    </View>
  </View>
</BottomSheet>
```

**Key Changes**:
1. Replaced `BottomSheetView className="flex-1"` with `View style={{ height: 650 }}`
2. Fixed height prevents entire container from scrolling
3. ScrollView gets `flex: 1` to take remaining space
4. Footer stays fixed at bottom as sibling to ScrollView

### 2. Fixed Text Visibility

**Before**:
```typescript
const primaryAlpha = getColor('primary', { alpha: 0.2 }) // Dark semi-transparent
marked[dateString] = {
  color: primaryAlpha,          // ❌ Dark background
  textColor: foregroundColor    // ❌ Dark text → invisible
}
```

**After**:
```typescript
const mutedColor = getColor('muted')           // ✅ Light gray
const foregroundColor = getColor('foreground') // ✅ Dark text
marked[dateString] = {
  color: mutedColor,      // ✅ Light background
  textColor: foregroundColor // ✅ Dark text → VISIBLE!
}
```

**Color Strategy**:
- **Start/End dates**: `primary` background (dark) + `primaryForeground` text (white) → High contrast
- **Range dates**: `muted` background (light gray) + `foreground` text (dark) → High contrast
- Ensures all dates are readable in both light and dark modes

### 3. Fixed Height Configuration

- Set container to fixed `height: 650` pixels
- This ensures bottom sheet shows full content including footer
- `enableDynamicSizing` with `maxDynamicContentSize={700}` provides safety limit
- ScrollView takes `flex: 1` to fill available space minus footer

## Implementation Details

### Container Structure Pattern

```tsx
{/* Layer 1: Bottom Sheet with dynamic sizing */}
<BottomSheet enableDynamicSizing maxDynamicContentSize={700}>

  {/* Layer 2: Fixed height container */}
  <View style={{ height: 650 }}>

    {/* Layer 3: Scrollable content area */}
    <BottomSheetScrollView style={{ flex: 1 }}>
      <Header />
      <Calendar />
      <Preview />
      <Instructions />
    </BottomSheetScrollView>

    {/* Layer 4: Fixed footer (sibling, not child) */}
    <View className="border-t p-4">
      <Actions />
    </View>

  </View>
</BottomSheet>
```

**Critical Rules**:
1. ✅ Footer must be **sibling** to ScrollView, not child
2. ✅ Container must use **fixed height** (inline style), not flex-1
3. ✅ ScrollView gets **flex: 1** to take remaining space
4. ❌ Never use `className="flex-1"` on container
5. ❌ Never put footer inside ScrollView

### Date Marking Pattern

```typescript
// Colors optimized for contrast
const primaryColor = getColor('primary')          // Dark
const primaryForeground = getColor('primaryForeground') // White
const mutedColor = getColor('muted')             // Light gray
const foregroundColor = getColor('foreground')   // Dark

// Start/End: Dark background + White text
marked[startDate] = {
  startingDay: true,
  color: primaryColor,
  textColor: primaryForeground,
}

// Range: Light background + Dark text
marked[middleDate] = {
  color: mutedColor,
  textColor: foregroundColor,
}
```

## Testing Results

✅ **Sticky Actions**: Buttons always visible, don't scroll out of view
✅ **Sheet Height**: Full content visible including footer
✅ **Text Visibility**: All dates readable with proper contrast
✅ **Scrolling**: Calendar scrolls smoothly when needed
✅ **TypeScript**: Compilation clean
✅ **Linting**: Biome checks pass

## Learnings

### Bottom Sheet Layout Patterns

**Anti-pattern - Everything Scrolls**:
```tsx
<BottomSheetView className="flex-1">
  <BottomSheetScrollView>...</BottomSheetScrollView>
  <View>Footer</View> {/* Scrolls away! */}
</BottomSheetView>
```

**Correct Pattern - Fixed Footer**:
```tsx
<View style={{ height: 650 }}>
  <BottomSheetScrollView style={{ flex: 1 }}>...</BottomSheetScrollView>
  <View>Footer</View> {/* Stays fixed! */}
</View>
```

**Why It Works**:
- Fixed height on container prevents it from being scrollable
- ScrollView with flex-1 takes remaining space
- Footer naturally stays at bottom as fixed element
- No need for absolute positioning or complex calculations

### Color Contrast for Range Selection

**Problem**: Using alpha/transparency on primary color creates visibility issues
```typescript
getColor('primary', { alpha: 0.2 }) // ❌ Dark + semi-transparent = still dark
```

**Solution**: Use purpose-built muted color
```typescript
getColor('muted') // ✅ Designed for light backgrounds
```

**Design System Usage**:
- `primary` / `primaryForeground`: High-contrast pairs for emphasis
- `muted` / `foreground`: High-contrast pairs for secondary elements
- Don't create custom alpha combinations - use existing color pairs

### Inline Styles vs. className

**When to use inline style**:
- ✅ Fixed numeric values: `style={{ height: 650 }}`
- ✅ When Tailwind doesn't support the pattern
- ✅ Dynamic calculations based on device dimensions

**When to use className**:
- ✅ Design system colors, spacing, typography
- ✅ Responsive utilities and breakpoints
- ✅ State-based styling (hover, active, etc.)

**This fix used inline style** because:
- Need precise height control
- Tailwind `flex-1` was causing the issue
- Fixed pixel value ensures consistent layout

## Related Patterns

- [Bottom Sheet List Integration](../../docs/architecture/patterns/bottom-sheet-list.md) - Gesture handling
- [Tabs Navigation](../../docs/architecture/patterns/tabs-navigation.md) - Layout pitfalls
- [Vietnamese Search](../../docs/architecture/patterns/vietnamese-search.md) - UI component patterns

## Impact

- **UX**: Critical blocking issues resolved → fully usable date picker
- **Accessibility**: All dates now visible and readable
- **Performance**: No impact, same rendering performance
- **Maintainability**: Clear, documented pattern for bottom sheet footers
