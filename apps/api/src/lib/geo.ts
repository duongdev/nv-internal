/**
 * GPS and geolocation utilities for check-in/checkout system
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is the shortest distance
 * over the earth's surface.
 *
 * Accuracy: ~0.5% margin of error for short distances
 *
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Distance in meters
 *
 * @example
 * // Calculate distance between two points in Hanoi
 * const distance = calculateDistance(21.0285, 105.8542, 21.0278, 105.8341)
 * console.log(distance) // ~1810 meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Earth's radius in meters
  const R = 6371e3

  // Convert degrees to radians
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  // Haversine formula
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Distance in meters
  return R * c
}

/**
 * Verify if a location is within acceptable range of a task location
 *
 * This function validates GPS check-in/out locations against the task's
 * designated location, applying a configurable distance threshold.
 *
 * @param taskLocation - The task's designated GPS coordinates
 * @param checkInLocation - The worker's current GPS coordinates
 * @param thresholdMeters - Maximum acceptable distance in meters (default: 100)
 * @returns Object containing distance, validation result, and any warnings
 *
 * @example
 * const result = verifyLocation(
 *   { lat: 21.0285, lng: 105.8542 },
 *   { lat: 21.0278, lng: 105.8545 },
 *   100
 * )
 * // result: { distance: 79.3, withinRange: true, warnings: [] }
 */
export function verifyLocation(
  taskLocation: { lat: number; lng: number },
  checkInLocation: { lat: number; lng: number },
  thresholdMeters = 100,
): {
  distance: number
  withinRange: boolean
  warnings: string[]
} {
  const distance = calculateDistance(
    taskLocation.lat,
    taskLocation.lng,
    checkInLocation.lat,
    checkInLocation.lng,
  )

  const warnings: string[] = []
  const withinRange = distance <= thresholdMeters

  if (!withinRange) {
    warnings.push(`Bạn đang ở cách vị trí công việc ${Math.round(distance)}m`)
  }

  return { distance, withinRange, warnings }
}
