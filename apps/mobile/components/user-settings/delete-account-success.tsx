import { CheckCircle2Icon } from 'lucide-react-native'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Text } from '@/components/ui/text'

export type DeleteAccountSuccessProps = {
  open: boolean
}

/**
 * Success screen for account deletion
 * Shows countdown (3 seconds) before auto-redirect to sign-in
 */
export const DeleteAccountSuccess: FC<DeleteAccountSuccessProps> = ({
  open,
}) => {
  const [countdown, setCountdown] = useState(3)

  // Reset countdown when dialog opens
  useEffect(() => {
    if (open) {
      setCountdown(3)
    }
  }, [open])

  // Countdown timer
  useEffect(() => {
    if (!open) {
      return
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open])

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <View className="items-center gap-4">
            <CheckCircle2Icon
              className="text-green-600 dark:text-green-500"
              color="currentColor"
              size={64}
            />
            <AlertDialogTitle
              accessibilityLabel="Tài khoản đã được xóa"
              accessibilityRole="header"
              className="text-center"
            >
              Tài khoản đã được xóa
            </AlertDialogTitle>
          </View>
          <AlertDialogDescription
            accessibilityHint={`Bạn sẽ được chuyển đến màn hình đăng nhập trong ${countdown} giây`}
            accessibilityLabel="Thông báo chuyển hướng"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
            className="text-center"
          >
            <Text className="font-normal text-base text-muted-foreground leading-6">
              Bạn sẽ được chuyển đến màn hình đăng nhập trong{' '}
              <Text className="font-semibold">{countdown}</Text> giây
            </Text>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}
