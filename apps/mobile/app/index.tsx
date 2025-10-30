import { Redirect } from 'expo-router'

/**
 * Root Index - Entry Point
 *
 * Redirects to the module-transit screen which handles:
 * - Determining user's role (admin/worker)
 * - Loading persisted module preference
 * - Routing to the appropriate module
 * - Preventing Tabs state corruption
 */
export default function Index() {
  return <Redirect href="/module-transit" />
}
