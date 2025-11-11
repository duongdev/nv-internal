import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { type ForwardedRef, forwardRef, useEffect, useState } from 'react'
import { View } from 'react-native'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'

type FieldType = 'text' | 'textarea' | 'number' | 'phone'

interface TaskFieldEditBottomSheetProps {
  fieldName: string
  fieldLabel: string
  fieldType: FieldType
  currentValue: string | number | null
  onSave: (value: string | number | null) => void
  isPending?: boolean
}

export const TaskFieldEditBottomSheet = forwardRef<
  BottomSheetModalMethods,
  TaskFieldEditBottomSheetProps
>(
  (
    {
      fieldName,
      fieldLabel,
      fieldType,
      currentValue,
      onSave,
      isPending = false,
    }: TaskFieldEditBottomSheetProps,
    ref: ForwardedRef<BottomSheetModalMethods>,
  ) => {
    const [value, setValue] = useState(String(currentValue || ''))

    // Reset value when currentValue changes
    useEffect(() => {
      setValue(String(currentValue || ''))
    }, [currentValue])

    const handleSave = () => {
      impactAsync(ImpactFeedbackStyle.Medium)
      if (fieldType === 'number') {
        onSave(value ? Number(value) : null)
      } else {
        onSave(value || null)
      }
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.dismiss()
      }
    }

    const handleCancel = () => {
      impactAsync(ImpactFeedbackStyle.Light)
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.dismiss()
      }
    }

    return (
      <BottomSheet enablePanDownToClose ref={ref} snapPoints={['75%', '95%']}>
        <BottomSheetScrollView
          className="flex-1"
          contentContainerClassName="gap-4 p-6"
        >
          <Text variant="h4">{fieldLabel}</Text>

          {fieldType === 'textarea' ? (
            <Textarea
              accessibilityHint={`Nhập ${fieldLabel.toLowerCase()}`}
              accessibilityLabel={fieldLabel}
              accessibilityRole="text"
              isInBottomSheet
              multiline
              numberOfLines={4}
              onChangeText={setValue}
              placeholder={`Nhập ${fieldLabel.toLowerCase()}`}
              testID={`task-edit-${fieldName}-input`}
              value={value}
            />
          ) : (
            <Input
              accessibilityHint={`Nhập ${fieldLabel.toLowerCase()}`}
              accessibilityLabel={fieldLabel}
              accessibilityRole="text"
              isInBottomSheet
              keyboardType={
                fieldType === 'number'
                  ? 'numeric'
                  : fieldType === 'phone'
                    ? 'phone-pad'
                    : 'default'
              }
              onChangeText={setValue}
              placeholder={`Nhập ${fieldLabel.toLowerCase()}`}
              testID={`task-edit-${fieldName}-input`}
              value={value}
            />
          )}

          <View className="mt-4 flex-row gap-2">
            <Button
              accessibilityHint="Đóng modal mà không lưu"
              accessibilityLabel="Hủy chỉnh sửa"
              accessibilityRole="button"
              className="flex-1"
              disabled={isPending}
              onPress={handleCancel}
              testID="task-edit-cancel"
              variant="outline"
            >
              <Text>Hủy</Text>
            </Button>
            <Button
              accessibilityHint="Lưu thay đổi vào công việc"
              accessibilityLabel={isPending ? 'Đang lưu' : 'Lưu thay đổi'}
              accessibilityRole="button"
              className="flex-1"
              disabled={isPending}
              onPress={handleSave}
              testID="task-edit-save"
            >
              <Text>{isPending ? 'Đang lưu...' : 'Lưu'}</Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)
