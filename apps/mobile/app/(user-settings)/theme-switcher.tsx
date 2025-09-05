import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Stack, useRouter } from 'expo-router'
import { CheckIcon, MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { MenuGroup, MenuItem } from '@/components/ui/menu'
import { Text } from '@/components/ui/text'

export default function ThemeSwitcherScreen() {
  const router = useRouter()
  const { colorScheme, setColorScheme } = useColorScheme()

  const handleSetColorScheme = (scheme: 'light' | 'dark' | 'system') => {
    impactAsync(ImpactFeedbackStyle.Light)
    setColorScheme(scheme)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button onPress={() => router.dismiss()} size="sm">
              <Text>Xong</Text>
            </Button>
          ),
        }}
      />
      <View className="flex-1 p-2">
        <MenuGroup>
          <MenuItem
            label="Hệ thống"
            leftIcon={SunMoonIcon}
            onPress={() => handleSetColorScheme('system')}
            rightIcon={colorScheme === undefined && CheckIcon}
          />
          <MenuItem
            label="Giao diện sáng"
            leftIcon={SunIcon}
            onPress={() => handleSetColorScheme('light')}
            rightIcon={colorScheme === 'light' && CheckIcon}
          />
          <MenuItem
            label="Giao diện tối"
            leftIcon={MoonIcon}
            onPress={() => handleSetColorScheme('dark')}
            rightIcon={colorScheme === 'dark' && CheckIcon}
            // isSelected={colorScheme === 'dark'}
          />
        </MenuGroup>
      </View>
    </>
  )
}
