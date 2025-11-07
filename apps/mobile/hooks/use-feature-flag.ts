import {
  useFeatureFlagWithPayload,
  useFeatureFlag as usePostHogFeatureFlag,
} from 'posthog-react-native'

/**
 * Hook to check if a boolean feature flag is enabled.
 * Returns loading state while fetching from PostHog.
 *
 * @param flagKey - PostHog feature flag key
 * @returns Object with isEnabled and isLoading states
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlag('new-task-ui')
 *
 * if (isLoading) return <LoadingSpinner />
 * return isEnabled ? <NewTaskUI /> : <LegacyTaskUI />
 * ```
 */
export function useFeatureFlag(flagKey: string): {
  isEnabled: boolean
  isLoading: boolean
} {
  const flagValue = usePostHogFeatureFlag(flagKey)

  return {
    isEnabled: flagValue === true,
    isLoading: flagValue === undefined,
  }
}

/**
 * Hook to get feature flag with payload data.
 * Useful for configuration flags (e.g., limits, colors, strings).
 *
 * @param flagKey - PostHog feature flag key
 * @returns Object with payload, isEnabled, and isLoading states
 *
 * @example
 * ```tsx
 * const { payload, isEnabled } = useFeatureFlagPayload<{ limit: number }>('task-limit')
 *
 * const maxTasks = payload?.limit || 50 // Default fallback
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameter allows any payload type
export function useFeatureFlagPayload<T = any>(
  flagKey: string,
): {
  payload: T | null
  isEnabled: boolean
  isLoading: boolean
} {
  const [flagValue, payload] = useFeatureFlagWithPayload(flagKey)

  return {
    payload: payload as T | null,
    isEnabled: flagValue !== undefined && flagValue !== false,
    isLoading: flagValue === undefined,
  }
}

/**
 * Hook for variant-based feature flags (A/B testing).
 * Returns the variant key (e.g., 'control', 'test-a', 'test-b').
 *
 * @param flagKey - PostHog feature flag key
 * @param variants - Array of expected variant keys
 * @returns Object with variant key and isLoading state
 *
 * @example
 * ```tsx
 * const { variant, isLoading } = useFeatureFlagVariant('button-color', ['blue', 'green', 'red'])
 *
 * const buttonColor = {
 *   blue: 'bg-blue-500',
 *   green: 'bg-green-500',
 *   red: 'bg-red-500',
 * }[variant || 'blue']
 * ```
 */
export function useFeatureFlagVariant<T extends string = string>(
  flagKey: string,
  variants: readonly T[],
): {
  variant: T | null
  isLoading: boolean
} {
  const flagValue = usePostHogFeatureFlag(flagKey)

  const variant =
    typeof flagValue === 'string' && variants.includes(flagValue as T)
      ? (flagValue as T)
      : null

  return {
    variant,
    isLoading: flagValue === undefined,
  }
}

/**
 * Type-safe feature flag keys (add your flags here).
 * Prevents typos and provides autocomplete.
 *
 * Naming Convention:
 * - Use dash-case (kebab-case): 'feature-name'
 * - Role-specific flags: Add '-admin' or '-worker' postfix
 * - Examples:
 *   - 'task-list-filter-enabled-admin' (admin-only feature)
 *   - 'quick-actions-worker' (worker-only feature)
 *   - 'new-payment-ui' (all users)
 *
 * @example
 * ```tsx
 * import { FEATURE_FLAGS } from '@/hooks/use-feature-flag'
 *
 * const { isEnabled } = useFeatureFlag(FEATURE_FLAGS.TASK_LIST_FILTER_ENABLED_ADMIN)
 * ```
 */
export const FEATURE_FLAGS = {
  // Admin Features
  /** Enable/disable task list filtering functionality for admin users */
  // biome-ignore lint/style/useNamingConvention: SCREAMING_SNAKE_CASE for constants is intentional
  TASK_LIST_FILTER_ENABLED_ADMIN: 'task-list-filter-enabled-admin',
  /** Enable/disable task list search functionality for admin users */
  // biome-ignore lint/style/useNamingConvention: SCREAMING_SNAKE_CASE for constants is intentional
  TASK_LIST_SEARCH_ENABLED_ADMIN: 'task-list-search-enabled-admin',

  // Worker Features
  /** Enable/disable task list filtering functionality for worker users */
  // biome-ignore lint/style/useNamingConvention: SCREAMING_SNAKE_CASE for constants is intentional
  TASK_LIST_FILTER_ENABLED_WORKER: 'task-list-filter-enabled-worker',
  /** Enable/disable task list search functionality for worker users */
  // biome-ignore lint/style/useNamingConvention: SCREAMING_SNAKE_CASE for constants is intentional
  TASK_LIST_SEARCH_ENABLED_WORKER: 'task-list-search-enabled-worker',

  // Shared Features
  // (Add flags available to all users here)
} as const

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]
