import { BottomSheetView } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import Fuse from 'fuse.js'
import { CheckIcon } from 'lucide-react-native'
import { type FC, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { useUserList } from '@/api/user/use-user-list'
import { cn } from '@/lib/utils'
import {
  formatPhoneNumber,
  getUserPhoneNumber,
  getUserRoles,
  isUserBanned,
} from '@/utils/user-helper'
import { Icon } from './ui/icon'
import { SearchBox } from './ui/search-box'
import { Text } from './ui/text'
import { UserRoleBadge } from './user-role-badge'

export type UserSelectBottomSheetModalProps = {
  selectedUserIds: string[]
  onChangeSelectedUserIds: (userIds: string[]) => void
}

export const UserSelectBottomSheetModal: FC<
  UserSelectBottomSheetModalProps
> = ({ selectedUserIds, onChangeSelectedUserIds }) => {
  const [searchText, setSearchText] = useState('')
  const { data, isLoading, refetch, isRefetching } = useUserList()

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
    <BottomSheetView className="h-full flex-1 gap-2 px-4 pb-safe">
      <SearchBox
        isInBottomSheet
        onChangeTextDebounced={setSearchText}
        placeholder="Tìm nhân viên..."
      />
      {isLoading && <ActivityIndicator className="my-1" />}
      <FlatList
        className="flex-1"
        contentContainerClassName="flex-1"
        data={users}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center justify-between gap-2 rounded-lg border-muted border-b px-2 active:bg-muted"
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light)
              const newSelectedUserIds = selectedUserIds.includes(item.id)
                ? selectedUserIds.filter((id) => id !== item.id)
                : [...selectedUserIds, item.id]
              onChangeSelectedUserIds(newSelectedUserIds)
            }}
          >
            <View className="py-2">
              <View className="flex-row items-center gap-2">
                <Text
                  className={cn('font-semibold text-lg text-muted-foreground', {
                    'line-through': isUserBanned(item),
                  })}
                >
                  {item.lastName} <Text>{item.firstName}</Text>
                </Text>
                {getUserRoles(item).length > 0 &&
                  getUserRoles(item).map((role) => (
                    <UserRoleBadge key={role} role={role} />
                  ))}
              </View>
              <Text className="text-muted-foreground text-sm">
                {formatPhoneNumber(getUserPhoneNumber(item))}
              </Text>
            </View>
            <Icon
              as={CheckIcon}
              className={cn('size-6 text-primary opacity-0', {
                'opacity-100': selectedUserIds.includes(item.id),
              })}
            />
          </Pressable>
        )}
      />
    </BottomSheetView>
  )
}
