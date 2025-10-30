import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CalendarIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { Pressable, View } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export type QuickDateRange =
  | 'yesterday'
  | 'today'
  | 'week'
  | 'lastWeek'
  | 'month'
  | 'lastMonth'
  | 'custom'
  | null

export type TaskQuickDateFilterProps = {
  selectedRange: QuickDateRange
  onSelectRange: (range: QuickDateRange) => void
  label: string
  showCustomButton?: boolean
}

type DateRangeOption = {
  value: QuickDateRange
  label: string
  icon?: typeof CalendarIcon
}

const QUICK_RANGE_OPTIONS: DateRangeOption[] = [
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'lastWeek', label: 'Tuần trước' },
  { value: 'lastMonth', label: 'Tháng trước' },
]

/**
 * Quick date range filter with preset buttons
 * Provides common date ranges as one-tap selections
 * Optional "Khác" button to open full date picker modal
 *
 * Features:
 * - Preset ranges: Yesterday, Today, This Week, This Month, Last Week, Last Month
 * - Custom range button (opens separate modal)
 * - Compact horizontal chip layout in 2 rows
 * - Haptic feedback on selection
 */
export const TaskQuickDateFilter: FC<TaskQuickDateFilterProps> = ({
  selectedRange,
  onSelectRange,
  label,
  showCustomButton = true,
}) => {
  const handleSelectRange = (range: QuickDateRange) => {
    impactAsync(ImpactFeedbackStyle.Light)
    onSelectRange(range)
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-muted-foreground text-sm">
        {label}
      </Text>

      {/* Quick range buttons */}
      <View className="flex-row flex-wrap gap-2">
        {QUICK_RANGE_OPTIONS.map((option) => {
          const isSelected = selectedRange === option.value

          return (
            <Pressable
              accessibilityHint={`Lọc ${label.toLowerCase()} ${option.label.toLowerCase()}`}
              accessibilityLabel={`${option.label}${isSelected ? ', đã chọn' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value || 'none'}
              onPress={() => handleSelectRange(option.value)}
            >
              <View
                className={cn(
                  'items-center justify-center rounded-lg border px-3 py-2.5',
                  isSelected
                    ? 'border-border bg-muted'
                    : 'border-muted bg-card',
                )}
              >
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

        {/* Custom range button */}
        {showCustomButton && (
          <Pressable
            accessibilityHint={`Chọn ${label.toLowerCase()} khác`}
            accessibilityLabel={`Khác${selectedRange === 'custom' ? ', đã chọn' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRange === 'custom' }}
            onPress={() => handleSelectRange('custom')}
          >
            <View
              className={cn(
                'flex-row items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5',
                selectedRange === 'custom'
                  ? 'border-border bg-muted'
                  : 'border-muted bg-card',
              )}
            >
              <Icon
                as={CalendarIcon}
                className={cn(
                  'size-4',
                  selectedRange === 'custom'
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )}
              />
              <Text
                className={cn('font-sans-semibold text-sm', 'text-foreground')}
                numberOfLines={1}
              >
                Khác
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Clear button (shown when any range is selected) */}
      {selectedRange && (
        <Pressable
          accessibilityHint={`Xóa bộ lọc ${label.toLowerCase()}`}
          accessibilityLabel="Xóa bộ lọc"
          accessibilityRole="button"
          onPress={() => handleSelectRange(null)}
        >
          <Text className="text-muted-foreground text-xs underline">
            Xóa bộ lọc
          </Text>
        </Pressable>
      )}
    </View>
  )
}
