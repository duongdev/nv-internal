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

              <View className="gap-2.5">
                <View className="flex-row gap-2">
                  <Text className="font-semibold text-base text-destructive leading-6">
                    •
                  </Text>
                  <Text className="flex-1 font-medium text-base text-foreground leading-6">
                    Quyền truy cập vào tài khoản
                  </Text>
                </View>

                <View className="flex-row gap-2 pl-4">
                  <Text className="text-muted-foreground text-sm leading-5">
                    ◦
                  </Text>
                  <Text className="flex-1 text-muted-foreground text-sm leading-5">
                    Tất cả dữ liệu cá nhân
                  </Text>
                </View>

                <View className="flex-row gap-2 pl-4">
                  <Text className="text-muted-foreground text-sm leading-5">
                    ◦
                  </Text>
                  <Text className="flex-1 text-muted-foreground text-sm leading-5">
                    Lịch sử công việc
                  </Text>
                </View>
              </View>
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
            className="bg-destructive active:bg-destructive/80"
            onPress={onContinue}
            testID="delete-account-continue-button"
          >
            <Text className="text-white">Tiếp tục</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
