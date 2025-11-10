import { AlertTriangleIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
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
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'

export type DeleteAccountFinalConfirmationProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
  error: string | null
}

const CONFIRMATION_TEXT = 'XÁC NHẬN'

/**
 * Final confirmation dialog for account deletion
 * Requires user to type "XÁC NHẬN" to confirm
 */
export const DeleteAccountFinalConfirmation: FC<
  DeleteAccountFinalConfirmationProps
> = ({ open, onConfirm, onCancel, isDeleting, error }) => {
  const [inputValue, setInputValue] = useState('')

  // Case-insensitive validation, trim whitespace
  const isValid =
    inputValue.trim().toUpperCase() === CONFIRMATION_TEXT.toUpperCase()

  const handleConfirm = () => {
    if (isValid && !isDeleting) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    setInputValue('')
    onCancel()
  }

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
              accessibilityLabel="Xác nhận xóa tài khoản"
              accessibilityRole="header"
            >
              Xác nhận xóa tài khoản
            </AlertDialogTitle>
          </View>
          <AlertDialogDescription
            accessibilityHint="Hướng dẫn nhập cụm từ xác nhận"
            accessibilityLabel="Hướng dẫn xác nhận"
            accessibilityRole="text"
          >
            <Text className="font-normal text-base text-muted-foreground leading-6">
              Để xác nhận, vui lòng nhập:{' '}
              <Text className="font-semibold">{CONFIRMATION_TEXT}</Text>
            </Text>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <View className="gap-3">
          <Input
            accessibilityHint="Nhập cụm từ XÁC NHẬN để xác nhận"
            accessibilityLabel="Ô nhập xác nhận"
            accessibilityRole="none"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isDeleting}
            onChangeText={setInputValue}
            placeholder={`Nhập ${CONFIRMATION_TEXT}`}
            testID="delete-account-confirmation-input"
            value={inputValue}
          />

          {error && (
            <View
              accessibilityHint="Thông báo lỗi khi xóa tài khoản"
              accessibilityLabel="Lỗi"
              accessibilityRole="alert"
              className="rounded-md bg-destructive/10 p-3"
            >
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          )}
        </View>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              accessibilityHint="Hủy bỏ việc xóa tài khoản"
              accessibilityLabel="Hủy"
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={handleCancel}
              testID="delete-account-final-cancel-button"
              variant="outline"
            >
              <Text>Hủy</Text>
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              accessibilityHint="Xóa tài khoản vĩnh viễn"
              accessibilityLabel="Xóa tài khoản vĩnh viễn"
              accessibilityRole="button"
              disabled={!isValid || isDeleting}
              onPress={handleConfirm}
              testID="delete-account-final-confirm-button"
              variant="destructive"
            >
              {isDeleting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="white" size="small" />
                  <Text>Đang xóa...</Text>
                </View>
              ) : (
                <Text>Xóa tài khoản vĩnh viễn</Text>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
