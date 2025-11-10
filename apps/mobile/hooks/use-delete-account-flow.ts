import { useAuth } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useCallback, useState } from 'react'
import { useDeleteAccount } from '@/api/account/use-delete-account'
import { clearTokenCache, setLoggingOut } from '@/lib/api-client'

export type DialogState =
  | 'closed'
  | 'first-warning'
  | 'final-confirmation'
  | 'deleting'
  | 'success'

/**
 * Hook to manage the account deletion flow
 * State machine: closed → first-warning → final-confirmation → deleting → success
 */
export function useDeleteAccountFlow() {
  const [state, setState] = useState<DialogState>('closed')
  const { signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const deleteMutation = useDeleteAccount()

  /**
   * Open the first warning dialog
   */
  const openDialog = useCallback(() => {
    setState('first-warning')
  }, [])

  /**
   * Close the dialog and reset state
   */
  const closeDialog = useCallback(() => {
    setState('closed')
    // Reset mutation state when closing
    deleteMutation.reset()
  }, [deleteMutation])

  /**
   * Proceed from first warning to final confirmation
   */
  const proceedToFinal = useCallback(() => {
    setState('final-confirmation')
  }, [])

  /**
   * Go back from final confirmation to first warning
   */
  const goBackToWarning = useCallback(() => {
    setState('first-warning')
  }, [])

  /**
   * Confirm deletion and execute the deletion flow
   */
  const confirmDeletion = useCallback(async () => {
    setState('deleting')

    try {
      // Set logging out flag to suppress error toasts during cleanup
      setLoggingOut(true)

      // Call API to delete account
      await deleteMutation.mutateAsync()

      // If successful, show success screen
      setState('success')

      // Auto-redirect after 3 seconds
      setTimeout(async () => {
        try {
          // 1. Clear TanStack Query cache
          queryClient.clear()

          // 2. Clear cached token from api-client memory
          clearTokenCache()

          // 3. Clear all AsyncStorage data except app preferences
          const allKeys = await AsyncStorage.getAllKeys()
          const keysToKeep = ['modulePreference', 'theme']
          const keysToRemove = allKeys.filter(
            (key) => !keysToKeep.includes(key),
          )
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove)
          }

          // 4. Clear all SecureStore items (Clerk tokens)
          try {
            const clerkKeys = [
              '__clerk_client_jwt',
              '__clerk_refresh_token',
              '__clerk_session_id',
            ]
            for (const key of clerkKeys) {
              await SecureStore.deleteItemAsync(key).catch(() => {
                // Ignore errors if key doesn't exist
              })
            }
          } catch (error) {
            // SecureStore errors are non-critical, log and continue
            console.warn('Error clearing SecureStore:', error)
          }

          // 5. Sign out from Clerk
          await signOut()

          // 6. Navigate to sign-in screen
          try {
            router.dismissAll()
          } catch {
            // Ignore errors - user might already be signed out
          }
          router.replace('/(auth)/sign-in')
        } catch (error) {
          console.error('Cleanup error:', error)
          // Still attempt to sign out and navigate even if cleanup fails
          try {
            await signOut()
            router.dismissAll()
          } catch {
            // Ignore errors
          }
          router.replace('/(auth)/sign-in')
        } finally {
          // Reset the logging out flag
          setLoggingOut(false)
        }
      }, 3000)
    } catch (error) {
      // On error, go back to final confirmation to allow retry
      setState('final-confirmation')
      setLoggingOut(false)
      console.error('Account deletion error:', error)
    }
  }, [deleteMutation, queryClient, signOut, router])

  return {
    state,
    openDialog,
    closeDialog,
    proceedToFinal,
    goBackToWarning,
    confirmDeletion,
    isDeleting: state === 'deleting',
    isSuccess: state === 'success',
    error: deleteMutation.error?.message || null,
  }
}
