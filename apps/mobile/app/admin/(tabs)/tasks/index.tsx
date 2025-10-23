import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { AdminTaskList } from '@/components/admin-task-list'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function AdminTasksScreen() {
  const router = useRouter()
  return (
    <>
      <Stack.Screen
        options={{
          title: `Công việc`,
          headerRight: () => (
            <Button
              className="w-10"
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Light)
                router.push('/admin/tasks/create')
              }}
              size={null}
              variant={null}
            >
              <Icon as={PlusIcon} className="size-7" />
            </Button>
          ),
        }}
      />
      <View className="flex-1 bg-background">
        <AdminTaskList contentContainerClassName="gap-2 p-4 pb-28" />
      </View>
    </>
  )
}
