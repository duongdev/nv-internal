import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Updates from 'expo-updates'
import { usePostHog } from 'posthog-react-native'
import { useCallback, useEffect, useState } from 'react'
import { captureException } from '@/lib/posthog'
import { getUpdateState, saveUpdateState } from '@/lib/update-state'

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
const IS_DEV = __DEV__
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

export interface OTAUpdateState {
  isChecking: boolean
  isDownloading: boolean
  isUpdateAvailable: boolean
  lastChecked: Date | null
  error: Error | null
}

export interface OTAUpdateActions {
  checkForUpdates: () => Promise<void>
  reloadApp: () => Promise<void>
}

export type OTAUpdateHook = OTAUpdateState & OTAUpdateActions

/**
 * Hook for managing OTA (Over-The-Air) updates.
 * Automatically checks for updates on mount in production builds.
 * Gracefully handles Expo Go and development environments.
 *
 * @returns OTA update state and actions
 */
export function useOTAUpdates(): OTAUpdateHook {
  const posthog = usePostHog()
  const [state, setState] = useState<OTAUpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    lastChecked: null,
    error: null,
  })

  /**
   * Check if enough time has passed since last check.
   * Prevents rapid consecutive checks to save battery.
   */
  const shouldCheckForUpdates = async (): Promise<boolean> => {
    const persistedState = await getUpdateState()
    if (!persistedState?.lastChecked) {
      return true
    }

    const timeSinceLastCheck =
      Date.now() - new Date(persistedState.lastChecked).getTime()
    return timeSinceLastCheck >= MIN_CHECK_INTERVAL_MS
  }

  /**
   * Check for updates with exponential backoff retry logic.
   */
  const checkForUpdatesWithRetry = async (retryCount = 0): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isChecking: true, error: null }))

      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        setState((prev) => ({ ...prev, isDownloading: true }))
        await Updates.fetchUpdateAsync()
        setState((prev) => ({
          ...prev,
          isUpdateAvailable: true,
          isDownloading: false,
          isChecking: false,
          lastChecked: new Date(),
        }))

        // Persist state
        await saveUpdateState({
          lastChecked: new Date().toISOString(),
          lastUpdateId: Updates.updateId || null,
          dismissedUpdateId: null,
        })
      } else {
        setState((prev) => ({
          ...prev,
          isChecking: false,
          lastChecked: new Date(),
        }))

        // Persist state
        await saveUpdateState({
          lastChecked: new Date().toISOString(),
          lastUpdateId: Updates.updateId || null,
          dismissedUpdateId: null,
        })
      }
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * 2 ** retryCount
        // biome-ignore lint/suspicious/noConsole: Intentional for OTA monitoring
        console.log(
          `[OTA] Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`,
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
        return checkForUpdatesWithRetry(retryCount + 1)
      }

      console.error('[OTA] All retries exhausted:', error)
      setState((prev) => ({
        ...prev,
        isChecking: false,
        isDownloading: false,
        error:
          error instanceof Error ? error : new Error('Update check failed'),
      }))
    }
  }

  /**
   * Check for OTA updates.
   * Skips in Expo Go and development environments.
   * Respects minimum check interval.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: checkForUpdates is stable and shouldn't change
  const checkForUpdates = useCallback(async (): Promise<void> => {
    // Skip in Expo Go or development
    if (IS_EXPO_GO || IS_DEV) {
      // biome-ignore lint/suspicious/noConsole: Intentional for OTA monitoring
      console.log('[OTA] Skipping update check (Expo Go or dev mode)')
      return
    }

    // Check minimum interval
    const shouldCheck = await shouldCheckForUpdates()
    if (!shouldCheck) {
      // biome-ignore lint/suspicious/noConsole: Intentional for OTA monitoring
      console.log('[OTA] Skipping check, too soon since last check')
      return
    }

    await checkForUpdatesWithRetry()
  }, [])

  /**
   * Reload the app to apply downloaded update.
   * Skips in Expo Go and development environments.
   * Note: reloadAsync() will terminate the app and restart it - this is expected behavior.
   */
  const reloadApp = useCallback(async (): Promise<void> => {
    if (IS_EXPO_GO || IS_DEV) {
      // biome-ignore lint/suspicious/noConsole: Intentional for OTA monitoring
      console.log('[OTA] Skipping reload (Expo Go or dev mode)')
      return
    }

    try {
      // Validate update is still available before attempting reload
      // biome-ignore lint/suspicious/noConsole: Intentional for OTA monitoring
      console.log('[OTA] Validating update availability...')
      const { isAvailable: stillAvailable } =
        await Updates.checkForUpdateAsync()

      if (!stillAvailable) {
        const error = new Error('Update no longer available')

        // Track validation failure to PostHog
        captureException(posthog, error, {
          action: 'ota_update_validation',
          screen: 'version_info_footer',
          metadata: {
            update_id: Updates.updateId,
            current_channel: Updates.channel,
            reason: 'update_not_available',
          },
        })

        console.warn('[OTA] Update no longer available')
        setState((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          error,
        }))
        return
      }

      // Log reload attempt to PostHog
      posthog?.capture('ota_update_reload_attempted', {
        update_id: Updates.updateId,
        current_channel: Updates.channel,
      })

      // Updates.reloadAsync() will terminate and restart the app immediately.
      // This is expected behavior and NOT a crash - the app will restart with the new update.
      await Updates.reloadAsync()
    } catch (error) {
      // Track error to PostHog BEFORE setting state
      // NOTE: This only catches JavaScript errors, not native crashes
      captureException(posthog, error, {
        action: 'ota_update_reload',
        screen: 'version_info_footer',
        metadata: {
          update_id: Updates.updateId,
          current_channel: Updates.channel,
        },
      })

      console.error('[OTA] Reload failed:', error)
      setState((prev) => ({
        ...prev,
        isUpdateAvailable: false, // Hide reload button after failure
        error: error instanceof Error ? error : new Error('Reload failed'),
      }))
    }
  }, [posthog])

  /**
   * Load persisted state and auto-check for updates on mount.
   */
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      // Load persisted state
      const persistedState = await getUpdateState()
      if (persistedState?.lastChecked && mounted) {
        const lastCheckedDate = new Date(persistedState.lastChecked)
        setState((prev) => ({
          ...prev,
          lastChecked: lastCheckedDate,
        }))
      }

      // Auto-check on mount (only in production builds)
      if (!IS_EXPO_GO && !IS_DEV && mounted) {
        await checkForUpdates()
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [checkForUpdates])

  return { ...state, checkForUpdates, reloadApp }
}
