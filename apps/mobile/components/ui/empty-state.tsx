import { type FC, type ReactNode, useMemo } from 'react'
import { Image, type ImageProps, View } from 'react-native'
import { ILLUSTRATION_MAP } from '@/lib/illustrations'
import { Text } from './text'

const IMAGE_MAP = ILLUSTRATION_MAP

export type EmptyStateProps = {
  image?: keyof typeof IMAGE_MAP
  source?: ImageProps['source']
  messageTitle?: string
  messageDescription?: string
  message?: ReactNode
}

export const EmptyState: FC<EmptyStateProps> = ({
  image = 'laziness',
  source,
  message,
  messageDescription,
  messageTitle,
}) => {
  const msgEl = useMemo(() => {
    if (message) {
      return message
    }
    return (
      <View className="items-center">
        <Text variant="h4">{messageTitle}</Text>
        <Text variant="muted">{messageDescription}</Text>
      </View>
    )
  }, [message, messageDescription, messageTitle])

  return (
    <View className="flex-1 items-center">
      <Image
        className="h-64 w-64 rounded-lg"
        source={source || IMAGE_MAP[image]}
      />
      {msgEl}
    </View>
  )
}
