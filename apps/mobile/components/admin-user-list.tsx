import { useUser } from '@clerk/clerk-expo'
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { UserRole } from '@nv-internal/validation'
import {
  ImpactFeedbackStyle,
  impactAsync,
  NotificationFeedbackType,
  notificationAsync,
} from 'expo-haptics'
import Fuse from 'fuse.js'
import {
  ChevronRightIcon,
  CircleSlashIcon,
  CrownIcon,
  EllipsisVerticalIcon,
  InfoIcon,
  LockKeyholeOpenIcon,
  PhoneCallIcon,
  SquareArrowOutUpRightIcon,
  SquareAsteriskIcon,
} from 'lucide-react-native'
import { type FC, type RefObject, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Linking,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { useBanUnbanUser } from '@/api/user/use-ban-unban-user'
import { useUpdateUserRoles } from '@/api/user/use-update-user-roles'
import { type User, useUserList } from '@/api/user/use-user-list'
import { cn } from '@/lib/utils'
import {
  formatPhoneNumber,
  getUserFullName,
  getUserPhoneNumber,
  getUserPrimaryEmail,
  getUserRoles,
  isUserAdmin,
  isUserBanned,
} from '@/utils/user-helper'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { EmptyState } from './ui/empty-state'
import { Icon } from './ui/icon'
import { MenuGroup, MenuItem } from './ui/menu'
import { Separator } from './ui/separator'
import { Text } from './ui/text'
import { ToastPosition, toast } from './ui/toasts'
import { UserAvatar } from './user-avatar'
import { UserRoleBadge } from './user-role-badge'

export type AdminUserListProps = {
  contentContainerClassName?: string
  searchText?: string
}

export const AdminUserList: FC<AdminUserListProps> = ({
  contentContainerClassName,
  searchText,
}) => {
  const { data, isLoading, refetch, isRefetching } = useUserList()

  const onRefresh = async () => {
    await refetch()
  }

  const users = useMemo(() => {
    if (!data) {
      return []
    }

    if (!searchText) {
      return data
    }

    const fuse = new Fuse(
      data.map((user) => ({
        ...user,
        phoneNumber: getUserPhoneNumber(user),
      })),
      {
        keys: ['firstName', 'lastName', 'phoneNumber', 'username'],
        threshold: 0.3,
      },
    )

    return fuse.search(searchText).map((result) => result.item)
  }, [data, searchText])

  if (isLoading) {
    return <ActivityIndicator className="my-2" />
  }

  return (
    <FlatList
      contentContainerClassName={cn(contentContainerClassName)}
      contentInsetAdjustmentBehavior="automatic"
      data={users}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        (!isLoading && (
          <EmptyState
            className="flex-1"
            image="laziness"
            messageDescription="Hãy tạo nhân viên mới để bắt đầu làm việc."
            messageTitle="Chưa có nhân viên"
          />
        )) ||
        null
      }
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={isRefetching} />
      }
      renderItem={({ item }) => <UserListItem user={item} />}
    />
  )
}

export type UserListItemProps = {
  user: User
}

export const UserListItem: FC<UserListItemProps> = ({ user }) => {
  const userRoles = getUserRoles(user)
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const handleOpenUserActions = () => {
    Keyboard.dismiss()
    impactAsync(ImpactFeedbackStyle.Light)
    bottomSheetRef.current?.present()
  }

  return (
    <>
      <Pressable
        className="flex-row items-center justify-between border-muted border-b py-2"
        onLongPress={handleOpenUserActions}
      >
        <View>
          <View className="flex-row items-center gap-2">
            <Text
              className={cn('font-semibold text-muted-foreground', {
                'line-through': isUserBanned(user),
              })}
            >
              {user.lastName} <Text>{user.firstName}</Text>
            </Text>
            {userRoles.length > 0 &&
              userRoles.map((role) => <UserRoleBadge key={role} role={role} />)}
          </View>
          <Text className="text-muted-foreground text-sm">
            {formatPhoneNumber(getUserPhoneNumber(user))}
          </Text>
        </View>
        <Button onPress={handleOpenUserActions} size="icon" variant="ghost">
          <Icon as={EllipsisVerticalIcon} />
        </Button>
      </Pressable>
      <AdminUserUserActionSheet ref={bottomSheetRef} user={user} />
    </>
  )
}

export type AdminUserUserActionSheetProps = {
  ref: RefObject<BottomSheetModal | null>
  user: User
}

