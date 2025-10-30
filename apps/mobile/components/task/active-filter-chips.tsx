import { TaskStatus } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { XIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export type TaskFilters = {
  status?: TaskStatus[]
  assigneeIds?: string[]
  createdFrom?: Date
  createdTo?: Date
  completedFrom?: Date
  completedTo?: Date
  sortBy?: string
  sortOrder?: string
}

export type ActiveFilterChipsProps = {
  filters: TaskFilters
  userNames?: Record<string, string> // Map of userId -> display name
  onRemoveStatus?: (status: TaskStatus) => void
  onRemoveAssignee?: (userId: string) => void
  onRemoveDateFilter?: (filterType: 'created' | 'completed') => void
  onClearAll?: () => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PREPARING]: 'Chuẩn bị',
  [TaskStatus.READY]: 'Sẵn sàng',
  [TaskStatus.IN_PROGRESS]: 'Đang làm',
  [TaskStatus.ON_HOLD]: 'Tạm dừng',
  [TaskStatus.COMPLETED]: 'Hoàn thành',
}

/**
 * Active filter chips component
 * Shows active filters as dismissible chips above the task list
 * Provides visual feedback of applied filters
 */
export const ActiveFilterChips: FC<ActiveFilterChipsProps> = ({
  filters,
  userNames = {},
  onRemoveStatus,
  onRemoveAssignee,
  onRemoveDateFilter,
  onClearAll,
}) => {
  const formatDateRange = (from?: Date, to?: Date) => {
    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }).format(date)

    if (from && to) {
      return `${formatDate(from)} - ${formatDate(to)}`
    }
    if (from) {
      return `Từ ${formatDate(from)}`
    }
    if (to) {
      return `Đến ${formatDate(to)}`
    }
    return ''
  }

  // Count active filters (excluding sortBy/sortOrder which are always present)
  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.assigneeIds?.length || 0) +
    (filters.createdFrom || filters.createdTo ? 1 : 0) +
    (filters.completedFrom || filters.completedTo ? 1 : 0)

  if (activeFilterCount === 0) {
    return null
  }

  const handleRemoveChip = (callback?: () => void) => {
    impactAsync(ImpactFeedbackStyle.Light)
    callback?.()
  }

  return (
    <View className="border-border border-b bg-background px-4 py-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-sans-semibold text-muted-foreground text-xs">
          Bộ lọc đang áp dụng ({activeFilterCount})
        </Text>
        {onClearAll && activeFilterCount > 0 && (
          <Pressable
            accessibilityHint="Xóa tất cả bộ lọc"
            accessibilityLabel="Xóa tất cả"
            accessibilityRole="button"
            onPress={() => handleRemoveChip(onClearAll)}
          >
            <Text className="font-sans-semibold text-destructive text-xs">
              Xóa tất cả
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerClassName="gap-2"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {/* Status chips */}
        {filters.status?.map((status) => (
          <View
            className="flex-row items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5"
            key={status}
          >
            <Text className="font-sans-medium text-primary text-xs">
              {STATUS_LABELS[status]}
            </Text>
            {onRemoveStatus && (
              <Pressable
                accessibilityHint={`Xóa bộ lọc ${STATUS_LABELS[status]}`}
                accessibilityLabel="Xóa"
                accessibilityRole="button"
                onPress={() => handleRemoveChip(() => onRemoveStatus(status))}
              >
                <Icon
                  as={XIcon}
                  className="size-3.5 text-primary"
                  strokeWidth={3}
                />
              </Pressable>
            )}
          </View>
        ))}

        {/* Assignee chips */}
        {filters.assigneeIds?.map((userId) => (
          <View
            className="flex-row items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5"
            key={userId}
          >
            <Text className="font-sans-medium text-blue-700 text-xs dark:text-blue-400">
              {userNames[userId] || 'Nhân viên'}
            </Text>
            {onRemoveAssignee && (
              <Pressable
                accessibilityHint="Xóa bộ lọc nhân viên"
                accessibilityLabel="Xóa"
                accessibilityRole="button"
                onPress={() => handleRemoveChip(() => onRemoveAssignee(userId))}
              >
                <Icon
                  as={XIcon}
                  className="size-3.5 text-blue-700 dark:text-blue-400"
                  strokeWidth={3}
                />
              </Pressable>
            )}
          </View>
        ))}

        {/* Created date range chip */}
        {(filters.createdFrom || filters.createdTo) && (
          <View className="flex-row items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5">
            <Text className="font-sans-medium text-green-700 text-xs dark:text-green-400">
              Tạo: {formatDateRange(filters.createdFrom, filters.createdTo)}
            </Text>
            {onRemoveDateFilter && (
              <Pressable
                accessibilityHint="Xóa bộ lọc ngày tạo"
                accessibilityLabel="Xóa"
                accessibilityRole="button"
                onPress={() =>
                  handleRemoveChip(() => onRemoveDateFilter('created'))
                }
              >
                <Icon
                  as={XIcon}
                  className="size-3.5 text-green-700 dark:text-green-400"
                  strokeWidth={3}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* Completed date range chip */}
        {(filters.completedFrom || filters.completedTo) && (
          <View className="flex-row items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
            <Text className="font-sans-medium text-amber-700 text-xs dark:text-amber-400">
              Hoàn thành:{' '}
              {formatDateRange(filters.completedFrom, filters.completedTo)}
            </Text>
            {onRemoveDateFilter && (
              <Pressable
                accessibilityHint="Xóa bộ lọc ngày hoàn thành"
                accessibilityLabel="Xóa"
                accessibilityRole="button"
                onPress={() =>
                  handleRemoveChip(() => onRemoveDateFilter('completed'))
                }
              >
                <Icon
                  as={XIcon}
                  className="size-3.5 text-amber-700 dark:text-amber-400"
                  strokeWidth={3}
                />
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
