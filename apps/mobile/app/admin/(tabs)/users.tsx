import { Stack, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import * as Haptics from 'expo-haptics';
import { SearchBox } from '@/components/ui/search-box';
import { AdminUserList } from '@/components/admin-user-list';

export default function AdminUsersScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nhân viên',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: true,
          headerRight: () => (
            <Button
              size="icon-sm"
              variant="ghost"
              className="mb-1 mr-2 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/admin/users/create');
              }}>
              <Icon as={PlusIcon} className="size-5" />
            </Button>
          ),
        }}
      />
      <View className="flex-1 py-4">
        <SearchBox className="m-4 mt-0" />
        <AdminUserList contentContainerClassName="px-4 flex-1" />
      </View>
    </>
  );
}
