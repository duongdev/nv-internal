import { useRouter } from 'expo-router'
import { FlatList, RefreshControl, View } from 'react-native'
import { useTaskInfiniteList } from '@/api/task/use-task-infinite-list'
import { EnhancedTaskCard } from './task/enhanced-task-card'
import { TaskListItemSkeleton } from './task-list-item-skeleton'
import { EmptyState } from './ui/empty-state'

export type AdminTaskListProps = {
  contentContainerClassName?: string
}

export function AdminTaskList({
  contentContainerClassName,
}: AdminTaskListProps) {
  const router = useRouter()
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    isLoading,
    fetchNextPage,
    refetch,
  } = useTaskInfiniteList()

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
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
      keyExtractor={(item) => item.id.toString()}
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
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <TaskListItemSkeleton />
          </View>
        ) : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl onRefresh={handleRefetch} refreshing={isRefetching} />
      }
      renderItem={({ item }) => (
        <EnhancedTaskCard
          onPress={() => {
            router.push({
              pathname: '/admin/tasks/[taskId]/view',
              params: { taskId: item.id },
            })
          }}
          task={item}
        />
      )}
    />
  )
}

// TaskListItem and TaskListItemProps moved to ./task-list-item
