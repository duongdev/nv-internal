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
    <BottomSheetView className="flex-1 gap-2 px-4">
      <SearchBox
        accessibilityHint="Tìm kiếm nhân viên theo tên hoặc số điện thoại"
        accessibilityLabel="Tìm kiếm nhân viên"
        isInBottomSheet
        onChangeTextDebounced={setSearchText}
        placeholder="Tìm nhân viên..."
        testID="assignee-search-input"
      />
      {isLoading && <ActivityIndicator className="my-1" />}
      {/*
        IMPORTANT: Use BottomSheetFlatList from @gorhom/bottom-sheet for scrolling within bottom sheets.
        Regular FlatList from react-native does NOT work properly in bottom sheets.
        - Buttons are placed OUTSIDE FlatList to ensure they are always accessible
        - Fixed action bar provides better UX and cleaner gesture handling
      */}
      <BottomSheetFlatList
        contentContainerStyle={{ paddingBottom: 16 }}
        data={users}
        keyExtractor={(item: (typeof users)[number]) => item.id}
        refreshControl={
          <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
        }
        renderItem={({ item }: { item: (typeof users)[number] }) => {
          const isSelected = selectedUserIds.includes(item.id)
          const fullName = `${item.lastName} ${item.firstName}`

          return (
            <Pressable
              accessibilityHint={`${isSelected ? 'Bỏ chọn' : 'Chọn'} nhân viên ${fullName}`}
              accessibilityLabel={`${fullName}${isSelected ? ', đã chọn' : ''}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              className="flex-row items-center justify-between gap-2 rounded-lg border-muted border-b px-2 active:bg-muted"
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Light)
                const newSelectedUserIds = selectedUserIds.includes(item.id)
                  ? selectedUserIds.filter((id) => id !== item.id)
                  : [...selectedUserIds, item.id]
                onChangeSelectedUserIds(newSelectedUserIds)
              }}
              testID={`assignee-user-${item.id}-item`}
            >
              <View className="py-2">
                <View className="flex-row items-center gap-2">
                  <Text
                    className={cn(
                      'font-semibold text-lg text-muted-foreground',
                      {
                        'line-through': isUserBanned(item),
                      },
                    )}
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
          )
        }}
      />
      {/* Fixed action bar outside FlatList for better gesture handling */}
      {(onCancel || onSave) && (
        <View className="flex-row gap-2 pt-4 pb-6">
          {onCancel && (
            <Button
              accessibilityLabel="Hủy chọn nhân viên"
              accessibilityRole="button"
              className="flex-1"
              onPress={onCancel}
              testID="assignee-cancel-button"
              variant="outline"
            >
              <Text>Hủy</Text>
            </Button>
          )}
          {onSave && (
            <Button
              accessibilityHint={`Lưu ${selectedUserIds.length} nhân viên đã chọn`}
              accessibilityLabel="Xác nhận phân công"
              accessibilityRole="button"
              className="flex-1"
              onPress={onSave}
              testID="assignee-confirm-button"
            >
              <Text>Lưu</Text>
            </Button>
          )}
        </View>
      )}
    </BottomSheetView>
  )
}
