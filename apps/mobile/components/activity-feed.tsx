import type { FC } from 'react'
import { View } from 'react-native'
import { Text } from './ui/text'

export type ActivityFeedProps = {
  targetId: string | number
}

export const ActivityFeed: FC<ActivityFeedProps> = ({ targetId }) => {
  return (
    <View>
      <Text>Chưa có hoạt động nào cho công việc {targetId}</Text>
    </View>
  )
}
