import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AdminTaskList } from '@/components/admin-task-list'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function AdminTasksScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Công việc`,
          headerSearchBarOptions: {
            placeholder: 'Tìm công việc...',
            onChangeText: ({ nativeEvent }) => setSearchText(nativeEvent.text),
          },
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
        <AdminTaskList
          contentContainerClassName="gap-2 p-4 pb-4"
          searchText={searchText}
        />
      </View>
    </>
  )
}
