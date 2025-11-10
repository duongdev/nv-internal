import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { type ForwardedRef, forwardRef, useEffect, useState } from 'react'
import { View } from 'react-native'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Text } from './ui/text'

interface CustomerEditBottomSheetProps {
  currentName: string | null
  currentPhone: string | null
  onSave: (data: { name: string; phone: string }) => void
  isPending?: boolean
}

export const CustomerEditBottomSheet = forwardRef<
  BottomSheetModalMethods,
  CustomerEditBottomSheetProps
>(
  (
    { currentName, currentPhone, onSave, isPending = false },
    ref: ForwardedRef<BottomSheetModalMethods>,
  ) => {
    const [name, setName] = useState(currentName || '')
    const [phone, setPhone] = useState(currentPhone || '')

    // Reset values when props change
    useEffect(() => {
      setName(currentName || '')
      setPhone(currentPhone || '')
    }, [currentName, currentPhone])

    const handleSave = () => {
      impactAsync(ImpactFeedbackStyle.Medium)
      onSave({ name, phone })
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
        <BottomSheetScrollView contentContainerClassName="gap-4 p-6">
          <Text variant="h4">Thông tin khách hàng</Text>

          {/* Customer Name Field */}
          <View className="gap-2">
            <Label>Tên khách hàng</Label>
            <Input
              accessibilityHint="Nhập tên khách hàng"
              accessibilityLabel="Tên khách hàng"
              accessibilityRole="text"
              isInBottomSheet
              onChangeText={setName}
              placeholder="Nhập tên khách hàng"
              testID="customer-name-input"
              value={name}
            />
          </View>

          {/* Customer Phone Field */}
          <View className="gap-2">
            <Label>Số điện thoại</Label>
            <Input
              accessibilityHint="Nhập số điện thoại khách hàng"
              accessibilityLabel="Số điện thoại"
              accessibilityRole="text"
              isInBottomSheet
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              testID="customer-phone-input"
              value={phone}
            />
          </View>

          {/* Save/Cancel Buttons */}
          <View className="mt-4 flex-row gap-2">
            <Button
              accessibilityHint="Đóng modal mà không lưu"
              accessibilityLabel="Hủy chỉnh sửa"
              accessibilityRole="button"
              className="flex-1"
              disabled={isPending}
              onPress={handleCancel}
              testID="customer-edit-cancel"
              variant="outline"
            >
              <Text>Hủy</Text>
            </Button>
            <Button
              accessibilityHint="Lưu thông tin khách hàng"
              accessibilityLabel={isPending ? 'Đang lưu' : 'Lưu thay đổi'}
              accessibilityRole="button"
              className="flex-1"
              disabled={isPending}
              onPress={handleSave}
              testID="customer-edit-save"
            >
              <Text>{isPending ? 'Đang lưu...' : 'Lưu'}</Text>
            </Button>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)

CustomerEditBottomSheet.displayName = 'CustomerEditBottomSheet'
