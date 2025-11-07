import * as Location from 'expo-location'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MapPinCheckIcon, XIcon } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export default function App() {
  const router = useRouter()
  const mapRef = React.useRef<MapView>(null)
  const [addressText, setAddressText] = useState('')
  const params = useLocalSearchParams()

  const latitude = parseFloat(params.latitude as string) || 10.7398321
  const longitude = parseFloat(params.longitude as string) || 106.6256546

  const initialRegion = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }

  const getAddressFromCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        )
        const address = await response.json()

        if (!address) {
          setAddressText('Không thể lấy địa chỉ')
          return null
        }

        setAddressText(
          ((address.display_name as string) || '')
            .split(',')
            .slice(0, -2)
            .join(', '),
        )
        return address
      } catch (error) {
        console.error('Error getting address:', error)
        setAddressText('Không thể lấy địa chỉ')
        return null
      }
    },
    [],
  )

  async function getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      // biome-ignore lint/suspicious/noConsole: <ignore location permission>
      console.log('Permission to access location was denied')
      return
    }

    const location = await Location.getCurrentPositionAsync({})
    const { latitude, longitude } = location.coords
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
    await getAddressFromCoordinates(latitude, longitude)
  }

  const handleSelectLocation = async () => {
    const camera = await mapRef.current?.getCamera()
    router.dismissTo({
      // biome-ignore lint/suspicious/noExplicitAny: <ignore>
      pathname: (params.redirectTo as string as any) || '/',
      params: {
        latitude: String(camera?.center.latitude || ''),
        longitude: String(camera?.center.longitude || ''),
        address: addressText,
        name: params.name as string,
      },
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <No need to check getCurrentLocation>
  useEffect(() => {
    if (params.latitude && params.longitude) {
      const lat = parseFloat(params.latitude as string)
      const lon = parseFloat(params.longitude as string)
      if (lat && lon) {
        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
        getAddressFromCoordinates(lat, lon)
      }
    } else {
      getCurrentLocation()
    }
  }, [params.latitude, params.longitude, getAddressFromCoordinates])

  return (
    <View className="relative flex-1">
      <Button
        className="absolute top-4 left-4 z-10 rounded-full shadow-lg"
        onPress={() => router.dismiss()}
        size="icon"
        variant="secondary"
      >
        <Icon as={XIcon} className="size-7 text-muted-foreground" />
      </Button>

      <MapView
        initialRegion={initialRegion}
        onRegionChangeComplete={(region) => {
          getAddressFromCoordinates(region.latitude, region.longitude)
        }}
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={styles.map}
      />
      <Image
        className="-translate-x-1/2 -translate-y-full absolute top-1/2 left-1/2 size-14"
        source={require('@/assets/images/map-marker-128px.png')}
      />
      {addressText && (
        <View className="absolute right-0 bottom-10 left-0 mx-4 items-center gap-2">
          <Button
            className="rounded-full shadow-lg"
            onPress={handleSelectLocation}
          >
            <Icon
              as={MapPinCheckIcon}
              className="size-5 text-primary-foreground"
            />
            <Text>Chọn địa điểm</Text>
          </Button>
          <View className="rounded-full bg-white/80 p-4 shadow-lg dark:bg-black/80">
            <Text className="text-center text-sm">
              {addressText || 'Đang tải địa chỉ...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
})
