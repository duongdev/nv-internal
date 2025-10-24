import { cva, type VariantProps } from 'class-variance-authority'
import { View, type ViewProps } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from '../ui/text'

const paymentStatusBadgeVariants = cva(
  'flex-row items-center justify-center rounded-full',
  {
    variants: {
      status: {
        paid: 'bg-green-500/10 dark:bg-green-500/20',
        unpaid: 'bg-muted dark:bg-muted/50',
        mismatch: 'bg-amber-500/10 dark:bg-amber-500/20',
      },
      size: {
        inline: 'px-2 py-1',
        card: 'px-3 py-1',
      },
    },
    defaultVariants: {
      status: 'unpaid',
      size: 'inline',
    },
  },
)

const paymentStatusTextVariants = cva('font-medium', {
  variants: {
    status: {
      paid: 'text-green-700 dark:text-green-400',
      unpaid: 'text-muted-foreground',
      mismatch: 'text-amber-700 dark:text-amber-400',
    },
    size: {
      inline: 'text-xs',
      card: 'text-sm',
    },
  },
  defaultVariants: {
    status: 'unpaid',
    size: 'inline',
  },
})

interface PaymentStatusBadgeProps
  extends Omit<ViewProps, 'children'>,
    VariantProps<typeof paymentStatusBadgeVariants> {
  /**
   * Whether payment has been collected
   */
  hasPayment: boolean
  /**
   * Expected amount (for mismatch detection)
   */
  expectedAmount?: number | null
  /**
   * Actual collected amount
   */
  actualAmount?: number | null
  /**
   * Custom label (overrides default)
   */
  label?: string
}

/**
 * PaymentStatusBadge Component
 * - Green "Đã thu tiền" - payment collected
 * - Gray "Chưa thu tiền" - no payment
 * - Amber "Chênh lệch" - amount mismatch
 */
export function PaymentStatusBadge({
  hasPayment,
  expectedAmount,
  actualAmount,
  label,
  size = 'inline',
  className,
  ...props
}: PaymentStatusBadgeProps) {
  // Determine status
  let status: 'paid' | 'unpaid' | 'mismatch' = 'unpaid'
  let displayLabel = label

  if (!hasPayment) {
    status = 'unpaid'
    displayLabel = displayLabel || 'Chưa thu tiền'
  } else if (
    expectedAmount &&
    actualAmount &&
    expectedAmount !== actualAmount
  ) {
    status = 'mismatch'
    displayLabel = displayLabel || 'Chênh lệch'
  } else {
    status = 'paid'
    displayLabel = displayLabel || 'Đã thu tiền'
  }

  return (
    <View
      className={cn(paymentStatusBadgeVariants({ status, size }), className)}
      {...props}
    >
      <Text className={paymentStatusTextVariants({ status, size })}>
        {displayLabel}
      </Text>
    </View>
  )
}
