import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Link, Stack } from 'expo-router'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  UsersIcon,
} from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { useEmployeeReport } from '@/api/reports/use-employee-report'
import { type User, useUserList } from '@/api/user/use-user-list'
import { BottomSheet } from '@/components/ui/bottom-sheet'
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
import { cn } from '@/lib/utils'
import { getUserFullName, isUserBanned } from '@/utils/user-helper'

export default function AdminReportsScreen() {
  const currentMonth = getCurrentMonth()
  const [selectedYear, setSelectedYear] = useState(currentMonth.year)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.month)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const employeeSheetRef = useRef<BottomSheetModal>(null)

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
  } = useEmployeeReport(
    {
      userId: selectedUserId || '',
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timezone: 'Asia/Ho_Chi_Minh',
    },
    {
      enabled: !!selectedUserId,
    },
  )

  // Fetch employee report for previous month (for comparison)
  const { data: prevReportData } = useEmployeeReport(
    {
      userId: selectedUserId || '',
      startDate: prevDateRange.startDate,
      endDate: prevDateRange.endDate,
      timezone: 'Asia/Ho_Chi_Minh',
    },
    {
      enabled: !!selectedUserId,
    },
  )

  // Fetch user list for selector
  const { data: users, refetch: refetchUsers } = useUserList()
  const selectedUser = users?.find((u) => u.id === selectedUserId)

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

  const handleOpenEmployeeSelector = () => {
    impactAsync(ImpactFeedbackStyle.Light)
    employeeSheetRef.current?.present()
  }

  const handleRefresh = useCallback(async () => {
    impactAsync(ImpactFeedbackStyle.Light)
    await Promise.all([
      refetchUsers(),
      selectedUserId ? refetchReport() : Promise.resolve(),
    ])
  }, [refetchUsers, refetchReport, selectedUserId])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Báo cáo nhân viên',
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

        {/* Employee Selector */}
        <Card>
          <CardHeader className="pb-3">
            <View className="flex-row items-center gap-2">
              <Icon as={UsersIcon} className="size-5 text-foreground" />
              <CardTitle>Chọn nhân viên</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Pressable
              accessibilityLabel="Chọn nhân viên"
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-lg border border-border bg-muted p-3 active:bg-muted/80"
              onPress={handleOpenEmployeeSelector}
            >
              {selectedUser ? (
                <View className="flex-row items-center gap-3">
                  <UserAvatar className="size-10" user={selectedUser} />
                  <Text className="font-medium">
                    {getUserFullName(selectedUser)}
                  </Text>
                </View>
              ) : (
                <Text className="text-muted-foreground">
                  Chọn nhân viên để xem báo cáo
                </Text>
              )}
            </Pressable>
          </CardContent>
        </Card>

        {/* Report Content */}
        {!selectedUserId ? (
          <EmptyState
            className="py-12"
            image="laziness"
            messageDescription="Chọn nhân viên và tháng để xem báo cáo"
            messageTitle="Chưa chọn nhân viên"
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

      {/* Employee Selector Bottom Sheet */}
      <BottomSheet enableDynamicSizing ref={employeeSheetRef}>
        <BottomSheetView className="px-4 pb-safe">
          <Text className="mb-3 font-semibold text-lg">Chọn nhân viên</Text>
          <FlatList
            data={users?.filter((u) => !isUserBanned(u)) || []}
            ItemSeparatorComponent={() => <View className="h-1" />}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EmployeeListItem
                isSelected={selectedUserId === item.id}
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light)
                  setSelectedUserId(item.id)
                  employeeSheetRef.current?.dismiss()
                }}
                user={item}
              />
            )}
            scrollEnabled={false}
          />
        </BottomSheetView>
      </BottomSheet>
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
          <Text className={cn('font-bold text-xl', valueClassName)}>
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

  const displayValue = isRevenue
    ? formatCurrencyDisplay(Math.abs(change))
    : Math.abs(change).toString()

  if (isZero) {
    return (
      <View className="flex-row items-center gap-1 rounded-md bg-muted px-2 py-1">
        <Icon as={MinusIcon} className="size-3 text-muted-foreground" />
        <Text className="font-medium text-muted-foreground text-xs">
          {displayValue}
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
  return (
    <Link asChild href={`/admin/tasks/${task.id}/view`}>
      <Pressable
        accessibilityLabel={`Xem chi tiết công việc ${task.title}`}
        accessibilityRole="button"
        className="gap-2 active:opacity-70"
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
// Employee List Item Component
// ============================================================================

interface EmployeeListItemProps {
  user: User
  isSelected: boolean
  onPress: () => void
}

function EmployeeListItem({
  user,
  isSelected,
  onPress,
}: EmployeeListItemProps) {
  return (
    <Pressable
      accessibilityLabel={getUserFullName(user)}
      accessibilityRole="button"
      className={cn(
        'flex-row items-center gap-3 rounded-lg border border-border p-3 active:bg-muted',
        {
          'border-primary bg-primary/10': isSelected,
        },
      )}
      onPress={onPress}
    >
      <UserAvatar className="size-12" user={user} />
      <View className="flex-1">
        <Text className="font-semibold">{getUserFullName(user)}</Text>
        <Text className="text-muted-foreground text-sm">{user.username}</Text>
      </View>
    </Pressable>
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
