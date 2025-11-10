import { usePathname } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { captureException } from '@/lib/posthog'

/**
 * Hook for tracking errors with PostHog.
 * Automatically includes current screen context.
 *
 * @example
 * ```typescript
 * const { captureError } = useErrorTracking()
 *
 * try {
 *   // risky operation
 * } catch (error) {
 *   captureError(error, 'load_tasks', { filter: 'active' })
 * }
 * ```
 */
export function useErrorTracking() {
  const posthog = usePostHog()
  const pathname = usePathname()

  return {
    /**
     * Capture an error with context.
     *
     * @param error - Error object or unknown value
     * @param action - What action was being performed when error occurred
     * @param metadata - Additional context data
     */
    captureError: (
      error: Error | unknown,
      action?: string,
      // biome-ignore lint/suspicious/noExplicitAny: PostHog accepts any property types
      metadata?: Record<string, any>,
    ) => {
      captureException(posthog, error, {
        screen: pathname,
        action,
        metadata,
        mechanism: 'manual',
      })
    },
  }
}
