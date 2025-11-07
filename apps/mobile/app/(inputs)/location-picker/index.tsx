import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { MapIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LocationSearchList } from '@/components/location-search-list'
import { Icon } from '@/components/ui/icon'
import { SearchBox } from '@/components/ui/search-box'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'

export default function LocationPicker() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [tabValue, setTabValue] = useState('suggestions')
  const [searchText, setSearchText] = useState((params.address as string) || '')
  const { bottom } = useSafeAreaInsets()

  useEffect(() => {
    if (params.address) {
      setSearchText(params.address as string)
    }
  }, [params.address])

  return (
    <>
      <Stack.Screen options={{ title: 'Chọn địa chỉ' }} />
      <View className="flex-1 px-4 pt-4 pb-safe">
        <View className="flex-1">
          <SearchBox
            onChangeTextDebounced={setSearchText}
            placeholder="Tìm địa chỉ..."
            value={searchText}
          />
          <Tabs
            className="mt-4 hidden"
            onValueChange={setTabValue}
            value={tabValue}
          >
            <TabsList className="h-10">
              <TabsTrigger value="suggestions">
                <Text>Gợi ý</Text>
              </TabsTrigger>
              <TabsTrigger value="saved">
                <Text>Đã lưu</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="suggestions">
              <Text>Chưa có gợi ý nào.</Text>
            </TabsContent>
            <TabsContent value="saved">
              <Text>Chưa có địa chỉ nào được lưu.</Text>
            </TabsContent>
          </Tabs>
          <ScrollView
            className="mt-4 flex-1"
            keyboardShouldPersistTaps="handled"
          >
            <LocationSearchList
              onSelect={(location) =>
                router.push({
                  pathname: '/(inputs)/location-picker/map-picker',
                  params: {
                    redirectTo: params.redirectTo as string,
                    latitude: String(location.location.latitude),
                    longitude: String(location.location.longitude),
                    address: location.formattedAddress,
                    name: location.displayName.text,
                  },
                })
              }
              searchText={searchText}
            />
          </ScrollView>
        </View>
        <KeyboardAvoidingView
          behavior="position"
          keyboardVerticalOffset={bottom + 100}
        >
          <Link
            asChild
            href={{
              pathname: '/(inputs)/location-picker/map-picker',
              params: { redirectTo: params.redirectTo as string },
            }}
          >
            <Pressable className="-mx-4 mt-4 flex-row items-center justify-center gap-1 border-border border-t pt-3 pb-4 active:bg-muted">
              <Icon as={MapIcon} className="size-5 text-muted-foreground" />
              <Text className="text-muted-foreground text-sm">
                Chọn từ bản đồ
              </Text>
            </Pressable>
          </Link>
        </KeyboardAvoidingView>
      </View>
    </>
  )
}
