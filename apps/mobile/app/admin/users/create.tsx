import { zodResolver } from '@hookform/resolvers/zod'
import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView } from 'react-native'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormInput } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import z from '@/lib/zod'

z.config(z.locales.vi())

const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên phải có tối đa 100 ký tự')
    .optional(),
  lastName: z.string().trim().max(100, 'Tên phải có tối đa 100 ký tự'),
  email: z.union([z.literal(''), z.email()]),
  phone: z
    .string()
    .trim()
    .length(10, 'Số điện thoại phải có 10 chữ số')
    .regex(/^0\d+$/, 'Số điện thoại không hợp lệ'),
  username: z
    .string()
    .trim()
    .min(2, 'Tên đăng nhập phải có ít nhất 2 ký tự')
    .max(100, 'Tên đăng nhập phải có tối đa 100 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập không hợp lệ'),
  password: z
    .union([
      z.literal(''),
      z.string().trim().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    ])
    .optional(),
})

export default function CreateUserScreen() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    shouldFocusError: true,
  })

  const { control, handleSubmit, watch, getFieldState, setValue } = form

  const onSubmit = (data: z.infer<typeof createUserSchema>) => {
    console.log(data)
  }

  const phoneValue = watch('phone')

  // Sync username with phone if it's not touched
  useEffect(() => {
    if (!getFieldState('username').isTouched) {
      setValue('username', phoneValue)
    }
  }, [phoneValue, getFieldState, setValue])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Thêm nhân viên mới',

          headerLeft: () => (
            <Button
              onPress={() => router.dismiss()}
              size="sm"
              variant="outline"
            >
              <Text className="">Huỷ</Text>
            </Button>
          ),
          headerRight: () => (
            <Button
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
    </>
  )
}
