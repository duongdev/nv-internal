import { Link } from 'expo-router'
import type { FC } from 'react'
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native'
import { useTaskInfiniteList } from '@/api/task/use-task-infinite-list'
import { formatTaskId } from '@/utils/task-id-helper'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'

export type AdminTaskListProps = {
  contentContainerClassName?: string
}

export const AdminTaskList: FC<AdminTaskListProps> = ({
  contentContainerClassName,
}) => {
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
    return <ActivityIndicator className="my-2" />
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
          href={{
            pathname: '/admin/tasks/[taskId]/view',
            params: { taskId: item.id },
          }}
        >
          <Text>
            {formatTaskId(item.id)} {item.title}
          </Text>
        </Link>
      )}
    />
  )
}
