import * as Application from 'expo-application'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Updates from 'expo-updates'

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

export interface VersionInfo {
  version: string
  buildNumber: string
  channel: string
  fullString: string
  otaUpdateId: string | null
  isEmbeddedLaunch: boolean
  otaCreatedAt: Date | null
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
 * In production builds, returns OTA build number if available, otherwise native build version.
 * Format: Build number as string (e.g., "123")
 */
export function getBuildNumber(): string {
  if (IS_EXPO_GO) {
    return 'Expo Go'
  }

  // Check if an OTA update is active
  if (!Updates.isEmbeddedLaunch && Updates.manifest) {
    // Try to extract build number from OTA message
    // Message format: "Nightly build v1.0.0 (42) 2025-11-11" or "Deploy v1.0.0 (42) to staging"
    const manifest = Updates.manifest as { message?: string }
    if (manifest.message) {
      const match = manifest.message.match(/\((\d+)\)/)
      if (match?.[1]) {
        return match[1] // Return OTA build number
      }
    }
  }

  // Fallback to native build version
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
 * Get OTA update information.
 * Returns update ID and timestamp if an OTA update is active.
 */
export function getOTAUpdateInfo(): {
  updateId: string | null
  isEmbeddedLaunch: boolean
  createdAt: Date | null
} {
  if (IS_EXPO_GO) {
    return { updateId: null, isEmbeddedLaunch: true, createdAt: null }
  }

  return {
    updateId: Updates.updateId || null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt ? new Date(Updates.createdAt) : null,
  }
}

/**
 * Get a formatted version string with OTA update info.
 * Shows build number from OTA if available, otherwise native build number.
 * Format: vX.Y.Z (N) where N is the build number
 */
export function getVersionStringWithOTA(): string {
  const version = getAppVersion()
  const build = getBuildNumber()
  return `v${version} (${build})`
}

/**
 * Get a formatted version string.
 * Format: vX.Y.Z (N)
 * @deprecated Use getVersionStringWithOTA() for more detailed OTA information
 */
export function getVersionString(): string {
  const version = getAppVersion()
  const build = getBuildNumber()
  return `v${version} (${build})`
}

/**
 * Get complete version information.
 * Returns all version details including formatted full string.
 * Format: vX.Y.Z (N) where N is OTA build number if available, otherwise native build number
 */
export function getVersionInfo(): VersionInfo {
  const version = getAppVersion()
  const buildNumber = getBuildNumber()
  const channel = getUpdateChannel()
  const otaInfo = getOTAUpdateInfo()
  const fullString = getVersionStringWithOTA()

  return {
    version,
    buildNumber,
    channel,
    fullString,
    otaUpdateId: otaInfo.updateId,
    isEmbeddedLaunch: otaInfo.isEmbeddedLaunch,
    otaCreatedAt: otaInfo.createdAt,
  }
}

/**
 * Check if running in Expo Go.
 * Useful for conditional logic that needs to handle dev vs production.
 */
export function isExpoGo(): boolean {
  return IS_EXPO_GO
}
