import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import type { TaskStatus } from '@nv-internal/validation'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { UsersIcon } from 'lucide-react-native'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import {
  TaskAssigneePickerModal,
  type TaskAssigneePickerModalMethods,
} from './task-assignee-picker-modal'
import {
  TaskDatePickerModal,
  type TaskDatePickerModalMethods,
} from './task-date-picker-modal'
import {
  type QuickDateRange,
  TaskQuickDateFilter,
} from './task-quick-date-filter'
import type { TaskSortBy, TaskSortOrder } from './task-sort-filter'
import { TaskSortFilter } from './task-sort-filter'
import { TaskStatusFilter } from './task-status-filter'

export type DateFilterType = 'created' | 'completed'

export type TaskFilterState = {
  status?: TaskStatus[]
  assigneeIds?: string[]
  createdFrom?: Date
  createdTo?: Date
  completedFrom?: Date
  completedTo?: Date
  sortBy?: TaskSortBy
  sortOrder?: TaskSortOrder
  dateFilterType?: DateFilterType
  datePreset?: QuickDateRange // Track which preset was selected for persistence
}

export type TaskFilterBottomSheetProps = {
  initialFilters: TaskFilterState
  onApplyFilters: (filters: TaskFilterState) => void
  showAssigneeFilter?: boolean // Only show for admins
}

export type TaskFilterBottomSheetMethods = {
  present: () => void
  dismiss: () => void
}

/**
 * Redesigned comprehensive filter bottom sheet for task lists
 * SIMPLIFIED UX: No scrolling needed, cleaner layout, progressive disclosure
 *
 * Key improvements:
 * - ✅ Removed BottomSheetScrollView (uses BottomSheetView only)
 * - ✅ Fixed VirtualizedList nesting error (assignee picker in separate modal)
 * - ✅ Quick date presets instead of verbose date pickers
 * - ✅ Horizontal chip layout for status (more compact)
 * - ✅ Collapsible sort filter (saves space)
 * - ✅ Separate modals for complex filters (assignees, custom dates)
 *
 * Features:
 * - Status multi-select with horizontal chips
 * - Quick date filters (Today, Week, Month, Custom)
 * - Assignee picker button (opens separate modal)
 * - Collapsible sort options
 * - Apply/Reset actions
 * - Haptic feedback on interactions
 */
export const TaskFilterBottomSheet = forwardRef<
  TaskFilterBottomSheetMethods,
  TaskFilterBottomSheetProps
