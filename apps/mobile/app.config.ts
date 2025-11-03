import { ConfigContext, ExpoConfig } from '@expo/config'

const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production'
const IS_STAGING = process.env.EXPO_PUBLIC_ENV === 'staging'

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
    config: {
      googleMapsApiKey: IS_PRODUCTION
        ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION
        : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING ||
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      NSCameraUsageDescription:
        'Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc và đính kèm vào nhiệm vụ.',
      NSPhotoLibraryUsageDescription:
        'Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'vn.dienlanhnamviet.internal',
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
        apiKey: IS_PRODUCTION
          ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION
          : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING ||
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
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
  updates: {
    url: 'https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc',
  },
  runtimeVersion: {
    policy: 'appVersion', // OTA updates only work for same app version
  },
})
