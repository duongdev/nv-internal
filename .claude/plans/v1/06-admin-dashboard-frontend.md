# Admin Dashboard - Frontend Implementation Plan

**Related**: [Main Plan](./06-admin-dashboard.md) | [Common Specs](./06-admin-dashboard-common.md) | [Backend Plan](./06-admin-dashboard-backend.md)

## Overview

Mobile UI implementation for the admin dashboard using React Native, Expo Router, and NativeWind. The dashboard provides a card-based interface for viewing metrics and accessing admin functions.

## Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **State Management**: TanStack Query v5
- **Authentication**: Clerk React Native SDK
- **UI Components**: shadcn-inspired components from `components/ui/`

### File Structure

```
apps/mobile/
├── app/
│   └── admin/
│       └── (tabs)/
│           └── index.tsx              # Dashboard screen
├── components/
│   └── dashboard/
│       ├── today-overview-card.tsx    # Today's metrics card
│       ├── task-distribution-card.tsx # Status breakdown card
│       ├── recent-activity-card.tsx   # Activity feed card
│       ├── worker-performance-card.tsx # Worker stats card
│       ├── quick-actions-card.tsx     # Action buttons card
│       └── metric-item.tsx            # Reusable metric display
└── lib/
    └── api/
        └── dashboard.ts               # API client functions
```

## Screen Implementation

### Dashboard Screen (index.tsx)

```tsx
import { ScrollView, RefreshControl, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { TodayOverviewCard } from '@/components/dashboard/today-overview-card'
import { TaskDistributionCard } from '@/components/dashboard/task-distribution-card'
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card'
import { WorkerPerformanceCard } from '@/components/dashboard/worker-performance-card'
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card'
import { useDashboardStats, useRecentActivities } from '@/lib/api/dashboard'
import { Text } from '@/components/ui/text'

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: statsRefetching
  } = useDashboardStats()

  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
    isRefetching: activitiesRefetching
  } = useRecentActivities({ limit: 10 })

  const isRefreshing = statsRefetching || activitiesRefetching

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchActivities()])
  }

  if (statsLoading || activitiesLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-muted-foreground">Đang tải...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <TodayOverviewCard stats={stats?.overview} />
      <TaskDistributionCard distribution={stats?.taskDistribution} />
      <RecentActivityCard activities={activities?.activities} />
      <WorkerPerformanceCard workers={stats?.workerStats} />
      <QuickActionsCard />
    </ScrollView>
  )
}
```

## Component Implementation

### 1. Today's Overview Card

```tsx
// components/dashboard/today-overview-card.tsx
import { View } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricItem } from './metric-item'

interface TodayOverviewCardProps {
  stats?: {
    tasksToday: number
    activeWorkers: number
    tasksInProgress: number
    overdueTasks: number
  }
}

export function TodayOverviewCard({ stats }: TodayOverviewCardProps) {
  if (!stats) return null

  return (
    <Card className="bg-muted dark:border-white/20">
      <CardHeader>
        <CardTitle>Tổng quan hôm nay</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row flex-wrap gap-4">
          <MetricItem
            label="Công việc hôm nay"
            value={stats.tasksToday}
            className="flex-1"
          />
          <MetricItem
            label="Nhân viên làm việc"
            value={stats.activeWorkers}
            className="flex-1"
          />
        </View>
        <View className="flex-row flex-wrap gap-4">
          <MetricItem
            label="Đang thực hiện"
            value={stats.tasksInProgress}
            className="flex-1"
          />
          <MetricItem
            label="Quá hạn"
            value={stats.overdueTasks}
            variant={stats.overdueTasks > 0 ? 'danger' : 'default'}
            className="flex-1"
          />
        </View>
      </CardContent>
    </Card>
  )
}
```

### 2. Task Distribution Card

```tsx
// components/dashboard/task-distribution-card.tsx
import { View } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { getTaskStatusInfo } from '@/lib/task-status'

interface TaskDistributionCardProps {
  distribution?: Record<string, { count: number; percentage: number }>
}

export function TaskDistributionCard({ distribution }: TaskDistributionCardProps) {
  if (!distribution) return null

  const statuses = ['PREPARING', 'READY', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']

  return (
    <Card className="bg-muted dark:border-white/20">
      <CardHeader>
        <CardTitle>Phân bổ công việc</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        {statuses.map((status) => {
          const data = distribution[status]
          const statusInfo = getTaskStatusInfo(status)

          return (
            <View
              key={status}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center gap-2">
                <Badge variant={statusInfo.variant}>
                  <Text className="text-xs">{statusInfo.label}</Text>
                </Badge>
                <Text className="text-sm text-muted-foreground">
                  {data.count} công việc
                </Text>
              </View>
              <Text className="text-sm font-medium">
                {data.percentage.toFixed(1)}%
              </Text>
            </View>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

### 3. Recent Activity Card

```tsx
// components/dashboard/recent-activity-card.tsx
import { View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Activity {
  id: string
  type: string
  userName: string
  taskId: string
  taskTitle?: string
  createdAt: string
}

interface RecentActivityCardProps {
  activities?: Activity[]
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  if (!activities?.length) return null

  const handleActivityPress = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  return (
    <Card className="bg-muted dark:border-white/20">
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        {activities.map((activity) => (
          <Pressable
            key={activity.id}
            onPress={() => handleActivityPress(activity.taskId)}
            className="active:opacity-70"
          >
            <View className="flex-row items-start justify-between gap-2 rounded-lg bg-background p-3">
              <View className="flex-1 gap-1">
                <Text className="text-sm font-medium">
                  {activity.userName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {activity.type} • {activity.taskTitle || 'Không có tiêu đề'}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: vi
                })}
              </Text>
            </View>
          </Pressable>
        ))}
      </CardContent>
    </Card>
  )
}
```

### 4. Worker Performance Card

```tsx
// components/dashboard/worker-performance-card.tsx
import { View, FlatList } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { MetricItem } from './metric-item'

