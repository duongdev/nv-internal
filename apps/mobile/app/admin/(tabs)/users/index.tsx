import * as Haptics from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AdminUserList } from '@/components/admin-user-list'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function AdminUsersScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  return (
    <>
      <Stack.Screen
        options={{
          title: `Nhân viên`,
          headerSearchBarOptions: {
            placeholder: 'Tìm nhân viên...',
            onChangeText: ({ nativeEvent }) => setSearchText(nativeEvent.text),
          },
          headerRight: () => (
            <Button
              className="w-10"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/admin/users/create')
              }}
              size={null}
              variant={null}
            >
              <Icon as={PlusIcon} className="size-7" />
            </Button>
          ),
        }}
      />
      <View className="flex-1 bg-background py-4">
        <AdminUserList
          contentContainerClassName="px-4 pb-24"
          searchText={searchText}
        />
      </View>
    </>
  )
}
