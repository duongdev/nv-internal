import type { TaskSearchFilterQuery, TaskStatus } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { FilterIcon, PlusIcon } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useUserList } from '@/api/user/use-user-list'
import { AdminTaskList } from '@/components/admin-task-list'
import { ActiveFilterChips } from '@/components/task/active-filter-chips'
import {
  TaskFilterBottomSheet,
  type TaskFilterBottomSheetMethods,
  type TaskFilterState,
} from '@/components/task/task-filter-bottom-sheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export default function AdminTasksScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [filterState, setFilterState] = useState<TaskFilterState>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const filterSheetRef = useRef<TaskFilterBottomSheetMethods>(null)

  // Fetch user list for displaying names in filter chips
  const { data: users } = useUserList()
  const userNames = useMemo(() => {
    if (!users) {
      return {}
    }
    return users.reduce(
      (acc, user) => {
        acc[user.id] = `${user.lastName} ${user.firstName}`
        return acc
      },
      {} as Record<string, string>,
    )
  }, [users])

  // Convert filter state to API query format
  const apiFilters: Omit<TaskSearchFilterQuery, 'search' | 'cursor' | 'take'> =
    useMemo(() => {
      return {
        status: filterState.status,
        assigneeIds: filterState.assigneeIds,
        createdFrom: filterState.createdFrom?.toISOString(),
        createdTo: filterState.createdTo?.toISOString(),
        completedFrom: filterState.completedFrom?.toISOString(),
        completedTo: filterState.completedTo?.toISOString(),
        sortBy: filterState.sortBy || 'createdAt',
        sortOrder: filterState.sortOrder || 'desc',
      }
    }, [filterState])

  // Count active filters (excluding sort)
  const activeFilterCount = useMemo(() => {
    return (
      (filterState.status?.length || 0) +
      (filterState.assigneeIds?.length || 0) +
      (filterState.createdFrom || filterState.createdTo ? 1 : 0) +
      (filterState.completedFrom || filterState.completedTo ? 1 : 0)
    )
  }, [filterState])

  const handleApplyFilters = (newFilters: TaskFilterState) => {
    setFilterState(newFilters)
  }

  const handleRemoveStatus = (status: TaskStatus) => {
    setFilterState((prev) => ({
      ...prev,
      status: prev.status?.filter((s) => s !== status),
    }))
  }

  const handleRemoveAssignee = (userId: string) => {
    setFilterState((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds?.filter((id) => id !== userId),
    }))
  }

  const handleRemoveDateFilter = (filterType: 'created' | 'completed') => {
    setFilterState((prev) => {
      if (filterType === 'created') {
        return { ...prev, createdFrom: undefined, createdTo: undefined }
      }
      if (filterType === 'completed') {
        return { ...prev, completedFrom: undefined, completedTo: undefined }
      }
      return prev
    })
  }

  const handleClearAllFilters = () => {
    setFilterState({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Công việc`,
          headerSearchBarOptions: {
            placeholder: 'Tìm công việc...',
            onChangeText: ({ nativeEvent }) => setSearchText(nativeEvent.text),
          },
          headerRight: () => (
            <View className="flex-row items-center gap-2">
              {/* Filter Button */}
              <Button
                className="relative w-10"
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light)
                  filterSheetRef.current?.present()
                }}
                size={null}
                variant={null}
              >
                <Icon as={FilterIcon} className="size-6" />
                {activeFilterCount > 0 && (
                  <View className="absolute top-0 right-0 size-5 items-center justify-center rounded-full bg-primary">
                    <Text className="font-sans-bold text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </Button>

              {/* Create Button */}
              <Button
                className="w-10"
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light)
                  router.push('/admin/tasks/create')
                }}
                size={null}
                variant={null}
              >
                <Icon as={PlusIcon} className="size-7" />
              </Button>
            </View>
          ),
        }}
      />
      <View className="flex-1 bg-background">
        {/* Active Filter Chips */}
        <ActiveFilterChips
          filters={filterState}
          onClearAll={handleClearAllFilters}
          onRemoveAssignee={handleRemoveAssignee}
          onRemoveDateFilter={handleRemoveDateFilter}
          onRemoveStatus={handleRemoveStatus}
          userNames={userNames}
        />

        {/* Task List */}
        <AdminTaskList
          contentContainerClassName="gap-2 p-4 pb-4"
          filters={apiFilters}
          searchText={searchText}
        />
      </View>

      {/* Filter Bottom Sheet */}
      <TaskFilterBottomSheet
        initialFilters={filterState}
        onApplyFilters={handleApplyFilters}
        ref={filterSheetRef}
        showAssigneeFilter // Admin can filter by assignees
      />
    </>
  )
}
