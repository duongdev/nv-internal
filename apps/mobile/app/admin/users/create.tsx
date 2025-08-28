import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Stack, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from '@/lib/zod';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormInput } from '@/components/ui/form';
import { useEffect } from 'react';

z.config(z.locales.vi());

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
    .union([z.literal(''), z.string().trim().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')])
    .optional(),
});

export default function CreateUserScreen() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    shouldFocusError: true,
  });

  const { control, handleSubmit, watch, getFieldState, setValue } = form;

  const onSubmit = (data: z.infer<typeof createUserSchema>) => {
    console.log(data);
  };

  const phoneValue = watch('phone');

  // Sync username with phone if it's not touched
  useEffect(() => {
    if (!getFieldState('username').isTouched) {
      setValue('username', phoneValue);
    }
  }, [phoneValue, getFieldState]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Thêm nhân viên mới',

          headerLeft: () => (
            <Button size="sm" variant="outline" onPress={() => router.dismiss()}>
              <Text className="">Huỷ</Text>
            </Button>
          ),
          headerRight: () => (
            <Button size="sm" variant="default" onPress={handleSubmit(onSubmit)}>
              <Text className="">Xong</Text>
            </Button>
          ),
        }}
      />
      <Form {...form}>
        <ScrollView contentContainerClassName="p-4 gap-2">
          <Text variant="h4">Thông tin cá nhân</Text>
          <Separator />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormInput
                autoFocus
                label="Họ và tên đệm"
                placeholder="Nguyễn Văn"
                autoComplete="family-name"
                autoCapitalize="words"
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormInput
                withAsterisk
                label="Tên"
                placeholder="Nam"
                autoComplete="given-name"
                autoCapitalize="words"
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                label="Địa chỉ email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
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
                withAsterisk
                label="Số điện thoại"
                placeholder="0123456789"
                keyboardType="phone-pad"
                autoComplete="tel"
                {...field}
              />
            )}
          />

          <Text variant="h4" className="mt-4">
            Tài khoản đăng nhập
          </Text>
          <Separator />
          <FormField
            control={control}
            name="username"
            render={({ field }) => (
              <FormInput
                withAsterisk
                label="Tên đăng nhập"
                placeholder="Tên đăng nhập"
                autoCapitalize="none"
                {...field}
              />
            )}
          />
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormInput
                label="Mật khẩu"
                description="Bỏ trống để dùng tên đăng nhập làm mật khẩu."
                placeholder="••••••••"
                secureTextEntry
                {...field}
              />
            )}
          />
        </ScrollView>
      </Form>
    </>
  );
}
