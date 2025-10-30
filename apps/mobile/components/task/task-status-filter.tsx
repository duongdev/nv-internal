import { TaskStatus } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import type { FC } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export type TaskStatusFilterProps = {
  selectedStatuses: TaskStatus[]
  onChangeSelectedStatuses: (statuses: TaskStatus[]) => void
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  {
    value: TaskStatus.PREPARING,
    label: 'Đang chuẩn bị',
    color: 'bg-yellow-500',
  },
  { value: TaskStatus.READY, label: 'Sẵn sàng', color: 'bg-green-500' },
  {
    value: TaskStatus.IN_PROGRESS,
    label: 'Đang tiến hành',
    color: 'bg-blue-500',
  },
  { value: TaskStatus.ON_HOLD, label: 'Tạm dừng', color: 'bg-gray-500' },
  {
    value: TaskStatus.COMPLETED,
    label: 'Đã hoàn thành',
    color: 'bg-green-500',
  },
]

/**
 * Multi-select status filter component with horizontal chip layout
 * Compact design that fits without scrolling
 * Shows status indicators with color dots
 */
export const TaskStatusFilter: FC<TaskStatusFilterProps> = ({
  selectedStatuses,
  onChangeSelectedStatuses,
}) => {
  const toggleStatus = (status: TaskStatus) => {
    impactAsync(ImpactFeedbackStyle.Light)

    if (selectedStatuses.includes(status)) {
      // Remove status
      onChangeSelectedStatuses(selectedStatuses.filter((s) => s !== status))
    } else {
      // Add status
      onChangeSelectedStatuses([...selectedStatuses, status])
    }
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-muted-foreground text-sm">
        Trạng thái
      </Text>
      {/* Horizontal chip layout with flex wrap - fits in 2-3 rows max */}
      <View className="flex-row flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selectedStatuses.includes(option.value)

          return (
            <Pressable
              accessibilityHint={`${isSelected ? 'Bỏ chọn' : 'Chọn'} trạng thái ${option.label}`}
              accessibilityLabel={`${option.label}${isSelected ? ', đã chọn' : ''}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              key={option.value}
              onPress={() => toggleStatus(option.value)}
            >
              <View
                className={cn(
                  'flex-row items-center gap-2 rounded-full border px-3 py-2',
                  isSelected
                    ? 'border-border bg-muted'
                    : 'border-muted bg-card',
                )}
              >
                <View className={cn('size-2 rounded-full', option.color)} />
                <Text
                  className={cn(
                    'font-sans-semibold text-sm',
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
  )
}
