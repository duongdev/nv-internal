# Expo Native Tabs Implementation - Lessons Learned

## Overview

Complete migration of both worker and admin tabs to Expo Router Native Tabs (SDK 54) with iOS 26 Liquid Glass support. This document captures all issues encountered and their solutions.

## Implementation Date

October 23, 2025 (UTC)

## Issues Encountered & Solutions

### 1. Dark Mode Background Rendering Conflict

**Issue**: Native tabs showed layered/inconsistent background appearance in dark mode

**Root Cause**:
- Set solid `backgroundColor` for all platforms
- Also enabled iOS `blurEffect`
- Blur effects are translucent and conflict with solid backgrounds

**Solution**:
```tsx
// ❌ BAD - Conflicting configuration
<NativeTabs
  backgroundColor={isDark ? '#000000' : '#ffffff'}  // Solid background
  blurEffect={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}  // Translucent blur
>

// ✅ GOOD - Platform-specific configuration
<NativeTabs
  {...(Platform.OS === 'ios' && {
    blurEffect: isDark ? 'systemMaterialDark' : 'systemMaterialLight',  // No backgroundColor
  })}
  {...(Platform.OS === 'android' && {
    backgroundColor: isDark ? '#000000' : '#ffffff',  // Only for Android
  })}
>
```

**Lesson**: iOS blur effects should never have solid backgrounds. Use platform-specific props.

---

### 2. Missing Screen Backgrounds

**Issue**: Screens had no explicit background color, allowing translucent tabs to show through incorrectly

**Solution**: Add `bg-background` to all screen root views
```tsx
// ✅ All screens need explicit backgrounds
<View className="flex-1 bg-background pt-safe">
<ScrollView className="flex-1 bg-background">
```

**Lesson**: With native tabs' translucent effects, all screens must have explicit backgrounds.

---

### 3. Content Cut Off by Tab Bar

**Issue**: Last item in lists was hidden behind native tab bar

**Root Cause**:
- Native tabs render **on top** of content (not pushing content up)
- `pb-safe` only accounts for safe area insets (home indicator)
- Doesn't account for tab bar height (~50-60px)

**Solution**: Use `pb-24` (96px) instead of `pb-safe`
```tsx
// ❌ BAD - Not enough padding
contentContainerClassName="gap-2 px-4 pb-safe"

// ✅ GOOD - Accounts for tab bar + safe area
contentContainerClassName="gap-2 px-4 pb-24"
```

**Lesson**: Native tab bar height requires explicit bottom padding (~96px recommended).

---

### 4. Settings Screen Scroll Boundary Bug

**Issue**: Settings screen could scroll beyond top, showing white space at bottom

**Root Cause**: `flex-1` on ScrollView's `contentContainerClassName`

**Solution**:
```tsx
// ❌ BAD - flex-1 on content container
<ScrollView contentContainerClassName="mt-4 flex-1">

// ✅ GOOD - flex-1 on ScrollView, padding on content
<ScrollView
  className="flex-1 bg-background"
  contentContainerClassName="px-4 pt-4 pb-24"
  bounces={false}
>
```

**Lesson**:
- `flex-1` goes on ScrollView itself
- `contentContainerClassName` should only have padding/margins
- Use `bounces={false}` to prevent over-scrolling

---

### 5. Missing Headers with Native Tabs

**Issue**: Stack.Screen header options in screen files weren't showing

**Root Cause**: Native tabs don't support mock stack headers like JavaScript tabs

**Solution**: Nest Stack layouts inside tabs
```
admin/(tabs)/
├── _layout.tsx          ← NativeTabs
├── users/
│   ├── _layout.tsx      ← Stack layout (NEW)
│   └── index.tsx        ← Screen with Stack.Screen options
└── tasks/
    ├── _layout.tsx      ← Stack layout (NEW)
    └── index.tsx        ← Screen with Stack.Screen options
```

**Files Created**:
- `admin/(tabs)/users/_layout.tsx` - `<Stack />`
- `admin/(tabs)/tasks/_layout.tsx` - `<Stack />`

**Lesson**: Headers require nested Stack layouts. Must restructure routes as directories with `_layout.tsx`.

---

### 6. Duplicate Screen Error After Restructuring

**Issue**: `Error: A navigator cannot contain multiple 'Screen' components with the same name`

**Root Cause**: Metro bundler cached old file structure

**Solution**: Clear Expo cache
```bash
rm -rf .expo node_modules/.cache
```

**Lesson**: After file restructuring, always clear cache before debugging.

---

### 7. Truncated Tab Labels on First Load

**Issue**: Admin tab labels showed truncated ("Tra...", "Nhân...", "Công...")

**Root Causes**:
- 4 tabs need more space than 2 tabs
- System font scaling affects initial layout calculations

**Solutions Applied**:
1. Reduced font size: `fontSize: 11` (was 12) for admin tabs
2. Disabled font scaling: `allowFontScaling: false`

```tsx
labelStyle={{
  fontFamily: FONT_FAMILY.medium,
  fontSize: 11,  // Smaller for 4 tabs
  allowFontScaling: false,  // Prevents system scaling issues
}}
```

**Lesson**:
- More tabs require smaller font sizes
- Disable font scaling for consistent layout calculations
- Worker (2 tabs) keeps 12px, Admin (4 tabs) uses 11px

---

### 8. iOS 26 Headers Looking "Ugly"

**Issue**: Headers didn't match modern iOS 26 Liquid Glass design

