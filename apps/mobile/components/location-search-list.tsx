import type { FC } from 'react'
import { Pressable, View } from 'react-native'
import {
  type LocationSearchResultItem,
  useLocationSearch,
} from '@/api/location/use-location-search'
import { Text } from './ui/text'

export type LocationSearchListProps = {
  searchText?: string
  onSelect?: (location: LocationSearchResultItem) => void
}

export const LocationSearchList: FC<LocationSearchListProps> = ({
  searchText,
  onSelect,
}) => {
  const { data: locations = [] } = useLocationSearch(searchText)

  return (
    <View>
      {locations?.map((location) => (
        <Pressable
          className="rounded-md border-border border-b px-2 pt-1 pb-2 active:bg-muted"
          key={location.id}
          onPress={() => onSelect?.(location)}
        >
          <Text className="font-sans-medium">{location.displayName.text}</Text>
          <Text className="text-muted-foreground text-sm">
            {location.formattedAddress}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
