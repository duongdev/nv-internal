import { useEffect } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { getHonoClient } from '@/lib/api-client'

const fetchHealth = async () => {
  console.log('fetching health status...', process.env.EXPO_PUBLIC_API_URL)
  const client = await getHonoClient()
  const res = await client.v1.user.$get()
  console.log('🚀 ~ fetchHealth ~ res:', res.url)
  console.log('🚀 ~ fetchHealth ~ res:', await res.json())
}

export default function AdminSettingsScreen() {
  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <View className="flex-1 items-center justify-center bg-muted">
      <Text className="font-bold text-2xl">Admin Settings</Text>
    </View>
  )
}
