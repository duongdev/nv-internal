import { Stack, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { useTask } from '@/api/task/use-task'
import { ActivityFeed } from '@/components/activity-feed'
import { AdminTaskAction } from '@/components/admin-task-action'
import { TaskDetails } from '@/components/task-details'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { formatTaskId } from '@/utils/task-id-helper'

export default function WorkerTaskView() {
  const searchParams = useLocalSearchParams()
  const taskId =
    typeof searchParams.taskId === 'string'
      ? parseInt(searchParams.taskId)
      : undefined
  const {
    data: task,
    isLoading,
    isRefetching,
    isFetched,
    refetch: handleRefetch,
  } = useTask({ id: taskId ?? 0 }, { enabled: !!taskId })

  const isTaskNotFound = !taskId || (isFetched && !task)

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: '',
          }}
        />
        <ActivityIndicator className="my-4" />
      </>
    )
  }

  return (
    <View className="flex-1">
      {isTaskNotFound ? (
        emptyState
      ) : (
        <>
          <Stack.Screen
            options={{
              headerBackButtonDisplayMode: 'generic',
              title: `Chi tiết công việc ${formatTaskId(taskId ?? 0)}`,
            }}
          />

          <View className="flex-1 justify-between">
            <ScrollView
              className="flex-1"
              contentContainerClassName="flex-1 gap-2 p-4"
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefetch}
                  refreshing={isRefetching}
                />
              }
            >
              {task && <TaskDetails task={task} />}
              <Separator className="my-2" />
              <Text className="font-sans-medium" variant="h4">
                Hoạt động
              </Text>
              <ActivityFeed targetId={task?.id ?? 0} />
            </ScrollView>

            <View className="p-4">
              <AdminTaskAction task={task!} />
            </View>
          </View>
        </>
      )}
    </View>
  )
}

const emptyState = (
  <>
    <Stack.Screen
      options={{
        headerBackButtonDisplayMode: 'generic',
        title: '',
      }}
    />
    <EmptyState
      className="flex-1"
      image="curiosity"
      messageDescription="Công việc này không tồn tại hoặc đã bị xóa."
      messageTitle="Không tìm thấy công việc"
    />
  </>
)
