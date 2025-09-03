import { useUser } from '@clerk/clerk-expo'
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import {
  ImpactFeedbackStyle,
  impactAsync,
  NotificationFeedbackType,
  notificationAsync,
} from 'expo-haptics'
import Fuse from 'fuse.js'
import {
  CircleSlashIcon,
  CrownIcon,
  EllipsisVerticalIcon,
  InfoIcon,
  LockKeyholeOpenIcon,
  type LucideIcon,
  PhoneCallIcon,
  SquareArrowOutUpRightIcon,
  SquareAsteriskIcon,
} from 'lucide-react-native'
import {
  type FC,
  type ReactNode,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FlatList,
  Keyboard,
  Linking,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { useBanUnbanUser } from '@/api/user/use-ban-unban-user'
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { BottomSheet } from './ui/bottom-sheet'
import { Button, type ButtonProps } from './ui/button'
import { EmptyState } from './ui/empty-state'
import { Icon } from './ui/icon'
import { Separator } from './ui/separator'
import { Text } from './ui/text'
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
  const { data, isFetching: isLoading, refetch } = useUserList()

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
            image="laziness"
            messageDescription="Hãy tạo nhân viên mới để bắt đầu làm việc."
            messageTitle="Chưa có nhân viên"
          />
        )) ||
        null
      }
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={isLoading} />
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
              className={cn('font-semibold text-lg text-muted-foreground', {
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
  const isAdmin = isUserAdmin(user)
  const userPhoneNumber = getUserPhoneNumber(user)
  const currentUser = useUser()

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
          <MenuItem icon={InfoIcon} label="Xem thông tin chi tiết" />
        </MenuGroup>
        <MenuGroup>
          <MenuItem
            disabled={!userPhoneNumber}
            icon={PhoneCallIcon}
            label="Gọi điện thoại"
            onPress={() => {
              Linking.openURL(`tel:${userPhoneNumber}`)
            }}
          />
          <MenuItem
            disabled={!userPhoneNumber}
            icon={SquareArrowOutUpRightIcon}
            label="Mở Zalo"
            onPress={() => {
              Linking.openURL(`https://zalo.me/${userPhoneNumber}`)
            }}
          />
        </MenuGroup>
        {/* <Separator /> */}
        <MenuGroup>
          <MenuItem
            icon={SquareAsteriskIcon}
            label="Đặt lại mật khẩu"
            onPress={() => {
              // Handle button press
            }}
          />
          {isAdmin ? (
            <MenuItem
              contentClassName="!text-yellow-600 dark:!text-yellow-700"
              disabled={currentUser.user?.id === user.id}
              icon={CrownIcon}
              label="Huỷ quyền admin"
            />
          ) : (
            <MenuItem
              contentClassName="!text-yellow-600 dark:!text-yellow-700"
              icon={CrownIcon}
              label="Cấp quyền admin"
            />
          )}
          <View className="px-2">
            <Separator />
          </View>
          <BanUserAction bottomSheetRef={ref} user={user} />
        </MenuGroup>
      </BottomSheetView>
    </BottomSheet>
  )
}

export type MenuGroupProps = {
  children: ReactNode
}

export const MenuGroup: FC<MenuGroupProps> = ({ children }) => {
  return <View className="gap-0.5 rounded-lg bg-muted p-2">{children}</View>
}

export type MenuItemProps = ButtonProps & {
  label: string
  contentClassName?: string
  icon?: LucideIcon
}

export const MenuItem: FC<MenuItemProps> = ({
  label,
  contentClassName,
  icon,
  className,
  ...props
}) => {
  return (
    <Button
      className={cn('justify-start px-2 active:bg-card', className)}
      size="lg"
      variant="ghost"
      {...props}
    >
      {(icon && (
        <Icon as={icon} className={cn('size-5', contentClassName)} />
      )) || <View className="mr-5" />}
      <Text className={cn('text-base', contentClassName)}>{label}</Text>
    </Button>
  )
}

export type BanUserActionProps = {
  user: User
  onSuccess?: () => void
  bottomSheetRef: RefObject<BottomSheetModal | null>
}

export const BanUserAction: FC<BanUserActionProps> = ({
  user,
  onSuccess,
  bottomSheetRef,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const isAdmin = isUserAdmin(user)
  const isUserCurrentlyBanned = isUserBanned(user)
  const { mutate: banUnbanUser, isPending } = useBanUnbanUser({
    onSuccess: () => {
      notificationAsync(NotificationFeedbackType.Success)
      setIsOpen(false)
    },
  })

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (open) {
          notificationAsync(NotificationFeedbackType.Warning)
        }
        setIsOpen(open)
      }}
      open={isOpen}
    >
      <AlertDialogTrigger asChild>
        <MenuItem
          contentClassName={cn(
            isUserCurrentlyBanned ? '' : '!text-destructive',
          )}
          disabled={isAdmin}
          icon={isUserCurrentlyBanned ? LockKeyholeOpenIcon : CircleSlashIcon}
          label={isUserCurrentlyBanned ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
          <AlertDialogDescription>
            {isUserCurrentlyBanned
              ? 'Hành động này sẽ mở khoá tài khoản của nhân viên và họ sẽ có thể đăng nhập vào ứng dụng.'
              : 'Hành động này sẽ khoá tài khoản của nhân viên và họ sẽ không thể đăng nhập vào ứng dụng nữa.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            <Text>Huỷ</Text>
          </AlertDialogCancel>
          <Button
            disabled={isPending}
            onPress={() => {
              banUnbanUser({ userId: user.id, ban: !isUserCurrentlyBanned })
            }}
            variant={isUserCurrentlyBanned ? 'default' : 'destructive'}
          >
            <Text>
              {isUserCurrentlyBanned ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
            </Text>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
