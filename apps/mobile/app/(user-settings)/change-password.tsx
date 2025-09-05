import { useUser } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type ChangeUserPassword,
  zChangeUserPassword,
} from '@nv-internal/validation'
import { Stack, useRouter } from 'expo-router'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormInput } from '@/components/ui/form'
import { Text } from '@/components/ui/text'
import { Toasts, toast } from '@/components/ui/toasts'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const { user } = useUser()
  const form = useForm<ChangeUserPassword>({
    resolver: zodResolver(zChangeUserPassword),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    shouldFocusError: true,
  })
  const toastsId = useId()

  const handleSubmit = async (data: ChangeUserPassword) => {
    if (!user) {
      return
    }

    try {
      await user.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      router.dismiss()
      toast.success('Thay đổi mật khẩu thành công')
    } catch (error) {
      const ERROR_MESSAGES: Record<string, string> = {
        'Incorrect password. Please try again.':
          'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.',
      }
      const errorMessage =
        (error instanceof Error && ERROR_MESSAGES[error.message]) ||
        'Đã xảy ra lỗi. Vui lòng thử lại.'
      toast.error(errorMessage, {
        providerKey: toastsId,
      })
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: !form.formState.isSubmitting,
          headerLeft: () => (
            <Button
              disabled={form.formState.isSubmitting}
              onPress={() => router.dismiss()}
              size="sm"
              variant="outline"
            >
              <Text className="">Huỷ</Text>
            </Button>
          ),
          headerRight: () => (
            <Button
              disabled={form.formState.isSubmitting}
              onPress={form.handleSubmit(handleSubmit)}
            >
              <Text>Xong</Text>
            </Button>
          ),
        }}
      />
      <Form {...form}>
        <View className="mb-safe flex-1 gap-2 p-4 pb-safe">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormInput
                autoComplete="password"
                autoFocus
                label="Mật khẩu hiện tại"
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
                withAsterisk
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormInput
                autoComplete="password"
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
                withAsterisk
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormInput
                autoComplete="password"
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
                withAsterisk
                {...field}
              />
            )}
          />
          <Toasts isInModal providerKey={toastsId} />
        </View>
      </Form>
    </>
  )
}
