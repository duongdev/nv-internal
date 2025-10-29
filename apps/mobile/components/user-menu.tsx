import { useAuth, useUser } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { TriggerRef } from '@rn-primitives/popover'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react-native'
import * as React from 'react'
import { View } from 'react-native'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Text } from '@/components/ui/text'

export function UserMenu() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const popoverTriggerRef = React.useRef<TriggerRef>(null)

  async function onSignOut() {
    popoverTriggerRef.current?.close()

    try {
      // 0. Set logging out flag to suppress error toasts
      const { setLoggingOut } = await import('@/lib/api-client')
      setLoggingOut(true)

      // 1. Clear TanStack Query cache
      queryClient.clear()

      // 2. Clear cached token from api-client
      const { clearTokenCache } = await import('@/lib/api-client')
      clearTokenCache()

      // 3. Clear AsyncStorage (except preferences)
      const allKeys = await AsyncStorage.getAllKeys()
      const keysToKeep = ['modulePreference', 'theme']
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key))
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove)
      }

      // 4. Clear SecureStore Clerk tokens
      try {
        const clerkKeys = [
          '__clerk_client_jwt',
          '__clerk_refresh_token',
          '__clerk_session_id',
        ]
        for (const key of clerkKeys) {
          await SecureStore.deleteItemAsync(key).catch(() => {
            // Ignore errors if key doesn't exist
          })
        }
      } catch (error) {
        console.warn('Error clearing SecureStore:', error)
      }

      // 5. Sign out from Clerk
      await signOut()

      // 6. Reset navigation state and navigate to sign-in screen
      if (router.canDismiss()) {
        router.dismissAll()
      }
      router.replace('/(auth)/sign-in')

      // 7. Reset the logging out flag after a short delay
      setTimeout(async () => {
        const { setLoggingOut } = await import('@/lib/api-client')
        setLoggingOut(false)
      }, 1000)
    } catch (error) {
      console.error('Logout error:', error)
      try {
        await signOut()
      } catch (signOutError) {
        console.error('SignOut error:', signOutError)
      }
      // Always navigate to sign-in, even if sign out fails
      if (router.canDismiss()) {
        router.dismissAll()
      }
      router.replace('/(auth)/sign-in')

      // Reset the logging out flag
      setTimeout(async () => {
        const { setLoggingOut } = await import('@/lib/api-client')
        setLoggingOut(false)
      }, 1000)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild ref={popoverTriggerRef}>
        <Button className="size-8 rounded-full" size="icon" variant="ghost">
          <UserAvatar />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" side="bottom">
        <View className="gap-3 border-border border-b p-3">
          <View className="flex-row items-center gap-3">
            <UserAvatar className="size-10" />
            <View className="flex-1">
              <Text className="font-medium leading-5">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </Text>
              {user?.fullName?.length ? (
                <Text className="font-normal text-muted-foreground text-sm leading-4">
                  {user?.username || user?.emailAddresses[0]?.emailAddress}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3 py-0.5">
            <Button
              onPress={() => {
                // TODO: Navigate to account settings screen
              }}
              size="sm"
              variant="outline"
            >
              <Icon as={SettingsIcon} className="size-4" />
              <Text>Manage Account</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={onSignOut}
              size="sm"
              variant="outline"
            >
              <Icon as={LogOutIcon} className="size-4" />
              <Text>Sign Out</Text>
            </Button>
          </View>
        </View>
        <Button
          className="h-16 justify-start gap-3 rounded-none rounded-b-md px-3 sm:h-14"
          onPress={() => {
            // TODO: Navigate to add account screen
          }}
          size="lg"
          variant="ghost"
        >
          <View className="size-10 items-center justify-center">
            <View className="size-7 items-center justify-center rounded-full border border-border border-dashed bg-muted/50">
              <Icon as={PlusIcon} className="size-5" />
            </View>
          </View>
          <Text>Add account</Text>
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function UserAvatar(props: Omit<React.ComponentProps<typeof Avatar>, 'alt'>) {
  const { user } = useUser()

  const { initials, imageSource, userName } = React.useMemo(() => {
    const userName =
      user?.fullName || user?.emailAddresses[0]?.emailAddress || 'Unknown'
    const initials = userName
      .split(' ')
      .map((name) => name[0])
      .join('')

    const imageSource = user?.imageUrl ? { uri: user.imageUrl } : undefined
    return { initials, imageSource, userName }
  }, [user?.imageUrl, user?.fullName, user?.emailAddresses[0]?.emailAddress])

  return (
    <Avatar alt={`${userName}'s avatar`} {...props}>
      <AvatarImage source={imageSource} />
      <AvatarFallback>
        <Text>{initials}</Text>
      </AvatarFallback>
    </Avatar>
  )
}
