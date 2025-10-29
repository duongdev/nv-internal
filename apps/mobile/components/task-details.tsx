import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { useRouter } from 'expo-router'
import {
  DollarSign,
  MapPinnedIcon,
  PhoneCallIcon,
  UsersIcon,
} from 'lucide-react-native'
import { type FC, useEffect, useRef, useState } from 'react'
import { Linking, View } from 'react-native'
import { useTaskPayments } from '@/api/payment/use-task-payments'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskAssignees } from '@/api/task/use-update-task-assignees'
import { useAppRole } from '@/hooks/use-app-role'
import { formatTaskId } from '@/utils/task-id-helper'
import { AttachmentList } from './attachment-list'
import { AttachmentUploader } from './attachment-uploader'
import { ExpectedRevenueModal } from './payment/expected-revenue-modal'
import { TaskAction } from './task-action'
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
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds)
  const originalAssigneeIds = useRef<string[]>(task.assigneeIds)
  const assigneeModalRef = useRef<BottomSheetModalMethods>(null)
  const expectedRevenueModalRef = useRef<BottomSheetModalMethods>(null)
  const { mutateAsync } = useUpdateTaskAssignees()

  // Handler for opening expected revenue modal
  const handleOpenExpectedRevenueModal = () => {
    expectedRevenueModalRef.current?.present()
  }

  // Fetch payment data - always fetch regardless of expected revenue
  const { data: paymentData } = useTaskPayments(task.id)

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

  return (
    <>
      {/* Flat Header - No Card */}
      <View className="gap-2">
        <Badge className="self-start" variant="outline">
          <Text>#{formatTaskId(task.id)}</Text>
        </Badge>
        <Text className="font-sans-bold text-2xl">
          {task.title || 'Chưa có tiêu đề'}
        </Text>
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
          {task.geoLocation ? (
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
            <Text className="font-sans-medium">
              {task.customer?.name || 'Không có tên'}
            </Text>
            <Text className="text-primary">
              {task.customer?.phone || 'Không có số điện thoại'}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Task Description Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Mô tả công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>{task.description || 'Chưa có mô tả'}</Text>
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
