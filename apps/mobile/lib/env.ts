/**
 * Environment variable utilities
 * Provides a centralized way to access environment variables
 *
 * Environment variables are managed by Expo's environment system.
 * Each build profile in eas.json defines the appropriate values.
 */

/**
 * Get the API URL for the current environment
 */
export function getApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL

  if (!apiUrl) {
    throw new Error(
      'Missing API URL. Please set EXPO_PUBLIC_API_URL in your environment.',
    )
  }

  return apiUrl
}

/**
 * Get the Clerk publishable key for the current environment
 */
export function getClerkPublishableKey(): string {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

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
 * Get PostHog API key for the current environment
 * Returns null if not configured (allows graceful degradation)
 */
export function getPostHogApiKey(): string | null {
  return process.env.EXPO_PUBLIC_POSTHOG_API_KEY || null
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

/**
 * Get Google Maps API key for the current platform
 * Google requires separate API keys for iOS and Android
 */
export function getGoogleMapsApiKey(): string {
  // Platform detection needs to be done at runtime in React Native
  // We'll use a lazy approach to avoid importing Platform at module level
  const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID

  // For web or unknown platforms, try Android key first (more permissive)
  // This is a fallback - in practice, maps are primarily used on mobile
  const key = androidKey || iosKey

  if (!key) {
    throw new Error(
      'Missing Google Maps API key. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID in your environment.',
    )
  }

  return key
}
