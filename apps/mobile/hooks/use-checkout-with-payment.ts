import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import type { InvoiceFile } from '@/components/payment/invoice-photo-capture'
import { toast } from '@/components/ui/toasts'
import { queryClient } from '@/lib/api-client'
import { useTaskEvent } from './use-task-event'

/**
 * Payment collection state for checkout
 */
export interface PaymentCollectionState {
  paymentCollected: boolean
  paymentAmount: number | null
  paymentNotes: string
  invoiceFile: InvoiceFile | null
}

/**
 * Extended hook for checkout with payment collection
 * Wraps useTaskEvent with additional payment-specific state and logic
 */
export function useCheckoutWithPayment(taskId: number) {
  const taskEvent = useTaskEvent(taskId, 'check-out')
  const router = useRouter()

  // Payment state
  const [paymentState, setPaymentState] = useState<PaymentCollectionState>({
    paymentCollected: false,
    paymentAmount: null,
    paymentNotes: '',
    invoiceFile: null,
  })

  // Check if task has expected revenue
  const hasExpectedRevenue = !!taskEvent.task?.expectedRevenue
  const expectedRevenue = taskEvent.task?.expectedRevenue
    ? Number(taskEvent.task.expectedRevenue)
    : null

  // Update payment collection status
  const setPaymentCollected = useCallback(
    (collected: boolean) => {
      setPaymentState((prev) => ({
        ...prev,
        paymentCollected: collected,
        // Reset amount to expected revenue when toggling to collected
        paymentAmount: collected && expectedRevenue ? expectedRevenue : null,
      }))
    },
    [expectedRevenue],
  )

  // Update payment amount
  const setPaymentAmount = useCallback((amount: number | null) => {
    setPaymentState((prev) => ({ ...prev, paymentAmount: amount }))
  }, [])

  // Update payment notes
  const setPaymentNotes = useCallback((notes: string) => {
    setPaymentState((prev) => ({ ...prev, paymentNotes: notes }))
  }, [])

  // Update invoice file
  const setInvoiceFile = useCallback((file: InvoiceFile | null) => {
    setPaymentState((prev) => ({ ...prev, invoiceFile: file }))
  }, [])

  // Check if amount differs significantly from expected
  const hasAmountMismatch = useCallback(() => {
    if (!expectedRevenue || !paymentState.paymentAmount) {
      return false
    }
    const difference = Math.abs(paymentState.paymentAmount - expectedRevenue)
    const percentageDifference = (difference / expectedRevenue) * 100
    return percentageDifference > 10 // More than 10% difference
  }, [expectedRevenue, paymentState.paymentAmount])

  // Enhanced submit that includes payment data
  const handleSubmitWithPayment = useCallback(async () => {
    if (!taskEvent.location || !taskEvent.task) {
      return
    }

    // Show warning if amount differs >10%
    if (paymentState.paymentCollected && hasAmountMismatch()) {
      toast.error(
        `Số tiền thu khác với dự kiến.\nDự kiến: ${expectedRevenue?.toLocaleString('vi-VN')} VNĐ\nThực thu: ${paymentState.paymentAmount?.toLocaleString('vi-VN')} VNĐ`,
        {
          duration: 5000,
        },
      )
      // Warning only - user can still proceed
    }

    // Prepare FormData for file upload
    const formData = new FormData()
    formData.append('latitude', taskEvent.location.coords.latitude.toString())
    formData.append('longitude', taskEvent.location.coords.longitude.toString())

    if (taskEvent.notes.trim()) {
      formData.append('notes', taskEvent.notes.trim())
    }

    // Append checkout files
    for (const attachment of taskEvent.attachments) {
      const file = {
        uri: attachment.uri,
        name: attachment.filename,
        type: attachment.mimeType,
      }
      formData.append('files', file as unknown as Blob)
    }

    // Append payment data if collected
    if (hasExpectedRevenue && paymentState.paymentCollected) {
      formData.append('paymentCollected', 'true')
      if (paymentState.paymentAmount) {
        formData.append('paymentAmount', paymentState.paymentAmount.toString())
      }
      if (paymentState.paymentNotes.trim()) {
        formData.append('paymentNotes', paymentState.paymentNotes.trim())
      }
      // Append invoice file if provided (optional)
      if (paymentState.invoiceFile) {
        const invoiceFile = {
          uri: paymentState.invoiceFile.uri,
          name: paymentState.invoiceFile.name,
          type: paymentState.invoiceFile.type,
        }
        formData.append('invoiceFile', invoiceFile as unknown as Blob)
      }
    }

    // Make API call
    try {
      const { clerk } = await import('@/lib/api-client')
      const token = await clerk.session?.getToken()

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/v1/task/${taskId}/check-out`,
        {
          method: 'POST',
          headers: {
            // biome-ignore lint/style/useNamingConvention: <header>
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Lỗi khi gửi dữ liệu')
      }

      const data = await response.json()

      toast.success('Đã hoàn thành công việc')

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        for (const warning of data.warnings) {
          toast.error(warning)
        }
      }

      // Show payment success message if collected
      if (data.payment) {
        toast.success('Đã ghi nhận thanh toán')
      }

      // Navigate away and invalidate caches
      router.back()

      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({
        queryKey: ['task-payments', taskId.toString()],
      })
      queryClient.invalidateQueries({
        queryKey: ['activities', `TASK_${taskId}`],
      })
    } catch (error) {
      console.error('Error submitting checkout:', error)
      toast.error(
        error instanceof Error ? error.message : 'Lỗi khi gửi dữ liệu',
      )
    }
  }, [
    taskEvent.location,
    taskEvent.task,
    taskEvent.notes,
    taskEvent.attachments,
    paymentState,
    hasExpectedRevenue,
    hasAmountMismatch,
    expectedRevenue,
    taskId,
    router,
  ])

  return {
    ...taskEvent,
    // Payment-specific state and methods
    hasExpectedRevenue,
    expectedRevenue,
    paymentState,
    setPaymentCollected,
    setPaymentAmount,
    setPaymentNotes,
    setInvoiceFile,
    hasAmountMismatch,
    handleSubmitWithPayment,
  }
}
