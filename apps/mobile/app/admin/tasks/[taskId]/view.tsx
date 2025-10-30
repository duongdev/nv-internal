import { useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useLocalSearchParams } from 'expo-router/build/hooks'
import { RefreshControl, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { activitiesQueryOptions } from '@/api/activity/use-activities'
import { useTask } from '@/api/task/use-task'
import { ActivityFeed } from '@/components/activity-feed'
import { TaskCommentBox } from '@/components/task-comment-box'
import { TaskDetails } from '@/components/task-details'
import { TaskDetailsSkeleton } from '@/components/task-details-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
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
    queryClient.invalidateQueries({
      queryKey: ['task-payments', taskId?.toString() ?? ''],
    })
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: 'generic',
            title: '',
          }}
        />
        <KeyboardAwareScrollView
          bottomOffset={40}
          contentContainerClassName="pb-safe"
        >
          <TaskDetailsSkeleton />
        </KeyboardAwareScrollView>
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
              headerShown: true,
              headerBackButtonDisplayMode: 'generic',
              title: `Chi tiết công việc ${formatTaskId(taskId ?? 0)}`,
            }}
          />

          {task && (
            <KeyboardAwareScrollView
              bottomOffset={40}
              contentContainerClassName="gap-3 p-4 pb-safe"
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefetch}
                  refreshing={isRefetching}
                />
              }
            >
              <TaskDetails task={task} />

              {/* Activities Card with Comment Box */}
              <Card className="bg-muted dark:border-white/20">
                <CardHeader>
                  <CardTitle>Hoạt động</CardTitle>
                </CardHeader>
                <CardContent className="gap-4">
                  <TaskCommentBox
                    onCommentSent={handleRefetch}
                    taskId={task.id}
                  />
                  <ActivityFeed topic={`TASK_${taskId}`} />
                </CardContent>
              </Card>
            </KeyboardAwareScrollView>
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
        headerShown: true,
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
