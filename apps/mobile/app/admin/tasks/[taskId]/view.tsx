import { Stack } from 'expo-router'
import { useLocalSearchParams } from 'expo-router/build/hooks'
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native'
import { useTask } from '@/api/task/use-task'
import { AdminTaskDetails } from '@/components/admin-task-details'
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
    <ScrollView
      contentContainerClassName="flex-1 p-4"
      refreshControl={
        <RefreshControl onRefresh={handleRefetch} refreshing={isRefetching} />
      }
    >
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

          {task && <AdminTaskDetails task={task} />}
        </>
      )}
    </ScrollView>
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
