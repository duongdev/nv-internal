import { Stack, useRouter } from 'expo-router'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import type { TaskEventConfig } from '@/hooks/use-task-event'
import { useTaskEvent } from '@/hooks/use-task-event'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { EmptyState } from '../ui/empty-state'
import { Text } from '../ui/text'
import { Textarea } from '../ui/textarea'
import { AttachmentManager } from './attachment-manager'
import { LocationVerification } from './location-verification'

export interface TaskEventScreenProps {
  taskId: number
  eventType: 'check-in' | 'check-out'
  config: TaskEventConfig
}

/**
 * Shared screen component for task events (check-in/check-out)
 * Driven by configuration props for maximum reusability
 */
export function TaskEventScreen({
  taskId,
  eventType,
  config,
}: TaskEventScreenProps) {
  const router = useRouter()
  const {
    task,
    isLoadingTask,
    location,
    distance,
    attachments,
    notes,
    isSubmitting,
    warnings,
    addFromCamera,
    addFromLibrary,
    addFromFiles,
    removeAttachment,
    setNotes,
    handleSubmit,
  } = useTaskEvent(taskId, eventType)

  // Validation - only location and task are required
  const canSubmit = location && task
  const isWrongStatus = task && task.status !== config.requiredStatus

  if (isLoadingTask) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: config.title,
          }}
        />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-muted-foreground text-sm">
            Đang tải thông tin...
          </Text>
        </View>
      </>
    )
  }

  if (!task) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: config.title,
          }}
        />
        <EmptyState
          className="flex-1"
          image="curiosity"
          messageDescription="Công việc không tồn tại hoặc đã bị xóa"
          messageTitle="Không tìm thấy"
        />
      </>
    )
  }

  if (isWrongStatus) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackButtonDisplayMode: 'generic',
            title: config.title,
          }}
        />
        <View className="flex-1 items-center justify-center gap-4 p-4">
          <EmptyState
            className="flex-1"
            image="curiosity"
            messageDescription={`Công việc cần ở trạng thái "${config.requiredStatus}" để ${eventType === 'check-in' ? 'check-in' : 'check-out'}`}
            messageTitle="Không thể thực hiện"
          />
          <Button
            className="w-full"
            onPress={() => router.back()}
            variant="outline"
          >
            <Text>Quay lại</Text>
          </Button>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackButtonDisplayMode: 'generic',
          title: config.title,
        }}
      />

      <KeyboardAwareScrollView
        bottomOffset={40}
        contentContainerClassName="gap-3 p-4 pb-safe"
      >
        {/* Task Information Card */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Thông tin công việc</CardTitle>
            <Text>{task.title}</Text>
          </CardHeader>
          <CardContent className="gap-3">
            {task.description && (
              <View>
                <Text className="text-muted-foreground">Mô tả:</Text>
                <Text>{task.description}</Text>
              </View>
            )}
            {task.customer && (
              <View>
                <Text className="text-muted-foreground">Khách hàng:</Text>
                <Text>{task.customer.name}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Location Verification */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Xác minh vị trí</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationVerification
              currentLocation={location}
              distance={distance}
              taskLocation={task.geoLocation}
              warnings={warnings}
            />
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Tệp đính kèm (tùy chọn)</CardTitle>
            <CardDescription>
              Thêm ảnh, video hoặc tài liệu liên quan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttachmentManager
              attachments={attachments}
              eventType={eventType}
              maxAllowed={10}
              minRequired={0}
              onAddFromCamera={addFromCamera}
              onAddFromFiles={addFromFiles}
              onAddFromLibrary={addFromLibrary}
              onRemove={removeAttachment}
            />
          </CardContent>
        </Card>

        {/* Notes (Optional) */}
        <Card className="bg-muted dark:border-white/20">
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
            <CardDescription>Thông tin bổ sung (tùy chọn)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              accessibilityLabel="Ghi chú"
              accessibilityHint="Nhập thông tin bổ sung cho công việc"
              className="!rounded-md !bg-background dark:!border-white/20"
              editable={!isSubmitting}
              multiline
              numberOfLines={3}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú..."
              testID={`${eventType}-notes-input`}
              value={notes}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          accessibilityLabel={config.buttonLabel}
          accessibilityHint={
            !canSubmit
              ? 'Cần có vị trí GPS để xác nhận'
              : isSubmitting
                ? 'Đang xử lý yêu cầu'
                : `Xác nhận ${eventType === 'check-in' ? 'bắt đầu' : 'hoàn thành'} công việc`
          }
          className={cn('w-full', isSubmitting && 'opacity-50')}
          disabled={!canSubmit || isSubmitting}
          onPress={handleSubmit}
          size="lg"
          testID={`${eventType}-submit-button`}
        >
          <Text className="font-semibold">
            {isSubmitting ? 'Đang xử lý...' : config.buttonLabel}
          </Text>
        </Button>

        {/* Validation Messages */}
        {!location && (
          <Text className="text-center text-destructive text-sm">
            Đang lấy vị trí hiện tại...
          </Text>
        )}
      </KeyboardAwareScrollView>
    </>
  )
}
