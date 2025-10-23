import { TaskStatus } from '@nv-internal/validation'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { RefreshControl, SectionList, View } from 'react-native'
import { useAssignedTaskInfiniteList } from '@/api/task/use-assigned-task-infinite-list'
import { TaskListItem } from '@/components/task-list-item'
import { TaskListItemSkeleton } from '@/components/task-list-item-skeleton'
import { Text } from '@/components/ui/text'

export default function WorkerIndex() {
  const {
    data: activeTasks,
    refetch: refetchActiveTasks,
    isRefetching: isRefetchingActiveTasks,
    isLoading: isLoadingActiveTasks,
  } = useAssignedTaskInfiniteList({
    status: [TaskStatus.READY, TaskStatus.IN_PROGRESS],
    limit: 50,
  })

  const {
    data: completedTasks,
    refetch: refetchCompletedTasks,
    isRefetching: isRefetchingCompletedTasks,
    fetchNextPage: fetchNextPageCompletedTasks,
    hasNextPage: hasNextPageCompletedTasks,
    isLoading: isLoadingCompletedTasks,
  } = useAssignedTaskInfiniteList({
    status: [TaskStatus.COMPLETED],
    limit: 50,
  })

  const { completed, next, onGoing } = useMemo(() => {
    const active = activeTasks?.pages.flatMap((page) => page.tasks) || []
    const onGoing = active.filter((t) => t.status === TaskStatus.IN_PROGRESS)
    const next = active.filter((t) => t.status === TaskStatus.READY)
    const completed = completedTasks?.pages.flatMap((page) => page.tasks) || []
    return {
      onGoing,
      next,
      completed,
    }
  }, [activeTasks, completedTasks])

  const sections = useMemo(() => {
    const secs = []
    if (onGoing.length > 0) {
      secs.push({ title: 'Việc đang làm', data: onGoing })
    }
    if (next.length > 0) {
      secs.push({ title: 'Việc tiếp theo', data: next })
    }
    if (completed.length > 0) {
      secs.push({ title: 'Việc đã hoàn thành', data: completed })
    }
    return secs
  }, [onGoing, next, completed])

  const handleRefetch = () => {
    refetchActiveTasks()
    refetchCompletedTasks()
  }
  const isRefetching = isRefetchingActiveTasks || isRefetchingCompletedTasks
  const isLoading = isLoadingActiveTasks || isLoadingCompletedTasks

  if (isLoading) {
    return (
      <View className="flex-1 gap-2 px-4 pt-safe">
        <View className="-mb-2 bg-background pb-1">
          <Text className="font-sans-medium" variant="h4">
            Việc đang làm
          </Text>
        </View>
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />

        <View className="-mb-2 bg-background pt-2 pb-1">
          <Text className="font-sans-medium" variant="h4">
            Việc tiếp theo
          </Text>
        </View>
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
      </View>
    )
  }

  return (
    <View className="flex-1 pt-safe">
      <SectionList
        contentContainerClassName="gap-2 px-4 pb-safe"
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text className="text-muted-foreground">Chưa có công việc nào.</Text>
        }
        onEndReached={() => {
          if (hasNextPageCompletedTasks) {
            fetchNextPageCompletedTasks()
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl onRefresh={handleRefetch} refreshing={isRefetching} />
        }
        renderItem={({ item: task }) => (
          <Link
            asChild
            href={{
              pathname: '/worker/tasks/[taskId]/view',
              params: {
                taskId: task.id.toString(),
              },
            }}
            key={task.id}
          >
            <View className="rounded-lg border border-border bg-secondary p-3 active:bg-card">
              <TaskListItem task={task} />
            </View>
          </Link>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="-mb-2 bg-background pb-1">
            <Text className="font-sans-medium" variant="h4">
              {title}
            </Text>
          </View>
        )}
        sections={sections}
      />
    </View>
  )
}
