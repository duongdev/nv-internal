import type { FC } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { useTaskInfiniteList } from '@/api/task/use-task-infinite-list'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'

export type AdminTaskListProps = {
  contentContainerClassName?: string
}

export const AdminTaskList: FC<AdminTaskListProps> = ({
  contentContainerClassName,
}) => {
  const { data, hasNextPage, isFetching, fetchNextPage, refetch } =
    useTaskInfiniteList()

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  const handleRefetch = () => {
    refetch()
  }

  return (
    <FlatList
      contentContainerClassName={contentContainerClassName}
      data={tasks}
      ListEmptyComponent={
        (!isFetching && (
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
        <RefreshControl onRefresh={handleRefetch} refreshing={isFetching} />
      }
      renderItem={({ item }) => <Text>{item.title}</Text>}
    />
  )
}
