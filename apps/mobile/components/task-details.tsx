import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  DollarSign,
  MapPinnedIcon,
  PhoneCallIcon,
  UsersIcon,
} from 'lucide-react-native'
import { type FC, useEffect, useRef, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { useTaskPayments } from '@/api/payment/use-task-payments'
import type { Task } from '@/api/task/use-task'
import { useUpdateTask } from '@/api/task/use-update-task'
import { useUpdateTaskAssignees } from '@/api/task/use-update-task-assignees'
import { useAppRole } from '@/hooks/use-app-role'
import { formatTaskId } from '@/utils/task-id-helper'
import { AttachmentList } from './attachment-list'
import { AttachmentUploader } from './attachment-uploader'
import { CustomerEditBottomSheet } from './customer-edit-bottom-sheet'
import { ExpectedRevenueModal } from './payment/expected-revenue-modal'
import { TaskAction } from './task-action'
import { TaskFieldEditBottomSheet } from './task-field-edit-bottom-sheet'
import { Badge } from './ui/badge'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Icon } from './ui/icon'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'
import { UserSelectBottomSheetModal } from './user-select-bottom-sheet-modal'

export type TaskDetailsProps = {
  task: Task
}

export const TaskDetails: FC<TaskDetailsProps> = ({ task }) => {
  const appRole = useAppRole()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds)
  const originalAssigneeIds = useRef<string[]>(task.assigneeIds)
  const assigneeModalRef = useRef<BottomSheetModalMethods>(null)
  const expectedRevenueModalRef = useRef<BottomSheetModalMethods>(null)
  const titleEditRef = useRef<BottomSheetModalMethods>(null)
  const descriptionEditRef = useRef<BottomSheetModalMethods>(null)
  const customerEditRef = useRef<BottomSheetModalMethods>(null)
  const { mutateAsync } = useUpdateTaskAssignees()
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask()

  // Track processed location params to prevent duplicate updates
  const processedLocationKey = useRef<string | null>(null)

  // Fetch payment data - always fetch regardless of expected revenue
  const { data: paymentData } = useTaskPayments(task.id)

  // Handler for opening expected revenue modal
  const handleOpenExpectedRevenueModal = () => {
    expectedRevenueModalRef.current?.present()
  }

  // Handle field updates
  const handleFieldUpdate = (field: string, value: string | number | null) => {
    updateTask({
      taskId: task.id,
      data: { [field]: value },
    })
  }

  // Handle customer update (combined name and phone)
  const handleCustomerUpdate = (data: { name: string; phone: string }) => {
    updateTask({
      taskId: task.id,
      data: {
        customerName: data.name,
        customerPhone: data.phone,
      },
    })
  }

  // Handle location picker return
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally exclude task.geoLocation to prevent infinite loop. We use processedLocationKey ref to track already-processed params.
  useEffect(() => {
    // Only process params if we have ALL THREE required params
    // The key insight: params from navigation TO picker won't have lat/lng
    // Only when RETURNING from map-picker will we have all three
    if (!params.address || !params.latitude || !params.longitude) {
      return
    }

    // Create a unique key for this set of location params
    const currentLocationKey = `${params.latitude}_${params.longitude}_${params.address}`

    // Check if we've already processed these exact params
    // This prevents duplicate updates when the component re-renders
    if (processedLocationKey.current === currentLocationKey) {
      return
    }

    const newLat = parseFloat(params.latitude as string)
    const newLng = parseFloat(params.longitude as string)

    // Verify the coordinates are valid numbers
    if (Number.isNaN(newLat) || Number.isNaN(newLng)) {
      return
    }

    // Check if location actually changed compared to current task data
    const hasLocationChanged =
      !task.geoLocation ||
      Math.abs(task.geoLocation.lat - newLat) > 0.000001 ||
      Math.abs(task.geoLocation.lng - newLng) > 0.000001 ||
      task.geoLocation.address !== params.address

    if (hasLocationChanged) {
      // Mark these params as processed BEFORE updating
      // This prevents re-running if the update causes a re-render
      processedLocationKey.current = currentLocationKey

      updateTask({
        taskId: task.id,
        data: {
          geoLocation: {
            address: params.address as string,
            lat: newLat,
            lng: newLng,
            name: (params.name as string) || (params.address as string),
          },
        },
      })
    }
  }, [
    params.address,
    params.latitude,
    params.longitude,
    params.name,
    task.id,
    updateTask,
  ])

  const saveAssignees = async () => {
    await mutateAsync({ taskId: task.id, assigneeIds })
    originalAssigneeIds.current = assigneeIds
    assigneeModalRef.current?.dismiss()
  }

  const handleModalDismiss = async () => {
    // Check if there are changes
    const hasChanges =
      assigneeIds.length !== originalAssigneeIds.current.length ||
      assigneeIds.some((id) => !originalAssigneeIds.current.includes(id))

    if (hasChanges) {
      await mutateAsync({ taskId: task.id, assigneeIds })
      originalAssigneeIds.current = assigneeIds
    }
  }

  useEffect(() => {
    setAssigneeIds(task.assigneeIds)
    originalAssigneeIds.current = task.assigneeIds
  }, [task.assigneeIds])

  // Don't render role-dependent UI until role is determined
  // This prevents flickering and ensures stable UI during navigation
  if (!appRole) {
    return null
  }

  return (
    <>
      {/* Flat Header - No Card */}
      <View className="gap-2">
        <Badge className="self-start" variant="outline">
          <Text>#{formatTaskId(task.id)}</Text>
        </Badge>
        {appRole === 'admin' && task.status !== 'COMPLETED' ? (
          <Pressable
            accessibilityHint="Nhấn để chỉnh sửa tiêu đề công việc"
            accessibilityLabel="Tiêu đề công việc"
            accessibilityRole="button"
            className="rounded active:opacity-70"
            onPress={() => {
              impactAsync(ImpactFeedbackStyle.Light)
              titleEditRef.current?.present()
            }}
            testID="task-title-edit-pressable"
          >
            <Text className="font-sans-bold text-2xl">
              {task.title || 'Chưa có tiêu đề'}
            </Text>
          </Pressable>
        ) : (
          <Text className="font-sans-bold text-2xl">
            {task.title || 'Chưa có tiêu đề'}
          </Text>
        )}
        <TaskStatusBadge status={task.status} />
      </View>

      {/* CTA Buttons Row */}
      <View className="flex-row gap-2">
        {/* Status Transition Button */}
        <View className="flex-1">
          <TaskAction task={task} />
        </View>

        {/* Open Map Button */}
        <Button
          accessibilityHint="Mở Google Maps để xem vị trí công việc"
          accessibilityLabel="Mở bản đồ"
          disabled={!task.geoLocation}
          onPress={() => {
            if (task.geoLocation) {
              const url = `https://www.google.com/maps/search/?api=1&query=${task.geoLocation.lat},${task.geoLocation.lng}`
              Linking.openURL(url)
            }
          }}
          size="icon"
          testID="task-details-open-map-button"
          variant="outline"
        >
          <Icon as={MapPinnedIcon} />
        </Button>

        {/* Call Customer Button */}
        <Button
          accessibilityHint={`Gọi số điện thoại ${task.customer?.phone || ''}`}
          accessibilityLabel="Gọi khách hàng"
          disabled={!task.customer?.phone}
          onPress={() => {
            if (task.customer?.phone) {
              Linking.openURL(`tel:${task.customer.phone}`)
            }
          }}
          size="icon"
          testID="task-details-call-customer-button"
          variant="outline"
        >
          <Icon as={PhoneCallIcon} />
        </Button>

        {/* Assign Button (Admin Only) */}
        {appRole === 'admin' && (
          <Button
            accessibilityHint="Mở modal để chọn nhân viên thực hiện công việc"
            accessibilityLabel="Phân công nhân viên"
            onPress={() => assigneeModalRef.current?.present()}
            size="icon"
            testID="task-details-assign-button"
            variant="outline"
          >
            <Icon as={UsersIcon} />
          </Button>
        )}
      </View>

      {/* Work Location & Customer Info Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Địa chỉ làm việc</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {appRole === 'admin' && task.status !== 'COMPLETED' ? (
            <Pressable
              accessibilityHint="Nhấn để chỉnh sửa địa chỉ làm việc"
              accessibilityLabel="Địa chỉ làm việc"
              accessibilityRole="button"
              className="-m-2 rounded p-2 active:bg-muted"
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Light)
                router.push({
                  pathname: '/(inputs)/location-picker',
                  params: {
                    redirectTo: `/admin/tasks/${task.id}/view`,
                    // Pass full address for search, and name separately if available
                    address:
                      task.geoLocation?.address || task.geoLocation?.name,
                    name: task.geoLocation?.name,
                  },
                })
              }}
              testID="task-location-edit-pressable"
            >
              {task.geoLocation ? (
                <>
                  {task.geoLocation.name && (
                    <Text className="font-sans-medium">
                      {task.geoLocation.name}
                    </Text>
                  )}
                  {task.geoLocation.address && (
                    <Text className="text-primary">
                      {task.geoLocation.address}
                    </Text>
                  )}
                </>
              ) : (
                <Text className="text-muted-foreground">
                  Nhấn để thêm địa chỉ
                </Text>
              )}
            </Pressable>
          ) : task.geoLocation ? (
            <>
              {task.geoLocation.name && (
                <Text className="font-sans-medium">
                  {task.geoLocation.name}
                </Text>
              )}
              {task.geoLocation.address && (
                <Text className="text-primary">{task.geoLocation.address}</Text>
              )}
            </>
          ) : (
            <Text className="text-muted-foreground">Chưa có địa chỉ</Text>
          )}

          <View className="gap-1">
            <Text className="font-sans-medium text-muted-foreground leading-none">
              Thông tin khách hàng
            </Text>
            {appRole === 'admin' && task.status !== 'COMPLETED' ? (
              <Pressable
                accessibilityHint="Nhấn để chỉnh sửa thông tin khách hàng"
                accessibilityLabel="Thông tin khách hàng"
                accessibilityRole="button"
                className="-m-1 gap-1 rounded p-1 active:bg-muted"
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light)
                  customerEditRef.current?.present()
                }}
                testID="task-customer-info-edit-pressable"
              >
                <Text className="font-sans-medium">
                  {task.customer?.name || 'Nhấn để thêm tên'}
                </Text>
                <Text className="text-primary">
                  {task.customer?.phone || 'Nhấn để thêm số điện thoại'}
                </Text>
              </Pressable>
            ) : (
              <>
                <Text className="font-sans-medium">
                  {task.customer?.name || 'Không có tên'}
                </Text>
                <Text className="text-primary">
                  {task.customer?.phone || 'Không có số điện thoại'}
                </Text>
              </>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Task Description Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Mô tả công việc</CardTitle>
        </CardHeader>
        <CardContent>
          {appRole === 'admin' && task.status !== 'COMPLETED' ? (
            <Pressable
              accessibilityHint="Nhấn để chỉnh sửa mô tả công việc"
              accessibilityLabel="Mô tả công việc"
              accessibilityRole="button"
              className="-m-2 rounded p-2 active:bg-muted"
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Light)
                descriptionEditRef.current?.present()
              }}
              testID="task-description-edit-pressable"
            >
              <Text>{task.description || 'Nhấn để thêm mô tả'}</Text>
            </Pressable>
          ) : (
            <Text>{task.description || 'Chưa có mô tả'}</Text>
          )}
        </CardContent>
      </Card>

      {/* Assignee Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Nhân viên thực hiện</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <View>
            {task.assigneeIds.length === 0 ? (
              <Text className="text-muted-foreground">
                Chưa có nhân viên được giao
              </Text>
            ) : (
              task.assigneeIds.map((userId) => (
                <UserFullName key={userId} userId={userId} />
              ))
            )}
          </View>
          {appRole === 'admin' && (
            <Button
              accessibilityHint="Mở modal để chọn nhân viên thực hiện công việc"
              accessibilityLabel="Phân công nhân viên"
              className="dark:border-white/20"
              onPress={() => assigneeModalRef.current?.present()}
              testID="task-details-assign-card-button"
              variant="outline"
            >
              <Icon as={UsersIcon} />
              <Text>Phân công</Text>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Card - Unified card for expected revenue and payment */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <CardTitle>Thanh toán</CardTitle>
            {appRole === 'admin' && (
              <Button
                accessibilityHint="Mở modal để thiết lập giá dịch vụ cho công việc"
                accessibilityLabel={
                  task.expectedRevenue && Number(task.expectedRevenue) > 0
                    ? 'Chỉnh sửa giá dịch vụ'
                    : 'Đặt giá dịch vụ'
                }
                onPress={handleOpenExpectedRevenueModal}
                size="sm"
                testID="task-details-set-revenue-button"
                variant="ghost"
              >
                <Icon as={DollarSign} size={16} />
                <Text className="text-sm">
                  {task.expectedRevenue && Number(task.expectedRevenue) > 0
                    ? 'Chỉnh sửa giá'
                    : 'Đặt giá'}
                </Text>
              </Button>
            )}
          </View>
        </CardHeader>
        <CardContent className="gap-4">
          {/* Expected Revenue Section */}
          {task.expectedRevenue && Number(task.expectedRevenue) > 0 && (
            <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
              <Text className="text-muted-foreground text-sm">
                Giá dịch vụ:
              </Text>
              <Text className="font-sans-medium text-lg">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(task.expectedRevenue))}
              </Text>
            </View>
          )}

          {/* Payment Status Section - Show if payment exists */}
          {paymentData?.summary.hasPayment && paymentData.payments[0] ? (
            <View className="gap-3">
              {/* Payment Amount */}
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground text-sm">Thực thu:</Text>
                <Text className="font-semibold text-lg">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(Number(paymentData.payments[0].amount))}
                </Text>
              </View>

              {/* Collection Info */}
              <View className="gap-1.5 rounded-lg border border-border bg-card p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-xs">
                    Thu bởi:
                  </Text>
                  <UserFullName
                    className="text-sm"
                    userId={paymentData.payments[0].collectedBy}
                  />
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-xs">
                    Thời gian:
                  </Text>
                  <Text className="text-sm">
                    {new Date(
                      paymentData.payments[0].collectedAt,
                    ).toLocaleString('vi-VN')}
                  </Text>
                </View>
                {paymentData.payments[0].notes && (
                  <View className="mt-1 gap-1">
                    <Text className="text-muted-foreground text-xs">
                      Ghi chú:
                    </Text>
                    <Text className="text-sm">
                      {paymentData.payments[0].notes}
                    </Text>
                  </View>
                )}
              </View>

              {/* Edit Payment Button (Admin Only) */}
              {appRole === 'admin' && (
                <Button
                  accessibilityHint="Mở màn hình để sửa thông tin thanh toán"
                  accessibilityLabel="Chỉnh sửa thanh toán"
                  className="dark:border-white/20"
                  onPress={() => {
                    const payment = paymentData.payments[0]
                    router.push({
                      pathname: '/admin/payments/[paymentId]/edit',
                      params: {
                        paymentId: payment.id,
                        taskId: task.id.toString(),
                        amount: payment.amount.toString(),
                        collectedBy: payment.collectedBy,
                        collectedAt: payment.collectedAt,
                        invoiceAttachmentId: payment.invoiceAttachmentId || '',
                        notes: payment.notes || '',
                      },
                    })
                  }}
                  testID="task-details-edit-payment-button"
                  variant="outline"
                >
                  <Text>Chỉnh sửa thanh toán</Text>
                </Button>
              )}
            </View>
          ) : (
            <>
              {/* Empty state - only show if no expected revenue AND no payment */}
              {(!task.expectedRevenue ||
                Number(task.expectedRevenue) === 0) && (
                <View className="rounded-lg border border-border bg-card p-3">
                  <Text className="text-center text-muted-foreground text-sm">
                    Chưa thiết lập giá dịch vụ
                  </Text>
                  {appRole === 'admin' && (
                    <Button
                      accessibilityHint="Mở modal để thiết lập giá dịch vụ cho công việc"
                      accessibilityLabel="Đặt giá dịch vụ"
                      className="mt-3"
                      onPress={handleOpenExpectedRevenueModal}
                      testID="task-details-set-revenue-empty-button"
                      variant="outline"
                    >
                      <Icon as={DollarSign} />
                      <Text>Đặt giá dịch vụ</Text>
                    </Button>
                  )}
                </View>
              )}
              {task.expectedRevenue && Number(task.expectedRevenue) > 0 && (
                <View className="rounded-lg border border-border bg-card p-3">
                  <Text className="text-center text-muted-foreground text-sm">
                    Chưa thu tiền từ khách hàng
                  </Text>
                </View>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignee Selection Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <BottomSheet
          index={1}
          onDismiss={handleModalDismiss}
          ref={assigneeModalRef}
          snapPoints={['50%', '90%']}
        >
          <UserSelectBottomSheetModal
            onCancel={() => assigneeModalRef.current?.dismiss()}
            onChangeSelectedUserIds={setAssigneeIds}
            onSave={saveAssignees}
            selectedUserIds={assigneeIds}
          />
        </BottomSheet>
      )}

      {/* Expected Revenue Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <BottomSheet
          enableDynamicSizing={false}
          ref={expectedRevenueModalRef}
          snapPoints={['75%']}
        >
          <ExpectedRevenueModal
            currentRevenue={
              task.expectedRevenue ? Number(task.expectedRevenue) : null
            }
            hasPayments={paymentData?.summary.hasPayment ?? false}
            onClose={() => expectedRevenueModalRef.current?.dismiss()}
            taskId={task.id}
          />
        </BottomSheet>
      )}

      {/* Title Edit Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <TaskFieldEditBottomSheet
          currentValue={task.title}
          fieldLabel="Tiêu đề công việc"
          fieldName="title"
          fieldType="text"
          isPending={isUpdating}
          onSave={(value) => handleFieldUpdate('title', value)}
          ref={titleEditRef}
        />
      )}

      {/* Description Edit Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <TaskFieldEditBottomSheet
          currentValue={task.description}
          fieldLabel="Mô tả công việc"
          fieldName="description"
          fieldType="textarea"
          isPending={isUpdating}
          onSave={(value) => handleFieldUpdate('description', value)}
          ref={descriptionEditRef}
        />
      )}

      {/* Customer Edit Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <CustomerEditBottomSheet
          currentName={task.customer?.name || ''}
          currentPhone={task.customer?.phone || ''}
          isPending={isUpdating}
          onSave={handleCustomerUpdate}
          ref={customerEditRef}
        />
      )}

      {/* Attachments Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Tệp đính kèm</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <AttachmentList attachments={task.attachments || []} />
          <AttachmentUploader assigneeIds={task.assigneeIds} taskId={task.id} />
        </CardContent>
      </Card>
    </>
  )
}