>(({ initialFilters, onApplyFilters, showAssigneeFilter = false }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null)
  const assigneeModalRef = useRef<TaskAssigneePickerModalMethods>(null)
  const datePickerModalRef = useRef<TaskDatePickerModalMethods>(null)

  // Local state for filters (only applied when user clicks "Áp dụng")
  const [localFilters, setLocalFilters] =
    useState<TaskFilterState>(initialFilters)

  // Quick date range state (for UI only, converts to actual dates)
  // Initialize from saved preset if available
  const [quickScheduledRange, setQuickScheduledRange] =
    useState<QuickDateRange>(initialFilters.datePreset || null)

  // Date filter type state (created or completed)
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>(
    initialFilters.dateFilterType || 'created',
  )

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      setLocalFilters(initialFilters) // Reset to current filters
      setQuickScheduledRange(initialFilters.datePreset || null) // Restore saved preset
      setDateFilterType(initialFilters.dateFilterType || 'created')
      bottomSheetRef.current?.present()
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss()
    },
  }))

  const handleApply = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    onApplyFilters({
      ...localFilters,
      dateFilterType,
      datePreset: quickScheduledRange, // Save the selected preset
    })
    bottomSheetRef.current?.dismiss()
  }

  const handleReset = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    const resetFilters: TaskFilterState = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      dateFilterType: 'created',
      datePreset: null, // Clear preset
    }
    setLocalFilters(resetFilters)
    setQuickScheduledRange(null)
    setDateFilterType('created')
  }

  const handleCancel = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    bottomSheetRef.current?.dismiss()
  }

  // Handle quick date range selection
  const handleQuickDateRangeChange = (range: QuickDateRange) => {
    setQuickScheduledRange(range)

    if (range === 'custom') {
      // Open custom date picker modal
      datePickerModalRef.current?.present()
      return
    }

    // Calculate dates based on quick range
    let fromDate: Date | undefined
    let toDate: Date | undefined

    const now = new Date()

    switch (range) {
      case 'yesterday': {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        fromDate = startOfDay(yesterday)
        toDate = endOfDay(yesterday)
        break
      }
      case 'today':
        fromDate = startOfDay(now)
        toDate = endOfDay(now)
        break
      case 'week':
        fromDate = startOfWeek(now, { weekStartsOn: 1 }) // Monday
        toDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'lastWeek': {
        const lastWeek = new Date(now)
        lastWeek.setDate(lastWeek.getDate() - 7)
        fromDate = startOfWeek(lastWeek, { weekStartsOn: 1 }) // Monday
        toDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
        break
      }
      case 'month':
        fromDate = startOfMonth(now)
        toDate = endOfMonth(now)
        break
      case 'lastMonth': {
        const lastMonth = new Date(now)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        fromDate = startOfMonth(lastMonth)
        toDate = endOfMonth(lastMonth)
        break
      }
      case null:
        fromDate = undefined
        toDate = undefined
        break
    }

    // Apply dates to the selected date filter type
    setLocalFilters((prev) => {
      const updates: Partial<TaskFilterState> = {}

      if (dateFilterType === 'created') {
        updates.createdFrom = fromDate
        updates.createdTo = toDate
      } else if (dateFilterType === 'completed') {
        updates.completedFrom = fromDate
        updates.completedTo = toDate
      }

      return { ...prev, ...updates }
    })
  }

  // Handle custom date picker apply
  const handleCustomDateApply = (fromDate?: Date, toDate?: Date) => {
    setLocalFilters((prev) => {
      const updates: Partial<TaskFilterState> = {}

      if (dateFilterType === 'created') {
        updates.createdFrom = fromDate
        updates.createdTo = toDate
      } else if (dateFilterType === 'completed') {
        updates.completedFrom = fromDate
        updates.completedTo = toDate
      }

      return { ...prev, ...updates }
    })
    // Keep 'custom' selected if dates are provided
    if (fromDate || toDate) {
      setQuickScheduledRange('custom')
    } else {
      setQuickScheduledRange(null)
    }
  }

  // Handle assignee picker apply
  const handleAssigneeApply = (userIds: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      assigneeIds: userIds,
    }))
  }

  const openAssigneePicker = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    assigneeModalRef.current?.present()
  }

  // Count active filters (excluding sort which is always present)
  const activeFilterCount =
    (localFilters.status?.length || 0) +
    (localFilters.assigneeIds?.length || 0) +
    (localFilters.createdFrom || localFilters.createdTo ? 1 : 0) +
    (localFilters.completedFrom || localFilters.completedTo ? 1 : 0)

  return (
    <>
      <BottomSheet
        enableDynamicSizing
        maxDynamicContentSize={700}
        ref={bottomSheetRef}
      >
        {/* Fixed height container - prevents actions from scrolling away */}
        <View style={{ height: 650 }}>
          {/* Scrollable Content - takes remaining space */}
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 16,
            }}
            style={{ flex: 1 }}
          >
            <View className="gap-5">
              {/* Header */}
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-bold text-foreground text-xl">
                  Bộ lọc & sắp xếp
                </Text>
                {activeFilterCount > 0 && (
                  <View className="rounded-full bg-primary px-2.5 py-1">
                    <Text className="font-sans-bold text-primary-foreground text-xs">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Status Filter - Horizontal chips */}
              <TaskStatusFilter
                onChangeSelectedStatuses={(statuses) =>
                  setLocalFilters((prev) => ({ ...prev, status: statuses }))
                }
                selectedStatuses={localFilters.status || []}
              />

              {/* Date Filter Type Selector */}
              <View className="gap-2">
                <Text className="font-sans-semibold text-muted-foreground text-sm">
                  Loại ngày
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    accessibilityHint="Lọc theo ngày tạo"
                    accessibilityLabel={`Ngày tạo${dateFilterType === 'created' ? ', đã chọn' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: dateFilterType === 'created',
                    }}
                    className="flex-1"
                    onPress={() => {
                      impactAsync(ImpactFeedbackStyle.Light)
                      setDateFilterType('created')
                      setQuickScheduledRange(null)
                    }}
                  >
                    <View
                      className={cn(
                        'items-center justify-center rounded-lg border px-3 py-2.5',
                        dateFilterType === 'created'
                          ? 'border-border bg-muted'
                          : 'border-muted bg-card',
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-semibold text-sm',
                          'text-foreground',
                        )}
                        numberOfLines={1}
                      >
                        Ngày tạo
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityHint="Lọc theo ngày hoàn thành"
                    accessibilityLabel={`Ngày hoàn thành${dateFilterType === 'completed' ? ', đã chọn' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: dateFilterType === 'completed',
                    }}
                    className="flex-1"
                    onPress={() => {
                      impactAsync(ImpactFeedbackStyle.Light)
                      setDateFilterType('completed')
                      setQuickScheduledRange(null)
                    }}
                  >
                    <View
                      className={cn(
                        'items-center justify-center rounded-lg border px-3 py-2.5',
                        dateFilterType === 'completed'
                          ? 'border-border bg-muted'
                          : 'border-muted bg-card',
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-semibold text-sm',
                          'text-foreground',
                        )}
                        numberOfLines={1}
                      >
                        Ngày hoàn thành
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Quick Date Filter */}
              <TaskQuickDateFilter
                label={
                  dateFilterType === 'created' ? 'Ngày tạo' : 'Ngày hoàn thành'
                }
                onSelectRange={handleQuickDateRangeChange}
                selectedRange={quickScheduledRange}
              />

              {/* Assignee Picker Button (Admin only) */}
              {showAssigneeFilter && (
                <View className="gap-2">
                  <Text className="font-sans-semibold text-muted-foreground text-sm">
                    Người làm
                  </Text>
                  <Pressable
                    accessibilityHint="Mở danh sách chọn nhân viên"
                    accessibilityLabel={`Chọn nhân viên${localFilters.assigneeIds?.length ? ` (${localFilters.assigneeIds.length} đã chọn)` : ''}`}
                    accessibilityRole="button"
                    onPress={openAssigneePicker}
                  >
                    <View
                      className={cn(
                        'flex-row items-center gap-2 rounded-lg border p-3',
                        localFilters.assigneeIds?.length
                          ? 'border-primary bg-primary/10'
                          : 'border-muted bg-card',
                      )}
                    >
                      <Icon
                        as={UsersIcon}
                        className={cn(
                          'size-5',
                          localFilters.assigneeIds?.length
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                      />
                      <Text
                        className={cn(
                          'flex-1 font-sans-medium',
                          localFilters.assigneeIds?.length
                            ? 'text-primary'
                            : 'text-foreground',
                        )}
                      >
                        {localFilters.assigneeIds?.length
                          ? `Đã chọn ${localFilters.assigneeIds.length} nhân viên`
                          : 'Chọn nhân viên...'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Sort Options - Collapsible */}
              <TaskSortFilter
                onChangeSortBy={(sortBy) =>
                  setLocalFilters((prev) => ({ ...prev, sortBy }))
                }
                onChangeSortOrder={(sortOrder) =>
                  setLocalFilters((prev) => ({ ...prev, sortOrder }))
                }
                sortBy={localFilters.sortBy}
                sortOrder={localFilters.sortOrder}
              />
            </View>
            <View className="mt-4 bg-background pb-safe">
              <View className="gap-2">
                <Button onPress={handleApply} size="lg">
                  <Text>
                    Áp dụng{activeFilterCount > 0 && ` (${activeFilterCount})`}
                  </Text>
                </Button>

                <View className="flex-row gap-2">
                  <Button
                    className="flex-1"
                    onPress={handleReset}
                    variant="outline"
                  >
                    <Text>Đặt lại</Text>
                  </Button>

                  <Button
                    className="flex-1"
                    onPress={handleCancel}
                    variant="outline"
                  >
                    <Text>Hủy</Text>
                  </Button>
                </View>
              </View>
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheet>

      {/* Separate Assignee Picker Modal - No nesting issues! */}
      {showAssigneeFilter && (
        <TaskAssigneePickerModal
          onApply={handleAssigneeApply}
          ref={assigneeModalRef}
          selectedUserIds={localFilters.assigneeIds || []}
        />
      )}

      {/* Separate Date Picker Modal - For custom dates */}
      <TaskDatePickerModal
        initialFromDate={
          dateFilterType === 'created'
            ? localFilters.createdFrom
            : localFilters.completedFrom
        }
        initialToDate={
          dateFilterType === 'created'
            ? localFilters.createdTo
            : localFilters.completedTo
        }
        label={
          dateFilterType === 'created'
            ? 'Chọn ngày tạo'
            : 'Chọn ngày hoàn thành'
        }
        onApply={handleCustomDateApply}
        ref={datePickerModalRef}
      />
    </>
  )
})

TaskFilterBottomSheet.displayName = 'TaskFilterBottomSheet'
