# Tabs Navigation Pattern

## Overview

This document describes the pattern for implementing tab navigation with Expo Router, including the critical migration from unstable NativeTabs to stable Tabs component, and best practices for avoiding UI responsiveness issues.

## ⚠️ Critical Update (2025-10-30)

**NativeTabs (unstable-native-tabs) has been deprecated in this project due to stability issues.** We've migrated to the stable Tabs component from expo-router. See migration details below.

## Current Implementation: Stable Tabs

### Why We Migrated

1. **NativeTabs Instability**: The `unstable-native-tabs` package had persistent UI responsiveness issues
2. **Production Reliability**: Stable Tabs are battle-tested and production-ready
3. **Consistent Behavior**: No race conditions or initialization issues
4. **Better UX**: Opportunity to add haptic feedback and improvements

### Current Pattern

```tsx
// ✅ CORRECT: Using stable Tabs with haptic feedback
import { Tabs } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { TabBarIcon } from '@/components/ui/TabBarIcon'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => {
          // Haptic feedback for better UX
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      {/* Additional tabs */}
    </Tabs>
  )
}
```

## Navigation Hierarchy

Proper structure for modules with tabs:

```
app/
├── _layout.tsx                  # Root Stack navigator
├── admin/
│   ├── _layout.tsx              # Module Stack (individual options)
│   ├── index.tsx                # Redirect with delay
│   └── (tabs)/
│       ├── _layout.tsx          # Tabs component (stable)
│       ├── index.tsx            # Dashboard tab
│       ├── users.tsx            # Users tab
│       └── settings.tsx         # Settings tab
└── worker/
    ├── _layout.tsx              # Module Stack (individual options)
    ├── index.tsx                # Redirect with delay
    └── (tabs)/
        ├── _layout.tsx          # Tabs component (stable)
        ├── index.tsx            # Dashboard tab
        └── settings.tsx         # Settings tab
```

## Critical: Avoiding Header Overlay Issues

### The Problem

Using `screenOptions` at the Stack level creates invisible header overlays that block touch events, making UI elements unresponsive.

### ✅ CORRECT: Individual Screen Options

```tsx
// app/admin/_layout.tsx or app/worker/_layout.tsx
export default function ModuleLayout() {
  return (
    <Stack>
      {/* Explicitly configure each route */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Child screens can have headers */}
      <Stack.Screen
        name="tasks/[taskId]/view"
        options={{
          headerShown: true,
          title: "Task Details",
          presentation: "modal"
        }}
      />
    </Stack>
  )
}
```

### ❌ WRONG: Stack-level screenOptions

```tsx
// THIS WILL CREATE BLOCKING OVERLAYS!
export default function ModuleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
    </Stack>
  )
}
```

## Module Index Pattern

Module index files must use delayed navigation to ensure tabs initialize properly.

### ✅ CORRECT: Delayed Navigation

```tsx
// app/worker/index.tsx or app/admin/index.tsx
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function WorkerIndex() {
  const router = useRouter()

  useEffect(() => {
    // Small delay lets navigation state stabilize
    const timer = setTimeout(() => {
      router.replace('/worker/(tabs)')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="small" />
    </View>
  )
}
```

### ❌ WRONG: Immediate Redirect

```tsx
// THIS CAN CAUSE NAVIGATION ISSUES!
import { Redirect } from 'expo-router'

export default function WorkerIndex() {
  return <Redirect href="/worker/(tabs)" />
}
```

## Enhancing UX with Haptic Feedback

Adding haptic feedback improves perceived responsiveness:

```tsx
import * as Haptics from 'expo-haptics'

// In your Tabs component
<Tabs
  screenListeners={{
    tabPress: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
  }}
>
  {/* Tab screens */}
</Tabs>
```

## Safe Area Handling

Ensure proper safe area padding in tab content:

```tsx
// Settings or profile screens
<ScrollView className="flex-1 bg-background pt-safe">
  {/* Content */}
</ScrollView>
```

## Migration from NativeTabs

If you have existing code using NativeTabs:

### 1. Update Imports

```diff
- import { Tabs as NativeTabs } from 'expo-router/tabs'
+ import { Tabs } from 'expo-router'
```

### 2. Replace Component

```diff
- <NativeTabs>
+ <Tabs>
    {/* Your tab screens */}
- </NativeTabs>
+ </Tabs>
```

### 3. Add Enhancements

```tsx
// Add haptic feedback
import * as Haptics from 'expo-haptics'

<Tabs
  screenListeners={{
    tabPress: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
  }}
>
```

### 4. Fix Module Layouts

Ensure all parent Stack navigators use individual Screen options, not screenOptions.

## Testing Checklist

After implementing or modifying tab navigation:

1. ✅ All tabs are clickable and responsive on first load
2. ✅ Tab switching works smoothly with haptic feedback
3. ✅ No unresponsive UI states in any module
4. ✅ Child screens display headers correctly
5. ✅ Modal presentations work as expected
6. ✅ Safe areas are properly respected
7. ✅ Test on both iOS and Android
8. ✅ Test with different color schemes (light/dark mode)

## Common Pitfalls

1. **Using unstable NativeTabs** - Always use stable Tabs from expo-router
2. **Using screenOptions with tabs** - Always use individual Screen options
3. **Using immediate Redirect to tabs** - Use delayed router.replace
4. **Forgetting haptic feedback** - Enhances UX significantly
5. **Missing safe area padding** - Causes content to overlap with system UI
6. **Not testing all modules** - Each module can behave differently

## Performance Considerations

- **Stable Tabs** have minimal performance overhead
- **Haptic feedback** is lightweight and doesn't impact performance
- **Lazy loading** of tab content is handled automatically by Expo Router
- **Memory usage** is optimized with proper unmounting of inactive tabs

## Accessibility

Ensure tabs are accessible:

```tsx
<Tabs.Screen
  name="index"
  options={{
    title: 'Dashboard',
    tabBarAccessibilityLabel: 'Dashboard Tab',
    tabBarIcon: ({ color, focused }) => (
      <TabBarIcon
        name={focused ? 'home' : 'home-outline'}
        color={color}
        accessibilityLabel="Dashboard Icon"
      />
    ),
  }}
/>
```

## Related Patterns

- [Route Organization](./route-organization.md) - API route structure
- [Auth Middleware](./auth-middleware.md) - Authentication patterns
- [Error Handling](./error-handling.md) - Error management

## References

- Migration Task: `.claude/tasks/20251030-041902-migrate-nativetabs-to-stable-tabs.md`
- Original Issue: `.claude/tasks/20251030-025700-fix-worker-unresponsive-ui.md`
- Expo Router Tabs: [Official Documentation](https://docs.expo.dev/router/advanced/tabs/)
- Expo Haptics: [API Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/)

## History

- **2025-10-30**: Migrated from NativeTabs to stable Tabs due to stability issues
- **2025-10-30**: Added haptic feedback to improve UX
- **2025-10-30**: Documented header overlay issues and solutions
- **Initial**: Used NativeTabs (unstable-native-tabs) from Expo SDK 54