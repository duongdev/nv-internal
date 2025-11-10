import { useState } from 'react'
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
  const [isReloading, setIsReloading] = useState(false)

  /**
   * Handle app reload with loading state.
   * Note: reloadAsync() will terminate the app, so loading state cleanup rarely executes.
   */
  const handleReload = async () => {
    setIsReloading(true)
    try {
      await reloadApp()
    } finally {
      // This rarely executes because reloadAsync() terminates the app
      // But we set it for completeness in case of errors
      setIsReloading(false)
    }
  }

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
          accessibilityHint={
            isReloading
              ? 'Đang khởi động lại ứng dụng'
              : 'Khởi động lại ứng dụng với phiên bản mới nhất'
          }
          accessibilityLabel={
            isReloading ? 'Đang khởi động lại' : 'Tải lại ứng dụng để cập nhật'
          }
          accessible
          className="mt-2"
          disabled={isReloading}
          onPress={handleReload}
          size="sm"
          variant="outline"
        >
          {isReloading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" />
              <Text className="text-xs">Đang khởi động lại...</Text>
            </View>
          ) : (
            <Text className="text-xs">Tải lại để cập nhật</Text>
          )}
        </Button>
      )}

      {/* Error state - different UI for check vs reload errors */}
      {error && !isUpdateAvailable && (
        <View className="flex-col items-center gap-2">
          {/* Vietnamese error message based on error type */}
          <Text className="text-center text-destructive text-xs">
            {error.message.includes('Update no longer available')
              ? 'Bản cập nhật không còn khả dụng. Vui lòng kiểm tra lại sau.'
              : error.message.includes('Reload failed')
                ? 'Không thể khởi động lại ứng dụng. Vui lòng thử lại sau.'
                : error.message.includes('Update check failed')
                  ? 'Kiểm tra cập nhật thất bại'
                  : 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </Text>
          {/* Show retry button only for check errors, not reload errors */}
          {error.message.includes('Update check failed') && (
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
          )}
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
