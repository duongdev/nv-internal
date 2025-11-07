/** biome-ignore-all lint/style/useNamingConvention: <Font names are different> */
import '@/global.css'

import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo'
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
import { Stack, usePathname } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { PostHogProvider, usePostHog } from 'posthog-react-native'
import * as React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { Toasts } from '@/components/ui/toasts'
import { queryClient } from '@/lib/api-client'
import { getClerkPublishableKey } from '@/lib/env'
import {
  createPostHogClient,
  identifyUser,
  resetPostHog,
  trackScreen,
} from '@/lib/posthog'
import { FONT_FAMILY, NAV_THEME } from '@/lib/theme'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export default function RootLayout() {
  const { colorScheme } = useColorScheme()

  // Create PostHog client instance (memoized to prevent recreation)
  const posthogClient = React.useMemo(() => createPostHogClient(), [])

  return (
    <ClerkProvider
      publishableKey={getClerkPublishableKey()}
      tokenCache={tokenCache}
    >
      {/* ALWAYS wrap with PostHogProvider - it handles null client gracefully */}
      <PostHogProvider
        autocapture={{
          captureScreens: false,
          captureTouches: true,
        }}
        client={posthogClient}
      >
        <AppContent colorScheme={colorScheme ?? 'light'} />
      </PostHogProvider>
    </ClerkProvider>
  )
}

function AppContent({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
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
  )
}

SplashScreen.preventAutoHideAsync()

function Routes() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const pathname = usePathname()
  const posthog = usePostHog()
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

  // User identification in PostHog
  React.useEffect(() => {
    if (isLoaded && user) {
      identifyUser(posthog, user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        role: user.publicMetadata?.role as string,
        created_at: user.createdAt,
      })
    } else if (isLoaded && !user) {
      resetPostHog(posthog)
    }
  }, [user, isLoaded, posthog])

  // Screen tracking
  React.useEffect(() => {
    const screenName =
      pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ') || 'Home'

    trackScreen(posthog, screenName, {
      path: pathname,
    })
  }, [pathname, posthog])

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
