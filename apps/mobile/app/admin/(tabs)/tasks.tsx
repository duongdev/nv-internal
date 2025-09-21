import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Link, Stack } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { AdminTaskList } from '@/components/admin-task-list'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function AdminTasksScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: true,
          headerRight: () => (
            <Link asChild href="/admin/tasks/create">
              <Button
                className="mr-2 mb-1 flex-row items-center"
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light)
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Icon as={PlusIcon} className="size-5" />
              </Button>
            </Link>
          ),
        }}
      />
      <View className="flex-1 bg-muted">
        <AdminTaskList contentContainerClassName="flex-1 gap-2 p-4" />
      </View>
    </>
  )
}
