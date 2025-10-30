import DateTimePicker from '@react-native-community/datetimepicker'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { CalendarIcon, XIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export type TaskDateFilterProps = {
  label: string
  fromDate?: Date
  toDate?: Date
  onChangeFromDate: (date?: Date) => void
  onChangeToDate: (date?: Date) => void
}

/**
 * Date range picker component for filtering tasks
 * Uses native date pickers for both iOS and Android
 */
export const TaskDateFilter: FC<TaskDateFilterProps> = ({
  label,
  fromDate,
  toDate,
  onChangeFromDate,
  onChangeToDate,
}) => {
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

  const formatDate = (date?: Date) => {
    if (!date) {
      return 'Chọn ngày'
    }
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const handleFromDateChange = (
    event: { type: string },
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowFromPicker(false)
    }

    if (event.type === 'set' && selectedDate) {
      impactAsync(ImpactFeedbackStyle.Light)
      onChangeFromDate(selectedDate)
    }
  }

  const handleToDateChange = (event: { type: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToPicker(false)
    }

    if (event.type === 'set' && selectedDate) {
      impactAsync(ImpactFeedbackStyle.Light)
      onChangeToDate(selectedDate)
    }
  }

  const clearFromDate = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    onChangeFromDate(undefined)
  }

  const clearToDate = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    onChangeToDate(undefined)
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-muted-foreground text-sm">
        {label}
      </Text>

      {/* From Date */}
      <View className="gap-1.5">
        <Text className="text-muted-foreground text-xs">Từ ngày</Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityHint="Chọn ngày bắt đầu"
            accessibilityLabel={`Từ ngày: ${formatDate(fromDate)}`}
            accessibilityRole="button"
            className="flex-1"
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light)
              setShowFromPicker(true)
            }}
          >
            <View
              className={cn(
                'flex-row items-center gap-2 rounded-lg border border-muted bg-card p-3',
                fromDate && 'border-primary',
              )}
            >
              <Icon
                as={CalendarIcon}
                className={cn(
                  'size-5',
                  fromDate ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <Text
                className={cn(
                  'flex-1 font-sans-medium',
                  fromDate ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {formatDate(fromDate)}
              </Text>
            </View>
          </Pressable>

          {fromDate && (
            <Button
              className="aspect-square h-full"
              onPress={clearFromDate}
              size={null}
              variant="outline"
            >
              <Icon as={XIcon} className="size-5 text-muted-foreground" />
            </Button>
          )}
        </View>
      </View>

      {/* To Date */}
      <View className="gap-1.5">
        <Text className="text-muted-foreground text-xs">Đến ngày</Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityHint="Chọn ngày kết thúc"
            accessibilityLabel={`Đến ngày: ${formatDate(toDate)}`}
            accessibilityRole="button"
            className="flex-1"
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light)
              setShowToPicker(true)
            }}
          >
            <View
              className={cn(
                'flex-row items-center gap-2 rounded-lg border border-muted bg-card p-3',
                toDate && 'border-primary',
              )}
            >
              <Icon
                as={CalendarIcon}
                className={cn(
                  'size-5',
                  toDate ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <Text
                className={cn(
                  'flex-1 font-sans-medium',
                  toDate ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {formatDate(toDate)}
              </Text>
            </View>
          </Pressable>

          {toDate && (
            <Button
              className="aspect-square h-full"
              onPress={clearToDate}
              size={null}
              variant="outline"
            >
              <Icon as={XIcon} className="size-5 text-muted-foreground" />
            </Button>
          )}
        </View>
      </View>

      {/* iOS Date Pickers */}
      {Platform.OS === 'ios' && showFromPicker && (
        <View className="rounded-lg border border-muted bg-card p-2">
          <DateTimePicker
            display="spinner"
            locale="vi-VN"
            mode="date"
            onChange={handleFromDateChange}
            value={fromDate || new Date()}
          />
          <Button
            className="mt-2"
            onPress={() => setShowFromPicker(false)}
            variant="secondary"
          >
            <Text>Xong</Text>
          </Button>
        </View>
      )}

      {Platform.OS === 'ios' && showToPicker && (
        <View className="rounded-lg border border-muted bg-card p-2">
          <DateTimePicker
            display="spinner"
            locale="vi-VN"
            mode="date"
            onChange={handleToDateChange}
            value={toDate || new Date()}
          />
          <Button
            className="mt-2"
            onPress={() => setShowToPicker(false)}
            variant="secondary"
          >
            <Text>Xong</Text>
          </Button>
        </View>
      )}

      {/* Android Date Pickers */}
      {Platform.OS === 'android' && showFromPicker && (
        <DateTimePicker
          mode="date"
          onChange={handleFromDateChange}
          value={fromDate || new Date()}
        />
      )}

      {Platform.OS === 'android' && showToPicker && (
        <DateTimePicker
          mode="date"
          onChange={handleToDateChange}
          value={toDate || new Date()}
        />
      )}
    </View>
  )
}
