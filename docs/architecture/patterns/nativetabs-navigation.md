# NativeTabs Navigation Pattern

## Overview

This document describes the critical pattern for implementing NativeTabs navigation with Expo Router to avoid unresponsive UI issues caused by invisible header overlays.

## The Problem

When wrapping NativeTabs with a Stack navigator, using `screenOptions` at the Stack level creates invisible transparent header overlays that block touch events on the tab bar, making tabs unclickable.

## The Solution

Use explicit individual Screen options instead of Stack-level screenOptions when working with NativeTabs.

## Correct Pattern

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

## Why This Happens

1. **NativeTabs don't have built-in headers** - they're pure tab bar components
2. **React Native Screens behavior** - creates header container elements even when `headerShown: false`
3. **Touch event capture** - invisible overlays intercept touch events before they reach the tabs
4. **Stack-level configuration** - applies globally and can't be properly overridden for NativeTabs

## Navigation Hierarchy

Proper navigation structure for modules with tabs:

```
app/
├── _layout.tsx                  # Root Stack navigator
├── admin/
│   ├── _layout.tsx              # Module Stack (individual options)
│   ├── index.tsx                # Redirect or landing
│   └── (tabs)/
│       ├── _layout.tsx          # NativeTabs component
│       ├── index.tsx            # Tab content (with/without Stack.Screen)
│       ├── users.tsx            # Tab content
│       └── settings.tsx         # Tab content
└── worker/
    ├── _layout.tsx              # Module Stack (individual options)
    ├── index.tsx                # Redirect or landing
    └── (tabs)/
        ├── _layout.tsx          # NativeTabs component
        ├── index.tsx            # Tab content
        └── settings.tsx         # Tab content
```

## Tab Content Patterns

### Tab with Header

When tab content needs its own header:

```tsx
// app/admin/(tabs)/users.tsx
export default function UsersTab() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "User Management"
        }}
      />
      <View>
        {/* Tab content */}
      </View>
    </>
  )
}
```

### Tab without Header

When tab content doesn't need a header:

```tsx
// app/worker/(tabs)/settings.tsx
export default function SettingsTab() {
  return (
    <View>
      {/* Tab content directly */}
    </View>
  )
}
```

## RBAC Implementation

When adding RBAC guards, ensure they don't interfere with navigation:

```tsx
// app/admin/_layout.tsx
export default function AdminLayout() {
  const { userMetadata } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userMetadata?.role !== 'admin') {
      router.replace('/worker')
    }
  }, [userMetadata?.role])

  // Use individual options, not screenOptions!
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
```

## Testing Checklist

After implementing or modifying navigation:

1. ✅ All tabs are clickable and responsive
2. ✅ Tab switching works smoothly
3. ✅ Child screens display headers correctly
4. ✅ Modal presentations work as expected
5. ✅ No unwanted "(tabs)" headers appear
6. ✅ Touch events aren't blocked anywhere
7. ✅ Test on both iOS and Android

## Common Pitfalls

1. **Using screenOptions with NativeTabs** - Always use individual Screen options
2. **Missing _layout.tsx files** - Every module needs a layout file
3. **Incorrect hierarchy** - Tabs must be wrapped by Stack
4. **Not testing all tabs** - One working tab doesn't mean all work
5. **Copying patterns blindly** - Understand why the pattern exists

## Migration Guide

If you have existing code using screenOptions:

1. Remove `screenOptions` from Stack component
2. Add explicit `options` to each Stack.Screen
3. Test all navigation paths
4. Verify touch responsiveness

## Related Patterns

- [Route Organization](./route-organization.md) - API route structure
- [Auth Middleware](./auth-middleware.md) - Authentication patterns
- [Error Handling](./error-handling.md) - Error management

## References

- Task: `.claude/tasks/20251030-025700-fix-worker-unresponsive-ui.md`
- Expo Router: [Layout Routes](https://docs.expo.dev/router/layouts/)
- React Native Screens: [Known Issues](https://github.com/software-mansion/react-native-screens/issues)