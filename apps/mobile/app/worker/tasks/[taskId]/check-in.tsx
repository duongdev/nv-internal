import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { TaskEventScreen } from '@/components/task-event/task-event-screen'
import { Text } from '@/components/ui/text'

/**
 * Check-in screen - thin wrapper around TaskEventScreen
 */
export default function CheckInScreen() {
  const searchParams = useLocalSearchParams()
  const taskId =
    typeof searchParams.taskId === 'string'
      ? Number.parseInt(searchParams.taskId, 10)
      : undefined

  if (!taskId || Number.isNaN(taskId)) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive">ID công việc không hợp lệ</Text>
      </View>
    )
  }

  return (
    <TaskEventScreen
      config={{
        title: 'Bắt đầu làm việc',
        buttonLabel: 'Xác nhận bắt đầu',
        requiredStatus: 'READY',
        successMessage: 'Đã bắt đầu làm việc',
        endpoint: 'check-in',
      }}
      eventType="check-in"
      taskId={taskId}
    />
  )
}
