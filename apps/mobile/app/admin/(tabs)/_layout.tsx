import { FONT_FAMILY, THEME } from '@/lib/theme';
import { Stack, Tabs } from 'expo-router';
import { HouseIcon, ListTodoIcon, SettingsIcon, UsersIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function AdminTabLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý', headerShown: false }} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: THEME[colorScheme ?? 'light'].primary,
          tabBarLabelStyle: { fontFamily: FONT_FAMILY.bold },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            headerShown: false,
            tabBarIcon: ({ color }) => <HouseIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Nhân viên',
            tabBarIcon: ({ color }) => <UsersIcon color={color} />,
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Công việc',
            tabBarIcon: ({ color }) => <ListTodoIcon color={color} />,
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Cài đặt',
            tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
            headerTitleStyle: { fontFamily: FONT_FAMILY.semi },
          }}
        />
      </Tabs>
    </>
  );
}
