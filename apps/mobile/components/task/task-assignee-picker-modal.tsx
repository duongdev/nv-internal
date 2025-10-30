import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CheckIcon, SearchIcon } from 'lucide-react-native'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  View,
} from 'react-native'
import { type User, useUserList } from '@/api/user/use-user-list'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { UserRoleBadge } from '@/components/user-role-badge'
import { useColorPalette } from '@/hooks/use-color-palette'
import { useUserSearch } from '@/hooks/use-user-search'
import { cn } from '@/lib/utils'
import {
  formatPhoneNumber,
  getUserPhoneNumber,
  getUserRoles,
  isUserBanned,
} from '@/utils/user-helper'

export type TaskAssigneePickerModalProps = {
  selectedUserIds: string[]
  onApply: (userIds: string[]) => void
}

export type TaskAssigneePickerModalMethods = {
  present: () => void
  dismiss: () => void
}

/**
 * Separate assignee picker modal (admin only)
 * Opens as independent bottom sheet to avoid VirtualizedList nesting
 *
 * Features:
 * - Multi-select user list with search
 * - Fuzzy search with accent-insensitive matching
 * - Pull-to-refresh
 * - Apply/Cancel actions
 * - Haptic feedback
 *
 * IMPORTANT: This component uses BottomSheetFlatList at the root level,
 * which is safe because it's in a separate modal (not nested in ScrollView)
 */
export const TaskAssigneePickerModal = forwardRef<
  TaskAssigneePickerModalMethods,
  TaskAssigneePickerModalProps
>(({ selectedUserIds: initialSelectedUserIds, onApply }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null)
  const { getColor } = useColorPalette()

  const [searchText, setSearchText] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialSelectedUserIds,
  )

  const { data, isLoading, refetch, isRefetching } = useUserList()

  // Use Fuse.js for fuzzy search with accent-insensitive matching
  const users = useUserSearch(data, searchText)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      setSelectedUserIds(initialSelectedUserIds)
      setSearchText('')
      bottomSheetRef.current?.present()
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss()
    },
  }))

  const toggleUser = (userId: string) => {
    impactAsync(ImpactFeedbackStyle.Light)

    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId))
    } else {
      setSelectedUserIds([...selectedUserIds, userId])
    }
  }

  const handleApply = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    onApply(selectedUserIds)
    bottomSheetRef.current?.dismiss()
  }

  const handleCancel = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    bottomSheetRef.current?.dismiss()
  }

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints={['90%']}>
      {/*
        IMPORTANT: Use BottomSheetFlatList from @gorhom/bottom-sheet for scrolling within bottom sheets.
        This is safe here because it's the ROOT scrollable element (not nested in another scroll view).
        ListHeaderComponent provides the search bar and header that scrolls with content.
        ListFooterComponent provides action buttons that scroll with content.
      */}
      <BottomSheetFlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={users}
        keyExtractor={(item: User) => item.id}
        ListEmptyComponent={
          !isLoading && (
            <View className="items-center justify-center py-8">
              <Text className="text-center text-muted-foreground">
                Không tìm thấy nhân viên
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View className="flex-row gap-2 pt-4 pb-6">
            <Button className="flex-1" onPress={handleCancel} variant="outline">
              <Text>Hủy</Text>
            </Button>
            <Button className="flex-1" onPress={handleApply}>
              <Text>Áp dụng ({selectedUserIds.length})</Text>
            </Button>
          </View>
        }
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-bold text-foreground text-xl">
                Chọn nhân viên
              </Text>
              {selectedUserIds.length > 0 && (
                <View className="rounded-full bg-primary px-2.5 py-1">
                  <Text className="font-sans-bold text-primary-foreground text-xs">
                    {selectedUserIds.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Search Box */}
            <View className="relative">
              <BottomSheetTextInput
                accessibilityHint="Tìm kiếm nhân viên theo tên hoặc số điện thoại"
                accessibilityLabel="Tìm kiếm nhân viên"
                accessibilityRole="search"
                className="h-11 rounded-lg border border-muted bg-background pr-4 pl-10 font-sans text-base text-foreground"
                onChangeText={setSearchText}
                placeholder="Tìm nhân viên..."
                placeholderTextColor={getColor('mutedForeground')}
                returnKeyType="search"
                style={{ color: getColor('foreground') }}
                value={searchText}
              />
              <View className="pointer-events-none absolute inset-y-0 left-0 items-center justify-center pl-3">
                <Icon
                  as={SearchIcon}
                  className="size-5 text-muted-foreground"
                />
              </View>
            </View>

            {/* Loading indicator */}
            {isLoading && <ActivityIndicator className="my-2" />}
          </View>
        }
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
            >
              <View className="flex-1 py-3">
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
                  'size-6 items-center justify-center rounded border',
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
      />
    </BottomSheet>
  )
})

TaskAssigneePickerModal.displayName = 'TaskAssigneePickerModal'
