import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { router, Stack } from 'expo-router'
import Fuse from 'fuse.js'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  type ListRenderItem,
  Platform,
  RefreshControl,
  View,
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import type { EmployeeSummary } from '@/api/reports/use-employees-summary'
import { useEmployeesSummary } from '@/api/reports/use-employees-summary'
import { EmployeeListItem } from '@/components/reports/employee-list-item'
import { SummaryStatsCard } from '@/components/reports/summary-stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { SearchBox } from '@/components/ui/search-box'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import {
  formatMonthDisplay,
  getCurrentMonth,
  getMonthDateRange,
  getNextMonth,
  getPreviousMonth,
} from '@/lib/date-utils'
import { removeVietnameseAccents } from '@/lib/utils'
import { getUserFullName } from '@/utils/user-helper'

// Constant for FlatList optimization
const EMPLOYEE_ITEM_HEIGHT = 88

export default function ReportsSummaryScreen() {
  const currentMonth = getCurrentMonth()
  const [selectedYear, setSelectedYear] = useState(currentMonth.year)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.month)
  const [searchQuery, setSearchQuery] = useState('')

  // Get date range for selected month
  const dateRange = getMonthDateRange(selectedYear, selectedMonth)

  // Fetch employees summary
  const { data, isLoading, isError, refetch, isRefetching } =
    useEmployeesSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timezone: 'Asia/Ho_Chi_Minh',
      sort: 'revenue',
      sortOrder: 'desc',
    })

  // Calculate employees with tied ranking
  const employeesWithRanks = useMemo(() => {
    if (!data?.employees) {
      return []
    }

    const employees = [...data.employees]
    let currentRank = 1
    let previousRevenue: number | null = null
    let sameRankCount = 0

    return employees.map((employee) => {
      const revenue = employee.metrics.totalRevenue

      // If revenue is different from previous, update rank
      if (previousRevenue !== null && revenue !== previousRevenue) {
        currentRank += sameRankCount
        sameRankCount = 1
      } else {
        sameRankCount++
      }

      previousRevenue = revenue

      return {
        ...employee,
        rank: currentRank,
      }
    })
  }, [data?.employees])

  // Filter employees by search query with fuzzy search (Fuse.js)
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employeesWithRanks
    }

    // Create searchable data with normalized fields
    const searchableEmployees = employeesWithRanks.map((emp) => ({
      ...emp,
      searchName: removeVietnameseAccents(getUserFullName(emp).toLowerCase()),
      searchEmail: removeVietnameseAccents((emp.email || '').toLowerCase()),
    }))

    // Configure Fuse.js for fuzzy matching
    const fuse = new Fuse(searchableEmployees, {
      keys: ['searchName', 'searchEmail'],
      threshold: 0.3,
      includeScore: true,
      shouldSort: true,
      ignoreLocation: true,
    })

    // Normalize search query
    const normalizedQuery = removeVietnameseAccents(
      searchQuery.toLowerCase().trim(),
    )

    // Perform fuzzy search
    const results = fuse.search(normalizedQuery)

    // Return original employee objects (without search* fields) while preserving rank
    return results.map((result) => {
      // biome-ignore lint/correctness/noUnusedVariables: Intentionally destructuring to omit search* fields
      const { searchName, searchEmail, ...emp } = result.item
      return emp as EmployeeSummary & { rank: number }
    })
  }, [employeesWithRanks, searchQuery])

  const handlePreviousMonth = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    const prev = getPreviousMonth(selectedYear, selectedMonth)
    setSelectedYear(prev.year)
    setSelectedMonth(prev.month)
  }, [selectedYear, selectedMonth])

  const handleNextMonth = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    const next = getNextMonth(selectedYear, selectedMonth)
    setSelectedYear(next.year)
    setSelectedMonth(next.month)
  }, [selectedYear, selectedMonth])

  const handleEmployeePress = useCallback(
    (userId: string) => {
      // Use template string with type assertion for dynamic routes
      router.push(
        `/admin/reports/${userId}?year=${selectedYear}&month=${selectedMonth}`,
      )
    },
    [selectedYear, selectedMonth],
  )

  const handleRefresh = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    await refetch()
  }, [refetch])

  // FlatList optimizations
  const renderItem: ListRenderItem<EmployeeSummary & { rank: number }> =
    useCallback(
      ({ item }) => (
        <EmployeeListItem
          employee={item}
          onPress={handleEmployeePress}
          rank={item.rank}
        />
      ),
      [handleEmployeePress],
    )

  const keyExtractor = useCallback((item: EmployeeSummary) => item.id, [])

  const getItemLayout = useCallback(
    (_data: ArrayLike<EmployeeSummary> | null | undefined, index: number) => ({
      length: EMPLOYEE_ITEM_HEIGHT,
      offset: EMPLOYEE_ITEM_HEIGHT * index,
      index,
    }),
    [],
  )

  const ListHeaderComponent = useMemo(
    () => (
      <View className="gap-4 pb-2">
        {/* Month Picker */}
        <Card>
          <CardHeader className="pb-3">
            <View className="flex-row items-center gap-2">
              <Icon as={CalendarIcon} className="size-5 text-foreground" />
              <CardTitle>Chọn tháng</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <Button
                accessibilityLabel="Tháng trước"
                accessibilityRole="button"
                onPress={handlePreviousMonth}
                size="icon"
                variant="outline"
              >
                <Icon as={ChevronLeftIcon} />
              </Button>
              <Text className="font-semibold text-lg">
                {formatMonthDisplay(selectedYear, selectedMonth)}
              </Text>
              <Button
                accessibilityLabel="Tháng sau"
                accessibilityRole="button"
                disabled={
                  selectedYear === currentMonth.year &&
                  selectedMonth === currentMonth.month
                }
                onPress={handleNextMonth}
                size="icon"
                variant="outline"
              >
                <Icon as={ChevronRightIcon} />
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <SummaryStatsCard summary={data?.summary} />

        {/* Search Box */}
        {data?.employees && data.employees.length > 0 && (
          <SearchBox
            accessibilityHint="Nhập tên hoặc email để tìm kiếm"
            accessibilityLabel="Tìm kiếm nhân viên"
            onChangeTextDebounced={setSearchQuery}
            placeholder="Tìm kiếm nhân viên..."
            value={searchQuery}
          />
        )}

        {/* Results Header */}
        {filteredEmployees.length > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-lg">Danh sách nhân viên</Text>
            <Text className="text-muted-foreground text-sm">
              {filteredEmployees.length} nhân viên
            </Text>
          </View>
        )}
      </View>
    ),
    [
      data?.summary,
      data?.employees,
      searchQuery,
      selectedYear,
      selectedMonth,
      currentMonth,
      filteredEmployees.length,
      handleNextMonth,
      handlePreviousMonth,
    ],
  )

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return null
    }

    if (isError) {
      return (
        <EmptyState
          className="py-12"
          image="curiosity"
          messageDescription="Không thể tải báo cáo. Vui lòng thử lại."
          messageTitle="Lỗi tải báo cáo"
        />
      )
    }

    if (searchQuery.trim() && filteredEmployees.length === 0) {
      return (
        <EmptyState
          className="py-12"
          image="curiosity"
          messageDescription="Thử tìm kiếm với từ khóa khác"
          messageTitle="Không tìm thấy nhân viên"
        />
      )
    }

    return (
      <EmptyState
        className="py-12"
        image="laziness"
        messageDescription="Chưa có dữ liệu cho tháng này"
        messageTitle="Chưa có hoạt động"
      />
    )
  }, [isLoading, isError, searchQuery, filteredEmployees.length])

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Báo cáo nhân viên',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View className="flex-1 bg-background">
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 112 }}
          data={isLoading && !data ? [] : filteredEmployees}
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={
            isLoading && !data ? (
              <LoadingHeaderComponent
                onMonthChange={(year, month) => {
                  setSelectedYear(year)
                  setSelectedMonth(month)
                }}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            ) : (
              ListHeaderComponent
            )
          }
          maxToRenderPerBatch={10}
          refreshControl={
            <RefreshControl
              onRefresh={handleRefresh}
              refreshing={isRefetching}
            />
          }
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderItem}
          windowSize={5}
        />
      </View>
    </>
  )
}

