import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateTaskValues, zCreateTask } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Keyboard, Pressable, ScrollView } from 'react-native'
import { useCreateTask } from '@/api/task/use-create-task'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormInput, FormTextarea } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Toasts } from '@/components/ui/toasts'

export default function AdminTaskCreateScreen() {
  const router = useRouter()
  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(zCreateTask),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      customerName: '',
      customerPhone: '',
    },
  })
  const { mutateAsync: createTask } = useCreateTask()

  const onSubmit = async (values: CreateTaskValues) => {
    Keyboard.dismiss()
    impactAsync(ImpactFeedbackStyle.Light)

    const task = await createTask(values)
    if (!task) {
      return
    }
    router.replace({
      pathname: '/admin/tasks/[taskId]/view',
      params: { taskId: task.id },
    })
  }

  return (
    <>
      <Form {...form}>
        <Stack.Screen
          options={{
            title: 'Thêm công việc mới',

            // headerLeft: () => (
            //   <Button
            //     disabled={form.formState.isSubmitting}
            //     onPress={() => router.dismiss()}
            //     size="sm"
            //     variant="outline"
            //   >
            //     <Text className="">Huỷ</Text>
            //   </Button>
            // ),
            headerRight: () => (
              <Button
                disabled={form.formState.isSubmitting}
                onPress={form.handleSubmit(onSubmit)}
                size="sm"
                variant={null}
              >
                <Text className="font-sans-bold">Tiếp tục</Text>
              </Button>
            ),
          }}
        />
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-2 p-4"
        >
          <Text variant="h4">Thông tin công việc</Text>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormInput
                autoCapitalize="sentences"
                label="Tiêu đề công việc"
                onSubmitEditing={() => form.setFocus('description')}
                placeholder="Nhập tiêu đề công việc"
                returnKeyType="next"
                withAsterisk
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormTextarea
                autoCapitalize="sentences"
                label="Mô tả công việc"
                placeholder="Nhập mô tả chi tiết công việc"
                {...field}
              />
            )}
          />

          <Pressable
            className="-mx-1 rounded px-1 active:bg-muted"
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light)
              router.push('/(inputs)/location-picker')
            }}
          >
            <Label className="mb-1">Địa chỉ làm việc</Label>
            <Text
              className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground leading-5"
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ lineHeight: 20 }}
            >
              {form.getValues('address') ||
                'Chọn địa chỉ làm việc (bấm để chọn)'}
            </Text>
          </Pressable>

          {/* <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormInput
                autoCapitalize="sentences"
                label="Địa chỉ làm việc"
                onSubmitEditing={() => form.setFocus('customerName')}
                placeholder="Nhập địa chỉ làm việc"
                returnKeyType="next"
                {...field}
                onFocus={() => {
                  router.push('/(inputs)/location-picker')
                }}
              />
            )}
          /> */}

          <Separator className="mt-4 mb-2" />

          <Text variant="h4">Thông tin khách hàng</Text>
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormInput
                autoCapitalize="words"
                label="Tên khách hàng"
                onSubmitEditing={() => form.setFocus('customerPhone')}
                placeholder="Nhập tên khách hàng"
                returnKeyType="next"
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormInput
                autoCapitalize="sentences"
                keyboardType="phone-pad"
                label="Số điện thoại khách hàng"
                // onSubmitEditing={() => form.setFocus('description')}
                placeholder="Nhập số điện thoại khách hàng"
                returnKeyType="next"
                {...field}
              />
            )}
          />
        </ScrollView>
      </Form>
      <Toasts />
    </>
  )
}
