import { getClerkInstance } from '@clerk/clerk-expo'
import type { AppType } from '@nv-internal/api'
import { QueryClient } from '@tanstack/react-query'
import { type ClientResponse, hc } from 'hono/client'
import { tokenCache } from './token-cache'

export const clerk = getClerkInstance({
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  tokenCache,
})

export const getHonoClient = async () => {
  const token = await clerk.session?.getToken()

  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return hc<AppType>(process.env.EXPO_PUBLIC_API_URL!, {
    headers,
  })
}

type CallHonoApiResult<T, Throw extends boolean> = Throw extends true
  ? { data: T; error: null }
  : { data: T | null; error: string | null }

export async function callHonoApi<T, Throw extends boolean = true>(
  fn: (
    client: Awaited<ReturnType<typeof getHonoClient>>,
  ) => Promise<ClientResponse<T>>,
  options?: { throwOnError?: Throw },
): Promise<CallHonoApiResult<T, Throw>> {
  const { throwOnError = true as Throw } = options || {}
  const client = await getHonoClient()
  const response = await fn(client)

  if (!response.ok) {
    const error = await response.text()
    if (throwOnError) {
      throw new Error(error)
    }
    return { data: null, error } as CallHonoApiResult<T, Throw>
  }

  const data = await response.json()
  return { data, error: null } as CallHonoApiResult<T, Throw>
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      staleTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
})
