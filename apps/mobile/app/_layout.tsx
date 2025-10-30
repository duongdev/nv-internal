/** biome-ignore-all lint/style/useNamingConvention: <Font names are different> */
import '@/global.css'

import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import {
  BeVietnamPro_200ExtraLight as Sans_200ExtraLight,
  BeVietnamPro_300Light as Sans_400Regular,
  BeVietnamPro_500Medium as Sans_500Medium,
  BeVietnamPro_600SemiBold as Sans_600SemiBold,
  BeVietnamPro_700Bold as Sans_700Bold,
  BeVietnamPro_800ExtraBold as Sans_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro'
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
import { KeyboardProvider } from 'react-native-keyboard-controller'
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
          <KeyboardProvider>
            <GestureHandlerRootView className="flex-1 font-gilroy">
              <BottomSheetModalProvider>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Routes />
                <Toasts />
                <PortalHost />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </KeyboardProvider>
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
    Sans_200ExtraLight,
    Sans_400Regular,
    Sans_500Medium,
    Sans_600SemiBold,
    Sans_700Bold,
    Sans_800ExtraBold,
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
    <Stack>
      {/*
        IMPORTANT: Don't use screenOptions here - it creates invisible overlays
        that block Tabs touch events. Apply options to individual screens instead.
        See: docs/architecture/patterns/tabs-navigation.md
      */}
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
        <Stack.Screen
          dangerouslySingular={() => 'admin'}
          name="admin"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          dangerouslySingular={() => 'worker'}
          name="worker"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        {/* Module transit screen - prevents Tabs state corruption */}
        <Stack.Screen
          name="module-transit"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        {/* User settings */}
        <Stack.Screen
          name="(user-settings)/theme-switcher"
          options={{
            title: 'Chọn giao diện',
            presentation: 'modal',
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="(user-settings)/change-password"
          options={{
            title: 'Đổi mật khẩu',
            presentation: 'modal',
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
      </Stack.Protected>

      {/* Screens outside the guards are accessible to everyone (e.g. not found) */}
      {/* Inputs */}
      <Stack.Screen
        name="(inputs)/location-picker"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
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
