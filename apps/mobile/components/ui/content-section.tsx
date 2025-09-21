import type { FC, ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { Text } from './text'

export type ContentSectionProps = {
  label?: string
  children?: ReactNode
} & ViewProps

export const ContentSection: FC<ContentSectionProps> = ({
  label,
  children,
  ...props
}) => {
  return (
    <View {...props}>
      {label && <Text variant="muted">{label}</Text>}
      {children}
    </View>
  )
}
