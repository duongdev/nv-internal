import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { TaskEventScreen } from '@/components/task-event/task-event-screen'
import { Text } from '@/components/ui/text'

/**
 * Check-out screen - thin wrapper around TaskEventScreen
 */
export default function CheckOutScreen() {
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
        title: 'Hoàn thành công việc',
        buttonLabel: 'Xác nhận hoàn thành',
        requiredStatus: 'IN_PROGRESS',
        successMessage: 'Đã hoàn thành công việc',
        endpoint: 'check-out',
      }}
      eventType="check-out"
      taskId={taskId}
    />
  )
}
