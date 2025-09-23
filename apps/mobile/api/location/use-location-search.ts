/** biome-ignore-all lint/style/useNamingConvention: <OSM standard> */
import { useQuery } from '@tanstack/react-query'

const { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } = process.env

export type LocationSearchResultItem = {
  id: string
  formattedAddress: string
  location: {
    latitude: number
    longitude: number
  }
  displayName: {
    text: string
    languageCode: string
  }
  googleMapsLinks: {
    directionsUri: string
    placeUri: string
    writeAReviewUri: string
    reviewsUri: string
    photosUri: string
  }
}

export const useLocationSearch = (searchText?: string) => {
  const query = useQuery({
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!,
              'X-Goog-FieldMask':
                'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks,places.location',
            },
            body: JSON.stringify({
              textQuery: searchText,
              languageCode: 'vi',
              regionCode: 'VN',
            }),
          },
        )
        const data = await response.json()
        return data.places as LocationSearchResultItem[]
      } catch (error) {
        console.error('Error searching:', error)
        return [] as LocationSearchResultItem[]
      }
    },
    queryKey: ['location-search', searchText],
    enabled: !!searchText,
  })

  return query
}
