import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { THEME } from '@/lib/theme'

export default function WorkerTabLayout() {
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
      <Tabs.Screen
        name="index"
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
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="cog" size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
