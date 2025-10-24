import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateTaskValues, zCreateTask } from '@nv-internal/validation'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Keyboard, Pressable, ScrollView, View } from 'react-native'
import { useCreateTask } from '@/api/task/use-create-task'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Form, FormField, FormInput, FormTextarea } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Toasts } from '@/components/ui/toasts'
import { cn } from '@/lib/utils'

export default function AdminTaskCreateScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(zCreateTask),
    defaultValues: {
      title: '',
      description: '',
      customerName: '',
      customerPhone: '',
      geoLocation: undefined,
      expectedRevenue: null,
    },
  })
  const { mutateAsync: createTask } = useCreateTask()
  const [expectedRevenue, setExpectedRevenue] = useState<number | null>(null)

  const geoLocation = form.watch('geoLocation')

  const onSubmit = async (values: CreateTaskValues) => {
    Keyboard.dismiss()
    impactAsync(ImpactFeedbackStyle.Light)

    // Add expectedRevenue to values
    const taskData = {
      ...values,
      expectedRevenue,
    }

    const task = await createTask(taskData)
    if (!task) {
      return
    }
    router.replace({
      pathname: '/admin/tasks/[taskId]/view',
      params: { taskId: task.id },
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need form.setValue>
  useEffect(() => {
    if (params.address && params.latitude && params.longitude) {
      form.setValue('geoLocation', {
        address: params.address as string,
        lat: parseFloat(params.latitude as string),
        lng: parseFloat(params.longitude as string),
        name: params.name as string,
      })
    }
  }, [params.address, params.latitude, params.longitude, params.name])

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
              router.push({
                pathname: '/(inputs)/location-picker',
                params: {
                  // Return to this screen after selecting a location
                  redirectTo: '/admin/tasks/create',
                  // Pass current address to location picker
                  address: geoLocation?.name || geoLocation?.address,
                },
              })
            }}
          >
            <Label className="mb-1">Địa chỉ làm việc</Label>
            <Text
              className={cn(
                'min-h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-base text-muted-foreground/50 dark:bg-input/30',
                {
                  'text-foreground': geoLocation,
                },
              )}
            >
              {(geoLocation &&
                [geoLocation.name, geoLocation.address]
                  .filter(Boolean)
                  .join(', ')) ||
                'Chọn địa chỉ làm việc'}
            </Text>
          </Pressable>

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
                placeholder="Nhập số điện thoại khách hàng"
                returnKeyType="next"
                {...field}
              />
            )}
          />

          <Separator className="mt-4 mb-2" />

          <Text variant="h4">Thanh toán</Text>
          <View>
            <CurrencyInput
              label="Doanh thu dự kiến (tùy chọn)"
              onValueChange={setExpectedRevenue}
              placeholder="0"
              value={expectedRevenue}
            />
            <Text className="mt-1 text-muted-foreground text-xs">
              Số tiền công nhân cần thu từ khách hàng
            </Text>
          </View>
        </ScrollView>
      </Form>
      <Toasts />
    </>
  )
}
