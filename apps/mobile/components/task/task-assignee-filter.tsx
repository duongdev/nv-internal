import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CheckIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { type User, useUserList } from '@/api/user/use-user-list'
import { Icon } from '@/components/ui/icon'
import { SearchBox } from '@/components/ui/search-box'
import { Text } from '@/components/ui/text'
import { UserRoleBadge } from '@/components/user-role-badge'
import { useUserSearch } from '@/hooks/use-user-search'
import { cn } from '@/lib/utils'
import {
  formatPhoneNumber,
  getUserPhoneNumber,
  getUserRoles,
  isUserBanned,
} from '@/utils/user-helper'

export type TaskAssigneeFilterProps = {
  selectedUserIds: string[]
  onChangeSelectedUserIds: (userIds: string[]) => void
}

/**
 * Multi-select assignee filter component (admin only)
 * Allows admins to filter tasks by assigned users
 * Uses the same user selection pattern as UserSelectBottomSheetModal
 */
export const TaskAssigneeFilter: FC<TaskAssigneeFilterProps> = ({
  selectedUserIds,
  onChangeSelectedUserIds,
}) => {
  const [searchText, setSearchText] = useState('')
  const { data, isLoading, refetch, isRefetching } = useUserList()

  // Use Fuse.js for fuzzy search with accent-insensitive matching
  const users = useUserSearch(data, searchText)

  const toggleUser = (userId: string) => {
    impactAsync(ImpactFeedbackStyle.Light)

    if (selectedUserIds.includes(userId)) {
      // Remove user
      onChangeSelectedUserIds(selectedUserIds.filter((id) => id !== userId))
    } else {
      // Add user
      onChangeSelectedUserIds([...selectedUserIds, userId])
    }
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-muted-foreground text-sm">
        Nhân viên
      </Text>

      <SearchBox
        accessibilityHint="Tìm kiếm nhân viên theo tên hoặc số điện thoại"
        accessibilityLabel="Tìm kiếm nhân viên"
        isInBottomSheet
        onChangeTextDebounced={setSearchText}
        placeholder="Tìm nhân viên..."
        testID="assignee-filter-search-input"
      />

      {isLoading && <ActivityIndicator className="my-1" />}

      {/*
        IMPORTANT: Use BottomSheetFlatList from @gorhom/bottom-sheet for scrolling within bottom sheets.
        Regular FlatList from react-native does NOT work properly in bottom sheets.
      */}
      <BottomSheetFlatList
        contentContainerStyle={{ paddingBottom: 16 }}
        data={users}
        keyExtractor={(item: User) => item.id}
        refreshControl={
          <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
        }
        renderItem={({ item }: { item: User }) => {
          const isSelected = selectedUserIds.includes(item.id)

          return (
            <Pressable
              accessibilityHint={`${isSelected ? 'Bỏ chọn' : 'Chọn'} nhân viên ${item.lastName} ${item.firstName}`}
              accessibilityLabel={`${item.lastName} ${item.firstName}${isSelected ? ', đã chọn' : ''}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              className="flex-row items-center justify-between gap-2 rounded-lg border-muted border-b px-2 active:bg-muted"
              onPress={() => toggleUser(item.id)}
              testID={`assignee-filter-user-${item.id}-item`}
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
              <View
                className={cn(
                  'size-5 items-center justify-center rounded border',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground bg-background',
                )}
              >
                {isSelected && (
                  <Icon
                    as={CheckIcon}
                    className="size-4 text-primary-foreground"
                  />
                )}
              </View>
            </Pressable>
          )
        }}
        style={{ maxHeight: 400 }}
      />
    </View>
  )
}