export const AdminUserUserActionSheet: FC<AdminUserUserActionSheetProps> = ({
  ref,
  user,
}) => {
  const userRoles = getUserRoles(user)
  const userPhoneNumber = getUserPhoneNumber(user)

  return (
    <BottomSheet enableDynamicSizing ref={ref}>
      <BottomSheetView className="gap-2 px-4 pb-safe">
        <View className="flex-row items-center gap-4">
          <UserAvatar className="size-16" user={user} />
          <View>
            <View className="flex-row items-center gap-2">
              <Text
                className={cn({ 'line-through': isUserBanned(user) })}
                variant="large"
              >
                {getUserFullName(user)}
              </Text>
              {userRoles.length > 0 &&
                userRoles.map((role) => (
                  <UserRoleBadge key={role} role={role} />
                ))}
            </View>
            <Text>
              {getUserPrimaryEmail(user) ||
                formatPhoneNumber(getUserPhoneNumber(user))}
            </Text>
          </View>
        </View>
        <Separator />
        <MenuGroup>
          <MenuItem
            label="Xem thông tin chi tiết"
            leftIcon={InfoIcon}
            rightIcon={ChevronRightIcon}
          />
        </MenuGroup>
        <MenuGroup>
          <MenuItem
            disabled={!userPhoneNumber}
            label="Gọi điện thoại"
            leftIcon={PhoneCallIcon}
            onPress={() => {
              Linking.openURL(`tel:${userPhoneNumber}`)
            }}
          />
          <MenuItem
            disabled={!userPhoneNumber}
            label="Mở Zalo"
            leftIcon={SquareArrowOutUpRightIcon}
            onPress={() => {
              Linking.openURL(`https://zalo.me/${userPhoneNumber}`)
            }}
          />
        </MenuGroup>
        {/* <Separator /> */}
        <MenuGroup>
          <MenuItem
            disabled
            label="Đặt lại mật khẩu"
            leftIcon={SquareAsteriskIcon}
            onPress={() => {
              // Handle button press
            }}
          />
          <GrantAdminAction user={user} />
          <View className="px-2">
            <Separator />
          </View>
          <BanUserAction user={user} />
        </MenuGroup>
      </BottomSheetView>
    </BottomSheet>
  )
}

export type BanUserActionProps = {
  user: User
}

export const BanUserAction: FC<BanUserActionProps> = ({ user }) => {
  const isAdmin = isUserAdmin(user)
  const isUserCurrentlyBanned = isUserBanned(user)
  const { mutate: banUnbanUser, isPending } = useBanUnbanUser({
    onSuccess: () => {
      notificationAsync(NotificationFeedbackType.Success)
      toast.success('Đã cập nhật trạng thái người dùng thành công', {
        position: ToastPosition.TOP,
      })
    },
  })

  return (
    <MenuItem
      contentClassName={cn(isUserCurrentlyBanned ? '' : '!text-destructive')}
      disabled={isAdmin || isPending}
      label={isUserCurrentlyBanned ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
      leftIcon={isUserCurrentlyBanned ? LockKeyholeOpenIcon : CircleSlashIcon}
      onPress={() => {
        Alert.alert(
          'Xác nhận',
          isUserCurrentlyBanned
            ? 'Bạn có chắc chắn muốn mở khoá tài khoản này?'
            : 'Bạn có chắc chắn muốn khoá tài khoản này?',
          [
            { text: 'Huỷ', style: 'cancel' },
            {
              text: isUserCurrentlyBanned
                ? 'Mở khoá tài khoản'
                : 'Khoá tài khoản',
              style: 'destructive',
              onPress: () => {
                banUnbanUser({ userId: user.id, ban: !isUserCurrentlyBanned })
              },
            },
          ],
        )
      }}
    />
  )
}

export type GrantAdminActionProps = {
  user: User
}

export const GrantAdminAction: FC<GrantAdminActionProps> = ({ user }) => {
  const currentUser = useUser()
  const isAdmin = isUserAdmin(user)
  const isUserCurrentlyBanned = isUserBanned(user)
  const isCurrentUser = currentUser.user?.id === user.id
  const currentRoles = getUserRoles(user)
  const { mutate: updateUserRoles, isPending } = useUpdateUserRoles({
    onSuccess: () => {
      notificationAsync(NotificationFeedbackType.Success)
      toast.success('Đã cập nhật quyền admin thành công', {
        position: ToastPosition.TOP,
      })
    },
  })

  return (
    <MenuItem
      contentClassName="!text-yellow-600 dark:!text-yellow-700"
      disabled={isCurrentUser || isUserCurrentlyBanned || isPending}
      label={isAdmin ? 'Huỷ quyền admin' : 'Cấp quyền admin'}
      leftIcon={CrownIcon}
      onPress={() => {
        Alert.alert(
          'Xác nhận',
          isAdmin
            ? 'Bạn có chắc chắn muốn huỷ quyền admin cho người dùng này?'
            : 'Bạn có chắc chắn muốn cấp quyền admin cho người dùng này?',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: isAdmin ? 'Huỷ quyền admin' : 'Cấp quyền admin',
              style: 'destructive',
              onPress: () => {
                updateUserRoles({
                  userId: user.id,
                  roles: isAdmin
                    ? currentRoles.filter((r) => r !== UserRole.nvInternalAdmin)
                    : [...currentRoles, UserRole.nvInternalAdmin],
                })
              },
            },
          ],
        )
      }}
    />
  )
}