interface WorkerStats {
  userId: string
  userName: string
  assignedTasks: number
  completedToday: number
  inProgressTasks: number
}

interface WorkerPerformanceCardProps {
  workers?: WorkerStats[]
}

export function WorkerPerformanceCard({ workers }: WorkerPerformanceCardProps) {
  if (!workers?.length) return null

  return (
    <Card className="bg-muted dark:border-white/20">
      <CardHeader>
        <CardTitle>Nhân viên</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <FlatList
          data={workers}
          scrollEnabled={false}
          keyExtractor={(item) => item.userId}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <View className="rounded-lg bg-background p-3">
              <Text className="mb-2 font-medium">{item.userName}</Text>
              <View className="flex-row gap-4">
                <MetricItem
                  label="Được giao"
                  value={item.assignedTasks}
                  compact
                />
                <MetricItem
                  label="Hoàn thành hôm nay"
                  value={item.completedToday}
                  compact
                />
                <MetricItem
                  label="Đang làm"
                  value={item.inProgressTasks}
                  compact
                />
              </View>
            </View>
          )}
        />
      </CardContent>
    </Card>
  )
}
```

### 5. Quick Actions Card

```tsx
// components/dashboard/quick-actions-card.tsx
import { View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Plus, List, Users } from 'lucide-react-native'

export function QuickActionsCard() {
  const actions = [
    {
      icon: Plus,
      label: 'Tạo công việc',
      onPress: () => router.push('/tasks/create')
    },
    {
      icon: List,
      label: 'Xem tất cả',
      onPress: () => router.push('/tasks')
    },
    {
      icon: Users,
      label: 'Quản lý nhân viên',
      onPress: () => router.push('/admin/employees')
    }
  ]

  return (
    <Card className="bg-muted dark:border-white/20">
      <CardHeader>
        <CardTitle>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap gap-3">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              className="active:opacity-70 flex-1 min-w-[100px] items-center gap-2 rounded-lg bg-primary p-4"
            >
              <action.icon size={24} className="text-primary-foreground" />
              <Text className="text-center text-sm font-medium text-primary-foreground">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </CardContent>
    </Card>
  )
}
```

### 6. Metric Item Component

```tsx
// components/dashboard/metric-item.tsx
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface MetricItemProps {
  label: string
  value: number
  variant?: 'default' | 'danger'
  compact?: boolean
  className?: string
}

