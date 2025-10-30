import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { THEME } from '@/lib/theme'

export default function AdminTabLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const primaryColor = THEME[colorScheme ?? 'light'].primary

  const handleTabPress = () => {
    impactAsync(ImpactFeedbackStyle.Light)
  }

  return (
    <Tabs
      screenListeners={{
        tabPress: handleTabPress,
      }}
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : '#ffffff',
        },
        headerShown: false,
      }}
    >
      {/* Phase 1: Reordered tabs - Tasks first, removed Dashboard */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Công việc',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={color}
              name="format-list-checks"
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Nhân viên',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={color}
              name="account-group"
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="cog" size={size} />
          ),
        }}
      />

      {/* Dashboard tab hidden - not implemented yet */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
          title: 'Trang chủ',
        }}
      />
    </Tabs>
  )
}
