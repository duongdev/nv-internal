import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import PostHog from 'posthog-react-native'
import { Platform } from 'react-native'
import { getPostHogApiKey, getPostHogHost, isPostHogEnabled } from '@/lib/env'

// Check if running in Expo Go
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

/**
 * Create PostHog client instance for PostHogProvider.
 * Returns null if PostHog is disabled or API key is missing.
 *
 * @returns PostHog instance or null
 *
 * @example
 * ```typescript
 * const posthogClient = useMemo(() => createPostHogClient(), [])
 *
 * return posthogClient ? (
 *   <PostHogProvider client={posthogClient}>...</PostHogProvider>
 * ) : (
 *   <AppContent />
 * )
 * ```
 */
export function createPostHogClient(): PostHog | null {
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

  // Create PostHog instance (Pattern 3: Direct instantiation)
  return new PostHog(apiKey, {
    host: getPostHogHost(),

    // Persistence via AsyncStorage
    customStorage: AsyncStorage,
    persistence: 'file',

    // Lifecycle events
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
  })
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

/**
 * Error Tracking
 */

// Error queue for capturing errors before PostHog is ready
// biome-ignore lint/suspicious/noExplicitAny: Context can have any shape
const errorQueue: Array<{ error: Error; context: any }> = []

/**
 * Capture exception with context for error tracking.
 * Queues errors if PostHog is not ready yet.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 * @param error - Error object or unknown value
 * @param context - Optional context (screen, action, metadata, etc.)
 *
 * @example
 * ```typescript
 * import { usePostHog } from 'posthog-react-native'
 * import { captureException } from '@/lib/posthog'
 *
 * const posthog = usePostHog()
 * try {
 *   // risky operation
 * } catch (error) {
 *   captureException(posthog, error, {
 *     screen: 'TaskList',
 *     action: 'load_tasks',
 *     metadata: { filter: 'active' }
 *   })
 * }
 * ```
 */
export function captureException(
  posthog: PostHog | null | undefined,
  error: Error | unknown,
  context?: {
    fatal?: boolean
    mechanism?: string
    screen?: string
    action?: string
    // biome-ignore lint/suspicious/noExplicitAny: PostHog accepts any property types
    metadata?: Record<string, any>
  },
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error))

  if (!posthog) {
    // Queue error if PostHog not ready
    errorQueue.push({ error: errorObj, context })
    return
  }

  posthog.capture('$exception', {
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_message: errorObj.message,
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_stack: errorObj.stack || '',
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_type: errorObj.name,
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_fatal: context?.fatal || false,
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_mechanism: context?.mechanism || 'manual',
    // Additional context
    ...(context?.screen && { screen: context.screen }),
    ...(context?.action && { action: context.action }),
    ...(context?.metadata && { metadata: context.metadata }),
    // Error fingerprinting for better grouping
    // biome-ignore lint/style/useNamingConvention: PostHog API requires this format
    $exception_fingerprint: generateErrorFingerprint(errorObj),
  })
}

/**
 * Process queued errors after PostHog is ready.
 * Should be called after PostHog initialization.
 *
 * @param posthog - PostHog instance from usePostHog() hook
 */
export function processErrorQueue(posthog: PostHog | null | undefined): void {
  if (!posthog) {
    return
  }

  while (errorQueue.length > 0) {
    const item = errorQueue.shift()
    if (item?.error) {
      captureException(posthog, item.error, item.context)
    }
  }
}

/**
 * Generate consistent fingerprint for error grouping.
 * Normalizes dynamic values (numbers, IDs) for better grouping.
 */
function generateErrorFingerprint(error: Error): string {
  const type = error.name || 'Error'
  // Normalize numbers and IDs in message for better grouping
  const message =
    error.message?.replace(/\d+/g, 'N').replace(/[a-f0-9]{24,}/gi, 'ID') || ''
  const stack = error.stack?.split('\n')[1] || '' // Use second line (first frame)
  return `${type}-${message}-${stack}`.slice(0, 100)
}
