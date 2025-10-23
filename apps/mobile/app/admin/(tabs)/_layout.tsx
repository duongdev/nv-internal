import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Stack } from 'expo-router'
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs'
import { useColorScheme } from 'nativewind'
import { Platform } from 'react-native'
import { FONT_FAMILY, THEME } from '@/lib/theme'

export default function AdminTabLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const primaryColor = THEME[colorScheme ?? 'light'].primary

  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý', headerShown: false }} />
      <NativeTabs
        iconColor={{
          default: isDark ? '#9ca3af' : '#6b7280',
          selected: primaryColor,
        }}
        labelStyle={{
          fontFamily: FONT_FAMILY.medium,
          fontSize: 10,
        }}
        {...(Platform.OS === 'ios' && {
          blurEffect: isDark ? 'systemMaterialDark' : 'systemMaterialLight',
        })}
        {...(Platform.OS === 'android' && {
          backgroundColor: isDark ? '#000000' : '#ffffff',
          labelVisibilityMode: 'labeled',
        })}
      >
        <NativeTabs.Trigger name="index">
          <Icon
            src={<VectorIcon family={MaterialCommunityIcons} name="home" />}
          />
          <Label>Trang chủ</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="users">
          <Icon
            src={
              <VectorIcon
                family={MaterialCommunityIcons}
                name="account-group"
              />
            }
          />
          <Label>Nhân viên</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="tasks">
          <Icon
            src={
              <VectorIcon
                family={MaterialCommunityIcons}
                name="format-list-checks"
              />
            }
          />
          <Label>Công việc</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <Icon
            src={<VectorIcon family={MaterialCommunityIcons} name="cog" />}
          />
          <Label>Cài đặt</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  )
}
