import type { TaskSearchFilterQuery } from '@nv-internal/validation'
import { useRouter } from 'expo-router'
import { FlatList, RefreshControl, ScrollView, View } from 'react-native'
import { useTaskInfiniteList } from '@/api/task/use-task-infinite-list'
import { useTaskSearch } from '@/api/task/use-task-search'
import { EnhancedTaskCard } from './task/enhanced-task-card'
import { TaskListItemSkeleton } from './task-list-item-skeleton'
import { EmptyState } from './ui/empty-state'

export type AdminTaskListProps = {
  contentContainerClassName?: string
  searchText?: string
  filters?: Omit<TaskSearchFilterQuery, 'search' | 'cursor' | 'take'>
}

export function AdminTaskList({
  contentContainerClassName,
  searchText = '',
  filters,
}: AdminTaskListProps) {
  const router = useRouter()

  // Determine if we should use search API (when search text or filters are present)
  const hasFilters = filters ? Object.keys(filters).length > 0 : false
  const isSearching = searchText.trim().length > 0 || hasFilters

  const {
    data: listData,
    hasNextPage: listHasNextPage,
    isFetchingNextPage: listIsFetchingNextPage,
    isRefetching: listIsRefetching,
    isLoading: listIsLoading,
    fetchNextPage: listFetchNextPage,
    refetch: listRefetch,
  } = useTaskInfiniteList({ enabled: !isSearching })

  const {
    data: searchData,
    hasNextPage: searchHasNextPage,
    isFetchingNextPage: searchIsFetchingNextPage,
    isRefetching: searchIsRefetching,
    isLoading: searchIsLoading,
    fetchNextPage: searchFetchNextPage,
    refetch: searchRefetch,
  } = useTaskSearch(
    {
      search: searchText,
      take: 20,
      status: filters?.status,
      assigneeIds: filters?.assigneeIds,
      assignedOnly: filters?.assignedOnly,
      customerId: filters?.customerId,
      scheduledFrom: filters?.scheduledFrom,
      scheduledTo: filters?.scheduledTo,
      createdFrom: filters?.createdFrom,
      createdTo: filters?.createdTo,
      completedFrom: filters?.completedFrom,
      completedTo: filters?.completedTo,
      sortBy: filters?.sortBy || 'createdAt',
      sortOrder: filters?.sortOrder || 'desc',
    },
    { enabled: isSearching },
  )

  // Select the appropriate data source based on search/filter state
  const data = isSearching ? searchData : listData
  const hasNextPage = isSearching ? searchHasNextPage : listHasNextPage
  const isFetchingNextPage = isSearching
    ? searchIsFetchingNextPage
    : listIsFetchingNextPage
  const isRefetching = isSearching ? searchIsRefetching : listIsRefetching
  const isLoading = isSearching ? searchIsLoading : listIsLoading
  const fetchNextPage = isSearching ? searchFetchNextPage : listFetchNextPage
  const refetch = isSearching ? searchRefetch : listRefetch

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
      <ScrollView
        contentContainerClassName={contentContainerClassName}
        contentInsetAdjustmentBehavior="automatic"
      >
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
        <TaskListItemSkeleton />
      </ScrollView>
    )
  }

  return (
    <FlatList
      contentContainerClassName={contentContainerClassName}
      contentInsetAdjustmentBehavior="automatic"
      data={tasks}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        (!isLoading && (
          <EmptyState
            className="flex-1"
            image="laziness"
            messageDescription={
              isSearching
                ? searchText
                  ? `Không tìm thấy công việc nào khớp với "${searchText}".`
                  : 'Không có công việc nào phù hợp với bộ lọc đã chọn.'
                : 'Hãy tạo công việc mới để bắt đầu làm việc.'
            }
            messageTitle={
              isSearching ? 'Không tìm thấy kết quả' : 'Chưa có công việc'
            }
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
        <RefreshControl
          accessibilityLabel="Làm mới danh sách công việc"
          onRefresh={handleRefetch}
          refreshing={isRefetching}
        />
      }
      removeClippedSubviews
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
      windowSize={10}
    />
  )
}
