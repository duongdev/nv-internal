/**
 * Environment variable utilities
 * Provides a centralized way to access environment variables with fallback logic
 */

/**
 * Get the API URL based on the current environment
 * Priority: PRODUCTION > STAGING > Generic
 */
export function getApiUrl(): string {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL_PRODUCTION ||
    process.env.EXPO_PUBLIC_API_URL_STAGING ||
    process.env.EXPO_PUBLIC_API_URL

  if (!apiUrl) {
    throw new Error(
      'Missing API URL. Please set EXPO_PUBLIC_API_URL in your environment.',
    )
  }

  return apiUrl
}

/**
 * Get the Clerk publishable key based on the current environment
 * Priority: PRODUCTION > STAGING > Generic
 */
export function getClerkPublishableKey(): string {
  const key =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION ||
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING ||
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!key) {
    throw new Error(
      'Missing Clerk Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment.',
    )
  }

  return key
}

/**
 * Get the current environment
 */
export function getEnvironment(): 'production' | 'staging' | 'development' {
  const env = process.env.EXPO_PUBLIC_ENV
  if (env === 'production') {
    return 'production'
  }
  if (env === 'staging') {
    return 'staging'
  }
  return 'development'
}

/**
 * Get PostHog API key based on current environment
 * Priority: PRODUCTION > STAGING > Generic
 * Returns null if not configured (allows graceful degradation)
 */
export function getPostHogApiKey(): string | null {
  const key =
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY_PRODUCTION ||
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY_STAGING ||
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY

  return key || null
}

/**
 * Get PostHog host URL
 * Defaults to PostHog Cloud
 */
export function getPostHogHost(): string {
  return process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
}

/**
 * Check if PostHog is enabled
 * Disabled if explicitly set to 'false' or if no API key is configured
 */
export function isPostHogEnabled(): boolean {
  return (
    process.env.EXPO_PUBLIC_POSTHOG_ENABLED !== 'false' &&
    getPostHogApiKey() !== null
  )
}
