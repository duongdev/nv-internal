import { AlertTriangleIcon } from 'lucide-react-native'
import { View } from 'react-native'
import type { TaskEventLocation } from '@/hooks/use-task-event'
import { cn } from '@/lib/utils'
import { Icon } from '../ui/icon'
import { Text } from '../ui/text'

export interface LocationVerificationProps {
  taskLocation: { lat: number; lng: number } | null | undefined
  currentLocation: TaskEventLocation | null
  distance: number | null
  warnings: string[]
}

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

/**
 * Displays GPS verification status and distance information
 */
export function LocationVerification({
  taskLocation,
  currentLocation,
  distance,
  warnings,
}: LocationVerificationProps) {
  const hasLocation = !!currentLocation
  const hasTaskLocation = !!taskLocation
  const isWithinRange = distance !== null && distance <= 100
  const hasWarnings = warnings.length > 0

  return (
    <View className="gap-3">
      {/* Location Status */}
      <View className="gap-3 rounded-lg border border-border bg-card p-3">
        {/* Current Location */}
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground">Vị trí hiện tại:</Text>
          {hasLocation ? (
            <Text className="font-medium">
              {currentLocation.coords.latitude.toFixed(6)},{' '}
              {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text className="text-muted-foreground">Đang lấy vị trí...</Text>
          )}
        </View>

        {/* Task Location */}
        {hasTaskLocation && (
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground">Vị trí công việc:</Text>
            <Text className="font-medium">
              {taskLocation.lat.toFixed(6)}, {taskLocation.lng.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Distance */}
        {distance !== null && hasTaskLocation && (
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground">Khoảng cách:</Text>
            <Text
              className={cn(
                'font-semibold',
                isWithinRange
                  ? 'text-primary'
                  : 'text-amber-600 dark:text-amber-500',
              )}
            >
              {formatDistance(distance)}
            </Text>
          </View>
        )}

        {/* GPS Accuracy */}
        {hasLocation && currentLocation.coords.accuracy && (
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground">Độ chính xác:</Text>
            <Text
              className={cn(
                currentLocation.coords.accuracy <= 50
                  ? 'text-primary'
                  : 'text-amber-600 dark:text-amber-500',
              )}
            >
              ±{Math.round(currentLocation.coords.accuracy)}m
            </Text>
          </View>
        )}
      </View>

      {/* Warnings */}
      {hasWarnings && (
        <View className="flex-row gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
          <Icon
            as={AlertTriangleIcon}
            className="mt-0.5 text-amber-600 dark:text-amber-500"
            size={20}
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
                  className="text-amber-700 dark:text-amber-400"
                  key={warning}
                >
                  {formattedWarning}
                </Text>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}
