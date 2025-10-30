import { Stack } from 'expo-router'

/**
 * Worker Layout - Navigation Wrapper
 *
 * IMPORTANT: Don't use screenOptions - it creates overlays that block tabs.
 * Configure each route explicitly instead.
 * See: docs/architecture/patterns/tabs-navigation.md
 */
export default function WorkerLayout() {
  return (
    <Stack>
      {/* Hide header for tabs - Tabs handle their own UI */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Hide header for index redirect */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
