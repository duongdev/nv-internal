import { useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useLocalSearchParams } from 'expo-router/build/hooks'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { activitiesQueryOptions } from '@/api/activity/use-activities'
import { useTask } from '@/api/task/use-task'
import { ActivityFeed } from '@/components/activity-feed'
import { TaskAction } from '@/components/task-action'
import { TaskAssignees, TaskDetails } from '@/components/task-details'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { formatTaskId } from '@/utils/task-id-helper'

export default function TaskViewScreen() {
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

          {task && (
            <View className="flex-1 justify-between">
              <ScrollView
                contentContainerClassName="gap-2 p-4 pb-safe"
                refreshControl={
                  <RefreshControl
                    onRefresh={handleRefetch}
                    refreshing={isRefetching}
                  />
                }
              >
                <TaskDetails task={task} />
                <TaskAssignees
                  assigneeIds={task.assigneeIds}
                  taskId={task.id}
                />
                <Separator className="my-2" />
                <Text className="font-sans-medium" variant="h4">
                  Hoạt động
                </Text>
                <ActivityFeed topic={`TASK_${taskId}`} />
              </ScrollView>

              <View className="px-6 pb-safe shadow-lg">
                <TaskAction task={task!} />
              </View>
            </View>
          )}
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
