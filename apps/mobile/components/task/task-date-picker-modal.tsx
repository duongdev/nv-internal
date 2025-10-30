import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { differenceInDays } from 'date-fns'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { View } from 'react-native'
import { Calendar, type DateData } from 'react-native-calendars'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useColorPalette } from '@/hooks/use-color-palette'

export type TaskDatePickerModalProps = {
  label: string
  initialFromDate?: Date
  initialToDate?: Date
  onApply: (fromDate?: Date, toDate?: Date) => void
}

export type TaskDatePickerModalMethods = {
  present: () => void
  dismiss: () => void
}

/**
 * Custom date range picker modal with calendar UI
 * Allows users to select custom from/to date ranges visually
 * Opens as a separate bottom sheet to avoid nesting issues
 *
 * Features:
 * - Visual calendar interface for intuitive date selection
 * - Period marking shows selected range with highlighting
 * - Two-tap selection: first tap = start date, second tap = end date
 * - Date range preview with day count
 * - Clear instructions guide the user
 * - Apply/Cancel actions
 * - Haptic feedback
 * - Prevents invalid ranges (auto-swaps if end < start)
 */
export const TaskDatePickerModal = forwardRef<
  TaskDatePickerModalMethods,
  TaskDatePickerModalProps
>(({ label, initialFromDate, initialToDate, onApply }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null)
  const { getColor } = useColorPalette()

  const [startDate, setStartDate] = useState<string | undefined>(
    initialFromDate ? initialFromDate.toISOString().split('T')[0] : undefined,
  )
  const [endDate, setEndDate] = useState<string | undefined>(
    initialToDate ? initialToDate.toISOString().split('T')[0] : undefined,
  )

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      setStartDate(
        initialFromDate
          ? initialFromDate.toISOString().split('T')[0]
          : undefined,
      )
      setEndDate(
        initialToDate ? initialToDate.toISOString().split('T')[0] : undefined,
      )
      bottomSheetRef.current?.present()
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss()
    },
  }))

  // Build marked dates for visual feedback
  const markedDates = useMemo(() => {
    if (!startDate && !endDate) {
      return {}
    }

    const marked: Record<
      string,
      {
        startingDay?: boolean
        endingDay?: boolean
        color?: string
        textColor?: string
        selected?: boolean
        selectedColor?: string
      }
    > = {}

    // Use design system colors
    const primaryColor = getColor('primary')
    const primaryForeground = getColor('primaryForeground')
    // Use muted color for range instead of alpha primary - ensures text visibility
    const mutedColor = getColor('muted')
    const foregroundColor = getColor('foreground')

    if (startDate && endDate) {
      // Both dates selected - mark the range
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Start date - dark background with white text
      marked[startDate] = {
        startingDay: true,
        color: primaryColor,
        textColor: primaryForeground,
      }

      // End date - dark background with white text
      marked[endDate] = {
        endingDay: true,
        color: primaryColor,
        textColor: primaryForeground,
      }

      // Mark days in between - light background with dark text for visibility
      const current = new Date(start)
      current.setDate(current.getDate() + 1)

      while (current < end) {
        const dateString = current.toISOString().split('T')[0]
        marked[dateString] = {
          color: mutedColor, // Light gray background
          textColor: foregroundColor, // Dark text - visible on light background
        }
        current.setDate(current.getDate() + 1)
      }
    } else if (startDate) {
      // Only start date selected - mark as single day period
      marked[startDate] = {
        startingDay: true,
        endingDay: true,
        color: primaryColor,
        textColor: primaryForeground,
      }
    } else if (endDate) {
      // Only end date selected (unlikely but handle it)
      marked[endDate] = {
        startingDay: true,
        endingDay: true,
        color: primaryColor,
        textColor: primaryForeground,
      }
    }

    return marked
  }, [startDate, endDate, getColor])

  const formatShortDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(dateString))
  }

  const getDayCount = () => {
    if (!startDate || !endDate) {
      return null
    }
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1 // +1 to include both dates
    return days
  }

  const handleDayPress = (day: DateData) => {
    impactAsync(ImpactFeedbackStyle.Light)

    if (!startDate || (startDate && endDate)) {
      // First selection or reset
      setStartDate(day.dateString)
      setEndDate(undefined)
    } else if (day.dateString > startDate) {
      // Second selection
      setEndDate(day.dateString)
    } else {
      // User selected earlier date, swap
      setEndDate(startDate)
      setStartDate(day.dateString)
    }
  }

  const handleApply = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    const fromDate = startDate ? new Date(startDate) : undefined
    const toDate = endDate ? new Date(endDate) : undefined
    onApply(fromDate, toDate)
    bottomSheetRef.current?.dismiss()
  }

  const handleClear = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const getInstructionText = () => {
    if (!startDate) {
      return 'Chọn ngày bắt đầu'
    }
    if (startDate && !endDate) {
      return 'Chọn ngày kết thúc'
    }
    if (startDate && endDate) {
      const days = getDayCount()
      return `${days} ngày được chọn`
    }
    return ''
  }

  // Calendar theme using design system colors
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: getColor('card'),
      calendarBackground: getColor('card'),
      textSectionTitleColor: getColor('mutedForeground'),
      dayTextColor: getColor('foreground'),
      todayTextColor: getColor('primary'),
      textDisabledColor: getColor('mutedForeground', { alpha: 0.5 }),
      selectedDayBackgroundColor: getColor('primary'),
      selectedDayTextColor: getColor('primaryForeground'),
      monthTextColor: getColor('foreground'),
      arrowColor: getColor('primary'),
      textMonthFontWeight: '600' as const,
      textDayFontSize: 16,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 14,
    }),
    [getColor],
  )

  return (
    <BottomSheet
      enableDynamicSizing
      maxDynamicContentSize={700}
      ref={bottomSheetRef}
    >
      {/* Fixed height container - prevents flex-1 from making everything scrollable */}
      <View style={{ height: 650 }}>
        {/* Scrollable Content - takes remaining space */}
        <BottomSheetScrollView
          contentContainerClassName="gap-4 px-4 pt-4 pb-2"
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View>
            <Text className="font-sans-bold text-foreground text-xl">
              {label}
            </Text>
            <Text className="text-muted-foreground text-sm">
              Chọn khoảng thời gian tùy chỉnh
            </Text>
          </View>

          {/* Visual Calendar */}
          <View className="overflow-hidden rounded-lg border border-muted bg-card">
            <Calendar
              markedDates={markedDates}
              markingType="period"
              onDayPress={handleDayPress}
              theme={calendarTheme}
            />
          </View>

          {/* Date Range Preview */}
          {startDate && endDate && (
            <View className="rounded-lg border border-primary bg-primary/5 p-3">
              <Text className="text-center font-sans-medium text-primary text-sm">
                📅 {formatShortDate(startDate)} → {formatShortDate(endDate)} (
                {getDayCount()} ngày)
              </Text>
            </View>
          )}

          {/* Clear Instructions */}
          <Text className="text-center text-muted-foreground text-sm">
            {getInstructionText()}
          </Text>
          {/* Fixed Footer - Sibling to ScrollView, NOT inside it */}
          <View className="mt-4 bg-background pb-safe">
            <View className="flex-row gap-2">
              {(startDate || endDate) && (
                <Button onPress={handleClear} variant="outline">
                  <Text>Xóa</Text>
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={!startDate || !endDate}
                onPress={handleApply}
              >
                <Text>Áp dụng</Text>
              </Button>
            </View>
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  )
})

TaskDatePickerModal.displayName = 'TaskDatePickerModal'
