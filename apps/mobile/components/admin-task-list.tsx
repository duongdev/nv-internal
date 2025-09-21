import { Link } from 'expo-router'
import { type FC, Fragment } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import {
  type FetchTaskListResponse,
  useTaskInfiniteList,
} from '@/api/task/use-task-infinite-list'
import { formatTaskId } from '@/utils/task-id-helper'
import { ContentSection } from './ui/content-section'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'

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
          className="active:opacity-70"
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

export type TaskListItemProps = {
  task: NonNullable<FetchTaskListResponse>['tasks'][number]
}

export const TaskListItem: FC<TaskListItemProps> = ({ task }) => {
  return (
    <View className="relative">
      <Text className="absolute top-0 right-0 font-gilroy-medium font-medium text-muted-foreground text-sm">
        {task.status}
      </Text>
      <Text className="font-sans-bold text-muted-foreground text-xs">
        {formatTaskId(task.id)}
      </Text>
      <Text className="text-lg">{task.title}</Text>
      {task.assigneeIds.length > 0 && (
        <View className="flex-row flex-wrap">
          {task.assigneeIds.map((userId, index) => (
            <Fragment key={userId}>
              <UserFullName userId={userId} />
              {index < task.assigneeIds.length - 1 && (
                <Text className="text-muted-foreground">, </Text>
              )}
            </Fragment>
          ))}
        </View>
      )}
    </View>
  )
}
