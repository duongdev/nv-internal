import type { ConfigContext, ExpoConfig } from '@expo/config'

// Read build number from environment variable (set by GitHub Actions or local .env)
// Falls back to '1' if not set
const buildNumber = process.env.BUILD_NUMBER || '1'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nam Việt Internal',
  slug: 'nv-internal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'nv-internal',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'vn.dienlanhnamviet.internal',
    buildNumber: buildNumber,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
    // Configure manual code signing for local/GitHub Actions builds
    // This prevents Xcode from defaulting to automatic signing
    usesAppleSignIn: false,
    infoPlist: {
      // biome-ignore lint/style/useNamingConvention: iOS InfoPlist requires exact key names
      NSLocationWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      // biome-ignore lint/style/useNamingConvention: iOS InfoPlist requires exact key names
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      // biome-ignore lint/style/useNamingConvention: iOS InfoPlist requires exact key names
      NSCameraUsageDescription:
        'Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc và đính kèm vào nhiệm vụ.',
      // biome-ignore lint/style/useNamingConvention: iOS InfoPlist requires exact key names
      NSPhotoLibraryUsageDescription:
        'Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.',
      // biome-ignore lint/style/useNamingConvention: iOS InfoPlist requires exact key names
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'vn.dienlanhnamviet.internal',
    versionCode: Number.parseInt(buildNumber),
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    'expo-asset',
    'expo-video',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.',
        cameraPermission:
          'Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'efc85258-12ce-4f6a-826a-ab5765d18ebc',
    },
  },
  owner: 'duongdev',
  // Expo Updates configuration for local builds
  // See migration task: .claude/tasks/YYYYMMDD-HHMMSS-migrate-eas-build-to-local-builds.md
  updates: {
    enabled: true,
    url: 'https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc',
    // Explicitly set channel for local builds to prevent ErrorRecovery crash
    // Channel should match EAS Update channel: production, staging, preview
    requestHeaders: {
      'expo-channel-name': process.env.EXPO_PUBLIC_ENV || 'production',
    },
    // Disable automatic error recovery to prevent tryRelaunchFromCache() crash
    // This was causing production crashes during app startup
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion', // OTA updates only work for same app version
  },
})
