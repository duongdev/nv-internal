import { AlertTriangleIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { View } from 'react-native'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export type DeleteAccountFirstWarningProps = {
  open: boolean
  onContinue: () => void
  onCancel: () => void
}

/**
 * First confirmation dialog for account deletion
 * Warns user about consequences of deletion
 */
export const DeleteAccountFirstWarning: FC<DeleteAccountFirstWarningProps> = ({
  open,
  onContinue,
  onCancel,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <View className="flex-row items-center gap-2 self-start">
            <AlertTriangleIcon
              className="text-destructive"
              color="currentColor"
              size={24}
            />
            <AlertDialogTitle
              accessibilityLabel="Xóa tài khoản"
              accessibilityRole="header"
            >
              Xóa tài khoản?
            </AlertDialogTitle>
          </View>
          <AlertDialogDescription
            accessibilityHint="Cảnh báo về hậu quả của việc xóa tài khoản"
            accessibilityLabel="Cảnh báo xóa tài khoản"
            accessibilityRole="text"
          >
            <View className="gap-3">
              <Text className="font-normal text-base text-muted-foreground leading-6">
                Hành động này không thể hoàn tác. Bạn sẽ mất:
              </Text>

              <View className="items-start gap-2">
                <Text className="text-base text-foreground">
                  • Quyền truy cập vào tài khoản
                </Text>
                <Text className="text-base text-foreground">
                  • Tất cả dữ liệu cá nhân
                </Text>
                <Text className="text-base text-foreground">
                  • Lịch sử công việc
                </Text>
              </View>
            </View>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              accessibilityHint="Hủy bỏ việc xóa tài khoản"
              accessibilityLabel="Hủy"
              accessibilityRole="button"
              onPress={onCancel}
              testID="delete-account-cancel-button"
              variant="outline"
            >
              <Text>Hủy</Text>
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              accessibilityHint="Tiếp tục đến bước xác nhận cuối cùng"
              accessibilityLabel="Tiếp tục"
              accessibilityRole="button"
              onPress={onContinue}
              testID="delete-account-continue-button"
              variant="destructive"
            >
              <Text>Tiếp tục</Text>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
