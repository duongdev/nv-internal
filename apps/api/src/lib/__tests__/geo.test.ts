import { describe, expect, it } from '@jest/globals'
import { calculateDistance, verifyLocation } from '../geo'

describe('geo utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points in Hanoi correctly', () => {
      // Two points in Hanoi approximately 2km apart
      const distance = calculateDistance(21.0285, 105.8542, 21.0278, 105.8341)
      // Should be approximately 2087 meters (±100m margin)
      expect(distance).toBeGreaterThan(1987)
      expect(distance).toBeLessThan(2187)
    })

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(21.0285, 105.8542, 21.0285, 105.8542)
      expect(distance).toBe(0)
    })

    it('should calculate distance between very close points accurately', () => {
      // Two points ~100m apart
      const distance = calculateDistance(21.0285, 105.8542, 21.0295, 105.8542)
      // Should be approximately 111 meters (1 degree latitude ≈ 111km)
      expect(distance).toBeGreaterThan(100)
      expect(distance).toBeLessThan(120)
    })

    it('should handle negative coordinates', () => {
      // Test with coordinates in the southern and western hemispheres
      const distance = calculateDistance(-33.8688, 151.2093, -34.0, 151.0)
      // Distance between two points in Sydney area
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(30000) // Less than 30km
    })

    it('should calculate distance across the equator', () => {
      const distance = calculateDistance(-1, 0, 1, 0)
      // 2 degrees of latitude ≈ 222km
      expect(distance).toBeGreaterThan(220000)
      expect(distance).toBeLessThan(225000)
    })

    it('should calculate distance across the prime meridian', () => {
      const distance = calculateDistance(0, -1, 0, 1)
      // 2 degrees of longitude at equator ≈ 222km
      expect(distance).toBeGreaterThan(220000)
      expect(distance).toBeLessThan(225000)
    })
  })

  describe('verifyLocation', () => {
    it('should mark location as within range when distance is less than threshold', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0286, lng: 105.8543 }

      const result = verifyLocation(taskLocation, checkInLocation, 100)

      expect(result.withinRange).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.distance).toBeLessThan(100)
    })

    it('should mark location as outside range when distance exceeds threshold', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0295, lng: 105.8552 }

      const result = verifyLocation(taskLocation, checkInLocation, 100)

      expect(result.withinRange).toBe(false)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('cách vị trí công việc')
      expect(result.distance).toBeGreaterThan(100)
    })

    it('should use default threshold of 100m when not specified', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0286, lng: 105.8543 }

      const result = verifyLocation(taskLocation, checkInLocation)

      expect(result.withinRange).toBe(true)
    })

    it('should accept custom threshold', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0286, lng: 105.8543 }

      // With 10m threshold, should be outside range
      const result = verifyLocation(taskLocation, checkInLocation, 10)

      expect(result.withinRange).toBe(false)
      expect(result.warnings).toHaveLength(1)
    })

    it('should return distance in the result', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0285, lng: 105.8542 }

      const result = verifyLocation(taskLocation, checkInLocation, 100)

      expect(result.distance).toBe(0)
    })

    it('should include distance in warning message', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0295, lng: 105.8552 }

      const result = verifyLocation(taskLocation, checkInLocation, 50)

      expect(result.warnings[0]).toMatch(/\d+m/)
    })

    it('should round distance in warning message', () => {
      const taskLocation = { lat: 21.0285, lng: 105.8542 }
      const checkInLocation = { lat: 21.0295, lng: 105.8542 }

      const result = verifyLocation(taskLocation, checkInLocation, 50)

      // Check that the warning contains a rounded number (no decimals)
      const match = result.warnings[0].match(/(\d+)m/)
      expect(match).toBeTruthy()
      expect(match?.[1]).toMatch(/^\d+$/) // Integer only
    })
  })
})
