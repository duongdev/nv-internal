import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Platform, Pressable, type PressableProps, View } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'

const radioCardVariants = cva(
  cn(
    'flex-row items-center gap-4 rounded-lg border p-4',
    Platform.select({
      web: 'cursor-pointer transition-all',
    }),
  ),
  {
    variants: {
      selected: {
        true: 'border-primary bg-primary/5 dark:bg-primary/10',
        false: 'border-border bg-card active:bg-muted dark:active:bg-muted/50',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
)

interface RadioCardProps
  extends Omit<PressableProps, 'children'>,
    VariantProps<typeof radioCardVariants> {
  /**
   * Icon component to display on the left
   */
  icon?: ReactNode
  /**
   * Main title text
   */
  title: string
  /**
   * Optional description text below title
   */
  description?: string
  /**
   * Whether this card is selected
   */
  selected?: boolean
}

/**
 * RadioCard Component
 * - Large touch target for mobile
 * - Icon + title + description layout
 * - Selected state animation
 * - Accessible for screen readers
 */
export function RadioCard({
  icon,
  title,
  description,
  selected = false,
  className,
  disabled,
  ...props
}: RadioCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected, disabled: !!disabled }}
      className={cn(
        radioCardVariants({ selected }),
        disabled && 'opacity-50',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <View
          className={cn(
            'items-center justify-center rounded-full p-2',
            selected
              ? 'bg-primary/10 dark:bg-primary/20'
              : 'bg-muted dark:bg-muted/50',
          )}
        >
          {icon}
        </View>
      )}

      {/* Text Content */}
      <View className="flex-1 gap-1">
        <Text className={cn('font-medium', selected && 'text-primary')}>
          {title}
        </Text>
        {description && (
          <Text className="text-muted-foreground text-sm">{description}</Text>
        )}
      </View>

      {/* Selection Indicator */}
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border-2',
          selected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30 bg-transparent',
        )}
      >
        {selected && <View className="h-2 w-2 rounded-full bg-white" />}
      </View>
    </Pressable>
  )
}

/**
 * RadioGroup Container
 * Simple container for radio cards with proper spacing
 */
export function RadioGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <View className={cn('gap-3', className)}>{children}</View>
}
