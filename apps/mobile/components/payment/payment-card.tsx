import { AlertTriangle, Edit3, FileImage } from 'lucide-react-native'
import { Image, Pressable, View } from 'react-native'
import { formatCurrencyDisplay } from '@/components/ui/currency-input'
import { UserFullName } from '@/components/user-public-info'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Text } from '../ui/text'

export interface Payment {
  id: string
  amount: number
  currency: string
  collectedAt: string
  collectedBy: string // Clerk user ID
  invoiceAttachmentId?: string | null
  notes?: string | null
}

interface PaymentCardProps {
  payment: Payment
  expectedRevenue?: number | null
  isAdmin?: boolean
  onEdit?: () => void
  onInvoicePress?: () => void
  className?: string
}

/**
 * PaymentCard Component
 * - Amount comparison display
 * - Difference alert (if mismatch)
 * - Collector info
 * - Invoice preview
 * - Edit button (admin only)
 */
export function PaymentCard({
  payment,
  expectedRevenue,
  isAdmin = false,
  onEdit,
  onInvoicePress,
  className,
}: PaymentCardProps) {
  // Calculate difference
  const difference =
    expectedRevenue && payment.amount
      ? Math.abs(Number(payment.amount) - expectedRevenue)
      : 0
  const hasMismatch = difference > 0

  // Get attachment URL for existing attachment
  const getAttachmentUrl = (attachmentId: string) => {
    return `${process.env.EXPO_PUBLIC_API_URL}/v1/attachment/${attachmentId}/download`
  }

  return (
    <Card className={cn('bg-muted dark:border-white/20', className)}>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle>Thanh toán</CardTitle>
          {isAdmin && onEdit && (
            <Pressable
              className="flex-row items-center gap-1.5 rounded-md p-2 active:bg-muted dark:active:bg-muted/50"
              onPress={onEdit}
            >
              <Edit3 className="text-primary" size={16} />
              <Text className="font-medium text-primary text-sm">
                Chỉnh sửa
              </Text>
            </Pressable>
          )}
        </View>
      </CardHeader>

      <CardContent className="gap-4">
        {/* Amount Comparison */}
        <View className="gap-2">
          {expectedRevenue && (
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-sm">
                Giá dịch vụ:
              </Text>
              <Text className="text-sm">
                {formatCurrencyDisplay(expectedRevenue)}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-sm">Thực thu:</Text>
            <Text className="font-semibold text-lg">
              {formatCurrencyDisplay(Number(payment.amount))}
            </Text>
          </View>

          {/* Mismatch Alert */}
          {hasMismatch && (
            <View className="flex-row items-start gap-2 rounded-lg bg-amber-500/10 p-3 dark:bg-amber-500/20">
              <AlertTriangle
                className="mt-0.5 text-amber-700 dark:text-amber-400"
                size={16}
              />
              <View className="flex-1">
                <Text className="font-medium text-amber-700 text-sm dark:text-amber-400">
                  Chênh lệch: {formatCurrencyDisplay(difference)}
                </Text>
                <Text className="text-amber-700/80 text-xs dark:text-amber-400/80">
                  Số tiền thu khác với dự kiến
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Collection Info */}
        <View className="gap-1.5 rounded-lg border border-border bg-background p-3 dark:bg-input/30">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">Thu bởi:</Text>
            <UserFullName className="text-sm" userId={payment.collectedBy} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">Thời gian:</Text>
            <Text className="text-sm">
              {new Date(payment.collectedAt).toLocaleString('vi-VN')}
            </Text>
          </View>
          {payment.notes && (
            <View className="mt-1 gap-1">
              <Text className="text-muted-foreground text-xs">Ghi chú:</Text>
              <Text className="text-sm">{payment.notes}</Text>
            </View>
          )}
        </View>

        {/* Invoice Preview */}
        {payment.invoiceAttachmentId && (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-muted-foreground text-sm">Hóa đơn:</Text>
              <Badge variant="secondary">
                <FileImage className="text-foreground" size={12} />
                <Text>Có ảnh</Text>
              </Badge>
            </View>
            <Pressable
              className="overflow-hidden rounded-lg border border-border active:opacity-80"
              onPress={onInvoicePress}
            >
              <Image
                className="h-32 w-full bg-muted"
                resizeMode="cover"
                source={{ uri: getAttachmentUrl(payment.invoiceAttachmentId) }}
              />
            </Pressable>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Empty state when no payment collected
 */
export function PaymentCardEmpty({
  className,
  expectedRevenue,
}: {
  className?: string
  expectedRevenue: number
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <Card className={cn('bg-muted dark:border-white/20', className)}>
      <CardHeader>
        <CardTitle>Thanh toán</CardTitle>
        <CardDescription>Chưa thu tiền từ khách hàng</CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground">Giá dịch vụ</Text>
          <Text className="font-semibold text-foreground">
            {formatCurrency(expectedRevenue)}
          </Text>
        </View>
      </CardContent>
    </Card>
  )
}
