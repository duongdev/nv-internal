import AsyncStorage from '@react-native-async-storage/async-storage'

const UPDATE_STATE_KEY = 'otaUpdateState'

export interface PersistedUpdateState {
  lastChecked: string | null // ISO date string
  lastUpdateId: string | null
  dismissedUpdateId: string | null // Track dismissed updates
}

/**
 * Save OTA update state to AsyncStorage.
 * Non-critical operation - logs errors but doesn't throw.
 */
export async function saveUpdateState(
  state: PersistedUpdateState,
): Promise<void> {
  try {
    await AsyncStorage.setItem(UPDATE_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('[OTA] Error saving update state:', error)
    // Non-critical error, don't throw
  }
}

/**
 * Get OTA update state from AsyncStorage.
 * Returns null if not found or on error.
 */
export async function getUpdateState(): Promise<PersistedUpdateState | null> {
  try {
    const state = await AsyncStorage.getItem(UPDATE_STATE_KEY)
    return state ? JSON.parse(state) : null
  } catch (error) {
    console.error('[OTA] Error getting update state:', error)
    return null
  }
}

/**
 * Clear OTA update state from AsyncStorage.
 * Non-critical operation - logs errors but doesn't throw.
 */
export async function clearUpdateState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(UPDATE_STATE_KEY)
  } catch (error) {
    console.error('[OTA] Error clearing update state:', error)
  }
}
