import {
  BriefcaseIcon,
  DollarSignIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react-native'
import { View } from 'react-native'
import type { SummaryStatistics } from '@/api/reports/use-employees-summary'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrencyDisplay } from '@/components/ui/currency-input'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export interface SummaryStatsCardProps {
  summary: SummaryStatistics | undefined
}

/**
 * Summary statistics card component
 * Displays overall statistics for all employees
 */
export function SummaryStatsCard({ summary }: SummaryStatsCardProps) {
  if (!summary) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <View className="flex-row items-center gap-2">
          <Icon as={TrendingUpIcon} className="size-5 text-foreground" />
          <CardTitle>Tổng quan</CardTitle>
        </View>
        <CardDescription>Thống kê tổng hợp cho tháng được chọn</CardDescription>
      </CardHeader>
      <CardContent className="gap-3">
        {/* Total Employees */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-blue-500/10 p-2">
              <Icon as={UsersIcon} className="size-4 text-blue-600" />
            </View>
            <Text className="text-muted-foreground">Tổng nhân viên:</Text>
          </View>
          <Text className="font-semibold text-lg">
            {summary.totalEmployees}
          </Text>
        </View>

        {/* Active Employees */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-green-500/10 p-2">
              <Icon as={TrendingUpIcon} className="size-4 text-green-600" />
            </View>
            <Text className="text-muted-foreground">Nhân viên hoạt động:</Text>
          </View>
          <Text className="font-semibold text-lg">
            {summary.activeEmployees}
          </Text>
        </View>

        {/* Total Tasks */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-purple-500/10 p-2">
              <Icon as={BriefcaseIcon} className="size-4 text-purple-600" />
            </View>
            <Text className="text-muted-foreground">Tổng công việc:</Text>
          </View>
          <Text className="font-semibold text-lg">{summary.totalTasks}</Text>
        </View>

        {/* Total Revenue */}
        <View className="flex-row items-center justify-between rounded-lg bg-muted p-3">
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-emerald-500/10 p-2">
              <Icon as={DollarSignIcon} className="size-4 text-emerald-600" />
            </View>
            <Text className="font-medium">Tổng doanh thu:</Text>
          </View>
          <View className="ml-2 flex-1 items-end">
            <Text
              adjustsFontSizeToFit
              className="font-sans-bold text-emerald-600 text-xl"
              minimumFontScale={0.7}
              numberOfLines={1}
            >
              {formatCurrencyDisplay(summary.totalRevenue)}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}
