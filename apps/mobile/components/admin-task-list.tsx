import { Link } from 'expo-router'
// ...existing code...
import { FlatList, RefreshControl, View } from 'react-native'
import { useTaskInfiniteList } from '@/api/task/use-task-infinite-list'
import { TaskListItem } from './task-list-item'
import { TaskListItemSkeleton } from './task-list-item-skeleton'
import { EmptyState } from './ui/empty-state'

export type AdminTaskListProps = {
  contentContainerClassName?: string
}

export function AdminTaskList({
  contentContainerClassName,
}: AdminTaskListProps) {
  const {
    data,
    hasNextPage,
    isFetching,
    isRefetching,
    isLoading,
    fetchNextPage,
    refetch,
  } = useTaskInfiniteList()

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  const handleRefetch = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <View className={contentContainerClassName}>
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
      </View>
    )
  }

  return (
    <FlatList
      contentContainerClassName={contentContainerClassName}
      data={tasks}
      ListEmptyComponent={
        (!isLoading && (
          <EmptyState
            className="flex-1"
            image="laziness"
            messageDescription="Hãy tạo công việc mới để bắt đầu làm việc."
            messageTitle="Chưa có công việc"
          />
        )) ||
        null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl onRefresh={handleRefetch} refreshing={isRefetching} />
      }
      renderItem={({ item }) => (
        <Link
          className="active:bg-muted"
          href={{
            pathname: '/admin/tasks/[taskId]/view',
            params: { taskId: item.id },
          }}
        >
          <View className="w-full rounded-lg border border-border bg-card p-3">
            <TaskListItem task={item} />
          </View>
        </Link>
      )}
    />
  )
}

// TaskListItem and TaskListItemProps moved to ./task-list-item
