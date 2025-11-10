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
    <AlertDialog onOpenChange={(isOpen) => !isOpen && onCancel()} open={open}>
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
            <Text className="font-normal text-base text-muted-foreground leading-6">
              Hành động này không thể hoàn tác. Bạn sẽ mất:
            </Text>
            {'\n\n'}
            <View className="gap-2">
              <Text className="font-normal text-base text-muted-foreground leading-6">
                • Quyền truy cập vào tài khoản
              </Text>
              <Text className="font-normal text-base text-muted-foreground leading-6">
                • Tất cả dữ liệu cá nhân
              </Text>
              <Text className="font-normal text-base text-muted-foreground leading-6">
                • Lịch sử công việc
              </Text>
            </View>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            accessibilityHint="Hủy bỏ việc xóa tài khoản"
            accessibilityLabel="Hủy"
            accessibilityRole="button"
            onPress={onCancel}
            testID="delete-account-cancel-button"
          >
            <Text>Hủy</Text>
          </AlertDialogCancel>
          <AlertDialogAction
            accessibilityHint="Tiếp tục đến bước xác nhận cuối cùng"
            accessibilityLabel="Tiếp tục"
            accessibilityRole="button"
            className="bg-destructive"
            onPress={onContinue}
            testID="delete-account-continue-button"
          >
            <Text>Tiếp tục</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
