import {
  AlertTriangleIcon,
  DollarSignIcon,
  EditIcon,
  MessageSquareIcon,
} from 'lucide-react-native'
import { type FC, Fragment, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { type Activity, useActivities } from '@/api/activity/use-activities'
import { useAttachments } from '@/api/attachment/use-attachments'
import { AttachmentList } from './attachment-list'
import { formatCurrencyDisplay } from './ui/currency-input'
import { Icon } from './ui/icon'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'

/**
 * Format distance in a friendly way
 * - Less than 1000m: show in meters (e.g., "50m")
 * - 1000m or more: show in kilometers with 1 decimal (e.g., "1.5km")
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

function AttachmentsWithDeletedPlaceholders({
  attachmentIds,
  compact = false,
}: {
  attachmentIds: string[]
  compact?: boolean
}) {
  const { data: resolvedAttachments, isLoading } = useAttachments(attachmentIds)

  if (isLoading) {
    return (
      <AttachmentList
        attachments={attachmentIds.map((id) => ({ id }))}
        compact={compact}
      />
    )
  }

  // Create a map of resolved attachments by ID for quick lookup
  const resolvedMap = new Map(
    resolvedAttachments?.map((att) => [att.id, att]) || [],
  )

  // Calculate deleted count
  const deletedCount = attachmentIds.length - (resolvedAttachments?.length ?? 0)
  const activeAttachments = attachmentIds
    .filter((id) => resolvedMap.has(id))
    .map((id) => ({ id }))

  return (
    <View className="gap-2">
      {activeAttachments.length > 0 ? (
        <AttachmentList attachments={activeAttachments} compact={compact} />
      ) : deletedCount > 0 ? (
        <Text className="text-muted-foreground text-sm">
          {deletedCount} tệp đã bị xóa
        </Text>
      ) : null}
      {activeAttachments.length > 0 && deletedCount > 0 && (
        <Text className="text-muted-foreground text-xs">
          {deletedCount} tệp đã bị xóa
        </Text>
      )}
    </View>
  )
}

export type ActivityFeedProps = {
  topic: string
  removeDuplicate?: boolean
}

// Define unimportant activity types
const UNIMPORTANT_ACTIVITIES = [
  'ATTACHMENT_DELETED',
  'TASK_ATTACHMENTS_UPLOADED',
  'TASK_EXPECTED_REVENUE_UPDATED',
]

export const ActivityFeed: FC<ActivityFeedProps> = ({
  topic,
  removeDuplicate = true,
}) => {
  const { data, isLoading } = useActivities({ topic })
  const [hideUnimportant, setHideUnimportant] = useState(true)

  const activities = useMemo(() => {
    if (!data) {
      return data
    }

    let filteredData = data

    // Filter out unimportant activities if enabled
    if (hideUnimportant) {
      filteredData = data.filter(
        (activity) => !UNIMPORTANT_ACTIVITIES.includes(activity.action),
      )
    }

    // Remove duplicates if enabled
    if (!removeDuplicate) {
      return filteredData
    }

    const activityItems: Activity[] = []
    filteredData.forEach((activity) => {
      // Don't add item if the previous item has the same action and timestamp is within 1 minute
      if (
        activityItems.length === 0 ||
        activityItems[activityItems.length - 1].action !== activity.action ||
        new Date(activityItems[activityItems.length - 1].createdAt).getTime() -
          new Date(activity.createdAt).getTime() >
          60000
      ) {
        activityItems.push(activity)
      }
    })
    return activityItems
  }, [data, removeDuplicate, hideUnimportant])

  if (isLoading && !activities) {
    return <ActivityIndicator />
  }

  return (
    <View className="gap-3">
      {/* Filter Toggle */}
      <View className="flex-row items-center justify-between rounded-lg border border-border bg-muted p-3 dark:border-white/20">
        <Text className="text-sm">Ẩn hoạt động không quan trọng</Text>
        <Switch
          checked={hideUnimportant}
          onCheckedChange={setHideUnimportant}
        />
      </View>

      <FlatList
        data={activities}
        ItemSeparatorComponent={() => <Separator className="my-3" />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-muted-foreground">Chưa có hoạt động</Text>
        }
        renderItem={({ item }) => <ActivityItem activity={item} />}
        scrollEnabled={false}
      />
    </View>
  )
}

