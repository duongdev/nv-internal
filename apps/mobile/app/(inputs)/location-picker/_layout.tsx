import { Stack } from 'expo-router'

export default function LocationPickerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="map-picker" options={{ headerShown: false }} />
    </Stack>
  )
}
