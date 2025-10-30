import { useUser } from '@clerk/clerk-expo'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useUserRole } from '@/hooks/use-user-role'
import {
  getModulePreference,
  validateModulePreference,
} from '@/lib/module-preference'

/**
 * Module Transit Screen
 *
 * Purpose: Central routing hub that:
 * 1. Acts as app entry point - determines which module to load on startup
 * 2. Provides buffer zone when switching modules to prevent Tabs state corruption
 * 3. Handles role-based routing and persisted module preferences
 *
 * Two modes of operation:
 * A) Entry Point (no target param):
 *    - Loads user roles and module preference
 *    - Routes to appropriate module based on role + preference
 *
 * B) Module Switcher (with target param):
 *    - Unmounts previous Tabs
 *    - Waits 800ms for state cleanup
 *    - Routes to target module with fresh state
 *
 * Without this transit screen, Tabs become unresponsive when switching
 * between modules due to navigation state corruption.
 *
 * See: https://github.com/expo/expo/issues/39722
 */
export default function ModuleTransitScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ target?: string }>()
  const { user } = useUser()
  const { isAdmin, isWorker } = useUserRole()
  const [isRouting, setIsRouting] = useState(false)

  useEffect(() => {
    // Prevent multiple routing attempts
    if (isRouting) {
      return
    }

    const routeUser = async () => {
      setIsRouting(true)

      // MODE A: Module Switcher - target is explicitly provided
      if (params.target) {
        const target = params.target

        if (target !== 'admin' && target !== 'worker') {
          // Invalid target, go back
          router.back()
          return
        }

        // Wait for Tabs state to fully clean up before navigating
        // Both modules now have proper loading states, so same delay works
        await new Promise((resolve) => setTimeout(resolve, 800))
        router.replace(target === 'admin' ? '/admin' : '/worker')
        return
      }

      // MODE B: Entry Point - determine module based on role + preference
      // Note: user is guaranteed to be authenticated by index.tsx redirect guard
      if (!user) {
        // This should never happen, but if it does, wait for user to load
        // The loading state will handle the UI
        return
      }

      // Load saved module preference
      const savedPreference = await getModulePreference()

      // Validate preference against current roles
      const validatedPreference = validateModulePreference(
        savedPreference,
        isAdmin,
        isWorker,
      )

      // Determine target module
      let targetModule: 'admin' | 'worker' | null = null
      if (validatedPreference) {
        targetModule = validatedPreference
      } else if (isAdmin) {
        targetModule = 'admin'
      } else if (isWorker) {
        targetModule = 'worker'
      }

      // Wait for Tabs state to initialize properly
      // Both modules now have proper loading states, so same delay works
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Route based on determined target
      if (targetModule) {
        router.replace(targetModule === 'admin' ? '/admin' : '/worker')
      } else {
        // No valid role - redirect to sign-in as fallback
        router.replace('/(auth)/sign-in')
      }
    }

    routeUser()
  }, [params.target, user, isAdmin, isWorker, router, isRouting])

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <ActivityIndicator size="large" />
      <Text className="text-muted-foreground">Vui lòng chờ...</Text>
    </View>
  )
}
