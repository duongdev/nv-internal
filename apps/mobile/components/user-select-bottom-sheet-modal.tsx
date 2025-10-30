import { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CheckIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { useUserList } from '@/api/user/use-user-list'
import { useUserSearch } from '@/hooks/use-user-search'
import { cn } from '@/lib/utils'
import {
  formatPhoneNumber,
  getUserPhoneNumber,
  getUserRoles,
  isUserBanned,
} from '@/utils/user-helper'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { SearchBox } from './ui/search-box'
import { Text } from './ui/text'
import { UserRoleBadge } from './user-role-badge'

export type UserSelectBottomSheetModalProps = {
  selectedUserIds: string[]
  onChangeSelectedUserIds: (userIds: string[]) => void
  onCancel?: () => void
  onSave?: () => void
}

export const UserSelectBottomSheetModal: FC<
  UserSelectBottomSheetModalProps
> = ({ selectedUserIds, onChangeSelectedUserIds, onCancel, onSave }) => {
  const [searchText, setSearchText] = useState('')
  const { data, isLoading, refetch, isRefetching } = useUserList()

  // Use Fuse.js for fuzzy search with accent-insensitive matching
  const users = useUserSearch(data, searchText)

  return (
    <BottomSheetView className="gap-2 px-4">
      <SearchBox
        isInBottomSheet
        onChangeTextDebounced={setSearchText}
        placeholder="Tìm nhân viên..."
      />
      {isLoading && <ActivityIndicator className="my-1" />}
      {/*
        IMPORTANT: Use BottomSheetFlatList from @gorhom/bottom-sheet for scrolling within bottom sheets.
        Regular FlatList from react-native does NOT work properly in bottom sheets.
        - Buttons are placed in ListFooterComponent to ensure they scroll with content
        - contentContainerStyle provides padding for the bottom content
      */}
      <BottomSheetFlatList
        contentContainerStyle={{ paddingBottom: 16 }}
        data={users}
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          (onCancel || onSave) && (
            <View className="flex-row gap-2 pt-4 pb-6">
              {onCancel && (
                <Button className="flex-1" onPress={onCancel} variant="outline">
                  <Text>Hủy</Text>
                </Button>
              )}
              {onSave && (
                <Button className="flex-1" onPress={onSave}>
                  <Text>Lưu</Text>
                </Button>
              )}
            </View>
          )
        }
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
