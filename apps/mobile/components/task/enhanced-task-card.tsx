import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { MapPinIcon, PhoneIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { Linking, Pressable, View } from 'react-native'
import type { FetchTaskListResponse } from '@/api/task/use-task-infinite-list'
import { PaymentStatusBadge } from '@/components/payment/payment-status-badge'
import { AssigneeAvatars } from '@/components/task/assignee-avatars'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { TaskStatusBadge } from '@/components/ui/task-status-badge'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { formatTaskId } from '@/utils/task-id-helper'

export type EnhancedTaskCardProps = {
  task: NonNullable<FetchTaskListResponse>['tasks'][number]
  /**
   * Callback when the card is pressed
   */
  onPress?: () => void
  /**
   * Show worker-specific features (e.g., urgency indicators)
   * @default false
   */
  workerMode?: boolean
  /**
   * Optional className for the container
   */
  className?: string
}

/**
 * EnhancedTaskCard - Rich task card for list views
 *
 * Displays comprehensive task information with quick actions.
 * Suitable for both admin and worker task lists.
 *
 * Features:
 * - Task ID and title
 * - Customer name and phone (with call button)
 * - Address (with navigate button)
 * - Status badge
 * - Payment status badge
 * - Assignee avatars
 * - Quick action buttons
 *
 * @example
 * ```tsx
 * <EnhancedTaskCard
 *   task={task}
 *   onPress={() => router.push(`/tasks/${task.id}`)}
 * />
 * ```
 */
export const EnhancedTaskCard: FC<EnhancedTaskCardProps> = ({
  task,
  onPress,
  workerMode = false,
  className,
}) => {
  // Calculate payment status
  const hasExpectedRevenue =
    task.expectedRevenue && Number(task.expectedRevenue) > 0
  const latestPayment = task.payments?.[0]
  const hasPayment = !!latestPayment
  const expectedAmount = task.expectedRevenue
    ? Number(task.expectedRevenue)
    : null
  const actualAmount = latestPayment?.amount
    ? Number(latestPayment.amount)
    : null

  const handleCallCustomer = () => {
    if (task.customer?.phone) {
      impactAsync(ImpactFeedbackStyle.Light)
      Linking.openURL(`tel:${task.customer.phone}`)
    }
  }

  const handleNavigate = () => {
    if (task.geoLocation) {
      impactAsync(ImpactFeedbackStyle.Light)
      const url = `https://www.google.com/maps/search/?api=1&query=${task.geoLocation.lat},${task.geoLocation.lng}`
      Linking.openURL(url)
    }
  }

  return (
    <Pressable
      accessibilityLabel={`Công việc ${task.title}, trạng thái ${task.status}`}
      accessibilityRole="button"
      className={cn(
        'w-full rounded-lg border border-border bg-card p-3 active:bg-muted/50',
        className,
      )}
      onPress={() => {
        impactAsync(ImpactFeedbackStyle.Light)
        onPress?.()
      }}
      testID={`task-card-${task.id}`}
    >
      {/* Header: Task ID + Badges */}
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="font-sans-bold text-muted-foreground text-xs">
          {formatTaskId(task.id)}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {hasExpectedRevenue && (
            <PaymentStatusBadge
              actualAmount={actualAmount}
              expectedAmount={expectedAmount}
              hasPayment={hasPayment}
              size="inline"
            />
          )}
          <TaskStatusBadge
            className="font-gilroy-medium text-muted-foreground text-sm"
            status={task.status}
          />
        </View>
      </View>

      {/* Title */}
      <Text className="mb-2 font-sans-semibold text-base" numberOfLines={2}>
        {task.title}
      </Text>

      {/* Customer Info with Quick Actions */}
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <View className="flex-1 gap-0.5">
          {task.customer?.name ? (
            <Text className="font-sans-medium text-sm" numberOfLines={1}>
              {task.customer.name}
            </Text>
          ) : (
            <Text
              className="font-sans-medium text-muted-foreground text-sm"
              numberOfLines={1}
            >
              Chưa có khách hàng
            </Text>
          )}
          {task.customer?.phone && (
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {task.customer.phone}
            </Text>
          )}
        </View>
        {task.customer?.phone && (
          <Button
            accessibilityHint={`Gọi số điện thoại ${task.customer.phone}`}
            accessibilityLabel="Gọi khách hàng"
            onPress={handleCallCustomer}
            size="icon-sm"
            testID={`task-card-${task.id}-call-button`}
            variant="outline"
          >
            <Icon as={PhoneIcon} className="size-4" />
          </Button>
        )}
      </View>

      {/* Address with Navigate Button */}
      <View className="mb-2 flex-row items-start gap-2">
        {/* Icon column */}
        <View className="pt-1">
          <Icon as={MapPinIcon} className="text-muted-foreground" size={16} />
        </View>

        {/* Address content */}
        <View className="flex-1 gap-0.5">
          {task.geoLocation ? (
            <>
              {/* Location name (prominent) */}
              {task.geoLocation.name && (
                <Text className="font-sans-medium text-sm" numberOfLines={1}>
                  {task.geoLocation.name}
                </Text>
              )}
              {/* Address (secondary) */}
              <Text
                className={cn(
                  'text-xs',
                  task.geoLocation.name
                    ? 'text-muted-foreground'
                    : 'font-sans-medium text-foreground',
                )}
                numberOfLines={2}
              >
                {task.geoLocation.address}
              </Text>
            </>
          ) : (
            <Text
              className="font-sans-medium text-muted-foreground text-sm"
              numberOfLines={1}
            >
              Chưa có địa chỉ
            </Text>
          )}
        </View>

        {/* Navigate button */}
        {task.geoLocation && (
          <Button
            accessibilityHint="Mở Google Maps để xem vị trí"
            accessibilityLabel="Xem bản đồ"
            onPress={handleNavigate}
            size="icon-sm"
            testID={`task-card-${task.id}-navigate-button`}
            variant="outline"
          >
            <Icon as={MapPinIcon} className="size-4" />
          </Button>
        )}
      </View>

      {/* Footer: Assignees + Attachment Count - Only show if there's content */}
      {(task.assigneeIds.length > 0 ||
        (task.attachments && task.attachments.length > 0)) && (
        <View className="mt-2 flex-row items-center justify-between border-border border-t pt-2">
          {task.assigneeIds.length > 0 ? (
            <AssigneeAvatars
              assigneeIds={task.assigneeIds}
              maxVisible={3}
              size="sm"
            />
          ) : (
            <Text className="text-muted-foreground text-xs">
              Chưa phân công
            </Text>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <Text className="text-muted-foreground text-xs">
              📎 {task.attachments.length} tệp
            </Text>
          )}
        </View>
      )}
    </Pressable>
  )
}
