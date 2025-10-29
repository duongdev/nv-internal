import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import * as React from 'react'
import { useUserRole } from '@/hooks/use-user-role'
import {
  getModulePreference,
  validateModulePreference,
} from '@/lib/module-preference'

export default function Screen() {
  const { user } = useUser()
  const { isAdmin, isWorker } = useUserRole()
  const router = useRouter()
  const [isRouting, setIsRouting] = React.useState(false)

  React.useEffect(() => {
    // Route users to their appropriate module based on role and saved preference
    const routeUser = async () => {
      if (isRouting) {
        return // Prevent multiple routing attempts
      }

      if (!user) {
        // If the user is not logged in, redirect to the sign-in page
        setIsRouting(true)
        router.replace('/(auth)/sign-in')
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

      // Route based on validated preference or role
      setIsRouting(true)
      if (validatedPreference) {
        // Use saved preference if valid
        router.replace(validatedPreference === 'admin' ? '/admin' : '/worker')
      } else if (isAdmin) {
        // Default to admin for admin users
        router.replace('/admin')
      } else if (isWorker) {
        // Default to worker for worker-only users
        router.replace('/worker')
      } else {
        // No valid role - this shouldn't happen, but redirect to sign-in as fallback
        router.replace('/(auth)/sign-in')
      }
    }

    routeUser()
  }, [isAdmin, isWorker, router, user, isRouting])

  // Don't render anything while routing to prevent flashing content
  return null
}
