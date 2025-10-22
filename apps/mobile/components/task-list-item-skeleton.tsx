import { View } from 'react-native'
import { Skeleton } from './ui/skeleton'

export function TaskListItemSkeleton() {
  return (
    <View className="w-full rounded-lg border border-border bg-card p-3">
      <View className="gap-2">
        {/* Task ID and Status Badge */}
        <View className="flex-row items-start justify-between">
          <Skeleton className="h-4 w-16 rounded-md bg-black/20" />
          <Skeleton className="h-5 w-24 rounded-full bg-black/20" />
        </View>

        {/* Task Title */}
        <Skeleton className="h-6 w-3/4 rounded-md bg-black/20" />

        {/* Description (optional) */}
        <View className="flex-row items-start gap-2">
          <Skeleton className="mt-1 h-4 w-4 rounded-md bg-black/20" />
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-full rounded-md bg-black/20" />
            <Skeleton className="h-4 w-2/3 rounded-md bg-black/20" />
          </View>
        </View>

        {/* Assignee */}
        <View className="flex-row items-start gap-2">
          <Skeleton className="mt-1 h-4 w-4 rounded-md bg-black/20" />
          <Skeleton className="h-4 w-32 rounded-md bg-black/20" />
        </View>

        {/* Location */}
        <View className="flex-row items-start gap-2">
          <Skeleton className="mt-1.5 h-4 w-4 rounded-md bg-black/20" />
          <Skeleton className="h-4 flex-1 rounded-md bg-black/20" />
        </View>
      </View>
    </View>
  )
}
