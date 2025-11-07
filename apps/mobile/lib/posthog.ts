import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import type {
  PostHog,
  PostHogAutocaptureOptions,
  PostHogOptions,
} from 'posthog-react-native'
import { Platform } from 'react-native'
import { getPostHogApiKey, getPostHogHost, isPostHogEnabled } from '@/lib/env'

// Check if running in Expo Go
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
const IS_DEV = __DEV__

/**
 * Get PostHog configuration options for PostHogProvider.
 * Returns null if PostHog is disabled or API key is missing.
 *
 * @returns Configuration object or null
 *
 * @example
 * ```typescript
 * const config = getPostHogConfig()
 * if (config) {
 *   return <PostHogProvider {...config}>...</PostHogProvider>
 * }
 * ```
 */
export function getPostHogConfig(): {
  apiKey: string
  options: PostHogOptions
  autocapture: PostHogAutocaptureOptions
  debug: boolean
} | null {
  // Check if PostHog is enabled
  if (!isPostHogEnabled()) {
    // biome-ignore lint/suspicious/noConsole: Intentional debug logging for PostHog initialization
    console.log('[PostHog] Disabled via environment configuration')
    return null
  }

  const apiKey = getPostHogApiKey()
  if (!apiKey) {
    console.warn('[PostHog] No API key provided')
    return null
  }

  return {
    apiKey,
    options: {
      host: getPostHogHost(),

      // Persistence via AsyncStorage
      customStorage: AsyncStorage,
      persistence: 'file',

      // Lifecycle events (correct property name in v4.x)
      captureAppLifecycleEvents: true,

      // Feature flags
      sendFeatureFlagEvent: true,
      preloadFeatureFlags: true,

      // Performance
      flushAt: 20, // Batch 20 events
      flushInterval: 30000, // Flush every 30 seconds

      // Default properties for all events
      customAppProperties: (props) => ({
        ...props,
        platform: Platform.OS,
        platform_version: String(Platform.Version),
        is_expo_go: IS_EXPO_GO,
        app_version: Constants.expoConfig?.version || 'unknown',
      }),
    },
    autocapture: {
      // Manual screen tracking for better control with Expo Router
      captureScreens: false,
      captureTouches: true,
    },
    // Debug in development (but not in Expo Go - too noisy)
    debug: IS_DEV && !IS_EXPO_GO,
  }
}

/**
 * Reset PostHog (on logout).
 * Clears user identification and local state.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 *
 * @example
 * ```typescript
 * import { usePostHog } from 'posthog-react-native'
 * import { resetPostHog } from '@/lib/posthog'
 *
 * const posthog = usePostHog()
 * await resetPostHog(posthog)
 * ```
 */
export async function resetPostHog(
  posthog: PostHog | undefined,
): Promise<void> {
  if (posthog) {
    await posthog.reset()
    // biome-ignore lint/suspicious/noConsole: Intentional debug logging for PostHog reset
    console.log('[PostHog] Reset complete')
  }
}

/**
 * Identify user in PostHog.
 * Should be called after successful authentication.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 * @param userId - Unique user identifier
 * @param properties - Optional user properties (email, name, role, etc.)
 *
 * @example
 * ```typescript
 * import { usePostHog } from 'posthog-react-native'
 * import { identifyUser } from '@/lib/posthog'
 *
 * const posthog = usePostHog()
 * identifyUser(posthog, user.id, {
 *   email: user.email,
 *   name: user.fullName,
 *   role: user.role,
 * })
 * ```
 */
export function identifyUser(
  posthog: PostHog | undefined,
  userId: string,
  // biome-ignore lint/suspicious/noExplicitAny: PostHog accepts any property types
  properties?: Record<string, any>,
): void {
  if (posthog) {
    posthog.identify(userId, properties)
    // biome-ignore lint/suspicious/noConsole: Intentional debug logging for user identification
    console.log('[PostHog] User identified:', userId)
  }
}

/**
 * Capture custom event.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 * @param event - Event name (use descriptive names like 'task-completed')
 * @param properties - Optional event properties
 *
 * @example
 * ```typescript
 * import { usePostHog } from 'posthog-react-native'
 * import { captureEvent } from '@/lib/posthog'
 *
 * const posthog = usePostHog()
 * captureEvent(posthog, 'task-completed', {
 *   task_id: task.id,
 *   task_status: task.status,
 *   completion_time_ms: 5000,
 * })
 * ```
 */
export function captureEvent(
  posthog: PostHog | undefined,
  event: string,
  // biome-ignore lint/suspicious/noExplicitAny: PostHog accepts any property types
  properties?: Record<string, any>,
): void {
  if (posthog) {
    posthog.capture(event, properties)
  }
}

/**
 * Track screen view.
 * Should be called in screen focus callbacks or route changes.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 * @param screenName - Human-readable screen name
 * @param properties - Optional screen properties
 *
 * @example
 * ```typescript
 * import { usePostHog } from 'posthog-react-native'
 * import { trackScreen } from '@/lib/posthog'
 *
 * const posthog = usePostHog()
 * trackScreen(posthog, 'Task Details', {
 *   task_id: task.id,
 *   task_status: task.status,
 * })
 * ```
 */
export function trackScreen(
  posthog: PostHog | undefined,
  screenName: string,
  // biome-ignore lint/suspicious/noExplicitAny: PostHog accepts any property types
  properties?: Record<string, any>,
): void {
  if (posthog) {
    posthog.screen(screenName, properties)
  }
}
