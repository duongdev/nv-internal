import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Pressable, View } from 'react-native'
import type { EmployeeSummary } from '@/api/reports/use-employees-summary'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyDisplay } from '@/components/ui/currency-input'
import { Text } from '@/components/ui/text'
import { getUserFullName } from '@/utils/user-helper'

export interface EmployeeListItemProps {
  employee: EmployeeSummary
  onPress: (userId: string) => void
  rank?: number
}

/**
 * Employee list item component for summary view
 * Displays employee avatar, name, revenue, and task count
 */
export function EmployeeListItem({
  employee,
  onPress,
  rank,
}: EmployeeListItemProps) {
  const handlePress = async () => {
    await impactAsync(ImpactFeedbackStyle.Light)
    onPress(employee.id)
  }

  const fullName = getUserFullName(employee)
  const isTopPerformer = rank !== undefined && rank <= 3

  // Get initials for avatar fallback
  const initials = fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()

  return (
    <Pressable
      accessibilityHint="Nhấn để xem chi tiết"
      accessibilityLabel={`${fullName}, ${employee.metrics.tasksCompleted} công việc, ${formatCurrencyDisplay(employee.metrics.totalRevenue)}`}
      accessibilityRole="button"
      onPress={handlePress}
    >
      <Card className="mb-2">
        <CardContent className="flex-row items-center gap-3 py-3">
          {/* Avatar with rank badge */}
          <View className="relative">
            <Avatar alt={`${fullName}'s avatar`} className="size-12">
              {employee.imageUrl ? (
                <AvatarImage source={{ uri: employee.imageUrl }} />
              ) : null}
              <AvatarFallback>
                <Text>{initials}</Text>
              </AvatarFallback>
            </Avatar>
            {/* Rank badge for top performers */}
            {isTopPerformer && (
              <View className="-right-1 -top-1 absolute rounded-full bg-yellow-500 px-2 py-0.5">
                <Text className="font-sans-bold text-white text-xs">
                  #{rank}
                </Text>
              </View>
            )}
          </View>

          {/* Employee Info */}
          <View className="flex-1">
            <Text className="font-semibold">{fullName}</Text>
            <Text className="text-muted-foreground text-sm">
              {employee.metrics.tasksCompleted} công việc
              {employee.metrics.daysWorked > 0 &&
                ` • ${employee.metrics.daysWorked} ngày`}
            </Text>
          </View>

          {/* Revenue */}
          <View className="items-end">
            <Text
              adjustsFontSizeToFit
              className="font-sans-bold text-emerald-600 text-lg"
              minimumFontScale={0.8}
              numberOfLines={1}
            >
              {formatCurrencyDisplay(employee.metrics.totalRevenue)}
            </Text>
            {!employee.hasActivity && (
              <Text className="text-muted-foreground text-xs">
                Chưa hoạt động
              </Text>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
