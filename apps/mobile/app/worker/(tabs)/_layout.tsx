import { Stack, Tabs } from 'expo-router'
import { ListTodoIcon, SettingsIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { FONT_FAMILY, THEME } from '@/lib/theme'

export default function WorkerTabLayout() {
  const { colorScheme } = useColorScheme()
  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý', headerShown: false }} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: THEME[colorScheme ?? 'light'].primary,
          tabBarLabelStyle: { fontFamily: FONT_FAMILY.medium },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Công việc',
            headerShown: false,
            tabBarIcon: ({ color }) => <ListTodoIcon color={color} />,
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
  )
}
