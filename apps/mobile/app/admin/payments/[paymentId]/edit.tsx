import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import type { TaskPayment } from '@/api/payment/use-task-payments'
import type { InvoiceFile } from '@/components/payment/invoice-photo-capture'
import { InvoicePhotoCapture } from '@/components/payment/invoice-photo-capture'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Icon } from '@/components/ui/icon'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toasts'
import { UserFullName } from '@/components/user-public-info'
import { getApiUrl } from '@/lib/env'
import { cn } from '@/lib/utils'

export default function PaymentEditModal() {
  const params = useLocalSearchParams<{
    paymentId: string
    taskId: string
    // Pre-fetched payment data from task details
    amount?: string
    collectedBy?: string
    collectedAt?: string
    invoiceAttachmentId?: string
    notes?: string
  }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Parse payment data from params (already fetched in task details)
  const payment: TaskPayment | null = params.amount
    ? {
        id: params.paymentId,
        amount: Number(params.amount),
        currency: 'VND',
        collectedAt: params.collectedAt || new Date().toISOString(),
        collectedBy: params.collectedBy || '',
        invoiceAttachmentId: params.invoiceAttachmentId || null,
        notes: params.notes || null,
      }
    : null

  // Form state
  const [amount, setAmount] = useState<number | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [editReason, setEditReason] = useState<string>('')
  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile | null>(null)
  const [editReasonError, setEditReasonError] = useState<string>('')

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      amount?: number
      notes?: string
      editReason: string
      invoiceFile?: InvoiceFile
    }) => {
      const formData = new FormData()

      if (data.amount !== undefined) {
        formData.append('amount', data.amount.toString())
      }
      if (data.notes !== undefined) {
        formData.append('notes', data.notes)
      }
      // editReason is required - always append
      formData.append('editReason', data.editReason)

      if (data.invoiceFile) {
        // React Native FormData expects {uri, name, type} format, not File object
        const fileData = {
          uri: data.invoiceFile.uri,
          name: data.invoiceFile.name,
          type: data.invoiceFile.type,
        }
        formData.append('invoiceFile', fileData as unknown as Blob)
      }

      // Use native fetch since Hono RPC client doesn't support file uploads
      // See: https://github.com/orgs/honojs/discussions/2298
      const { clerk } = await import('@/lib/api-client')
      const token = await clerk.session?.getToken()

      const response = await fetch(
        `${getApiUrl()}/v1/payment/${params.paymentId}`,
        {
          method: 'PUT',
          headers: {
            // biome-ignore lint/style/useNamingConvention: <header>
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Không thể cập nhật thanh toán')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', Number(params.taskId)],
      })
      queryClient.invalidateQueries({
        queryKey: ['task-payments', params.taskId],
      })
      queryClient.invalidateQueries({
        queryKey: ['activities', `TASK_${params.taskId}`],
      })
      queryClient.invalidateQueries({ queryKey: ['payment', params.paymentId] })
      toast.success('Cập nhật thanh toán thành công')
      router.back()
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật thanh toán')
    },
  })

  // Form validation
  const validateForm = (): boolean => {
    // Reset errors
    setEditReasonError('')

    // editReason is required
    if (!editReason.trim()) {
      setEditReasonError('Vui lòng nhập lý do chỉnh sửa')
      return false
    }

    // editReason must be at least 10 characters
    if (editReason.trim().length < 10) {
      setEditReasonError('Lý do chỉnh sửa phải có ít nhất 10 ký tự')
      return false
    }

    // At least one field must be changed
    const hasAmountChange = amount !== null && amount !== payment?.amount
    const hasNotesChange = notes.trim() !== (payment?.notes || '')
    const hasInvoiceChange = invoiceFile !== null

    if (!hasAmountChange && !hasNotesChange && !hasInvoiceChange) {
      toast.error('Vui lòng thay đổi ít nhất một trường')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    updatePaymentMutation.mutate({
      amount:
        amount !== null && amount !== payment?.amount ? amount : undefined,
      notes: notes.trim() !== (payment?.notes || '') ? notes.trim() : undefined,
      editReason: editReason.trim(),
      invoiceFile: invoiceFile || undefined,
    })
  }

  if (!payment) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-muted-foreground">Không tìm thấy thanh toán</Text>
      </View>
    )
  }

  // Check if editReason is valid (required field)
  const hasValidEditReason = editReason.trim().length >= 10

  // Check if at least one field has changed
  const hasChanges =
    (amount !== null && amount !== payment?.amount) ||
    notes.trim() !== (payment?.notes || '') ||
    invoiceFile !== null

  const isFormValid = hasValidEditReason && hasChanges
  const isSubmitting = updatePaymentMutation.isPending

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chỉnh sửa thanh toán',
          headerLeft: () => (
            <Button
              className="w-10"
              onPress={() => router.back()}
              size={null}
              variant={null}
            >
              <Icon as={X} className="text-foreground" size={28} />
            </Button>
          ),
          headerRight: () => (
            <Button
              disabled={!isFormValid || isSubmitting}
              onPress={handleSave}
              size="sm"
              variant="ghost"
            >
              <Text className="font-sans-bold text-primary">Lưu</Text>
            </Button>
          ),
        }}
      />

      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="gap-4 p-4 pb-10"
      >
        {/* Warning Banner */}
        <View className="rounded-lg bg-amber-500/10 p-4 dark:bg-amber-500/20">
          <Text className="text-amber-900 dark:text-amber-100">
            ⚠️ Thay đổi thanh toán sẽ được ghi lại trong lịch sử hoạt động
          </Text>
        </View>

        {/* Audit Info (read-only) */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Thông tin gốc</CardTitle>
            <CardDescription>
              Dữ liệu ban đầu trước khi chỉnh sửa
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-sm">Thu bởi:</Text>
              <UserFullName className="text-sm" userId={payment.collectedBy} />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-sm">Thời gian:</Text>
              <Text className="text-sm">
                {new Date(payment.collectedAt).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-sm">
                Số tiền gốc:
              </Text>
              <Text className="font-semibold text-sm">
                {Number(payment.amount).toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            {payment.notes && (
              <View className="mt-2 gap-1">
                <Text className="text-muted-foreground text-sm">
                  Ghi chú gốc:
                </Text>
                <Text className="text-sm">{payment.notes}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Chỉnh sửa thanh toán</CardTitle>
            <CardDescription>
              Cập nhật thông tin thanh toán (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {/* Amount Input */}
            <CurrencyInput
              className="!rounded-md !bg-background dark:!border-white/20"
              label="Số tiền mới (tùy chọn)"
              onValueChange={setAmount}
              placeholder={`${Number(payment.amount).toLocaleString('vi-VN')}`}
              value={amount}
            />

            {/* Notes Input */}
            <View className="gap-1.5">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                className="!rounded-md !bg-background dark:!border-white/20"
                onChangeText={setNotes}
                placeholder={payment.notes || 'Thêm ghi chú...'}
                value={notes}
              />
            </View>

            {/* Edit Reason (REQUIRED) */}
            <View className="gap-1.5">
              <Label>
                Lý do chỉnh sửa{' '}
                <Text className="text-destructive">* (Bắt buộc)</Text>
              </Label>
              <Textarea
                className={cn(
                  '!rounded-md !bg-background dark:!border-white/20',
                  editReasonError && 'border-destructive',
                )}
                onChangeText={(text) => {
                  setEditReason(text)
                  if (editReasonError) {
                    setEditReasonError('')
                  }
                }}
                placeholder="Ví dụ: Khách hàng đưa nhầm số tiền, cần cập nhật lại"
                value={editReason}
              />
              {editReasonError ? (
                <Text className="text-destructive text-xs leading-tight">
                  {editReasonError}
                </Text>
              ) : (
                <Text className="text-muted-foreground text-xs">
                  Tối thiểu 10 ký tự. Giải thích tại sao cần chỉnh sửa thanh
                  toán.
                </Text>
              )}
            </View>

            {/* Invoice Photo Replacement */}
            <InvoicePhotoCapture
              currentAttachmentId={payment.invoiceAttachmentId}
              label="Thay thế hóa đơn (Tùy chọn)"
              onChange={setInvoiceFile}
              value={invoiceFile}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </>
  )
}
