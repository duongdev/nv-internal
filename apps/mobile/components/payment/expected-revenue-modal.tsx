import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { AlertTriangle, DollarSign } from 'lucide-react-native'
import { type FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useUpdateExpectedRevenue } from '@/api/payment/use-update-expected-revenue'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { CurrencyInput, formatCurrencyDisplay } from '../ui/currency-input'
import { Icon } from '../ui/icon'
import { Text } from '../ui/text'

interface ExpectedRevenueModalProps {
  taskId: number
  currentRevenue?: number | null
  hasPayments?: boolean
  onClose?: () => void
}

/**
 * Expected Revenue Modal Content Component
 * - Content for the expected revenue bottom sheet modal
 * - Shows current value if exists
 * - Allows clearing value (set to null) with confirmation if payments exist
 * - Admin-only
 */
export const ExpectedRevenueModal: FC<ExpectedRevenueModalProps> = ({
  taskId,
  currentRevenue,
  hasPayments = false,
  onClose,
}) => {
  const [expectedRevenue, setExpectedRevenue] = useState<number | null>(
    currentRevenue ?? null,
  )
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const { mutate: updateExpectedRevenue, isPending } =
    useUpdateExpectedRevenue()

  // Reset form when current revenue changes
  useEffect(() => {
    setExpectedRevenue(currentRevenue ?? null)
    setShowClearConfirmation(false)
  }, [currentRevenue])

  const hasChanges =
    expectedRevenue !== (currentRevenue ?? null) ||
    (expectedRevenue === null && currentRevenue !== null)

  const handleSave = () => {
    updateExpectedRevenue(
      { taskId, expectedRevenue },
      {
        onSuccess: () => {
          onClose?.()
        },
      },
    )
  }

  const handleClear = () => {
    // Show confirmation if payments already exist
    if (hasPayments && !showClearConfirmation) {
      setShowClearConfirmation(true)
      return
    }

    // User confirmed or no payments - actually clear and save
    updateExpectedRevenue(
      { taskId, expectedRevenue: null },
      {
        onSuccess: () => {
          setExpectedRevenue(null)
          setShowClearConfirmation(false)
          onClose?.()
        },
        onError: () => {
          // Keep the confirmation shown on error so user can retry
          setShowClearConfirmation(true)
        },
      },
    )
  }

  const handleCancel = () => {
    setExpectedRevenue(currentRevenue ?? null)
    setShowClearConfirmation(false)
    onClose?.()
  }

  return (
    <BottomSheetScrollView
      className="gap-4 p-6"
      contentContainerClassName="gap-4"
    >
      {/* Header */}
      <View className="items-center gap-2">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon as={DollarSign} className="text-primary" size={24} />
        </View>
        <Text className="font-sans-bold text-xl">Giá dịch vụ</Text>
        <Text className="text-center text-muted-foreground text-sm">
          Thiết lập giá dịch vụ cho công việc này
        </Text>
      </View>

      {/* Current Value Display */}
      {currentRevenue && (
        <View className="rounded-lg bg-muted p-3 dark:bg-muted/30">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-sm">Hiện tại:</Text>
            <Text className="font-sans-medium">
              {formatCurrencyDisplay(currentRevenue)}
            </Text>
          </View>
        </View>
      )}

      {/* Clear Confirmation Warning */}
      {showClearConfirmation && (
        <View className="flex-row items-start gap-2 rounded-lg bg-amber-500/10 p-3 dark:bg-amber-500/20">
          <View className="mt-0.5">
            <AlertTriangle color="#f59e0b" size={20} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-amber-700 text-sm dark:text-amber-400">
              Xác nhận xóa giá dịch vụ
            </Text>
            <Text className="text-amber-700/80 text-xs dark:text-amber-400/80">
              Công việc này đã có thanh toán. Bạn có chắc muốn xóa giá dịch vụ?
            </Text>
          </View>
        </View>
      )}

      {/* Currency Input */}
      <CurrencyInput
        editable={!isPending}
        isInBottomSheet
        label="Giá dịch vụ"
        onValueChange={setExpectedRevenue}
        placeholder="Nhập giá dịch vụ"
        value={expectedRevenue}
      />

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {/* Clear Button - Only show if there's a current value */}
        {currentRevenue && (
          <Button
            className={cn(
              'flex-1',
              !showClearConfirmation && 'dark:border-white/20',
            )}
            disabled={isPending}
            onPress={handleClear}
            variant={showClearConfirmation ? 'destructive' : 'outline'}
          >
            <Text>
              {isPending && showClearConfirmation
                ? 'Đang xóa...'
                : showClearConfirmation
                  ? 'Xác nhận xóa'
                  : 'Xóa'}
            </Text>
          </Button>
        )}

        {/* Cancel Button */}
        <Button
          className={currentRevenue ? 'flex-1' : 'flex-1 dark:border-white/20'}
          disabled={isPending}
          onPress={handleCancel}
          variant={currentRevenue ? 'outline' : 'outline'}
        >
          <Text>Hủy</Text>
        </Button>

        {/* Save Button */}
        <Button
          className="flex-1"
          disabled={!hasChanges || isPending}
          onPress={handleSave}
        >
          <Text>{isPending ? 'Đang lưu...' : 'Lưu'}</Text>
        </Button>
      </View>

      {/* Helper Text */}
      <Text className="text-center text-muted-foreground text-xs">
        Giá dịch vụ giúp bạn theo dõi chênh lệch với số tiền thực thu
      </Text>
    </BottomSheetScrollView>
  )
}
