import { View } from 'react-native'
import { Skeleton } from './ui/skeleton'

/**
 * TaskListItemSkeleton - Loading placeholder for EnhancedTaskCard
 *
 * Matches the exact layout of EnhancedTaskCard:
 * - Header: Task ID (left) + Status badges (right)
 * - Title (2 lines)
 * - Customer info with action button
 * - Address/Location with action button
 * - Footer: Assignees + Attachments (with divider)
 */
export function TaskListItemSkeleton() {
  return (
    <View className="w-full rounded-lg border border-border bg-card p-3">
      <View className="gap-2">
        {/* Header: Task ID + Status Badges */}
        <View className="flex-row items-start justify-between">
          <Skeleton className="h-4 w-16 rounded-md bg-black/20 dark:bg-white/20" />
          <View className="flex-row items-center gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-5 w-20 rounded-full bg-black/20 dark:bg-white/20" />
          </View>
        </View>

        {/* Task Title (2 lines) */}
        <View className="gap-1">
          <Skeleton className="h-5 w-full rounded-md bg-black/20 dark:bg-white/20" />
          <Skeleton className="h-5 w-3/4 rounded-md bg-black/20 dark:bg-white/20" />
        </View>

        {/* Customer Info with Call Button */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-32 rounded-md bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-3 w-24 rounded-md bg-black/20 dark:bg-white/20" />
          </View>
          <Skeleton className="h-8 w-8 rounded-md bg-black/20 dark:bg-white/20" />
        </View>

        {/* Address with Navigate Button */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-48 rounded-md bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-3 w-full rounded-md bg-black/20 dark:bg-white/20" />
          </View>
          <Skeleton className="h-8 w-8 rounded-md bg-black/20 dark:bg-white/20" />
        </View>

        {/* Footer: Assignees + Attachments */}
        <View className="mt-2 flex-row items-center justify-between border-border border-t pt-2">
          {/* Assignee avatars */}
          <View className="flex-row items-center">
            <Skeleton className="h-6 w-6 rounded-full bg-black/20 dark:bg-white/20" />
            <Skeleton className="-ml-2 h-6 w-6 rounded-full bg-black/20 dark:bg-white/20" />
            <Skeleton className="-ml-2 h-6 w-6 rounded-full bg-black/20 dark:bg-white/20" />
          </View>
          {/* Attachment count */}
          <Skeleton className="h-3 w-12 rounded-md bg-black/20 dark:bg-white/20" />
        </View>
      </View>
    </View>
  )
}
