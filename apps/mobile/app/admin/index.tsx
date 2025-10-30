import { Redirect } from 'expo-router'

/**
 * Admin Module Entry Point
 *
 * Redirects to Tasks screen as the default landing page for admin module.
 * Tasks is the primary feature and should be immediately accessible.
 */
export default function AdminIndex() {
  return <Redirect href="/admin/tasks" />
}
