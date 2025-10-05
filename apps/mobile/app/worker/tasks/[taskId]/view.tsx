import { useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { activitiesQueryOptions } from '@/api/activity/use-activities'
import { useTask } from '@/api/task/use-task'
import { ActivityFeed } from '@/components/activity-feed'
import { TaskBottomActions } from '@/components/task-bottom-actions'
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
    refetch,
  } = useTask({ id: taskId ?? 0 }, { enabled: !!taskId })
  const queryClient = useQueryClient()

  const isTaskNotFound = !taskId || (isFetched && !task)

  const handleRefetch = () => {
    refetch()
    queryClient.invalidateQueries({
      queryKey: activitiesQueryOptions({ topic: `TASK_${taskId}` }).queryKey,
    })
  }

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
              contentContainerClassName="mb-safe gap-2 p-4 pb-safe-offset-4"
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
              <ActivityFeed topic={`TASK_${taskId}`} />
              <View className="pb-safe" />
            </ScrollView>
            <TaskBottomActions />
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