export type ActivityItemProps = {
  activity: Activity
}

export const ActivityItem: FC<ActivityItemProps> = ({ activity }) => {
  const { action, payload: pl } = activity

  const content = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: <flexible>
    const payload = pl as Record<string, any> | null | undefined

    if (action === 'TASK_CREATED') {
      return <Text>Đã tạo công việc.</Text>
    }
    if (action === 'TASK_STATUS_UPDATED' && payload?.newStatus) {
      return (
        <View className="inline-flex flex-row flex-wrap items-baseline">
          <Text>Đã cập nhật trạng thái công việc sang </Text>
          <TaskStatusBadge status={payload.newStatus} />
        </View>
      )
    }
    if (action === 'TASK_ASSIGNEES_UPDATED' && payload?.newAssigneeIds) {
      return (
        <View className="inline-flex flex-row flex-wrap items-baseline">
          <Text>
            Đã cập nhật nhân viên làm việc:{' '}
            {payload.newAssigneeIds.length ? (
              (payload.newAssigneeIds as string[]).map(
                (userId: string, index: number) => (
                  <Fragment key={userId}>
                    <UserFullName
                      className="font-sans-medium"
                      userId={userId}
                    />
                    {index <
                      (payload.newAssigneeIds as string[]).length - 1 && (
                      <Text className="text-muted-foreground">, </Text>
                    )}
                  </Fragment>
                ),
              )
            ) : (
              <Text className="font-sans-medium">Không có nhân viên</Text>
            )}
          </Text>
        </View>
      )
    }
    if (action === 'TASK_ATTACHMENTS_UPLOADED' && payload?.attachments) {
      const attachments = payload.attachments as Array<{ id?: string }>
      const count = attachments.length

      // Check if attachments have IDs (new format)
      const hasIds = attachments.every((att) => att.id)

      if (hasIds && attachments.length > 0) {
        const attachmentIds = attachments.map((att) => att.id as string)
        return (
          <View className="gap-2">
            <Text>Đã tải lên {count} tệp đính kèm</Text>
            <AttachmentsWithDeletedPlaceholders
              attachmentIds={attachmentIds}
              compact
            />
          </View>
        )
      }

      // Fallback for old activities without IDs
      return <Text>Đã tải lên {count} tệp đính kèm</Text>
    }
    if (action === 'ATTACHMENT_DELETED' && payload?.originalFilename) {
      return (
        <Text>
          Đã xóa tệp đính kèm{' '}
          <Text className="font-sans-medium">{payload.originalFilename}</Text>
        </Text>
      )
    }
    if (action === 'TASK_CHECKED_IN' && payload) {
      const attachments = payload.attachments as Array<{ id?: string }>
      const distance = payload.distanceFromTask as number | undefined
      const notes = payload.notes as string | undefined
      const warnings = (payload.warnings as string[]) || []

      // Format distance
      const distanceText =
        distance !== undefined ? formatDistance(distance) : null

      return (
        <View className="gap-2">
          <Text>Đã bắt đầu làm việc</Text>
          {distanceText && (
            <Text className="text-muted-foreground text-sm">
              Khoảng cách: {distanceText}
            </Text>
          )}
          {warnings.length > 0 && (
            <View className="flex-row gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-700 dark:bg-amber-950/20">
              <Icon
                as={AlertTriangleIcon}
                className="mt-0.5 text-amber-600 dark:text-amber-500"
                size={16}
              />
              <View className="flex-1 gap-1">
                {warnings.map((warning) => {
                  const distanceMatch = warning.match(/(\d+)m/)
                  const distanceValue = distanceMatch
                    ? Number.parseInt(distanceMatch[1], 10)
                    : 0
                  const formattedWarning = distanceMatch
                    ? warning.replace(/(\d+)m/, formatDistance(distanceValue))
                    : warning

                  return (
                    <Text
                      className="text-amber-700 text-xs dark:text-amber-400"
                      key={warning}
                    >
                      {formattedWarning}
                    </Text>
                  )
                })}
              </View>
            </View>
          )}
          {notes && (
            <View className="flex-row gap-2 rounded-lg border border-border bg-card p-2">
              <Icon
                as={MessageSquareIcon}
                className="mt-1 text-muted-foreground"
                size={16}
              />
              <Text className="flex-1 text-sm">{notes}</Text>
            </View>
          )}
          {attachments && attachments.length > 0 && (
            <AttachmentsWithDeletedPlaceholders
              attachmentIds={attachments.map((att) => att.id as string)}
              compact
            />
          )}
        </View>
      )
    }
    if (action === 'TASK_CHECKED_OUT' && payload) {
      const attachments = payload.attachments as Array<{ id?: string }>
      const distance = payload.distanceFromTask as number | undefined
      const notes = payload.notes as string | undefined
      const warnings = (payload.warnings as string[]) || []

      // Format distance
      const distanceText =
        distance !== undefined ? formatDistance(distance) : null

      return (
        <View className="gap-2">
          <Text>Đã hoàn thành công việc</Text>
          {distanceText && (
            <Text className="text-muted-foreground text-sm">
              Khoảng cách: {distanceText}
            </Text>
          )}
          {warnings.length > 0 && (
            <View className="flex-row gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-700 dark:bg-amber-950/20">
              <Icon
                as={AlertTriangleIcon}
                className="mt-0.5 text-amber-600 dark:text-amber-500"
                size={16}
              />
              <View className="flex-1 gap-1">
                {warnings.map((warning) => {
                  const distanceMatch = warning.match(/(\d+)m/)
                  const distanceValue = distanceMatch
                    ? Number.parseInt(distanceMatch[1], 10)
                    : 0
                  const formattedWarning = distanceMatch
                    ? warning.replace(/(\d+)m/, formatDistance(distanceValue))
                    : warning

                  return (
                    <Text
                      className="text-amber-700 text-xs dark:text-amber-400"
                      key={warning}
                    >
                      {formattedWarning}
                    </Text>
                  )
                })}
              </View>
            </View>
          )}
          {notes && (
            <View className="flex-row gap-2 rounded-lg border border-border bg-card p-2">
              <Icon
                as={MessageSquareIcon}
                className="mt-1 text-muted-foreground"
                size={16}
              />
              <Text className="flex-1 text-sm">{notes}</Text>
            </View>
          )}
          {attachments && attachments.length > 0 && (
            <AttachmentsWithDeletedPlaceholders
              attachmentIds={attachments.map((att) => att.id as string)}
              compact
            />
          )}
        </View>
      )
    }

    // PAYMENT_COLLECTED - Worker collected payment at checkout
    if (action === 'PAYMENT_COLLECTED' && payload) {
      const amount = payload.amount as number
      const invoiceAttachmentId = payload.invoiceAttachmentId as
        | string
        | undefined
      const notes = payload.notes as string | undefined

      return (
        <View className="gap-2">
          <View className="flex-row items-start gap-2">
            <Icon
              as={DollarSignIcon}
              className="mt-0.5 text-green-600 dark:text-green-500"
              size={18}
            />
            <View className="flex-1 gap-2">
              <Text>
                Đã thu{' '}
                <Text className="font-sans-bold">
                  {formatCurrencyDisplay(amount)}
                </Text>
              </Text>
              {notes && (
                <View className="rounded-lg border border-border bg-card p-2">
                  <Text className="text-muted-foreground text-xs">
                    Ghi chú:
                  </Text>
                  <Text className="text-sm">{notes}</Text>
                </View>
              )}
              {invoiceAttachmentId && (
                <AttachmentsWithDeletedPlaceholders
                  attachmentIds={[invoiceAttachmentId]}
                  compact
                />
              )}
            </View>
          </View>
        </View>
      )
    }

    // PAYMENT_UPDATED - Admin edited payment
    if (action === 'PAYMENT_UPDATED' && payload) {
      const editReason = payload.editReason as string
      const changes = payload.changes as
        | {
            amount?: { old: number; new: number }
            notes?: { old: string | null; new: string | null }
            invoiceReplaced?: boolean
            newInvoiceAttachmentId?: string
          }
        | undefined

      return (
        <View className="gap-2">
          <View className="flex-row items-start gap-2">
            <Icon
              as={EditIcon}
              className="mt-0.5 text-amber-600 dark:text-amber-500"
              size={18}
            />
            <View className="flex-1 gap-2">
              <Text>Đã chỉnh sửa thanh toán</Text>

              {/* Edit Reason */}
              <View className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-700 dark:bg-amber-950/20">
                <Text className="text-amber-700 text-xs dark:text-amber-400">
                  Lý do: {editReason}
                </Text>
              </View>

              {/* Changes Summary */}
              {changes && (
                <View className="gap-2">
                  {changes.amount && (
                    <View className="flex-row items-center gap-1">
                      <Text className="text-muted-foreground text-sm">
                        Số tiền:
                      </Text>
                      <Text className="text-sm line-through">
                        {formatCurrencyDisplay(changes.amount.old)}
                      </Text>
                      <Text className="text-muted-foreground text-sm">→</Text>
                      <Text className="font-sans-bold text-sm">
                        {formatCurrencyDisplay(changes.amount.new)}
                      </Text>
                    </View>
                  )}
                  {changes.notes?.new && (
                    <View className="rounded-lg border border-border bg-card p-2">
                      <Text className="text-muted-foreground text-xs">
                        Ghi chú mới:
                      </Text>
                      <Text className="text-sm">{changes.notes.new}</Text>
                    </View>
                  )}
                  {changes.newInvoiceAttachmentId && (
                    <AttachmentsWithDeletedPlaceholders
                      attachmentIds={[changes.newInvoiceAttachmentId]}
                      compact
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      )
    }

    // TASK_EXPECTED_REVENUE_UPDATED - Admin sets/updates/clears expected revenue
    if (action === 'TASK_EXPECTED_REVENUE_UPDATED' && payload) {
      const oldValue = payload.oldExpectedRevenue as number | null
      const newValue = payload.newExpectedRevenue as number | null

      let description: React.ReactNode
      if (oldValue === null && newValue !== null) {
        // Setting new value - bold the new value
        description = (
          <>
            Đã thiết lập giá dịch vụ:{' '}
            <Text className="font-sans-semibold">
              {formatCurrencyDisplay(newValue)}
            </Text>
          </>
        )
      } else if (oldValue !== null && newValue !== null) {
        // Updating value - bold the new value
        description = (
          <>
            Đã cập nhật giá dịch vụ từ {formatCurrencyDisplay(oldValue)} thành{' '}
            <Text className="font-sans-semibold">
              {formatCurrencyDisplay(newValue)}
            </Text>
          </>
        )
      } else if (oldValue !== null && newValue === null) {
        // Clearing value - bold the old value
        description = (
          <>
            Đã xóa giá dịch vụ (trước đó:{' '}
            <Text className="font-sans-semibold">
              {formatCurrencyDisplay(oldValue)}
            </Text>
            )
          </>
        )
      } else {
        // Fallback for unexpected case
        description = 'Đã cập nhật giá dịch vụ'
      }

      return <Text>{description}</Text>
    }

    return <Text className="text-muted-foreground text-sm">{action}</Text>
  }, [action, pl])

  return (
    <View>
      <View className="flex-row items-baseline justify-between">
        {activity.userId ? (
          <UserFullName className="font-sans-medium" userId={activity.userId} />
        ) : (
          <Text className="font-sans-medium">Hệ thống</Text>
        )}
        <Text className="text-muted-foreground text-sm">
          {new Date(activity.createdAt).toLocaleString()}
        </Text>
      </View>
      <View>{content}</View>
    </View>
  )
}
