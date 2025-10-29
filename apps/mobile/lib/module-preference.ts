import AsyncStorage from '@react-native-async-storage/async-storage'

const MODULE_PREFERENCE_KEY = 'modulePreference'

export type ModuleType = 'admin' | 'worker'

/**
 * Save user's preferred module to AsyncStorage
 *
 * This preference persists across app restarts and allows
 * admin users with worker role to choose their default module.
 *
 * @param module - The module to set as preferred ('admin' or 'worker')
 */
export async function saveModulePreference(module: ModuleType): Promise<void> {
  try {
    await AsyncStorage.setItem(MODULE_PREFERENCE_KEY, module)
  } catch (error) {
    console.error('Error saving module preference:', error)
    // Non-critical error, don't throw
  }
}

/**
 * Get user's saved module preference from AsyncStorage
 *
 * @returns The saved module preference, or null if not set
 */
export async function getModulePreference(): Promise<ModuleType | null> {
  try {
    const preference = await AsyncStorage.getItem(MODULE_PREFERENCE_KEY)
    if (preference === 'admin' || preference === 'worker') {
      return preference
    }
    return null
  } catch (error) {
    console.error('Error getting module preference:', error)
    return null
  }
}

/**
 * Clear the saved module preference
 *
 * This is typically called when user logs out or when
 * their role changes and the preference is no longer valid.
 */
export async function clearModulePreference(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MODULE_PREFERENCE_KEY)
  } catch (error) {
    console.error('Error clearing module preference:', error)
    // Non-critical error, don't throw
  }
}

/**
 * Validate that a saved preference is still valid for the user's current roles
 *
 * If user has admin preference but no longer has admin role, returns 'worker'
 * If user has worker preference but no longer has worker role, returns 'admin'
 * If preference is valid, returns the preference
 *
 * @param preference - The saved preference to validate
 * @param hasAdminRole - Whether user currently has admin role
 * @param hasWorkerRole - Whether user currently has worker role
 * @returns The validated module, or null if no valid default
 */
export function validateModulePreference(
  preference: ModuleType | null,
  hasAdminRole: boolean,
  hasWorkerRole: boolean,
): ModuleType | null {
  // If no preference, return null to use role-based default
  if (!preference) {
    return null
  }

  // Validate admin preference
  if (preference === 'admin') {
    return hasAdminRole ? 'admin' : hasWorkerRole ? 'worker' : null
  }

  // Validate worker preference
  if (preference === 'worker') {
    return hasWorkerRole ? 'worker' : hasAdminRole ? 'admin' : null
  }

  return null
}
