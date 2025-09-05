import { zodResolver } from '@hookform/resolvers/zod'
import { type z, zCreateUser } from '@nv-internal/validation'
import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Keyboard, ScrollView } from 'react-native'
import { useCreateUser } from '@/api/user/use-create-user'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormInput } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Toasts, toast } from '@/components/ui/toasts'
import { removeVietnameseAccents } from '@/utils/remove-vn-accents'

export default function CreateUserScreen() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(zCreateUser),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    shouldFocusError: true,
  })
  const { mutateAsync } = useCreateUser({
    onSuccess() {
      router.back()
    },
    onError(error) {
      toast.error(error.message, {
        providerKey: ':modal:',
      })
    },
  })

  const { control, handleSubmit, watch, getFieldState, setValue, formState } =
    form

  const onSubmit = async (data: z.infer<typeof zCreateUser>) => {
    Keyboard.dismiss()
    await mutateAsync(data)
  }

  const firstNameValue = watch('firstName')
  const lastNameValue = watch('lastName')

  // Sync username with phone if it's not touched
  useEffect(() => {
    if (!getFieldState('username').isDirty) {
      const lastWordOfFirstName = (firstNameValue || '').split(' ').pop()
      const firstWordOfLastName = (lastNameValue || '').split(' ')[0]
      const suggestedUsername = removeVietnameseAccents(
        [lastWordOfFirstName, firstWordOfLastName].join('').toLowerCase(),
      )
      setValue('username', suggestedUsername)
    }
  }, [firstNameValue, lastNameValue, getFieldState, setValue])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Thêm nhân viên mới',

          headerLeft: () => (
            <Button
              disabled={formState.isSubmitting}
              onPress={() => router.dismiss()}
              size="sm"
              variant="outline"
            >
              <Text className="">Huỷ</Text>
            </Button>
          ),
          headerRight: () => (
            <Button
              disabled={formState.isSubmitting}
              onPress={handleSubmit(onSubmit)}
              size="sm"
              variant="default"
            >
              <Text className="">Xong</Text>
            </Button>
          ),
        }}
      />
      <Form {...form}>
        <ScrollView contentContainerClassName="gap-2 p-4">
          <Text variant="h4">Thông tin cá nhân</Text>
          <Separator />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormInput
                autoCapitalize="words"
                autoComplete="family-name"
                autoFocus
                label="Họ và tên đệm"
                placeholder="Nguyễn Văn"
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormInput
                autoCapitalize="words"
                autoComplete="given-name"
                label="Tên"
                placeholder="Nam"
                withAsterisk
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="Địa chỉ email"
                placeholder="m@example.com"
                returnKeyType="default"
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormInput
                autoComplete="tel"
                keyboardType="phone-pad"
                label="Số điện thoại"
                placeholder="0123456789"
                withAsterisk
                {...field}
              />
            )}
          />

          <Text className="mt-4" variant="h4">
            Tài khoản đăng nhập
          </Text>
          <Separator />
          <FormField
            control={control}
            name="username"
            render={({ field }) => (
              <FormInput
                autoCapitalize="none"
                label="Tên đăng nhập"
                placeholder="Tên đăng nhập"
                withAsterisk
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormInput
                description="Bỏ trống để dùng tên đăng nhập làm mật khẩu."
                label="Mật khẩu"
                placeholder="••••••••"
                secureTextEntry
                {...field}
              />
            )}
          />
        </ScrollView>
      </Form>
      <Toasts isInModal />
    </>
  )
}
