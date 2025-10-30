import { TaskStatus } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, View } from 'react-native'
import { useAssignedTaskInfiniteList } from '@/api/task/use-assigned-task-infinite-list'
import { EnhancedTaskCard } from '@/components/task/enhanced-task-card'
import { TaskListItemSkeleton } from '@/components/task-list-item-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type TaskFilter = 'active' | 'completed'

/**
 * WorkerTasksScreen - Tab-based task filtering for workers
 *
 * Features:
 * - Tab-based filtering (Active / Completed)
 * - Badge counts on tabs
 * - Pull-to-refresh with haptic feedback
 * - Excellent loading and empty states
 * - High-performance FlatList with virtualization
 * - Smooth animations and haptic feedback
 */
export default function WorkerIndex() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('active')

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
    isFetchingNextPage: isFetchingNextPageCompletedTasks,
    isLoading: isLoadingCompletedTasks,
  } = useAssignedTaskInfiniteList({
    status: [TaskStatus.COMPLETED],
    limit: 50,
  })

  // Group tasks for display
  const { activeTasksList, completedTasksList } = useMemo(() => {
    const active = activeTasks?.pages.flatMap((page) => page.tasks) || []
    // Sort active tasks: In Progress first, then Ready
    const sortedActive = [...active].sort((a, b) => {
      if (
        a.status === TaskStatus.IN_PROGRESS &&
        b.status !== TaskStatus.IN_PROGRESS
      ) {
        return -1
      }
      if (
        a.status !== TaskStatus.IN_PROGRESS &&
        b.status === TaskStatus.IN_PROGRESS
      ) {
        return 1
      }
      return 0
    })

    const completed = completedTasks?.pages.flatMap((page) => page.tasks) || []

    return {
      activeTasksList: sortedActive,
      completedTasksList: completed,
    }
  }, [activeTasks, completedTasks])

  const handleRefetch = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    refetchActiveTasks()
    refetchCompletedTasks()
  }

  const handleFilterChange = (filter: TaskFilter) => {
    if (filter !== activeFilter) {
      impactAsync(ImpactFeedbackStyle.Light)
      setActiveFilter(filter)
    }
  }

  const isRefetching = isRefetchingActiveTasks || isRefetchingCompletedTasks
  const isLoading = isLoadingActiveTasks || isLoadingCompletedTasks

  // Determine which data to display based on active filter
  const displayTasks =
    activeFilter === 'active' ? activeTasksList : completedTasksList

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background pt-safe">
        {/* Tab buttons skeleton */}
        <View className="flex-row gap-2 border-border border-b bg-background px-4 pb-3">
          <View className="h-9 w-32 rounded-full bg-muted" />
          <View className="h-9 w-32 rounded-full bg-muted/50" />
        </View>

        {/* Task list skeleton */}
        <View className="gap-2 p-4">
          <TaskListItemSkeleton />
          <TaskListItemSkeleton />
          <TaskListItemSkeleton />
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      {/* Tab Filter Buttons */}
      <View className="flex-row gap-2 border-border border-b bg-background px-4 pb-3">
        <Pressable
          accessibilityHint="Xem danh sách công việc đang làm và sắp tới"
          accessibilityLabel={`Công việc đang làm, ${activeTasksList.length} việc`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'active' }}
          onPress={() => handleFilterChange('active')}
        >
          <View
            className={cn(
              'flex-row items-center gap-2 rounded-full px-4 py-2 transition-colors',
              activeFilter === 'active' ? 'bg-primary' : 'bg-muted',
            )}
          >
            <Text
              className={cn(
                'font-sans-semibold text-sm',
                activeFilter === 'active'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              Đang làm
            </Text>
            {activeTasksList.length > 0 && (
              <View
                className={cn(
                  'flex-row items-center justify-center rounded-full px-2 py-0.5',
                  activeFilter === 'active'
                    ? 'bg-primary-foreground/20'
                    : 'bg-foreground/10',
                )}
              >
                <Text
                  className={cn(
                    'font-sans-bold text-xs',
                    activeFilter === 'active'
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {activeTasksList.length}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          accessibilityHint="Xem danh sách công việc đã hoàn thành"
          accessibilityLabel={`Công việc hoàn thành, ${completedTasksList.length} việc`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === 'completed' }}
          onPress={() => handleFilterChange('completed')}
        >
          <View
            className={cn(
              'flex-row items-center gap-2 rounded-full px-4 py-2 transition-colors',
              activeFilter === 'completed' ? 'bg-primary' : 'bg-muted',
            )}
          >
            <Text
              className={cn(
                'font-sans-semibold text-sm',
                activeFilter === 'completed'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              Hoàn thành
            </Text>
            {completedTasksList.length > 0 && (
              <View
                className={cn(
                  'flex-row items-center justify-center rounded-full px-2 py-0.5',
                  activeFilter === 'completed'
                    ? 'bg-primary-foreground/20'
                    : 'bg-foreground/10',
                )}
              >
                <Text
                  className={cn(
                    'font-sans-bold text-xs',
                    activeFilter === 'completed'
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {completedTasksList.length}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Task List */}
      <FlatList
        contentContainerClassName="gap-2 p-4 pb-24"
        data={displayTasks}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState
            className="flex-1 py-20"
            image="laziness"
            messageDescription={
              activeFilter === 'active'
                ? 'Bạn chưa có công việc nào. Liên hệ quản lý để được phân công nhiệm vụ.'
                : 'Bạn chưa hoàn thành công việc nào.'
            }
            messageTitle={
              activeFilter === 'active'
                ? 'Chưa có công việc'
                : 'Chưa có việc hoàn thành'
            }
          />
        }
        ListFooterComponent={
          activeFilter === 'completed' && isFetchingNextPageCompletedTasks ? (
            <View className="py-4">
              <TaskListItemSkeleton />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (
            activeFilter === 'completed' &&
            hasNextPageCompletedTasks &&
            !isFetchingNextPageCompletedTasks
          ) {
            fetchNextPageCompletedTasks()
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            accessibilityLabel="Làm mới danh sách công việc"
            onRefresh={handleRefetch}
            refreshing={isRefetching}
          />
        }
        removeClippedSubviews
        // Performance optimizations
        renderItem={({ item: task }) => (
          <EnhancedTaskCard
            key={task.id}
            onPress={() => {
              router.push({
                pathname: '/worker/tasks/[taskId]/view',
                params: {
                  taskId: task.id.toString(),
                },
              })
            }}
            task={task}
            workerMode
          />
        )}
        windowSize={10}
      />
    </View>
  )
}
