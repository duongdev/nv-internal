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
 * Displays app version and handles OTA update detection.
 * After successful download, instructs user to manually restart the app.
 * All UI text in Vietnamese.
 *
 * SAFETY NOTE: Does NOT call Updates.reloadAsync() to avoid native crashes.
 * Users must force-quit and reopen the app to apply updates.
 */
export function VersionInfoFooter({ className }: VersionInfoFooterProps) {
  const {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    lastChecked,
    error,
    checkForUpdates,
  } = useOTAUpdates()

  const { fullString, isEmbeddedLaunch, otaUpdateId } = getVersionInfo()

  return (
    <View className={cn('items-center gap-2 py-4', className)}>
      {/* Version line */}
      <Text className="text-center text-xs" variant="muted">
        {fullString}
      </Text>

      {/* OTA status indicator - show green dot when OTA update is active */}
      {!isEmbeddedLaunch && otaUpdateId && (
        <View
          accessibilityHint="Ứng dụng đang chạy bản cập nhật OTA"
          accessibilityLabel="Trạng thái cập nhật OTA"
          accessibilityRole="text"
          accessible
          className="flex-row items-center gap-1.5"
          testID="ota-active-indicator"
        >
          <View className="h-2 w-2 rounded-full bg-green-500" />
          <Text className="text-muted-foreground text-xs">
            Cập nhật OTA đang hoạt động
          </Text>
        </View>
      )}

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

      {/* Update available - show manual restart instruction */}
      {isUpdateAvailable && !isDownloading && (
        <View
          accessibilityHint="Vui lòng thoát ứng dụng hoàn toàn và mở lại để áp dụng bản cập nhật mới nhất"
          accessibilityLabel="Hướng dẫn khởi động lại ứng dụng"
          accessibilityRole="text"
          accessible
          className="mt-2 max-w-sm rounded-md border border-primary/20 bg-primary/5 px-4 py-3"
          testID="ota-restart-instruction"
        >
          <Text className="text-center font-medium text-primary text-xs">
            Bản cập nhật đã tải xuống.
          </Text>
          <Text className="mt-1 text-center text-primary/80 text-xs">
            Vui lòng khởi động lại ứng dụng để áp dụng bản cập nhật.
          </Text>
          <Text className="mt-2 text-center text-primary/60 text-xs">
            ℹ️ Vuốt lên và mở lại ứng dụng
          </Text>
        </View>
      )}

      {/* Error state - show error message and retry button */}
      {error && !isUpdateAvailable && (
        <View className="flex-col items-center gap-2">
          {/* Vietnamese error message */}
          <Text className="text-center text-destructive text-xs">
            {error.message.includes('Update check failed')
              ? 'Kiểm tra cập nhật thất bại'
              : 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </Text>
          {/* Retry button for download errors */}
          <Button
            accessibilityHint="Kiểm tra lại để tìm bản cập nhật mới"
            accessibilityLabel="Thử lại kiểm tra cập nhật"
            accessible
            onPress={checkForUpdates}
            size="sm"
            testID="retry-update-check-button"
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
