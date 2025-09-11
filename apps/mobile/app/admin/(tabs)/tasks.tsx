import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Link, Stack } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

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
      <View className="flex-1 items-center justify-center">
        <Text className="font-bold text-2xl">Admin Tasks</Text>
      </View>
    </>
  )
}
