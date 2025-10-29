import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle, XCircle } from 'lucide-react-native'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
import { InvoicePhotoCapture } from '@/components/payment/invoice-photo-capture'
import { AttachmentManager } from '@/components/task-event/attachment-manager'
import { LocationVerification } from '@/components/task-event/location-verification'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CurrencyInput,
  formatCurrencyDisplay,
} from '@/components/ui/currency-input'
import { EmptyState } from '@/components/ui/empty-state'
import { RadioCard, RadioGroup } from '@/components/ui/radio-card'
import { Text } from '@/components/ui/text'
import { Textarea } from '@/components/ui/textarea'
import { useCheckoutWithPayment } from '@/hooks/use-checkout-with-payment'

/**
 * Check-out screen with payment collection
 * Progressive disclosure pattern - payment fields only shown when needed
 */
export default function CheckOutScreen() {
  const router = useRouter()
  const searchParams = useLocalSearchParams()
  const taskId =
    typeof searchParams.taskId === 'string'
      ? Number.parseInt(searchParams.taskId, 10)
      : undefined

  const {
    task,
    isLoadingTask,
    location,
    distance,
    attachments,
    notes,
    isSubmitting,
    warnings,
    addFromCamera,
    addFromLibrary,
    addFromFiles,
    removeAttachment,
    setNotes,
    // Payment-specific
    hasExpectedRevenue,
    expectedRevenue,
    paymentState,
    setPaymentCollected,
    setPaymentAmount,
    setPaymentNotes,
    setInvoiceFile,
    hasAmountMismatch,
    handleSubmitWithPayment,
  } = useCheckoutWithPayment(taskId!)

  // Validation
  const canSubmit =
    location &&
    task &&
    (!hasExpectedRevenue ||
      !paymentState.paymentCollected ||
      paymentState.paymentAmount !== null)
  const isWrongStatus = task && task.status !== 'IN_PROGRESS'

  if (!taskId || Number.isNaN(taskId)) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive">ID công việc không hợp lệ</Text>
      </View>
    )
  }

  if (isLoadingTask) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: 'Hoàn thành công việc',
          }}
        />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-muted-foreground text-sm">
            Đang tải thông tin...
          </Text>
        </View>
      </>
    )
  }

  if (!task) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: 'Hoàn thành công việc',
          }}
        />
        <EmptyState
          className="flex-1"
          image="curiosity"
          messageDescription="Công việc không tồn tại hoặc đã bị xóa"
          messageTitle="Không tìm thấy"
        />
      </>
    )
  }

  if (isWrongStatus) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: 'Hoàn thành công việc',
          }}
        />
        <View className="flex-1 items-center justify-center gap-4 p-4">
          <EmptyState
            className="flex-1"
            image="curiosity"
            messageDescription="Công việc cần ở trạng thái IN_PROGRESS để check-out"
            messageTitle="Không thể thực hiện"
          />
          <Button
            className="w-full"
            onPress={() => router.back()}
            variant="outline"
          >
            <Text>Quay lại</Text>
          </Button>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackButtonDisplayMode: 'generic',
          title: 'Hoàn thành công việc',
        }}
      />

      <KeyboardAwareScrollView
        bottomOffset={40}
        contentContainerClassName="gap-3 p-4 pb-safe"
      >
        {/* Task Information Card */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Thông tin công việc</CardTitle>
            <Text>{task.title}</Text>
          </CardHeader>
          <CardContent className="gap-3">
            {task.description && (
              <View>
                <Text className="text-muted-foreground">Mô tả:</Text>
                <Text>{task.description}</Text>
              </View>
            )}
            {task.customer && (
              <View>
                <Text className="text-muted-foreground">Khách hàng:</Text>
                <Text>{task.customer.name}</Text>
              </View>
            )}
            {hasExpectedRevenue && (
              <View>
                <Text className="text-muted-foreground">
                  Thanh toán dự kiến:
                </Text>
                <Text className="font-semibold">
                  {formatCurrencyDisplay(expectedRevenue)}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Location Verification */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Xác minh vị trí</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationVerification
              currentLocation={location}
              distance={distance}
              taskLocation={task.geoLocation}
              warnings={warnings}
            />
          </CardContent>
        </Card>

        {/* Payment Collection Section - Progressive Disclosure */}
        {hasExpectedRevenue && (
          <Animated.View
            layout={LinearTransition.duration(300)}
            style={{ overflow: 'hidden' }}
          >
            <Card className="bg-muted dark:border-white/20">
              <CardHeader>
                <CardTitle>Thu tiền từ khách hàng</CardTitle>
                <CardDescription>
                  Dự kiến: {formatCurrencyDisplay(expectedRevenue)}
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {/* Radio Card Selection */}
                <RadioGroup>
                  <RadioCard
                    description="Khách hàng chưa thanh toán"
                    icon={
                      <XCircle className="text-muted-foreground" size={20} />
                    }
                    onPress={() => setPaymentCollected(false)}
                    selected={!paymentState.paymentCollected}
                    title="Chưa thu tiền"
                  />
                  <RadioCard
                    description="Tôi đã thu tiền từ khách hàng"
                    icon={<CheckCircle className="text-green-600" size={20} />}
                    onPress={() => setPaymentCollected(true)}
                    selected={paymentState.paymentCollected}
                    title="Đã thu đủ tiền"
                  />
                </RadioGroup>

                {/* Progressive Disclosure - Show payment details when collected */}
                {paymentState.paymentCollected && (
                  <Animated.View
                    className="gap-4"
                    entering={FadeInDown.duration(250).springify()}
                    exiting={FadeOut.duration(200)}
                  >
                    {/* Currency Input */}
                    <CurrencyInput
                      label="Số tiền đã thu"
                      onValueChange={setPaymentAmount}
                      placeholder={expectedRevenue?.toLocaleString('vi-VN')}
                      value={paymentState.paymentAmount}
                    />

                    {/* Mismatch Warning */}
                    {hasAmountMismatch() && (
                      <View className="rounded-lg bg-amber-500/10 p-3 dark:bg-amber-500/20">
                        <Text className="font-medium text-amber-700 text-sm dark:text-amber-400">
                          ⚠️ Số tiền khác với dự kiến
                        </Text>
                        <Text className="text-amber-700/80 text-xs dark:text-amber-400/80">
                          Bạn sẽ được yêu cầu xác nhận trước khi hoàn thành
                        </Text>
                      </View>
                    )}

                    {/* Payment Notes */}
                    <View className="gap-1.5">
                      <Text className="text-sm">Ghi chú (tùy chọn)</Text>
                      <Textarea
                        className="!rounded-md !bg-background dark:!border-white/20"
                        editable={!isSubmitting}
                        multiline
                        numberOfLines={2}
                        onChangeText={setPaymentNotes}
                        placeholder="Ví dụ: Khách trả bằng chuyển khoản"
                        value={paymentState.paymentNotes}
                      />
                    </View>

                    {/* Invoice Photo Capture - OPTIONAL, inline */}
                    <InvoicePhotoCapture
                      inline
                      label="Ảnh hóa đơn (Tùy chọn)"
                      onChange={setInvoiceFile}
                      value={paymentState.invoiceFile}
                    />
                  </Animated.View>
                )}
              </CardContent>
            </Card>
          </Animated.View>
        )}

        {/* Attachments */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Tệp đính kèm (tùy chọn)</CardTitle>
            <CardDescription>
              Thêm ảnh, video hoặc tài liệu liên quan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttachmentManager
              attachments={attachments}
              eventType="check-out"
              maxAllowed={10}
              minRequired={0}
              onAddFromCamera={addFromCamera}
              onAddFromFiles={addFromFiles}
              onAddFromLibrary={addFromLibrary}
              onRemove={removeAttachment}
            />
          </CardContent>
        </Card>

        {/* Notes (Optional) */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
            <CardDescription>Thông tin bổ sung (tùy chọn)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="!rounded-md !bg-background dark:!border-white/20"
              editable={!isSubmitting}
              multiline
              numberOfLines={3}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú..."
              value={notes}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full"
          disabled={!canSubmit}
          onPress={handleSubmitWithPayment}
          size="lg"
        >
          <Text className="font-semibold">Xác nhận hoàn thành</Text>
        </Button>

        {/* Validation Messages */}
        {!location && (
          <Text className="text-center text-destructive text-sm">
            Đang lấy vị trí hiện tại...
          </Text>
        )}
        {paymentState.paymentCollected && !paymentState.paymentAmount && (
          <Text className="text-center text-destructive text-sm">
            Vui lòng nhập số tiền đã thu
          </Text>
        )}
      </KeyboardAwareScrollView>
    </>
  )
}
