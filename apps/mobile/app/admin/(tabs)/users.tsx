import * as Haptics from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { AdminUserList } from '@/components/admin-user-list'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { SearchBox } from '@/components/ui/search-box'

export default function AdminUsersScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nhân viên',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: true,
          headerRight: () => (
            <Button
              className="mr-2 mb-1 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/admin/users/create')
              }}
              size="icon-sm"
              variant="ghost"
            >
              <Icon as={PlusIcon} className="size-5" />
            </Button>
          ),
        }}
      />
      <View className="flex-1 py-4">
        <SearchBox className="m-4 mt-0" onChangeTextDebounced={setSearchText} />
        <AdminUserList
          contentContainerClassName="flex-1 px-4"
          searchText={searchText}
        />
      </View>
    </>
  )
}
