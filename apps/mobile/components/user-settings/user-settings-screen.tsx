import { useAuth, useUser } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import {
  ChartBarIcon,
  ChevronRightIcon,
  CrownIcon,
  HardHatIcon,
  LogOutIcon,
  Repeat2Icon,
  ShieldUserIcon,
  SquareAsteriskIcon,
  SunMoonIcon,
} from 'lucide-react-native'
import type { FC } from 'react'
import { Alert, View } from 'react-native'
import type { User } from '@/api/user/use-user-list'
import { MenuGroup, MenuItem } from '@/components/ui/menu'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { UserAvatar } from '@/components/user-avatar'
import { UserRoleBadge } from '@/components/user-role-badge'
import { saveModulePreference } from '@/lib/module-preference'
import {
  formatPhoneNumber,
  getUserFullName,
  getUserPhoneNumber,
  getUserPrimaryEmail,
  getUserRoles,
} from '@/utils/user-helper'

export type UserSettingsProps = {
  isAdminView?: boolean
}

export const UserSettingsScreen: FC<UserSettingsProps> = ({ isAdminView }) => {
  const { user } = useUser()
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  if (!user) {
    return null
  }

  /**
   * Handle module switching with preference persistence
   */
  const handleModuleSwitch = async (module: 'admin' | 'worker') => {
    try {
      // Save the preference before navigating
      await saveModulePreference(module)

      // Navigate to the selected module
      router.replace(module === 'admin' ? '/admin' : '/worker')
    } catch (error) {
      console.error('Error switching module:', error)
      // Still attempt navigation even if save fails
      router.replace(module === 'admin' ? '/admin' : '/worker')
    }
  }

  const handleSignOut = async () => {
    try {
      // 0. Set logging out flag to suppress error toasts
      const { setLoggingOut } = await import('@/lib/api-client')
      setLoggingOut(true)

      // 1. Clear TanStack Query cache (all cached API responses)
      queryClient.clear()

      // 2. Clear cached token from api-client memory
      // This is handled via module import to access the cachedToken variable
      const { clearTokenCache } = await import('@/lib/api-client')
      clearTokenCache()

      // 3. Clear all AsyncStorage data except app preferences
      const allKeys = await AsyncStorage.getAllKeys()
      const keysToKeep = ['modulePreference', 'theme']
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key))
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove)
      }

      // 4. Clear all SecureStore items (Clerk tokens managed by tokenCache)
      // Note: Clerk handles its own token cleanup via signOut, but we clear explicitly for safety
      try {
        const clerkKeys = [
          '__clerk_client_jwt',
          '__clerk_refresh_token',
          '__clerk_session_id',
        ]
        for (const key of clerkKeys) {
          await SecureStore.deleteItemAsync(key).catch((error: unknown) => {
            // Ignore errors if key doesn't exist
          })
        }
      } catch (error) {
        // SecureStore errors are non-critical, log and continue
        console.warn('Error clearing SecureStore:', error)
      }

      // 5. Sign out from Clerk (this also clears Clerk's internal state)
      await signOut()

      // 6. Reset navigation state and navigate to sign-in screen
      // Note: We use replace to prevent back navigation to authenticated screens
      // Don't use router.canDismiss() after signOut as it may error when user is signed out
      try {
        router.dismissAll()
      } catch {
        // Ignore errors - user might already be signed out
      }
      router.replace('/(auth)/sign-in')

      // 7. Reset the logging out flag after a short delay
      setTimeout(async () => {
        const { setLoggingOut } = await import('@/lib/api-client')
        setLoggingOut(false)
      }, 1000)
    } catch (error) {
      console.error('Logout error:', error)
      // Still attempt to sign out and navigate even if cleanup fails
      try {
        await signOut()
      } catch (signOutError) {
        console.error('SignOut error:', signOutError)
      }
      // Always navigate to sign-in, even if sign out fails
      try {
        router.dismissAll()
      } catch {
        // Ignore errors - user might already be signed out
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
    <View className="gap-4">
      <UserHeader
        user={
          {
            ...user,
            banned: false,
            locked: false,
            privateMetadata: {},
            raw: null,
            lastActiveAt: Date.now(),
            // biome-ignore lint/suspicious/noExplicitAny: <idk>
          } as any as User
        }
      />
      <MenuGroup>
        <Link asChild href="/(user-settings)/theme-switcher">
          <MenuItem
            label="Giao diện"
            leftIcon={SunMoonIcon}
            rightIcon={ChevronRightIcon}
          />
        </Link>
      </MenuGroup>
      {isAdminView && (
        <MenuGroup>
          <Link asChild href="/admin/reports">
            <MenuItem
              label="Báo cáo nhân viên"
              leftIcon={ChartBarIcon}
              rightIcon={ChevronRightIcon}
            />
          </Link>
        </MenuGroup>
      )}
      {/* Module switcher - show for users with ADMIN role (who can switch to worker view) */}
      {(() => {
        const roles = getUserRoles(user as unknown as User)
        const hasAdmin = roles.includes('nv_internal_admin')

        // Users with admin role can always switch between admin/worker views
        // Users with only worker role cannot switch (they don't have access to admin)
        if (!hasAdmin) {
          return null
        }

        return (
          <MenuGroup>
            {isAdminView ? (
              <MenuItem
                label="Chuyển sang tài khoản thợ"
                leftIcon={HardHatIcon}
                onPress={() => handleModuleSwitch('worker')}
                rightIcon={Repeat2Icon}
              />
            ) : (
              <MenuItem
                contentClassName="text-yellow-600 dark:text-yellow-700"
                label="Chuyển sang tài khoản Admin"
                leftIcon={CrownIcon}
                onPress={() => handleModuleSwitch('admin')}
                rightIcon={Repeat2Icon}
              />
            )}
          </MenuGroup>
        )
      })()}
      <MenuGroup>
        <MenuItem
          disabled
          label="Quản lý tài khoản"
          leftIcon={ShieldUserIcon}
          rightIcon={ChevronRightIcon}
        />
        <Link asChild href="/(user-settings)/change-password">
          <MenuItem
            label="Đổi mật khẩu"
            leftIcon={SquareAsteriskIcon}
            rightIcon={ChevronRightIcon}
          />
        </Link>
        <Separator />
        <MenuItem
          contentClassName="!text-destructive"
          label="Đăng xuất"
          leftIcon={LogOutIcon}
          onPress={() =>
            Alert.alert('Xác nhận', 'Bạn có chắc muốn đăng xuất?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: handleSignOut,
              },
            ])
          }
        />
      </MenuGroup>
    </View>
  )
}

export type UserHeaderProps = {
  user: User
}

export const UserHeader: FC<UserHeaderProps> = ({ user }) => {
  const userRoles = getUserRoles(user)
  return (
    <View className="flex-row items-center gap-4 bg-card">
      <UserAvatar className="size-16" user={user} />
      <View>
        <View className="flex-row items-center gap-2">
          <Text variant="large">{getUserFullName(user)}</Text>
          {userRoles.length > 0 &&
            userRoles.map((role) => <UserRoleBadge key={role} role={role} />)}
        </View>
        <Text>
          {getUserPrimaryEmail(user) ||
            formatPhoneNumber(getUserPhoneNumber(user))}
        </Text>
      </View>
    </View>
  )
}
