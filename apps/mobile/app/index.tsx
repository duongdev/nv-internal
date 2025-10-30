import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

/**
 * Root Index - Entry Point
 *
 * Handles initial routing based on authentication state:
 * - Unauthenticated users → sign-in screen
 * - Authenticated users → module-transit (which determines role/module)
 *
 * Module-transit handles:
 * - Determining user's role (admin/worker)
 * - Loading persisted module preference
 * - Routing to the appropriate module
 * - Preventing Tabs state corruption
 */
export default function Index() {
  const { isSignedIn, isLoaded } = useAuth()

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Redirect based on authentication state
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return <Redirect href="/module-transit" />
}
