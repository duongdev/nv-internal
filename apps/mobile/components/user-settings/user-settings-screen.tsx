import { useAuth, useUser } from '@clerk/clerk-expo'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'expo-router'
import {
  ChevronRightIcon,
  LogOutIcon,
  ShieldUserIcon,
  SquareAsteriskIcon,
  SunMoonIcon,
} from 'lucide-react-native'
import type { FC } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import type { User } from '@/api/user/use-user-list'
import { MenuGroup, MenuItem } from '@/components/ui/menu'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { UserAvatar } from '@/components/user-avatar'
import { UserRoleBadge } from '@/components/user-role-badge'
import {
  formatPhoneNumber,
  getUserFullName,
  getUserPhoneNumber,
  getUserPrimaryEmail,
  getUserRoles,
} from '@/utils/user-helper'

export type UserSettingsProps = {}

export const UserSettingsScreen: FC<UserSettingsProps> = () => {
  const { user } = useUser()
  const { signOut } = useAuth()
  const queryClient = useQueryClient()

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    queryClient.clear()
  }

  return (
    <ScrollView contentContainerClassName="flex-1 gap-4 p-4">
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
      <MenuGroup>
        <MenuItem
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
    </ScrollView>
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
