import { Text } from '@/components/ui/text';
import { getHonoClient } from '@/lib/api-client';
import { useEffect } from 'react';
import { View } from 'react-native';

const fetchHealth = async () => {
  console.log('fetching health status...', process.env.EXPO_PUBLIC_API_URL);
  const client = await getHonoClient();
  const res = await client.v1.health.$get();
  console.log('🚀 ~ fetchHealth ~ res:', res.url);
  console.log('🚀 ~ fetchHealth ~ res:', await res.text());
};

export default function AdminSettingsScreen() {
  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-muted">
      <Text className="text-2xl font-bold">Admin Settings</Text>
    </View>
  );
}
