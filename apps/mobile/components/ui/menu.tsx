import * as Slot from '@rn-primitives/slot'
import type { LucideIcon } from 'lucide-react-native'
import type { FC, ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from './button'
import { Icon } from './icon'
import { Text } from './text'

export type MenuGroupProps = {
  label?: string
  children: ReactNode
  className?: string
}

export const MenuGroup: FC<MenuGroupProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <View>
      {label && (
        <Text className="px-3.5 font-medium text-muted-foreground text-sm">
          {label}
        </Text>
      )}
      <View className={cn('gap-0.5 rounded-lg bg-muted p-[2px]', className)}>
        {children}
      </View>
    </View>
  )
}

export type MenuItemProps = ButtonProps & {
  label: string
  contentClassName?: string
  leftIcon?: LucideIcon | false | null
  rightIcon?: LucideIcon | false | null
  inset?: boolean
  asChild?: boolean
}

export const MenuItem: FC<MenuItemProps> = ({
  label,
  contentClassName,
  leftIcon,
  rightIcon,
  className,
  asChild,
  inset,
  ...props
}) => {
  const Component = asChild ? Slot.View : Button

  return (
    <Component
      className={cn(
        'justify-start px-3 active:bg-card dark:active:bg-card',
        className,
      )}
      size="lg"
      variant="ghost"
      {...props}
    >
      {(leftIcon && (
        <Icon as={leftIcon} className={cn('size-5', contentClassName)} />
      )) ||
        (inset && <View className="mr-5" />)}
      <Text className={cn('flex-1 text-base', contentClassName)}>{label}</Text>
      {rightIcon && (
        <Icon as={rightIcon} className={cn('size-5', contentClassName)} />
      )}
    </Component>
  )
}
