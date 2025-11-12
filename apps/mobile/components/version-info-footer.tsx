import { ActivityIndicator, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useOTAUpdates } from '@/hooks/use-ota-updates'
import { cn } from '@/lib/utils'
import { getVersionInfo } from '@/utils/version-helper'

export interface VersionInfoFooterProps {
  className?: string
}

/**
 * Format relative time in Vietnamese.
 * Examples: "vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return 'vừa xong'
  }
  if (diffMins < 60) {
    return `${diffMins} phút trước`
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`
  }
  return `${diffDays} ngày trước`
}

/**
 * Version information footer component.
 * Displays app version and handles OTA update detection and application.
 * All UI text in Vietnamese.
 */
export function VersionInfoFooter({ className }: VersionInfoFooterProps) {
  const {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    lastChecked,
    error,
    checkForUpdates,
    reloadApp,
  } = useOTAUpdates()

  const { fullString } = getVersionInfo()

  return (
    <View className={cn('items-center gap-2 py-4', className)}>
      {/* Version line */}
      <Text className="text-center text-xs" variant="muted">
        {fullString}
      </Text>

      {/* Checking state */}
      {isChecking && !isDownloading && (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-muted-foreground text-xs">
            Đang kiểm tra cập nhật...
          </Text>
        </View>
      )}

      {/* Downloading state - indeterminate spinner (no percentage) */}
      {isDownloading && (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-muted-foreground text-xs">
            Đang tải cập nhật...
          </Text>
        </View>
      )}

      {/* Update available - show reload button */}
      {isUpdateAvailable && !isDownloading && (
        <Button
          accessibilityHint="Khởi động lại ứng dụng với phiên bản mới nhất"
          accessibilityLabel="Tải lại ứng dụng để cập nhật"
          accessible
          className="mt-2"
          onPress={reloadApp}
          size="sm"
          variant="outline"
        >
          <Text className="text-xs">Tải lại để cập nhật</Text>
        </Button>
      )}

      {/* Error state - show retry button */}
      {error && (
        <View className="flex-row items-center gap-2">
          <Text className="text-destructive text-xs">Kiểm tra thất bại</Text>
          <Button
            accessibilityHint="Kiểm tra lại để tìm bản cập nhật mới"
            accessibilityLabel="Thử lại kiểm tra cập nhật"
            accessible
            onPress={checkForUpdates}
            size="sm"
            variant="ghost"
          >
            <Text className="text-xs">Thử lại</Text>
          </Button>
        </View>
      )}

      {/* Last checked timestamp */}
      {lastChecked && !isChecking && !error && (
        <Text className="text-muted-foreground text-xs">
          Cập nhật {formatRelativeTime(lastChecked)}
        </Text>
      )}
    </View>
  )
}
