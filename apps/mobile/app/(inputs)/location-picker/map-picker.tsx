import { useRouter } from 'expo-router'
import { LocateFixedIcon, XIcon } from 'lucide-react-native'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export default function App() {
  const router = useRouter()
  const mapRef = React.useRef<MapView>(null)
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: 10.7398321,
    longitude: 106.6256546,
  })
  const [addressText, setAddressText] = useState('')

  const initialRegion = {
    latitude: markerCoordinate.latitude,
    longitude: markerCoordinate.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ) => {
    try {
      const address = await mapRef.current?.addressForCoordinate({
        latitude,
        longitude,
      })
      setAddressText(
        `${address?.name}, ${address?.subLocality}, ${address?.subAdministrativeArea}, ${address?.administrativeArea}`,
      )
      return address
    } catch (error) {
      console.error('Error getting address:', error)
      return null
    }
  }

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
        onRegionChange={setMarkerCoordinate}
        onRegionChangeComplete={async (region) => {
          setMarkerCoordinate({
            latitude: region.latitude,
            longitude: region.longitude,
          })
          await getAddressFromCoordinates(region.latitude, region.longitude)
        }}
        ref={mapRef}
        style={styles.map}
      >
        <Marker coordinate={markerCoordinate} title="Marker" />
      </MapView>
      {addressText && (
        <View className="absolute right-0 bottom-10 left-0 mx-4 items-center gap-2">
          <Button
            className="rounded-full shadow-lg"
            onPress={() => router.dismiss()}
          >
            <Icon
              as={LocateFixedIcon}
              className="size-5 text-primary-foreground"
            />
            <Text>Chọn địa điểm</Text>
          </Button>
          <View className="rounded-full bg-white/80 p-4 shadow-lg">
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
