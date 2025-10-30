# Migration Guide: NativeTabs to Stable Tabs

## Quick Migration Steps

If you're experiencing unresponsive UI with NativeTabs, follow these steps to migrate to stable Tabs.

## 1. Update Imports

```diff
- import { Tabs as NativeTabs } from 'expo-router/tabs'
+ import { Tabs } from 'expo-router'
```

## 2. Replace Components

```diff
- <NativeTabs
+ <Tabs
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      headerShown: false,
    }}
  >
    {/* Your tab screens */}
- </NativeTabs>
+ </Tabs>
```

## 3. Add Haptic Feedback (Optional but Recommended)

```tsx
import * as Haptics from 'expo-haptics'

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

## 4. Fix Parent Stack Navigators

Ensure all Stack navigators use individual Screen options:

```diff
// ❌ WRONG - Creates invisible overlays
- <Stack screenOptions={{ headerShown: false }}>
-   <Stack.Screen name="(tabs)" />
- </Stack>

// ✅ CORRECT - No overlays
+ <Stack>
+   <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
+ </Stack>
```

## 5. Fix Module Index Files

Replace immediate redirects with delayed navigation:

```diff
// ❌ WRONG - Can cause race conditions
- import { Redirect } from 'expo-router'
-
- export default function ModuleIndex() {
-   return <Redirect href="/module/(tabs)" />
- }

// ✅ CORRECT - Stable navigation
+ import { useRouter } from 'expo-router'
+ import { useEffect } from 'react'
+ import { ActivityIndicator, View } from 'react-native'
+
+ export default function ModuleIndex() {
+   const router = useRouter()
+
+   useEffect(() => {
+     const timer = setTimeout(() => {
+       router.replace('/module/(tabs)')
+     }, 100)
+     return () => clearTimeout(timer)
+   }, [router])
+
+   return (
+     <View className="flex-1 items-center justify-center">
+       <ActivityIndicator size="small" />
+     </View>
+   )
+ }
```

## 6. Test Everything

After migration, verify:

- [ ] All tabs respond to touch on first load
- [ ] Tab switching works smoothly
- [ ] Haptic feedback works (if added)
- [ ] No "phantom" headers appear
- [ ] Works on both iOS and Android
- [ ] Module switching works correctly

## Common Issues and Solutions

### Issue: Tabs still unresponsive
**Solution**: Check parent Stack navigators for `screenOptions`

### Issue: Weird header appears
**Solution**: Ensure `headerShown: false` is set on individual Screen, not Stack

### Issue: Module redirect feels slow
**Solution**: The 100ms delay is intentional for stability. You can try 50ms but test thoroughly

### Issue: Haptic feedback not working
**Solution**: Haptics don't work on iOS simulator. Test on real device

## Why This Migration?

1. **NativeTabs is unstable**: It's marked as "unstable" for a reason
2. **Race conditions**: NativeTabs has issues with navigation state initialization
3. **Production ready**: Stable Tabs are battle-tested and reliable
4. **Better UX**: Opportunity to add haptic feedback

## References

- Full migration details: `.claude/tasks/20251030-041902-migrate-nativetabs-to-stable-tabs.md`
- Navigation patterns: `docs/architecture/patterns/tabs-navigation.md`
- Original issue: `.claude/tasks/20251030-025700-fix-worker-unresponsive-ui.md`