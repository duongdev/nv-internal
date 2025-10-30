import { Stack } from 'expo-router'

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Công việc',
        }}
      />
    </Stack>
  )
}
