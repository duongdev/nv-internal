import * as Application from 'expo-application'
import Constants, { ExecutionEnvironment } from 'expo-constants'

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

export interface VersionInfo {
  version: string
  buildNumber: string
  channel: string
  fullString: string
}

/**
 * Get the app version string.
 * In Expo Go, returns version from expo config.
 * In production builds, returns native application version.
 */
export function getAppVersion(): string {
  if (IS_EXPO_GO) {
    return Constants.expoConfig?.version || 'Dev'
  }
  return Application.nativeApplicationVersion || 'Unknown'
}

/**
 * Get the build number.
 * In Expo Go, returns 'Expo Go' identifier.
 * In production builds, returns native build version.
 * Format: Build number as string (e.g., "123")
 */
export function getBuildNumber(): string {
  if (IS_EXPO_GO) {
    return 'Expo Go'
  }
  return Application.nativeBuildVersion || 'Unknown'
}

/**
 * Get the update channel name.
 * In Expo Go, returns 'Development'.
 * In production builds, returns channel from EAS Update configuration.
 */
export function getUpdateChannel(): string {
  if (IS_EXPO_GO) {
    return 'Development'
  }
  // Type assertion: channel is set at build time via EAS Build but not in ExpoConfig type
  return (
    (Constants.expoConfig?.updates as { channel?: string })?.channel ||
    'Production'
  )
}

/**
 * Get a formatted version string.
 * Format: vX.Y.Z (N)
 */
export function getVersionString(): string {
  const version = getAppVersion()
  const build = getBuildNumber()
  return `v${version} (${build})`
}

/**
 * Get complete version information.
 * Returns all version details including formatted full string.
 * Format: vX.Y.Z (N)
 */
export function getVersionInfo(): VersionInfo {
  const version = getAppVersion()
  const buildNumber = getBuildNumber()
  const channel = getUpdateChannel()
  const fullString = `v${version} (${buildNumber})`

  return { version, buildNumber, channel, fullString }
}

/**
 * Check if running in Expo Go.
 * Useful for conditional logic that needs to handle dev vs production.
 */
export function isExpoGo(): boolean {
  return IS_EXPO_GO
}