// ============================================================================
// Loading Header Component (keeps month picker interactive)
// ============================================================================

interface LoadingHeaderComponentProps {
  selectedYear: number
  selectedMonth: number
  onMonthChange: (year: number, month: number) => void
}

function LoadingHeaderComponent({
  selectedYear,
  selectedMonth,
  onMonthChange,
}: LoadingHeaderComponentProps) {
  // Get current month for comparison (to disable "next month" button)
  const currentMonth = getCurrentMonth()

  const handlePreviousMonth = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    const prev = getPreviousMonth(selectedYear, selectedMonth)
    onMonthChange(prev.year, prev.month)
  }, [selectedYear, selectedMonth, onMonthChange])

  const handleNextMonth = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    const next = getNextMonth(selectedYear, selectedMonth)
    onMonthChange(next.year, next.month)
  }, [selectedYear, selectedMonth, onMonthChange])

  return (
    <View className="gap-4 pb-2">
      {/* Month Picker - INTERACTIVE during loading */}
      <Card>
        <CardHeader className="pb-3">
          <View className="flex-row items-center gap-2">
            <Icon as={CalendarIcon} className="size-5 text-foreground" />
            <CardTitle>Chọn tháng</CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between">
            <Button
              accessibilityLabel="Tháng trước"
              accessibilityRole="button"
              onPress={handlePreviousMonth}
              size="icon"
              variant="outline"
            >
              <Icon as={ChevronLeftIcon} />
            </Button>
            <Text className="font-semibold text-lg">
              {formatMonthDisplay(selectedYear, selectedMonth)}
            </Text>
            <Button
              accessibilityLabel="Tháng sau"
              accessibilityRole="button"
              disabled={
                selectedYear === currentMonth.year &&
                selectedMonth === currentMonth.month
              }
              onPress={handleNextMonth}
              size="icon"
              variant="outline"
            >
              <Icon as={ChevronRightIcon} />
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Loading Stats Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="gap-3">
          {Array.from({ length: 4 }, (_, i) => ({ id: `stat-${i}` })).map(
            (item) => (
              <View
                className="flex-row items-center justify-between"
                key={item.id}
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </View>
            ),
          )}
        </CardContent>
      </Card>

      {/* Loading Employee List Skeleton */}
      {Array.from({ length: 5 }, (_, i) => ({
        id: `employee-skeleton-${i}`,
      })).map((item) => (
        <Card key={item.id}>
          <CardContent className="flex-row items-center gap-3 py-3">
            <Skeleton className="size-12 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </View>
            <Skeleton className="h-6 w-20" />
          </CardContent>
        </Card>
      ))}
    </View>
  )
}