export function MetricItem({
  label,
  value,
  variant = 'default',
  compact = false,
  className
}: MetricItemProps) {
  return (
    <View className={cn('gap-1', className)}>
      <Text
        className={cn(
          'font-medium',
          compact ? 'text-lg' : 'text-2xl',
          variant === 'danger' && 'text-destructive'
        )}
      >
        {value}
      </Text>
      <Text
        className={cn(
          'text-muted-foreground',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {label}
      </Text>
    </View>
  )
}
```

## API Client Implementation

### dashboard.ts

```typescript
// lib/api/dashboard.ts
import { useQuery } from '@tanstack/react-query'
import { callHonoApi } from './client'

export interface DashboardStats {
  overview: {
    tasksToday: number
    activeWorkers: number
    tasksInProgress: number
    overdueTasks: number
  }
  taskDistribution: Record<string, { count: number; percentage: number }>
  workerStats: Array<{
    userId: string
    userName: string
    assignedTasks: number
    completedToday: number
    inProgressTasks: number
  }>
}

export interface RecentActivitiesResponse {
  activities: Array<{
    id: string
    type: string
    userId: string
    userName: string
    taskId: string
    taskTitle?: string
    payload: Record<string, unknown>
    createdAt: string
  }>
  total: number
  hasMore: boolean
}

// Fetch dashboard statistics
export async function fetchDashboardStats(date?: string): Promise<DashboardStats> {
  const params = date ? { date } : {}
  return callHonoApi('/v1/dashboard/stats', { params })
}

// Fetch recent activities
export async function fetchRecentActivities(options?: {
  limit?: number
  offset?: number
}): Promise<RecentActivitiesResponse> {
  return callHonoApi('/v1/dashboard/activities', { params: options })
}

// React Query hooks
export function useDashboardStats(date?: string) {
  return useQuery({
    queryKey: ['dashboard', 'stats', date],
    queryFn: () => fetchDashboardStats(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000     // 10 minutes
  })
}

export function useRecentActivities(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['dashboard', 'activities', options],
    queryFn: () => fetchRecentActivities(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000      // 5 minutes
  })
}
```

## State Management

### TanStack Query Configuration

```typescript
// Existing query client configuration in app/_layout.tsx
// Dashboard queries use:
// - staleTime: 5 minutes for stats, 2 minutes for activities
// - gcTime: 10 minutes for stats, 5 minutes for activities
// - Aggressive caching for better UX
// - Manual refetch via pull-to-refresh
```

### Cache Invalidation

```typescript
// Invalidate dashboard cache after mutations
import { useQueryClient } from '@tanstack/react-query'

// Example: After creating a task
const queryClient = useQueryClient()
await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
```

## Styling Guidelines

### NativeWind Classes

```typescript
// Card container
"bg-muted dark:border-white/20"

// Card spacing
"gap-4 p-4"

// Metric layout
"flex-row flex-wrap gap-4"

// Text styles
"text-sm text-muted-foreground"
"text-2xl font-medium"

// Interactive elements
"active:opacity-70"
```

### Dark Mode Support

All components support dark mode automatically through NativeWind's dark: prefix and the app's theme configuration.

## Error Handling

### Strategy

```tsx
// Error boundary for dashboard
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary fallback={<DashboardErrorFallback />}>
  <AdminDashboard />
</ErrorBoundary>

// Error fallback component
function DashboardErrorFallback() {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="mb-4 text-destructive">
        Không thể tải trang tổng quan
      </Text>
      <Button onPress={() => window.location.reload()}>
        Thử lại
      </Button>
    </View>
  )
}
```

### Loading States

```tsx
// Skeleton loaders
import { Skeleton } from '@/components/ui/skeleton'

function DashboardSkeleton() {
  return (
    <View className="gap-4 p-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </View>
  )
}
```

## Testing Strategy

### Component Tests

```typescript
// __tests__/components/dashboard/today-overview-card.test.tsx
import { render, screen } from '@testing-library/react-native'
import { TodayOverviewCard } from '../today-overview-card'

describe('TodayOverviewCard', () => {
  it('renders all metrics correctly', () => {
    const stats = {
      tasksToday: 10,
      activeWorkers: 5,
      tasksInProgress: 3,
      overdueTasks: 2
    }
    render(<TodayOverviewCard stats={stats} />)

    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText('Công việc hôm nay')).toBeTruthy()
  })

  it('handles missing data gracefully', () => {
    render(<TodayOverviewCard stats={undefined} />)
    expect(screen.queryByText('Tổng quan hôm nay')).toBeNull()
  })
})
```

### Integration Tests

```typescript
// __tests__/screens/admin-dashboard.test.tsx
import { render, waitFor, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminDashboard from '../index'

describe('AdminDashboard', () => {
  it('loads and displays dashboard data', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboard />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Tổng quan hôm nay')).toBeTruthy()
    })
  })
})
```

## Performance Optimization

### Strategies

1. **Memoization**: Use React.memo for expensive card components
2. **Virtualization**: FlatList for worker performance list
3. **Image Optimization**: Optimize any icons or images
4. **Code Splitting**: Lazy load card components if needed

### Example

```tsx
import { memo } from 'react'

export const TodayOverviewCard = memo(function TodayOverviewCard(props) {
  // Component implementation
})
```

## Accessibility

### Requirements

- Semantic labels for all interactive elements
- Screen reader support for metrics
- Proper focus management
- Color contrast compliance (WCAG AA)

### Implementation

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Tạo công việc mới"
  accessibilityHint="Nhấn để mở màn hình tạo công việc"
>
  {/* Button content */}
</Pressable>
```

## Deployment Checklist

- [ ] All components render correctly
- [ ] Pull-to-refresh works
- [ ] Navigation from cards functions properly
- [ ] Loading states display correctly
- [ ] Error boundaries catch failures
- [ ] Dark mode displays correctly
- [ ] Vietnamese language throughout
- [ ] Performance metrics met (< 2s load)
- [ ] Accessibility requirements met
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] UAT on staging environment
- [ ] Production deployment

## Related Documentation

- [Main Plan](./06-admin-dashboard.md)
- [Common Specifications](./06-admin-dashboard-common.md)
- [Backend Plan](./06-admin-dashboard-backend.md)
- [v1 Master Plan](./README.md)
