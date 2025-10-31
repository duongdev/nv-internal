import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export type TaskSortBy =
  | 'scheduledAt'
  | 'createdAt'
  | 'updatedAt'
  | 'completedAt'
  | 'id'
export type TaskSortOrder = 'asc' | 'desc'

export type TaskSortFilterProps = {
  sortBy?: TaskSortBy
  sortOrder?: TaskSortOrder
  onChangeSortBy: (sortBy: TaskSortBy) => void
  onChangeSortOrder: (sortOrder: TaskSortOrder) => void
}

const SORT_BY_OPTIONS: { value: TaskSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Ngày tạo' },
  { value: 'updatedAt', label: 'Ngày cập nhật' },
  { value: 'completedAt', label: 'Ngày hoàn thành' },
  { value: 'scheduledAt', label: 'Ngày hẹn' },
  { value: 'id', label: 'Mã công việc' },
]

const SORT_ORDER_OPTIONS: { value: TaskSortOrder; label: string }[] = [
  { value: 'desc', label: 'Mới nhất' },
  { value: 'asc', label: 'Cũ nhất' },
]

/**
 * Compact sort options filter component with collapsible dropdown
 * Shows current sort as single line, expands to show all options
 * Saves vertical space in filter UI
 */
export const TaskSortFilter: FC<TaskSortFilterProps> = ({
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onChangeSortBy,
  onChangeSortOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSortByChange = (value: TaskSortBy) => {
    impactAsync(ImpactFeedbackStyle.Light)
    onChangeSortBy(value)
  }

  const handleSortOrderChange = (value: TaskSortOrder) => {
    impactAsync(ImpactFeedbackStyle.Light)
    onChangeSortOrder(value)
  }

  const toggleExpanded = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    setIsExpanded(!isExpanded)
  }

  const currentSortByLabel =
    SORT_BY_OPTIONS.find((o) => o.value === sortBy)?.label || 'Ngày tạo'
  const currentSortOrderLabel =
    SORT_ORDER_OPTIONS.find((o) => o.value === sortOrder)?.label || 'Mới nhất'

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-muted-foreground text-sm">
        Sắp xếp
      </Text>

      {/* Compact display - shows current selection */}
      <Pressable
        accessibilityHint={`${isExpanded ? 'Thu gọn' : 'Mở rộng'} tùy chọn sắp xếp`}
        accessibilityLabel={`Sắp xếp: ${currentSortByLabel} - ${currentSortOrderLabel}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={toggleExpanded}
      >
        <View className="flex-row items-center justify-between rounded-lg border border-muted bg-card p-3">
          <Text className="flex-1 font-sans-medium text-foreground">
            {currentSortByLabel} • {currentSortOrderLabel}
          </Text>
          <Icon
            as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
            className="size-5 text-muted-foreground"
          />
        </View>
      </Pressable>

      {/* Expanded options - collapsible */}
      {isExpanded && (
        <View className="gap-3">
          {/* Sort By Options */}
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs">Sắp xếp theo</Text>
            <View className="flex-row flex-wrap gap-2">
              {SORT_BY_OPTIONS.map((option) => {
                const isSelected = sortBy === option.value

                return (
                  <Pressable
                    accessibilityHint={`Sắp xếp theo ${option.label}`}
                    accessibilityLabel={`${option.label}${isSelected ? ', đã chọn' : ''}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    key={option.value}
                    onPress={() => handleSortByChange(option.value)}
                  >
                    <View
                      className={cn(
                        'rounded-full border px-3 py-1.5',
                        isSelected
                          ? 'border-border bg-muted'
                          : 'border-muted bg-background',
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-medium text-xs',
                          'text-foreground',
                        )}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Sort Order Options */}
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs">Thứ tự</Text>
            <View className="flex-row gap-2">
              {SORT_ORDER_OPTIONS.map((option) => {
                const isSelected = sortOrder === option.value

                return (
                  <Pressable
                    accessibilityHint={`Hiển thị ${option.label.toLowerCase()}`}
                    accessibilityLabel={`${option.label}${isSelected ? ', đã chọn' : ''}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    className="flex-1"
                    key={option.value}
                    onPress={() => handleSortOrderChange(option.value)}
                  >
                    <View
                      className={cn(
                        'flex-row items-center justify-center gap-1.5 rounded-lg border p-2.5',
                        isSelected
                          ? 'border-border bg-muted'
                          : 'border-muted bg-card',
                      )}
                    >
                      {isSelected && (
                        <Icon
                          as={CheckIcon}
                          className="size-3.5 text-foreground"
                        />
                      )}
                      <Text
                        className={cn(
                          'font-sans-semibold text-xs',
                          'text-foreground',
                        )}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
