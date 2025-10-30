import { useUser } from '@clerk/clerk-expo'
import { Redirect, Stack } from 'expo-router'
import type { User } from '@/api/user/use-user-list'
import { isUserAdmin } from '@/utils/user-helper'

/**
 * Admin Layout - RBAC Guard + Navigation
 *
 * This layout protects all admin routes and ensures only users with
 * the 'nv_internal_admin' role can access admin features.
 *
 * IMPORTANT: Don't use screenOptions - it creates overlays that block tabs.
 * Configure each route explicitly instead.
 * See: docs/architecture/patterns/tabs-navigation.md
 */
export default function AdminLayout() {
  const { user, isLoaded } = useUser()

  // Wait for user data to load
  if (!isLoaded) {
    return null
  }

  // Check if user has admin role
  const hasAdminRole = user ? isUserAdmin(user as unknown as User) : false

  // Redirect workers to worker module
  if (!hasAdminRole) {
    return <Redirect href="/worker" />
  }

  return (
    <Stack>
      {/* Hide header for tabs - Tabs handle their own UI */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Hide header for index redirect */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* User management screens */}
      <Stack.Screen
        name="users/create"
        options={{
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />

      {/* Task management screens */}
      <Stack.Screen name="tasks/create" />

      {/* Payment screens */}
      <Stack.Screen
        name="payments/[paymentId]/edit"
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack>
  )
}
