import { View } from 'react-native'
import { Card, CardContent, CardHeader } from './ui/card'
import { Skeleton } from './ui/skeleton'

export function TaskDetailsSkeleton() {
  return (
    <View className="gap-3 p-4">
      {/* Header Skeleton */}
      <View className="gap-2">
        <Skeleton className="h-6 w-20 rounded-md bg-black/20 dark:bg-white/20" />
        <Skeleton className="h-8 w-3/4 rounded-md bg-black/20 dark:bg-white/20" />
        <Skeleton className="h-6 w-24 rounded-md bg-black/20 dark:bg-white/20" />
      </View>

      {/* CTA Buttons Row */}
      <View className="flex-row gap-2">
        <Skeleton className="h-11 flex-1 rounded-md bg-black/20 dark:bg-white/20" />
        <Skeleton className="h-11 w-11 rounded-md bg-black/20 dark:bg-white/20" />
        <Skeleton className="h-11 w-11 rounded-md bg-black/20 dark:bg-white/20" />
      </View>

      {/* Work Location & Customer Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <Skeleton className="h-5 w-32 rounded-md bg-black/20 dark:bg-white/20" />
        </CardHeader>
        <CardContent className="gap-3">
          <Skeleton className="h-4 w-full rounded-md bg-black/20 dark:bg-white/20" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-black/20 dark:bg-white/20" />
          <View className="gap-1">
            <Skeleton className="h-4 w-40 rounded-md bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-4 w-32 rounded-md bg-black/20 dark:bg-white/20" />
          </View>
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <Skeleton className="h-5 w-32 rounded-md bg-black/20 dark:bg-white/20" />
        </CardHeader>
        <CardContent className="gap-2">
          <Skeleton className="h-4 w-full rounded-md bg-black/20 dark:bg-white/20" />
          <Skeleton className="h-4 w-full rounded-md bg-black/20 dark:bg-white/20" />
          <Skeleton className="h-4 w-1/2 rounded-md bg-black/20 dark:bg-white/20" />
        </CardContent>
      </Card>

      {/* Assignee Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <Skeleton className="h-5 w-40 rounded-md bg-black/20 dark:bg-white/20" />
        </CardHeader>
        <CardContent className="gap-2">
          <Skeleton className="h-4 w-32 rounded-md bg-black/20 dark:bg-white/20" />
        </CardContent>
      </Card>

      {/* Attachments Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <Skeleton className="h-5 w-28 rounded-md bg-black/20 dark:bg-white/20" />
        </CardHeader>
        <CardContent className="gap-2">
          <View className="flex-row gap-2">
            <Skeleton className="h-24 w-24 rounded-lg bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-24 w-24 rounded-lg bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-24 w-24 rounded-lg bg-black/20 dark:bg-white/20" />
          </View>
        </CardContent>
      </Card>

      {/* Activities Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <Skeleton className="h-5 w-24 rounded-md bg-black/20 dark:bg-white/20" />
        </CardHeader>
        <CardContent className="gap-3">
          <Skeleton className="h-20 w-full rounded-md bg-black/20 dark:bg-white/20" />
          <View className="gap-2">
            <Skeleton className="h-4 w-full rounded-md bg-black/20 dark:bg-white/20" />
            <Skeleton className="h-4 w-3/4 rounded-md bg-black/20 dark:bg-white/20" />
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
