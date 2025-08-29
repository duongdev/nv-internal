import { useUser } from '@clerk/clerk-expo'
import { Link, Stack, useRouter } from 'expo-router'
import { MoonStarIcon, SunIcon, XIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { Image, type ImageStyle, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { UserMenu } from '@/components/user-menu'
import { useUserRole } from '@/hooks/use-user-role'

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
}

const CLERK_LOGO = {
  light: require('@/assets/images/clerk-logo-light.png'),
  dark: require('@/assets/images/clerk-logo-dark.png'),
}

const LOGO_STYLE: ImageStyle = {
  height: 36,
  width: 40,
}

const SCREEN_OPTIONS = {
  header: () => (
    <View className="absolute top-safe right-0 left-0 web:mx-2 flex-row justify-between px-4 py-2">
      <ThemeToggle />
      <UserMenu />
    </View>
  ),
}

export default function Screen() {
  const { colorScheme } = useColorScheme()
  const { user } = useUser()
  const { isAdmin } = useUserRole()
  const router = useRouter()

  React.useEffect(() => {
    if (isAdmin) {
      // If the user is an admin, redirect to the admin dashboard
      router.replace('/(auth)/sign-in')
    }
  }, [isAdmin, router])

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1 items-center justify-center gap-8 p-4">
        <View className="flex-row items-center justify-center gap-3.5">
          <Image
            resizeMode="contain"
            source={CLERK_LOGO[colorScheme ?? 'light']}
            style={LOGO_STYLE}
          />
          <Icon as={XIcon} className="mr-1 size-5" />
          <Image
            resizeMode="contain"
            source={LOGO[colorScheme ?? 'light']}
            style={LOGO_STYLE}
          />
        </View>
        <View className="max-w-sm gap-2 px-4">
          <Text className="text-3xl" variant="h1">
            Chào mừng đến với Nam Việt Make it yours
            {user?.firstName ? `, ${user.firstName}` : ''}.
          </Text>
          <Text className="text-center font-mono ios:text-foreground text-muted-foreground text-sm">
            Update the screens and components to match your design and logic.
          </Text>
        </View>
        <View className="gap-2">
          <Link asChild href="https://go.clerk.com/8e6CCee">
            <Button size="sm">
              <Text className="">Explore Clerk Docs</Text>
            </Button>
          </Link>
        </View>
      </View>
    </>
  )
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
}

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme()

  return (
    <Button
      className="rounded-full"
      onPress={toggleColorScheme}
      size="icon"
      variant="ghost"
    >
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-6" />
    </Button>
  )
}
