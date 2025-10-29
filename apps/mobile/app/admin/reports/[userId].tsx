import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Link, Stack, useLocalSearchParams } from 'expo-router'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
} from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { useEmployeeReport } from '@/api/reports/use-employee-report'
import { useUserList } from '@/api/user/use-user-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrencyDisplay } from '@/components/ui/currency-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { UserAvatar } from '@/components/user-avatar'
import {
  formatDateTimeVN,
  formatMonthDisplay,
  getCurrentMonth,
  getMonthDateRange,
  getNextMonth,
  getPreviousMonth,
} from '@/lib/date-utils'
import { cn, formatCurrencyCompact } from '@/lib/utils'
import { getUserFullName } from '@/utils/user-helper'

export default function EmployeeReportDetailScreen() {
  const { userId, year, month } = useLocalSearchParams<{
    userId: string
    year?: string
    month?: string
  }>()
  const currentMonth = getCurrentMonth()

  // Initialize with passed params or default to current month
  const [selectedYear, setSelectedYear] = useState(() => {
    if (year && !Number.isNaN(Number.parseInt(year, 10))) {
      return Number.parseInt(year, 10)
    }
    return currentMonth.year
  })
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (month && !Number.isNaN(Number.parseInt(month, 10))) {
      const monthNum = Number.parseInt(month, 10)
      if (monthNum >= 1 && monthNum <= 12) {
        return monthNum
      }
    }
    return currentMonth.month
  })

  // Get date range for selected month
  const dateRange = getMonthDateRange(selectedYear, selectedMonth)

  // Get previous month date range for comparison
  const prevMonth = getPreviousMonth(selectedYear, selectedMonth)
  const prevDateRange = getMonthDateRange(prevMonth.year, prevMonth.month)

  // Fetch employee report for selected month
  const {
    data: reportData,
    isLoading,
    isError,
    refetch: refetchReport,
    isRefetching,
  } = useEmployeeReport({
    userId: userId || '',
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    timezone: 'Asia/Ho_Chi_Minh',
  })

  // Fetch employee report for previous month (for comparison)
  const { data: prevReportData } = useEmployeeReport({
    userId: userId || '',
    startDate: prevDateRange.startDate,
    endDate: prevDateRange.endDate,
    timezone: 'Asia/Ho_Chi_Minh',
  })

  // Fetch user to display name in header
  const { data: users } = useUserList()
  const selectedUser = users?.find((u) => u.id === userId)

  const handlePreviousMonth = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    const prev = getPreviousMonth(selectedYear, selectedMonth)
    setSelectedYear(prev.year)
    setSelectedMonth(prev.month)
  }

  const handleNextMonth = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    const next = getNextMonth(selectedYear, selectedMonth)
    setSelectedYear(next.year)
    setSelectedMonth(next.month)
  }

  const handleRefresh = useCallback(async () => {
    impactAsync(ImpactFeedbackStyle.Light)
    await refetchReport()
  }, [refetchReport])

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: selectedUser
            ? getUserFullName(selectedUser)
            : 'Báo cáo nhân viên',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-28"
        refreshControl={
          <RefreshControl onRefresh={handleRefresh} refreshing={isRefetching} />
        }
      >
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

        {/* Employee Info Card */}
        {selectedUser && (
          <Card>
            <CardContent className="flex-row items-center gap-3 py-3">
              <UserAvatar className="size-16" user={selectedUser} />
              <View className="flex-1">
                <Text className="font-semibold text-lg">
                  {getUserFullName(selectedUser)}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {selectedUser.username}
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        {!userId ? (
          <EmptyState
            className="py-12"
            image="laziness"
            messageDescription="Không tìm thấy thông tin nhân viên"
            messageTitle="Lỗi"
          />
        ) : isLoading ? (
          <ReportSkeleton />
        ) : isError || !reportData ? (
          <EmptyState
            className="py-12"
            image="curiosity"
            messageDescription="Không thể tải báo cáo. Vui lòng thử lại."
            messageTitle="Lỗi tải báo cáo"
          />
        ) : (
          <>
            {/* Metrics Cards */}
            <View className="flex-row gap-4">
              <MetricCard
                change={
                  prevReportData
                    ? reportData.metrics.daysWorked -
                      prevReportData.metrics.daysWorked
                    : undefined
                }
                className="flex-1"
                label="Ngày làm việc"
                value={reportData.metrics.daysWorked.toString()}
              />
              <MetricCard
                change={
                  prevReportData
                    ? reportData.metrics.tasksCompleted -
                      prevReportData.metrics.tasksCompleted
                    : undefined
                }
                className="flex-1"
                label="Công việc"
                value={reportData.metrics.tasksCompleted.toString()}
              />
            </View>

            <MetricCard
              change={
                prevReportData
                  ? reportData.metrics.totalRevenue -
                    prevReportData.metrics.totalRevenue
                  : undefined
              }
              isRevenue
              label="Tổng doanh thu"
              value={formatCurrencyDisplay(reportData.metrics.totalRevenue)}
              valueClassName="text-2xl"
            />

            {/* Task List */}
            {reportData.tasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết công việc</CardTitle>
                  <CardDescription>
                    {reportData.tasks.length} công việc đã hoàn thành
                  </CardDescription>
                </CardHeader>
                <CardContent className="gap-3">
                  {reportData.tasks.map((task, index) => (
                    <View key={task.id}>
                      {index > 0 && <Separator className="mb-3" />}
                      <TaskListItem task={task} />
                    </View>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                className="py-8"
                image="laziness"
                messageDescription="Nhân viên chưa hoàn thành công việc nào trong tháng này"
                messageTitle="Chưa có công việc"
              />
            )}
          </>
        )}
      </ScrollView>
    </>
  )
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  label: string
  value: string
  className?: string
  valueClassName?: string
  change?: number
  isRevenue?: boolean
}

function MetricCard({
  label,
  value,
  className,
  valueClassName,
  change,
  isRevenue = false,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="gap-1 py-2.5">
        <Text className="text-muted-foreground text-sm">{label}</Text>
        <View className="flex-row items-center justify-between">
          <Text className={cn('font-sans-bold text-xl', valueClassName)}>
            {value}
          </Text>
          {change !== undefined && (
            <MetricChange change={change} isRevenue={isRevenue} />
          )}
        </View>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Metric Change Component
// ============================================================================

interface MetricChangeProps {
  change: number
  isRevenue?: boolean
}

function MetricChange({ change, isRevenue = false }: MetricChangeProps) {
  const isPositive = change > 0
  const isNegative = change < 0
  const isZero = change === 0

  // NO +/- SIGNS - Icons and colors already indicate direction
  // Use compact format for revenue, absolute number for other metrics
  const displayValue = isRevenue
    ? formatCurrencyCompact(change)
    : Math.abs(change).toString()

  if (isZero) {
    return (
      <View className="flex-row items-center gap-1 rounded-md bg-muted px-2 py-1">
        <Icon as={MinusIcon} className="size-3 text-muted-foreground" />
        <Text className="font-medium text-muted-foreground text-xs">
          {isRevenue ? '0 ₫' : '0'}
        </Text>
      </View>
    )
  }

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-md px-2 py-1',
        isPositive && 'bg-green-500/10',
        isNegative && 'bg-red-500/10',
      )}
    >
      <Icon
        as={isPositive ? ArrowUpIcon : ArrowDownIcon}
        className={cn(
          'size-3',
          isPositive && 'text-green-600',
          isNegative && 'text-red-600',
        )}
      />
      <Text
        className={cn(
          'font-medium text-xs',
          isPositive && 'text-green-600',
          isNegative && 'text-red-600',
        )}
      >
        {displayValue}
      </Text>
    </View>
  )
}

// ============================================================================
// Task List Item Component
// ============================================================================

interface TaskListItemProps {
  task: {
    id: number
    title: string
    completedAt: string
    revenue: number
    revenueShare: number
    workerCount: number
  }
}

function TaskListItem({ task }: TaskListItemProps) {
  const handlePress = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
  }, [])

  return (
    <Link asChild href={`/admin/tasks/${task.id}/view`}>
      <Pressable
        accessibilityLabel={`Xem chi tiết công việc ${task.title}`}
        accessibilityRole="button"
        className="gap-2 active:opacity-70"
        onPress={handlePress}
      >
        <Text className="font-semibold">{task.title}</Text>
        <Text className="text-muted-foreground text-sm">
          Hoàn thành: {formatDateTimeVN(task.completedAt)}
        </Text>
        <View className="gap-1.5 rounded-lg bg-muted p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-sm">
              Tổng doanh thu:
            </Text>
            <Text className="text-sm">
              {formatCurrencyDisplay(task.revenue)}
            </Text>
          </View>
          {task.workerCount > 1 && (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground text-sm">
                  Số người làm:
                </Text>
                <Text className="text-sm">{task.workerCount} người</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground text-sm">
                  Phần của nhân viên:
                </Text>
                <Text className="font-semibold text-sm">
                  {formatCurrencyDisplay(task.revenueShare)}
                </Text>
              </View>
            </>
          )}
        </View>
      </Pressable>
    </Link>
  )
}

// ============================================================================
// Report Skeleton Component
// ============================================================================

function ReportSkeleton() {
  return (
    <View className="gap-4">
      {/* Metrics Skeleton */}
      <View className="flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="gap-1 py-2.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="gap-1 py-2.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </CardContent>
        </Card>
      </View>

      <Card>
        <CardContent className="gap-1 py-2.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      {/* Task List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="gap-4">
          {[1, 2, 3].map((i) => (
            <View className="gap-2" key={i}>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <View className="gap-1.5 rounded-lg bg-muted p-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  )
}