**Attempted Solutions** (didn't work well):
- `headerTransparent: true` → Content overlapped header
- `headerLargeTitleShadowVisible: false` → Removed shadow but not enough

**Final Solution**: Simplified header config
```tsx
// ✅ Clean, modern configuration
<Stack.Screen
  options={{
    title: 'Nhân viên',
    headerBlurEffect: 'systemMaterial',  // Auto-becomes Liquid Glass on iOS 26
    headerSearchBarOptions: {
      placeholder: 'Search',
      onChangeText: ({ nativeEvent }) => setSearchText(nativeEvent.text),
    },
  }}
/>
```

**Lesson**:
- Less is more - don't over-configure headers
- `headerBlurEffect: 'systemMaterial'` auto-adapts to iOS 26
- Native search bar in header works great
- Avoid `headerTransparent` unless you handle content insets

---

### 9. User List Scrolling "Feels Off"

**Issue**: FlatList scrolling behavior felt janky and unnatural

**Root Cause**: `flex-1` in `contentContainerClassName`

**Solution**:
```tsx
// ❌ BAD - flex-1 on content container
<AdminUserList
  contentContainerClassName="flex-1 px-4 pb-24"
/>

// ✅ GOOD - Only padding
<AdminUserList
  contentContainerClassName="px-4 pb-24"
/>
```

**Lesson**: Same as ScrollView - **never** use `flex-1` on FlatList content containers.

---

## Best Practices Established

### Native Tabs Configuration

```tsx
<NativeTabs
  iconColor={{
    default: isDark ? '#9ca3af' : '#6b7280',
    selected: primaryColor,
  }}
  labelStyle={{
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,  // Adjust based on number of tabs
    allowFontScaling: false,
  }}
  {...(Platform.OS === 'ios' && {
    blurEffect: isDark ? 'systemMaterialDark' : 'systemMaterialLight',
  })}
  {...(Platform.OS === 'android' && {
    backgroundColor: isDark ? '#000000' : '#ffffff',
    labelVisibilityMode: 'labeled',
  })}
>
```

### Screen Structure with Headers

```
tab-name/
├── _layout.tsx          # Stack layout
└── index.tsx            # Screen with Stack.Screen options
```

### Content Padding for Native Tabs

- **Bottom padding**: `pb-24` (96px) for tab bar clearance
- **Background**: Always add `bg-background` to screen root
- **ScrollView**: `bounces={false}` to prevent over-scrolling
- **Content container**: **Never** use `flex-1`

### Icon Requirements

- Use `@expo/vector-icons` families (e.g., MaterialCommunityIcons)
- Lucide icons don't work with `VectorIcon` (missing `getImageSource` method)

---

## Files Modified Summary

### Worker Tabs
- `apps/mobile/app/worker/(tabs)/_layout.tsx` - Native tabs implementation
- `apps/mobile/app/worker/(tabs)/index.tsx` - Background & padding fixes
- `apps/mobile/app/worker/(tabs)/settings.tsx` - Background & padding fixes

### Admin Tabs
- `apps/mobile/app/admin/(tabs)/_layout.tsx` - Native tabs implementation
- `apps/mobile/app/admin/(tabs)/index.tsx` - Background
- `apps/mobile/app/admin/(tabs)/settings.tsx` - Background & padding
- `apps/mobile/app/admin/(tabs)/users/_layout.tsx` - **NEW** Stack layout
- `apps/mobile/app/admin/(tabs)/users/index.tsx` - Moved from `users.tsx`, header config
- `apps/mobile/app/admin/(tabs)/tasks/_layout.tsx` - **NEW** Stack layout
- `apps/mobile/app/admin/(tabs)/tasks/index.tsx` - Moved from `tasks.tsx`, header config

### Shared Components
- `apps/mobile/components/user-settings/user-settings-screen.tsx` - Removed padding (handled by parent)

---

## Key Takeaways

1. **Platform-Specific Props**: iOS and Android need different configurations for native feel
2. **Blur + Solid Don't Mix**: Never combine iOS blur effects with solid backgrounds
3. **Cache Issues**: File restructuring requires cache clearing
4. **Content Container Sizing**: Never use `flex-1` on content containers
5. **Tab Bar Overlay**: Native tabs overlay content, need explicit bottom padding
6. **Headers Need Nesting**: Native tabs require nested Stack layouts for headers
7. **Icon Libraries**: Only `@expo/vector-icons` works with VectorIcon component
8. **Font Scaling**: Disable for UI elements needing consistent sizing
9. **Simplicity Wins**: Over-configured headers look worse than simple configs

---

## Related Documentation

- `.claude/tasks/20251023-102747-implement-native-tabs-for-worker.md`
- `.claude/tasks/20251023-102958-fix-settings-scroll-boundary-bug.md`
- `.claude/tasks/20251023-103806-fix-native-tabs-dark-mode-issues.md`

---

## iOS 26 Liquid Glass Resources

- iOS 26 introduces "Liquid Glass" design language (Apple's first major redesign since iOS 7)
- Expo SDK 54+ supports Liquid Glass automatically with native tabs
- `headerBlurEffect: 'systemMaterial'` auto-adapts to Liquid Glass on iOS 26
- Translucent, dynamic materials that reflect surroundings
- Tab bars dynamically shrink/expand when scrolling

---

## Testing Checklist for Future Native Tabs

- [ ] Dark mode renders correctly without layering
- [ ] Can scroll to last item in lists (not hidden by tab bar)
- [ ] Section headers have backgrounds (for sticky headers)
- [ ] Settings screens don't over-scroll
- [ ] Headers show correctly with nested Stack
- [ ] Tab labels aren't truncated on first load
- [ ] FlatList/ScrollView scrolling feels natural
- [ ] Content doesn't overlap headers
- [ ] Safe area insets respected
- [ ] Works on both iOS and Android

---

## Performance Notes

- Native tabs use platform-native rendering (better performance than JS tabs)
- Liquid Glass effects are GPU-accelerated
- Lazy logger instantiation recommended (don't create loggers until needed)
