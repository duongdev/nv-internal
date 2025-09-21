/** biome-ignore-all lint/style/useNamingConvention: <explanation> */
import '@/global.css'

import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import {
  PublicSans_200ExtraLight,
  PublicSans_400Regular,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
} from '@expo-google-fonts/public-sans'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Toasts } from '@/components/ui/toasts'
import { queryClient } from '@/lib/api-client'
import { FONT_FAMILY, NAV_THEME } from '@/lib/theme'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export default function RootLayout() {
  const { colorScheme } = useColorScheme()

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView className="flex-1 font-gilroy">
            <BottomSheetModalProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <Routes />
              <Toasts />
              <PortalHost />
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}

SplashScreen.preventAutoHideAsync()

function Routes() {
  const { isSignedIn, isLoaded } = useAuth()
  const [fontsLoaded] = useFonts({
    'Gilroy-Regular': require('@/assets/fonts/SVN-Gilroy Regular.otf'),
    'Gilroy-Bold': require('@/assets/fonts/SVN-Gilroy Bold.otf'),
    'Gilroy-Medium': require('@/assets/fonts/SVN-Gilroy Medium.otf'),
    'Gilroy-SemiBold': require('@/assets/fonts/SVN-Gilroy SemiBold.otf'),
    'Gilroy-Black': require('@/assets/fonts/SVN-Gilroy Black.otf'),
    PublicSans_200ExtraLight,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  })

  React.useEffect(() => {
    if (isLoaded && fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [isLoaded, fontsLoaded])

  if (!isLoaded || !fontsLoaded) {
    return null
  }

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      {/* Screens only shown when the user is NOT signed in */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
        <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
        <Stack.Screen
          name="(auth)/reset-password"
          options={DEFAULT_AUTH_SCREEN_OPTIONS}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={DEFAULT_AUTH_SCREEN_OPTIONS}
        />
      </Stack.Protected>

      {/* Screens only shown when the user IS signed in */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="admin/(tabs)" options={ADMIN_SCREEN_OPTIONS} />
        {/* Users */}
        <Stack.Screen
          name="admin/users/create"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />
        {/* Tasks */}
        <Stack.Screen name="admin/tasks/create" />
        {/* User settings */}
        <Stack.Screen
          name="(user-settings)/theme-switcher"
          options={{
            title: 'Chọn giao diện',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(user-settings)/change-password"
          options={{
            title: 'Đổi mật khẩu',
            presentation: 'modal',
          }}
        />
      </Stack.Protected>

      {/* Screens outside the guards are accessible to everyone (e.g. not found) */}
    </Stack>
  )
}

const SIGN_IN_SCREEN_OPTIONS = {
  headerShown: false,
  title: 'Sign in',
}

const SIGN_UP_SCREEN_OPTIONS = {
  presentation: 'modal',
  title: '',
  headerTransparent: true,
  gestureEnabled: false,
} as const

const DEFAULT_AUTH_SCREEN_OPTIONS = {
  title: '',
  headerShadowVisible: false,
  headerTransparent: true,
}

const ADMIN_SCREEN_OPTIONS = {
  headerShown: false,
}
