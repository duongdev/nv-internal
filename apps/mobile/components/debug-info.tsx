import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { getApiUrl, getClerkPublishableKey, getEnvironment } from '@/lib/env'
import { Text } from './ui/text'

/**
 * Debug Info Component
 * Shows environment configuration - useful for debugging production builds
 * Triple-tap the logo/header to toggle visibility
 */
export function DebugInfo() {
  const [isExpanded, setIsExpanded] = useState(true)

  let apiUrl = 'Error loading'
  let clerkKey = 'Error loading'
  const env = getEnvironment()

  try {
    apiUrl = getApiUrl()
  } catch (error) {
    apiUrl = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  try {
    clerkKey = getClerkPublishableKey()
  } catch (error) {
    clerkKey = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  return (
    <View className="rounded-lg border border-amber-500 bg-amber-500/10 p-3">
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <Text className="mb-2 font-bold text-amber-900 text-sm dark:text-amber-100">
          🐛 Debug Info {isExpanded ? '▼' : '▶'}
        </Text>
      </Pressable>

      {isExpanded && (
        <ScrollView className="max-h-60">
          <View className="gap-2">
            <View>
              <Text className="font-medium text-amber-900 text-xs dark:text-amber-200">
                Environment:
              </Text>
              <Text
                className="font-mono text-amber-800 text-xs dark:text-amber-300"
                selectable
              >
                {env}
              </Text>
            </View>

            <View>
              <Text className="font-medium text-amber-900 text-xs dark:text-amber-200">
                API URL:
              </Text>
              <Text
                className="font-mono text-amber-800 text-xs dark:text-amber-300"
                selectable
              >
                {apiUrl}
              </Text>
            </View>

            <View>
              <Text className="font-medium text-amber-900 text-xs dark:text-amber-200">
                Clerk Key:
              </Text>
              <Text
                className="font-mono text-amber-800 text-xs dark:text-amber-300"
                selectable
              >
                {clerkKey}
              </Text>
              <Text className="font-mono text-amber-700 text-xs dark:text-amber-400">
                Type:{' '}
                {clerkKey.startsWith('pk_test_')
                  ? 'TEST'
                  : clerkKey.startsWith('pk_live_')
                    ? 'LIVE/PRODUCTION'
                    : 'UNKNOWN'}
              </Text>
            </View>

            <View>
              <Text className="font-medium text-amber-900 text-xs dark:text-amber-200">
                Available Env Vars:
              </Text>
              <Text
                className="font-mono text-amber-800 text-xs dark:text-amber-300"
                selectable
              >
                {JSON.stringify(
                  {
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_PROD_API: !!process.env.EXPO_PUBLIC_API_URL_PRODUCTION,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_STAGING_API: !!process.env.EXPO_PUBLIC_API_URL_STAGING,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_GENERIC_API: !!process.env.EXPO_PUBLIC_API_URL,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_PROD_CLERK:
                      !!process.env
                        .EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_STAGING_CLERK:
                      !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    HAS_GENERIC_CLERK:
                      !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
                    // biome-ignore lint/style/useNamingConvention: Debug object keys use CONSTANT_CASE intentionally
                    ENV: process.env.EXPO_PUBLIC_ENV,
                  },
                  null,
                  2,
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
}
