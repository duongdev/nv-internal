import '@/global.css'

import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { Appearance, View } from 'react-native'
import { FONT_FAMILY, NAV_THEME } from '@/lib/theme'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

Appearance.setColorScheme('light')

export default function RootLayout() {
  const { colorScheme } = useColorScheme()

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <View className="flex-1 font-gilroy">
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Routes />
          <PortalHost />
        </View>
      </ThemeProvider>
    </ClerkProvider>
  )
}

SplashScreen.preventAutoHideAsync()

function Routes() {
  const { isSignedIn, isLoaded } = useAuth()
  const [fontsLoaded] = useFonts({
    // 'AirbnbCereal-Black': require('@/assets/fonts/AirbnbCereal-Black.ttf'),
    // 'AirbnbCereal-Bold': require('@/assets/fonts/AirbnbCereal-Bold.ttf'),
    // 'AirbnbCereal-Book': require('@/assets/fonts/AirbnbCereal-Book.ttf'),
    // 'AirbnbCereal-ExtraBold': require('@/assets/fonts/AirbnbCereal-ExtraBold.ttf'),
    // 'AirbnbCereal-Light': require('@/assets/fonts/AirbnbCereal-Light.ttf'),
    // 'AirbnbCereal-Medium': require('@/assets/fonts/AirbnbCereal-Medium.ttf'),
    'Gilroy-Regular': require('@/assets/fonts/SVN-Gilroy Regular.otf'),
    'Gilroy-Bold': require('@/assets/fonts/SVN-Gilroy Bold.otf'),
    'Gilroy-Medium': require('@/assets/fonts/SVN-Gilroy Medium.otf'),
    'Gilroy-SemiBold': require('@/assets/fonts/SVN-Gilroy SemiBold.otf'),
    'Gilroy-Black': require('@/assets/fonts/SVN-Gilroy Black.otf'),
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
        <Stack.Screen
          name="admin/users/create"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
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
